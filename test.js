var agent = require('webkit-devtools-agent');

var grunt = require('grunt')

var gruntLastMsg = 0
grunt.log.overwrite = function (msg) {
    if (Date.now() < gruntLastMsg + 2000) return grunt.log
    gruntLastMsg = Date.now()
    process.stdout.clearLine && process.stdout.clearLine()
    return grunt.log.write.call(this, '\r' + (msg || ''))
}

// Wrapper to run a grunt task asynchronously
var runTask = function (task, done, taskArgs) {
    try {
        console.log('Task started: ' + task)
        require('./tasks/' + task)
            .call(
            {
                async:function () {
                    return function () {
                        console.log('\nTask finished: ' + task)
                        done()
                    }
                }
            }, grunt, taskArgs || [])
    } catch (e) {
        console.error(e)
    }
}

runTask('courses/update')