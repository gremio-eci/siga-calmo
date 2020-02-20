var SIGA = require('../../../lib/siga')
    , expect = require('chai').expect
    , _ = require('underscore')
    , fs = require('fs')
    , path = require('path')

var
    login = function (invalidPass, cb) {
        if (typeof invalidPass == 'function') {
            cb = invalidPass;
            invalidPass = null;
        }

        var pass = invalidPass ? 'invalid' : '***********'
            , user = '12727004702'
            , siga = new SIGA(user, pass);
        siga.login(cb)
        return siga
    }
    , TEST_URL = 'http://test.localhost'
    , rfs = function (f) {
        return fs.readFileSync(path.resolve(__dirname, f)).toString()
    }

describe('SIGA', function () {

    // Mocking servers
    before(function () {
        SIGA.CRAWL_PROGRAMS_URL = TEST_URL + '/programs'
        SIGA.CRAWL_COURSES_URL = TEST_URL + '/courses'
    });

    describe('login & isLoggedIn', function () {

        var siga;

        it('should be able to work with a proper login', function (done) {
            siga = login(function (logged) {
                expect(logged).to.equal(true);
                expect(siga.loggedIn()).to.equal(true)
                done();
            })
        });

        it('should fail with an invalid login', function (done) {
            siga = login(true, function (logged) {
                expect(logged).to.equal(false);
                expect(siga.loggedIn()).to.equal(false)
                done();
            })
        });

        afterEach(function (done) {
            siga && siga.logout(function () {
                done()
            })
        });

    });

    it('should be able to logout', function (done) {
        var siga = login(function (logged) {
            expect(logged).to.equal(true);
            siga.logout(function (s) {
                expect(s).to.equal(true)
                done();
            })
        })
    });

    describe('with session', function () {

        var siga
            , course = 'MAC118'

        // Login before testing
        before(function (done) {
            siga = login(function () {
                done()
            })
        });

        after(function (done) {
            siga && siga.logout(function () {
                done()
            })
        })

        describe('fetchCourse', function () {
            it('should be able to fetch an existing code', function (done) {
                siga.fetchCourse(course, function (res) {
                    expect(res).to.exist
                })
            });

            it('should return error on a code that doesn\'t exist', function () {

            });
        });

    });

    describe('crawling', function () {

        var siga = new SIGA;

        describe('fetchDirectoryLinks', function () {
            it('should be able to fetch proper links', function (done) {
                siga.fetchDirectoryLinks(TEST_URL + '/programs', function (err, links) {
                    expect(links).to.have.length.above(0)
                    done()
                })
            });
        });

    });


    //
    // Static
    //

    describe('parseCoursesFromSearch', function () {

        var tests = [
                {
                    page:'<tr class="tableBody1">' +
                        '<td align="center"><input class="checkbox" name="tableListaInscricao_30_check_table_0_30" type="checkbox"></td>' +
                        '<td align="left"><span class="normalLabel">Cálculo Difer e Integ I - IFA/FM/IG1/IGA(6833)<br>Fisica</span></td>' +
                        '<td align="center"><span class="normalLabel">Seg 08:00 às 10:00<br>Qua 08:00 às 10:00<br>Sex 08:00 às 10:00<br></span></td>' +
                        '<td align="center"><span class="normalLabel">MAC118</span></td>' +
                        '<td align="center"><span class="normalLabel"> 6.0</span></td>' +
                        '<td align="center"><span class="normalLabel">30</span></td>' +
                        '<td align="center"><span class="normalLabel">19</span></td></tr>',
                    course:{
                        name:'Cálculo Difer e Integ I - IFA/FM/IG1/IGA',
                        program:'Fisica',
                        code:'MAC118',
                        credits:6,
                        sigaId:'6833',
                        days:[
                            {
                                weekday:1,
                                start:800,
                                end:1000
                            },
                            {
                                weekday:3,
                                start:800,
                                end:1000
                            },
                            {
                                weekday:5,
                                start:800,
                                end:1000
                            }
                        ]
                    }
                }
            ]
            , fullPage = rfs('../../fixture/courses-page.html')
            , fullPageCoursesTotal = 46

        it('should return the proper courses', function () {
            tests.forEach(function (test) {
                var course = SIGA.parseCoursesFromSearch(test.page)[0];
                _.each(course, function (val, key) {
                    if (val instanceof Array) return;
                    expect(val).to.equal(test.course[key])
                })
                test.course.days.forEach(function (day, i) {
                    expect(course.days[i]).to.eql(day)
                })
            })
        });

        it('should be able to parse a full page', function () {
            expect(SIGA.parseCoursesFromSearch(fullPage).length).to.equal(fullPageCoursesTotal)
        });


    });


    describe('parseCoursesList', function () {

        var html = rfs('../../fixture/courses-list.html')
            , testCourses = [
                {
                    name:'Anatomia Vegetal (DIURNO) T1',
                    code:'IBB351',
                    teachers:['ELIANA SCHWARTZ TAVARES'],
                    days:[
                        {
                            weekday:1,
                            start:1300,
                            end:1500
                        },
                        {
                            weekday:1,
                            start:1500,
                            end:1710
                        }
                    ]
                },
                {
                    name:'Anatomia Vegetal (DIURNO) T2',
                    code:'IBB351',
                    teachers:['DULCE GILSON MANTUANO'],
                    days:[
                        {
                            weekday:1,
                            start:1300,
                            end:1500
                        },
                        {
                            weekday:2,
                            start:1300,
                            end:1500
                        }
                    ]
                },
                {
                    name:'Biofisica B/IBA',
                    code:'CFB163',
                    teachers:['JOAO PAULO MACHADO TORRES', 'MAURO DE FREITAS REBELO'],
                    days:[
                        {
                            weekday:3,
                            start:1500,
                            end:1700
                        },
                        {
                            weekday:5,
                            start:1500,
                            end:1700
                        }
                    ]
                }
            ]

        it('should return the proper courses', function () {
            var assertCourse = function (course, test) {
                _.each(course, function (val, key) {
                    // Comparing days, they have to be in the right order
                    if (val instanceof Array) {
                        val.forEach(function (item, i) {
                            expect(test[key][i]).to.eql(item)
                        })
                    } else {
                        // Comparing regular values
                        expect(val).to.equal(test[key])
                    }
                })
            }
            var courses = SIGA.parseCoursesList(html)
            expect(courses).to.be.an.instanceof(Array)
            expect(courses).to.have.length.above(20)
            assertCourse(testCourses[0], courses[0])
            assertCourse(testCourses[1], courses[1])
            assertCourse(testCourses[2], courses[3])
        });

    });


    describe('extractDirectoryLinks', function () {

        var page = '<tr><td valign="top"><img src="/icons/text.gif" alt="[TXT]"></td><td><a href="FEE185EA-3582-413B-87C9-D8E619BEEE82.html">FEE185EA-3582-413B-87C9-D8E619BEEE82.html</a></td><td align="right">25-Jul-2012 14:07  </td><td align="right"> 66K</td></tr>' +
                '<tr><td valign="top"><img src="/icons/text.gif" alt="[TXT]"></td><td><a href="0AF49CFC-2D18-4D79-B2E4-0E8DFDF7AC5D.html">0AF49CFC-2D18-4D79-B2E4-0E8DFDF7AC5D.html</a></td><td align="right">25-Jul-2012 14:12  </td><td align="right"> 69K</td></tr>'
            , results = [
                {link:'FEE185EA-3582-413B-87C9-D8E619BEEE82.html', date:new Date('25-Jul-2012') },
                {link:'0AF49CFC-2D18-4D79-B2E4-0E8DFDF7AC5D.html', date:new Date('25-Jul-2012') }
            ]

        it('should return a list of all sublinks in the given directory, and the date they were last modified in', function () {
            expect(SIGA.extractDirectoryLinks(page)).to.eql(results)
        });
    });


    describe('parseProgram', function () {

        var page = rfs('../../fixture/program-page.html')
            , pages = [
                {
                    body:rfs('../../fixture/program-direito.html'),
                    name:'Direito'
                },
                {
                    body:rfs('../../fixture/program-radialismo.html'),
                    name:'Comunicacao Social - Hab. Radialismo'
                }
            ]
            , program = SIGA.parseProgram(page)
            , firstPeriodCourses = ['EEL170', 'FIS111', 'FIT112', 'IQG111', 'MAC118']

        before(function () {
            expect(program).to.exist
        });

        it('should have the right plain attributes', function () {
            expect(program.officialName).to.equal('Engenharia Eletrônica e de Computação')
            expect(program.sigaId).to.equal('3601010900')
            expect(program.startSemester).to.equal('1999/2')
            expect(program.endSemester).to.equal('2011/2')
            expect(program.name).to.equal('Engenharia Eletrônica e de Computação')
            expect(program.degree).to.equal('Graduação')
            expect(program.hours).to.equal('DE')
            expect(program.fullTitle).to.equal('Ênfase de Graduação em Engenharia Eletrônica e de Computação')
            expect(program.status).to.equal('Ativo')
        });

        it('should have valid periods', function () {
            expect(program.periods.length).to.equal(10)

            expect(firstPeriodCourses.length).to.equal(program.periods[0].courses.length)
            firstPeriodCourses.forEach(function (course) {
                expect(program.periods[0].courses).to.include(course)
            })
        });

        it('should have valid option and restricted courses', function () {
            expect(program.restricted.length).to.equal(31)
            expect(program.conditional.length).to.equal(62)
        });

        it('should be able to parse all names', function () {
            pages.forEach(function (page) {
                var program = SIGA.parseProgram(page.body)
                expect(program.name).to.equal(page.name)
            })
        });


    });


    describe('parseCoursesInfoFromProgram', function () {

        var page = rfs('../../fixture/program-page.html')
            , coursesInfo = SIGA.parseCoursesInfoFromProgram(page)
            , codes = {
                'EEL170':{period:0, credits:5}
            }

        before(function () {
            expect(coursesInfo).to.exist
        });

        it('should have valid courses', function () {
            console.log(coursesInfo);
            for (var code in codes) {
                expect(coursesInfo[code]).to.eql(codes[code])
            }
        });

    });


});