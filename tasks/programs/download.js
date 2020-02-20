var SIGA = require('../../lib/siga')
    , fs = require('fs')
    , request = require('request')
    , async = require('async')
    , wrench = require('wrench')
    , Iconv = require('iconv').Iconv

module.exports = function (grunt, taskArgs) {

    var fn = function (limit) {
        var siga = new SIGA
            , done = this.async ? this.async() : function () {
            }
            , WRITE_PROGRAMS_DIR = './var/programs'
            , WRITE_COURSES_DIR = './var/courses-lists'

        // Directory cleanup
        if (fs.existsSync(WRITE_PROGRAMS_DIR)) {
            wrench.rmdirSyncRecursive(WRITE_PROGRAMS_DIR)
        }
        fs.mkdirSync(WRITE_PROGRAMS_DIR)

        if (fs.existsSync(WRITE_COURSES_DIR)) {
            wrench.rmdirSyncRecursive(WRITE_COURSES_DIR)
        }
        fs.mkdirSync(WRITE_COURSES_DIR)

        grunt.log.write('Downloading directory ' + SIGA.CRAWL_PROGRAMS_URL + '.. ');
        siga.fetchDirectoryLinks(SIGA.CRAWL_PROGRAMS_URL, function (err, links, concurrency) {
            grunt.log.ok();

            var i = 0
                , conv = new Iconv('ISO-8859-1', 'UTF-8')
                , total = links.length
                , currentDescriptor = function (task, n) {
                    return n + ' of ' + links.length + ' [' + task.link + ']';
                }

            // We'll do all of these in parallel!
            var q = async.queue(function (task, after) {
                grunt.log.overwrite('Downloading files.. ' + currentDescriptor(task, i))
                async.forEach(
                    [
                        // Downloading the PROGRAM file
                        {from:SIGA.CRAWL_PROGRAMS_URL + '/' + task.link, to:WRITE_PROGRAMS_DIR + '/' + task.link },
                        // Downloading the COURSES file
                        {from:SIGA.CRAWL_PROGRAM_COURSES_URL + task.link.split('.')[0], to:WRITE_COURSES_DIR + '/' + task.link }
                    ],
                    function (paths, next) {
                        // Getting the file from SIGA's server
                        request.get({
                            url:paths.from,
                            encoding:null
                        }, function (err, res, body) {
                            if (err) {
                                grunt.log.error('Couldn\'t download file ' + task.link)
                                return next(err);
                            }
                            // And then saving it
                            fs.writeFile(paths.to, conv.convert(body), function () {
                                next()
                            })
                        })
                    },
                    function (next) {
                        grunt.log.overwrite('Files downloaded for ' + currentDescriptor(task, ++i))
                        after();
                    })

            }, concurrency || 20)


            if (!links.length) {
                grunt.log.error().writeln('Couldn\'t find any links.')
                return done();
            }

            // Let's limit our scope, for debugging purposes
            if (limit) {
                links = links.slice(0, limit);
                grunt.log.writeln('Limiting the search to ' + links.length + ' of ' + total + ' file(s)')
                total = links.length;
            }

            q.drain = function () {
                done();
            }
            q.push(links)

        })

    }

    // We are going to run the task right now.
    if (taskArgs)
        fn.apply(this, taskArgs)
    else
        grunt.registerTask('programs/download', 'Downloads all programs and their schedules files from SIGA', fn)
}
