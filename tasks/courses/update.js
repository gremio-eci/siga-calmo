var SIGA = require('../../lib/siga')
    , fs = require('fs')
    , request = require('request')
    , async = require('async')
    , Iconv = require('iconv').Iconv
    , models = require('../../models')
    , _ = require('underscore')

module.exports = function (grunt, taskArgs) {

    var fn = function (skip, limit) {

        var done = this.async ? this.async() : function () {
            }
            , COURSES_DIR = './var/courses-lists'
            , PROGRAMS_DIR = './var/programs'
            , CURRENT_SEGMENTATIONS = ['2012-2-0', '2012-3-0']
            , segmentations = {}

        var processPrograms = function (err, programs) {

            if (err) {
                grunt.log.error('Couldn\'t load programs', 1)
                return grunt.log.verbose.error(err)
            }

            if (!programs.length) {
                return grunt.log('There are no programs to update courses from')
            }

            // Available Course files
            var
                currentDescriptor = function (c) {
                    return 'model ' + iCourse + ' of ' + totalCourses + ' (' + courseErrors + ')'
                        + ', file ' + iFile + ' of ' + totalFiles + ' (' + fileErrors + ')' + ' [' + c + ']';
                }

            // Let's limit our scope, for debugging purposes
            if (limit) {
                var old = programs.length;
                programs = programs.slice(0, limit);
                grunt.log.writeln('Limiting the search to ' + programs.length + ' of ' + old + ' outdated courses list(s)')
            }

            var iCourse = 0, totalCourses = 0, courseErrors = 0
                , totalFiles = programs.length, iFile = 0, fileErrors = 0

            // Processes a single program
            var processProgram = function (program, after) {
                var fileName = program.hash + '.html'
                    , coursesFile = fs.readFileSync(COURSES_DIR + '/' + fileName);

                var segmentation = SIGA.parseCoursesListSegmentation(coursesFile)
                segmentations[segmentation] = segmentations[segmentation]+1 || 0

                if (!segmentation) {
                    fileErrors++;
                    grunt.log.overwrite().error('Invalid course segmentation for file ' + fileName)
                    return after(1)
                } else if (false && !~CURRENT_SEGMENTATIONS.indexOf(segmentation)) {
                    fileErrors++;
                    grunt.log.overwrite().verbose.writeln('Ignoring segmentation ' + segmentation)
                    return after(1)
                }

                var courses = SIGA.parseCoursesList(coursesFile)
                if (!courses) {
                    grunt.log.overwrite().error('Invalid courses for file ' + fileName)
                    return done(1)
                }

                if (!courses.length) {
                    fileErrors++;
                    grunt.log.overwrite().verbose.error('No courses for file ' + fileName)
                    return after(1)
                }

                coursesFile = null



                totalCourses += courses.length;

                var courseQ = async.queue(function (course, next) {

                    course.updatedAt = new Date()
                    course.hash = fileName.split('.')[0]
                    course.semester = segmentation

                    models.Course.update(
                        {code:course.code, name:course.name},
                        {$set:course, $addToSet:{programs:program.name}},
                        {upsert:true},
                        function (err) {
                            if (err) {
                                courseErrors++;
                                grunt.log.overwrite().error('Couldn\'t save course for file ' + fileName)
                                grunt.log.error('Course: ', JSON.stringify(course, null, '\t'))
                                grunt.log.error(err)
                                return done(1);
                            }
                            iCourse++;
                            grunt.log.overwrite('Updated ' + currentDescriptor(course.name))
                            next()
                        })
                }, 3)

                courseQ.drain = function () {
                    iFile++;
                    grunt.log.overwrite('Updated ' + currentDescriptor(fileName))
                    after();
                }
                courseQ.push(courses)

            }

            // We'll do all processing in parallel
            var q = async.queue(processProgram, 5)
            // Weeh, finally over
            q.drain = function () {
                grunt.log.overwrite('Finished ' + currentDescriptor('-'))
                done();
                console.log(segmentations)
            }
            q.push(programs)
        }


        grunt.log.subhead('Updating courses from local cache')

        // We'll only update the most recent courses lists
        models.Program
            .find({endSemester:'9999/9'}, {hash:1, name:1, periods:1, elective:1, conditional:1 })
            .skip(skip || 0)
            .batchSize(100)
            .exec(processPrograms)

    }

    //
    // Apache listing download task
    //

    if (taskArgs)
        fn.apply(this, taskArgs)
    else
        grunt.registerTask('courses/update', 'Updates all courses from local cache', fn)
}