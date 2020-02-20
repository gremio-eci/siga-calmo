var SIGA = require('../../lib/siga')
    , fs = require('fs')
    , request = require('request')
    , async = require('async')
    , Iconv = require('iconv').Iconv
    , models = require('../../models')
    , _ = require('underscore')

module.exports = function (grunt, taskArgs) {

    var fn = function (concurrency) {

        var done = this.async ? this.async() : function () {}
            , PROGRAMS_DIR = './var/programs'

        grunt.log.subhead('Updating courses info from local cache');

        // Building cache to check for updates
        models.Course.distinct('hash', {credits:{$exists:false}}, function (err, docs) {
            if (err) {
                grunt.log.error(err)
                return done(1)
            }

            // Available Program files
            var programFiles = docs
                , currentDescriptor = function (fileName, n) {
                    return n + ' of ' + programFiles.length + ' [' + fileName + ']';
                }

            if (!programFiles.length) {
                grunt.log.writeln('There are no programs to update from')
                return done();
            }

            var i = 0;
            // We'll do all of these in parallel!
            var q = async.queue(function (hash, after) {
                var fileName = hash + '.html'

                var coursesInfo = SIGA.parseCoursesInfoFromProgram(fs.readFileSync(PROGRAMS_DIR + '/' + fileName));
                if (!coursesInfo) {
                    grunt.log.error('Invalid courseInfo for file ' + fileName)
                    return after()
                }

                var updates = [];
                for (var code in coursesInfo) {
                    updates.push({code:code, info:coursesInfo[code]})
                }

                var updateQ = async.queue(function (task, next) {
                    models.Course.update(
                        {code:task.code},
                        {$set:{credits:task.info.credits}},
                        {multi:true},
                        function (err) {
                            if (err) {
                                grunt.log.overwrite().error(err)
                                return next()
                            }
                            next();
                        })
                }, concurrency || 3)

                updateQ.drain = function () {
                    grunt.log.overwrite('Courses info updated.. ' + currentDescriptor(fileName, ++i))
                    after()
                }
                updateQ.push(updates)

            }, concurrency || 3)

            q.drain = function () {
                done();
            }
            q.push(programFiles)

        })

    }

    if (taskArgs)
        fn.apply(this, taskArgs)
    else
        grunt.registerTask('courses/update-info', 'Updates all courses info on the database', fn)

}