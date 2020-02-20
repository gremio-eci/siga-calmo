var Intranet = require('../../../lib/siga').Intranet
    , expect = require('chai').expect

var
    login = function (invalidPass, cb) {
        if (typeof invalidPass == 'function') {
            cb = invalidPass;
            invalidPass = null;
        }

        var pass = invalidPass ? 'invalid' : '*******'
            , user = '12727004702'
            , intranet = new Intranet(user, pass);
        intranet.login(cb)
        return intranet
    }

describe('SIGA.Intranet', function () {
    describe('login & isLoggedIn', function () {

        var intranet;

        it('should be able to work with a proper login', function (done) {
            intranet = login(function (logged) {
                expect(logged).to.equal(true);
                expect(intranet.loggedIn()).to.equal(true)
                done();
            })
        });

        it('should fail with an invalid login', function (done) {
            intranet = login(true, function (logged) {
                expect(logged).to.equal(false);
                expect(intranet.loggedIn()).to.equal(false)
                done();
            })
        });

        afterEach(function (done) {
            intranet && intranet.logout(function () {
                done()
            })
        });

    });

    describe('with session', function () {

        var intranet;
        before(function (done) {
            intranet = login(function (l) {
                expect(l).to.equal(true)
                done()
            })
        });

        describe('sessionInfo', function () {
            it('should return the current session\'s info', function () {
                expect(intranet.sessionInfo()).to.exist
            });
        });
    });


    it('should be able to logout', function (done) {
        var intranet = login(function (logged) {
            expect(logged).to.equal(true);
            intranet.logout(function (s) {
                expect(s).to.equal(true)
                done();
            })
        })
    });

    //
    // Static
    //

    describe('extractSessionInfo', function(){
        var page = '<strong><a href="https://www.siga.ufrj.br/sira/intranet/LoginIntranet.jsp?identificacaoUFRJ=12727004702&idSessao=499090187" target="_blank">SIGA - Sistema Integrado de Gestão Acadêmica</a><br></strong>'
        it('should extract proper fields from the page if found', function(){
            expect(Intranet.extractSessionInfo(page)).to.eql({
                identificacaoUFRJ:'12727004702',
                idSessao:'499090187'
            })
        });

        it('should return null if the info couldn\'t be found', function(){
            expect(Intranet.extractSessionInfo('some invalid code')).to.equal(null)
        });

    });


});

