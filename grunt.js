/*global module:false*/
module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        test:{
            files:['test/**/*.js']
        }
    });

    var gruntLastMsg = 0
    grunt.log.overwrite = function (msg) {
        if (Date.now() < gruntLastMsg + 2000) return grunt.log
        gruntLastMsg = Date.now()
        process.stdout.clearLine && process.stdout.clearLine()
        return grunt.log.write.call(this, '\r' + (msg || ''))
    }

    // Default task.
    grunt.registerTask('default', 'test');
    grunt.loadTasks('./tasks/programs')
    grunt.loadTasks('./tasks/courses')
    grunt.loadTasks('./tasks')

};
