var api = require('./api')
    , models = require(__approot + '/models')
    , easyPI = require('easyPI')
    , fs = require('fs')
    ;

// Easy access
global.models = models;

module.exports = function (app) {

    /*
     * Web Application Routing
     */

    // Only static routing
    if (app.settings.env == 'development' && !process.env.APP_MIN) {
        app.get('/', function (req, res) {
            res.render('index');
        });
    } else {
        app.get('/', function (req, res) {
            res.setHeader('Cache-Control', 'public, max-age=3600')
            res.render('index');
        });
    }

    /*
     * API Routing
     */

    var epi = new easyPI(app, {
        routePrefix:'/api',
        models:models
    });

    // Mapeamento de caractéres com acento para um character set
    var charMaps = [
            '[a\u00e0-\u00e5]',
            '[e\u00e8-\u00eb]',
            '[i\u00ec-\u00ef]',
            '[o\u00f2-\u00f6]',
            '[u\u00f9-\u00fd]',
            '[cç]'
        ]
        , specialsMap = new RegExp('(\\' + [ '\/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\' ].join('|\\') + ')', 'g')
        , regexpMaps = charMaps.map(function (exp) {
            return new RegExp(exp, 'ig')
        })
        , translatedRegExp = function (text, options) {
            text = text.replace(specialsMap, '\\$1')
            regexpMaps.forEach(function (map, i) {
                text = text.replace(map, charMaps[i])
            })
            return new RegExp(text, options)
        }

    epi.model({
            url:'/courses',
            name:'Course',
            methods:['list', 'show'],
            methodOptions:{
                list:{
                    defaultQuery:function (model, context) {
                        return function (req, epi, next) {
                            var q = req.query.q ? translatedRegExp(req.query.q, 'i') : null

                            var query = [];

                            if (req.query.codes) {
                                query.push({
                                    code:{$in:req.query.codes.split(',').map(function (v) {
                                        return translatedRegExp(v, 'i')
                                    })}
                                })
                            }

                            if (req.query.teachers) {
                                query.push({
                                    teachers:{$in:req.query.teachers.split(',').map(function (v) {
                                        return translatedRegExp(v, 'i')
                                    })}
                                })
                            }

                            if (req.query.days) {
                                query.push({
                                    'days.weekday':{$in:req.query.days.split(',').map(function (v) {
                                        return parseInt(v)
                                    })}
                                })
                            }

                            if (req.query.programs) {
                                query.push({
                                    programs:{$in:req.query.programs.split(',').map(function (v) {
                                        return translatedRegExp(v, 'i')
                                    })}
                                })
                            }

                            if (req.query.q) {
                                query.push({
                                    $or:[
                                        {name:q},
                                        {code:q},
                                        {programName:q}
                                    ]
                                })
                            }

                            var semesterQuery = {semester:{$exists:true}}
                            if (!req.query.outdated) {
                                // Calculation of current semester
                                var currentSemesters = []
                                    , date = new Date()
                                    , year = date.getFullYear()

                                if (date.getMonth() > 5) {
                                    currentSemesters.push(year + '-2-0')
                                    currentSemesters.push(year + '-3-0')
                                } else {
                                    currentSemesters.push(year + '-1-0')
                                }
                                semesterQuery.semester['$in'] = currentSemesters
                            }
                            query.push(semesterQuery)

                            return model
                                .find(query.length ? {$and:query } : {})
                                .sort('name')
                        }
                    },
                    custom:{
                        '/courses/sets':function (model, context) {
                            return function (req, epi, next) {
                                var query = []
                                    , q = req.query.q

                                if (!(q instanceof Array) || !q.length) {
                                    return epi.bad('q', 'array_expected')
                                }

                                for (var i = 0; i < q.length; i += 2) {
                                    query.push({
                                        code:q[i],
                                        name:q[i + 1]
                                    })
                                }

                                return model
                                    .find({$or:query})
                                    .sort('name')
                            }
                        },
                        '/courses/horario':function (model, context) {
                            return function (req, epi, next) {
                                return function (cb) {

                                    if (!epi.rule('query', 'id', function () {
                                        this.mongoId()
                                    }))
                                        return epi.bad()

                                    models.Horario.findById(req.query.id, epi.cb(function (doc) {
                                        if (!doc) return epi.lost();


                                        var query = []
                                            , q = doc.courses

                                        if (!(q instanceof Array) || !q.length) {
                                            return epi.raise('invalid_horario')
                                        }

                                        for (var i = 0; i < q.length; i += 2) {
                                            query.push({
                                                code:q[i],
                                                name:q[i + 1]
                                            })
                                        }

                                        cb(model
                                            .find({$or:query})
                                            .sort('name'))

                                    }))
                                }
                            }
                        }
                    }
                }
            }
        }
    )


    epi.model({
        url:'/programs',
        name:'Program',
        methods:['list', 'show'],
        methodOptions:{
            list:{
                defaultQuery:function (model, context) {
                    return function (req, epi, next) {
                        return model
                            .find(req.query.q ? {$or:[
                            {name:translatedRegExp(req.query.q, 'i')}
                        ]} : {})
                            .sort('-startSemester name')
                    }
                }
            }
        }
    })


    epi.model({
        url:'/horarios',
        name:'Horario',
        methods:['show', 'create'],
        validation:{
            courses:function () {
                this.notNull()
            }
        },
        methodOptions:{
        }
    })

    epi.printRoutes();
}
