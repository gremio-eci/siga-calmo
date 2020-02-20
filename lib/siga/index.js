var request = require('request')
    , _ = require('underscore')
    , Intranet = require('./intranet')
    , cheerio = require('cheerio')
    , async = require('async')
    , models = require('../../models')
    , Iconv = require('iconv').Iconv

// Hack to add some functionality
cheerio.prototype.parents = function () {
    return this.make(this.map(function (i, el) {
        return el.parent
    }))
}

cheerio.prototype.htmls = function () {
    return this.make(this.map(function (i, el) {
        return el.parent
    }))
}

cheerio.prototype.closest = function (selector) {
    var p = this
    while ((p = p.parents()) && p.length) {
        if (p.filter(selector).length) {
            return p
        }
    }
    return p
}

var trim = function (s) {
    return s.trim()
}

//
// Funcionalidades no sistema SIGA
//
var SIGA = function (user, pass) {
    this.intranet = new Intranet(user, pass);

    this.jar = request.jar();
    this.request = request.defaults({jar:this.jar})
}

SIGA.prototype = {

    _loggedIn:false,
    loggedIn:function () {
        return this._loggedIn;
    },

    login:function (done) {
        // Already logged into SIGA
        if (this.loggedIn()) return done(true);
        var self = this
        // Wrapper so we can change our loggedIn state
            , cb = function (r) {
                self._loggedIn = r;
                done(r)
            }
        // We must make sure we have access to the intranet first
        this.intranet.login(function (l) {
            if (!l) return cb(l);
            var info = self.intranet.sessionInfo();
            // Request to created the session
            self.request.get({
                    url:SIGA.LOGIN_URL + '?identificacaoUFRJ=' + info.identificacaoUFRJ + '&idSessao=' + info.idSessao,
                    followRedirect:false
                }
                , function (err, res, body) {
                    if (err) return cb(false);
                    if (res.headers.location == 'https://www.siga.ufrj.br/sira/temas/zire/frames.jsp') {
                        return cb(true)
                    }
                    cb(false);
                }
            )
        })
        return this;
    },

    clearCookies:function () {
        this.jar.cookies = [];
    },

    // We should logout to help SIGA not hang
    logout:function (done) {
        // No session to logout from
        if (!this.loggedIn() && !this.intranet.loggedIn()) return done(true);
        var self = this
            , cb = function (r) {
                self._loggedIn = !r;
                done(r)
            }
        this.intranet.logout(function (l) {
            // Wrapper so we can change our loggedIn state
            self.request.get(SIGA.LOGOUT_URL, function (err, res, body) {
                if (err) return cb(false);
                if (~body.indexOf('Obrigado por usar o siga') || res.status == 302) {
                    return cb(true)
                }
                cb(false)
            })
        })
    },

    fetchDirectoryLinks:function (url, done) {
        return this.request.get(url, function (err, res, body) {
            if (err || !body) return done(err);
            done(null, SIGA.extractDirectoryLinks(body))
        })
    }
}


//
// Static
//

// Extracts course information from a search page within SIGA
SIGA.parseCoursesFromSearch = function (body) {
    body = body.toString()
    var $body = $ = cheerio.load(body)
        , $courses = $body('tr.tableBody1, tr.tableBody2')
        , courses = []
        , $div = cheerio.load('<div></div>')('div')


    $courses.each(function (i, el) {
        var course = {
                days:[]
            }
            , $labels = $body(el).find('.normalLabel')

        if ($labels.length == 0) return
        // Let's handle this only if we find a use case
        else if ($labels.length != 6) throw 'Invalid course HTML';

        // Day schedules
        $labels.eq(1).html().split('<br>').forEach(function (html) {
            var day = trim($div.html(html).text())
            if (!trim(day)) return;
            var m = /(Seg|Ter|Qua|Qui|Sex|Sáb|Sab|Dom).*?(\d+):(\d+).*?(\d+):(\d+)/.exec(day);
            if (!m) throw 'Invalid course schedule';
            course.days.push({
                weekday:SIGA.parseCoursesFromSearch.weekdaysMap[m[1]],
                start:Number(m[2] + m[3]),
                end:Number(m[4] + m[5])
            })
        })

        var texts = $labels.eq(0).html().split('<br>')
            , names = /^(.*)\((\d+)\)$/.exec(texts[0])

        if (!names) throw 'Invalid course name';

        course.name = trim(names[1])
        course.sigaId = trim(names[2])
        course.program = trim(texts[1])
        course.code = trim($labels.eq(2).text())
        course.credits = Number($labels.eq(3).text())
        courses.push(course)

    });

    return courses;
}

SIGA.parseCoursesListSegmentation = function (body) {
    var m = /.*?Segmentacao:.*?(\d{4}-\d-\d)/.exec(body);
    return m ? m[1] : null;
}

// Extracts course information from distributed programs
SIGA.parseCoursesList = function (body) {

    body = body.toString()
    var $body = cheerio.load(body)
        , $courses = $body('tr.tableBody1, tr.tableBody2')
        , courses = []
        , $div = cheerio.load('<div></div>')('div')

    $courses.each(function (i, el) {
        var course = {
                days:[]
            }
            , $tds = $body(el).find('td')

        if ($tds.length == 0) return
        // Let's handle this only if we find a use case
        else if ($tds.length != 4) throw 'Invalid course HTML';

        // Day schedules
        $tds.eq(3).html().split('<br>').forEach(function (html) {
            var day = $div.html(html).text().trim()
            if (!day) return;
            var m = /(Seg|Ter|Qua|Qui|Sex|Sáb|Sab|Dom).*?(\d+):(\d+).*?(\d+):(\d+)/.exec(day);
            if (!m) throw 'Invalid course schedule';
            course.days.push({
                weekday:SIGA.parseCoursesFromSearch.weekdaysMap[m[1]],
                start:Number(m[2] + m[3]),
                end:Number(m[4] + m[5])
            })
        })

        course.days = _.uniq(course.days, false, function (a) {
            return a.weekday + '-' + a.start + '-' + a.end
        })
        course.name = ($tds.eq(1).text().replace(/\s+/g, ' ')).trim()
        course.teachers = _.unique($tds.eq(2).html().split('<br>')
            .map(function (html) {
                return $div.html(html).text().replace(/\s+/g, ' ').trim()
            }))
            .filter(function (t) {
                return t.length
            })
        course.code = $tds.eq(0).text().replace(/\s+/g, ' ').trim()
        courses.push(course)

    });

    return courses;
}


// Weekdays Numerical maps
SIGA.parseCoursesFromSearch.weekdaysMap = {
    'Seg':1, 'Ter':2, 'Qua':3, 'Qui':4, 'Sex':5, 'Sáb':6, 'Sab':6, 'Dom':0
}

// Extracts course information from a Program's page
SIGA.parseCoursesInfoFromProgram = function (body) {
    body = body.toString()
    var program = {}
        , $body = cheerio.load(body)
        , $periods = $body('td > center > b:contains(Per)').closest('table')
        , $restricted = $body('td > center > b:contains(Escolha Restrita)').closest('table').find('tr.tableBodyBlue1, tr.tableBodyBlue2')
        , $conditional = $body('td > center > b:contains(Escolha Condicionada)').closest('table').find('tr.tableBodyBlue1, tr.tableBodyBlue2')

    var codes = {}

    var findCodes = function ($el, period) {
        $el.each(function (i) {
            var $tds = $el.eq(i).find('td')
                , code = $tds.eq(0).text().trim()
            if (!/^[A-Z0-9]+$/.exec(code)) return;

            codes[code] = {
                period:period,
                credits:parseInt($tds.eq(2).text().trim())
            }
        })
    }

    $periods.each(function (i) {
        findCodes($periods.eq(i).find('tr.tableBodyBlue1, tr.tableBodyBlue2'), i)
    })
    findCodes($restricted, 'restricted')
    findCodes($conditional, 'conditional')

    return codes;
}

// Extracts links from an Apache directory listing
SIGA.extractDirectoryLinks = function (body) {
    var links = []
        , m
        , r = /<tr>.*?<a.*?>([A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}\.html)<.*?(\d{1,2}-[a-zA-Z]+-\d{4})/g
    while (m = r.exec(body)) {
        links.push({
            link:m[1],
            date:new Date(m[2])
        })
    }
    return links;
}

// Extracts the program information from a page
SIGA.parseProgram = function (body) {
    body = body.toString()
    var program = {}
        , $body = cheerio.load(body)
        , semesters = /Curriculo a ser cumprido pelos alunos de (\d+\/\d) a (\d+\/\d)/.exec(body)

    var $periods = $body('td > center > b:contains(Per)').closest('table')
        , $restricted = $body('td > center > b:contains(Escolha Restrita)').closest('table').find('.linkNormal')
        , $conditional = $body('td > center > b:contains(Escolha Condicionada)').closest('table').find('.linkNormal')

    program.sigaId = ($body('td > strong:contains(Código:)').parent().next().text()).trim()
    if (!program.sigaId) return null;


    program.fullTitle = trim(/<b style="font-size: 15pt">(.+?)<[\/a-z]/.exec(body)[1])
    program.officialName = trim($body('td > strong:contains(Denominação Oficial:)').parent().next().text().replace(/\s+/g, ' '))
    program.startSemester = trim(semesters[1])
    program.endSemester = trim(semesters[2])
    program.periods = []
    program.hours = trim($body('td > strong:contains(C.H.:)').parent().next().text().replace(/\s+/g, ' '))
    program.name = trim(program.fullTitle.replace(/^.*?\sem/, ''))
    program.status = trim($body('td strong:contains(Situação)').closest('td').next().text())
//
//    if (program.name == 'Engenharia Eletrônica e de Computação') {
//        console.log($body('td > center > b:contains(Per)').parent())
//        console.log($periods)
//        process.exit()
//    }

    _.each(SIGA.parseProgram.degrees, function (val, key) {
        if (val.test(program.fullTitle)) {
            program.degree = key
            return false
        }
    })

    var findCodes = function ($el) {
        var codes = []
        $el.each(function (i) {
            var code = trim($el.eq(i).text());
            if (!code) return;
            codes.push(code)
        })
        return _.unique(codes);
    }

    $periods.each(function (i) {
        program.periods.push({
            index:i,
            courses:findCodes($periods.eq(i).find('.linkNormal'))
        })
    })


    program.restricted = findCodes($restricted)
    program.conditional = findCodes($conditional)

    return program;
}
SIGA.parseProgram.degrees = {
    'Graduação':/graduação/i,
    'Extensão':/extensão/i,
    'Aperfeiçoamento':/aperfeiçoamento/i,
    'Especialização':/especialização/i,
    'Mestrado':/mestrado/i,
    'Doutorado':/moutorado/i,
    'Pós-doutorado':/pós-doutorado/i
}

// URL from where to parse course requests
SIGA.LOGIN_URL = 'https://www.siga.ufrj.br/sira/intranet/MainWindow.jsp'
SIGA.LOGOUT_URL = 'https://www.siga.ufrj.br/sira/intranet/LogoutSiga.jsp'

//
// Crawling
//
// Informações específicas sobre matérias de uma grade e professores
SIGA.CRAWL_PROGRAM_COURSES_URL = 'https://www.siga.ufrj.br/sira/inscricao/GradeHoraria.jsp?distribuicaoCurricular_oid='
// Lista de grades curriculares
SIGA.CRAWL_PROGRAMS_URL = 'https://www.siga.ufrj.br/sira/repositorio-curriculo/distribuicoes/'
// Lista de disciplinas (descrições)
SIGA.CRAWL_COURSES_URL = 'https://www.siga.ufrj.br/sira/repositorio-curriculo/disciplinas/'

SIGA.Intranet = Intranet;
module.exports = SIGA;