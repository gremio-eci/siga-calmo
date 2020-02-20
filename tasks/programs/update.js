var SIGA = require('../../lib/siga')
    , fs = require('fs')
    , request = require('request')
    , async = require('async')
    , Iconv = require('iconv').Iconv
    , models = require('../../models')

module.exports = function (grunt, taskArgs) {

    var fn = function (limit, concurrency) {

        var done = this.async ? this.async() : function () {
            }
            , PROGRAMS_DIR = './var/programs'

        grunt.log.subhead('Updating programs from local cache');

        // Building cache to check for updates
        models.Program.find(function (err, docs) {
            if (err) return cb(err);
            var programs = {}
            docs.forEach(function (doc) {
                programs[doc.hash] = doc.updatedAt;
            })
            docs = null;

            // Available Program files
            var programFiles = fs.readdirSync(PROGRAMS_DIR)
                , currentDescriptor = function (fileName, n) {
                    return n + ' of ' + programFiles.length + ' [' + fileName + ']';
                }
                , total = programFiles.length
            // We'll only update outdated objects
                , filterOutdated = function (dir) {
                    return function (fileName) {
                        var hash = fileName.split('.')[0]
                            , stat = fs.statSync(dir + '/' + fileName)
                        return !programs[hash] || programs[hash] < stat.mtime
                    }
                }


            if (!programFiles.length) {
                grunt.log.error().writeln('Couldn\'t find any local cache copies')
                return done();
            }

            // We only want to update outdated copies
            grunt.log.write('Filtering outdated programs.. ');
            programFiles = programFiles.filter(filterOutdated(PROGRAMS_DIR))

            if (!programFiles.length) {
                grunt.log.writeln('there are no outdated programs.')
                return done();
            }
            grunt.log.writeln(programFiles.length + ' of ' + total + ' program(s) outdated')
            total = programFiles.length;

            // Let's limit our scope, for debugging purposes
            if (limit) {
                programFiles = programFiles.slice(0, limit);
                grunt.log.writeln('Limiting the search to ' + programFiles.length + ' of ' + total + ' outdated program(s)')
                total = programFiles.length;
            }


            var i = 0, n = 0;
            // We'll do all of these in parallel!
            var q = async.queue(function (fileName, after) {
                grunt.log.overwrite('Updating program.. ' + currentDescriptor(fileName, ++n))
                var program = SIGA.parseProgram(fs.readFileSync(PROGRAMS_DIR + '/' + fileName));
                if (!program) {
                    grunt.log.error('Invalid program for file ' + fileName)
                    return after()
                }

                //
                // Database
                //
                program.updatedAt = new Date()
                program.hash = fileName.split('.')[0]
                models.Program.update({hash:program.hash},
                    program, {upsert:true},
                    function (err) {
                        if (err) {
                            grunt.log.overwrite().error('Program couldn\'t be updated for file ' + fileName)
                            grunt.log.verbose.error(err)
                            return after();
                        }
                        grunt.log.overwrite('Program updated.. ' + currentDescriptor(fileName, ++i))
                        after()
                    }
                )

            }, 1)

            q.drain = function () {
                done();
            }
            q.push(programFiles)

        })

    }

    if (taskArgs)
        fn.apply(this, taskArgs)
    else
        grunt.registerTask('programs/update', 'Updates all programs from local cache', fn)
}