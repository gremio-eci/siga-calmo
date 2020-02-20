var request = require('request')
    , _ = require('underscore')

//
// Login em http://intranet.ufrj.br/
//
var Intranet = function (user, pass) {
    this.user = user;
    this.pass = pass;

    this.jar = request.jar();
    this.request = request.defaults({jar:this.jar})
}

Intranet.prototype = {

    _loggedIn:false,
    loggedIn:function () {
        return this._loggedIn;
    },

    _sessionInfo:null,
    sessionInfo:function () {
        return this._sessionInfo
    },

    // Updates current session info if logged in
    updateSessionInfo:function (cb) {
        if (!this.loggedIn()) return cb(false);
        var self = this;
        this.request.get(Intranet.MENU_URL, function (err, res, body) {
            if (err) return cb(false);

            // Oops!
            if (res.status == 302) {
                self._loggedIn = false;
                return cb(false);
            }

            self._sessionInfo = Intranet.extractSessionInfo(body);
            return cb(!!self._sessionInfo);
        })
    },

    login:function (done) {
        // Already logged into SIGA's intranet
        if (this.loggedIn()) return done(true);
        var self = this
        // Wrapper so we can change our loggedIn state
            , cb = function (r) {
                self._loggedIn = r;
                return self.updateSessionInfo(done);
            }

        this.request.post({
            url:Intranet.LOGIN_URL,
            form:{
                usuario:this.user,
                senha:this.pass
            }
        }, function (err, res, body) {
            if (err) return cb(false);
            if (res.headers.location == '/Menu.asp') {
                return cb(true)
            }
            cb(false);
        })
        return this;
    },

    // We should logout to help SIGA not hang
    logout:function (done) {
        // No session to logout from
        if (!this.loggedIn()) return done(true);
        // Wrapper so we can change our loggedIn state
        var self = this
            , cb = function (r) {
                self._loggedIn = !r;
                done(r)
            }

        this.request.get(Intranet.LOGOUT_URL, function (err, res, body) {
            if (err) return cb(false);

            if (~body.indexOf('o foi encerrada.') || res.status == 302) {
                return cb(true)
            }

            cb(false)
        })
    }
}

//
// Static
//

// Extracts session info from a given page body
Intranet.extractSessionInfo = function (body) {
    var m = /LoginIntranet\.jsp\?identificacaoUFRJ=(\d+)&idSessao=(\d+)/
        .exec(body)
    if (!m) return null;
    return {
        identificacaoUFRJ: m[1],
        idSessao: m[2]
    }
}

// Constantes
Intranet.LOGIN_URL = 'https://intranet.ufrj.br/Utilidades2006/Login.asp';
Intranet.MENU_URL = 'https://intranet.ufrj.br/Menu.asp';
Intranet.LOGOUT_URL = 'https://intranet.ufrj.br/encerra.asp';

module.exports = Intranet;