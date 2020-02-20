var grunt = require('grunt')
    , async = require('async')
    , wrench = require('wrench')


var gruntLastMsg = 0
grunt.log.overwrite = function (msg) {
    if (Date.now() < gruntLastMsg + 4000) return grunt.log
    gruntLastMsg = Date.now()
    process.stdout.clearLine && process.stdout.clearLine()
    console.log('\r' + (msg || ''))
    return grunt.log
}

// Installs cronjobs to run in the server
module.exports = function (app) {

    var cronJob = require('cron').CronJob
        , lastProcessing = 0
        , updateStep = 0
        , missingTime = function () {
            return parseInt((lastProcessing + 10 * 60 * 1000 - Date.now())/1000)
        }

    wrench.mkdirSyncRecursive(__approot + '/var/programs');
    wrench.mkdirSyncRecursive(__approot + '/var/courses-list')
    wrench.mkdirSyncRecursive(__approot + '/var/courses-lists')

    console.log()
    console.log('Installing CRONJOBS')

    // Wrapper to run a grunt task asynchronously
    var runTask = function (task, done, taskArgs) {
            try {
                console.log('Task started: ' + task)
                require(__approot + '/tasks/' + task)
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

    // Updates all courses and programs
        , updateAll = function (done) {
            // One processing each 10 min tops
            if (missingTime() > 0) return false
            lastProcessing = Date.now()
            updateStep = 0
            console.log('------------------------')
            console.log('Courses update initiated')
            console.log('------------------------')
            async.series([
                function (done) {
                    updateStep = 1
                    runTask('programs/download', done)
                },
                function (done) {
                    updateStep = 2
                    runTask('programs/update', done)
                },
                function (done) {
                    updateStep = 3
                    runTask('courses/update', done)
                },
                function (done) {
                    updateStep = 4
                    runTask('courses/update-info', done)
                }
            ], function () {
                updateStep = null
                console.log('--------------------')
                console.log('Courses update ended')
                console.log('--------------------')
                done && done()
            })

        }

//    updateAll()

    // Downloads the programs and courses, and then
    // update them to the database
    new cronJob({
        cronTime:'00 05 03 * * *',
        onTick:function () {
            updateAll()
        },
        start:true
    })

    /**
     * HTTP API
     */
    app.get('/update-all', function (req, res, next) {
        var updating = updateAll()
        res.send({
            started:updating !== false,
            step:updateStep,
            last:lastProcessing ? new Date(lastProcessing) : null,
            next:Math.max(missingTime(), 0)
        })
    })

    app.get('/grab-stats', function (req, res, next) {
        res.send({
            lastUpdate:lastProcessing ? new Date(lastProcessing) : null,
            memory:process.memoryUsage(),
            uptime:process.uptime()
        })
    })

}