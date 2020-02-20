/*
 * Global Variables
 */

global.__approot = __dirname;

process.on('uncaughtException', function (err) {
    console.error('Exception: ', err)
})

/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , mws = require('./lib/middlewares')
    ;

var app = express();

// Easy context settings
app.isProduction = function () {
    return app.settings.env == 'production'
}

app.isDevel = function () {
    return app.settings.env != 'production'
}

//
// Configuração do servidor
//

app.configure(function () {

    // Configurações básicas
    app.set('port', process.env.PORT || 5030);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');

    app.use(express.favicon(__dirname + '/public/favicon.ico'));
    app.use(express.logger('dev'));

    // Parsers e Sessão
    app.use(express.bodyParser());
    app.use(express.cookieParser('1829jad891287u9'));
    app.use(express.session({key:'s'}));

    // Estáticos
    app.use(require('less-middleware')({ src:__dirname + '/assets', dest:__dirname + '/public' }));
    app.use(express.static(__dirname + '/public', {maxAge:1800 * 1000}));

    // Autenticação de usuário
    app.use(mws.sessionUser);
    app.use(app.router);


});


app.configure('development', function () {
    app.use(function (req, res, next) {
        res.setHeader('Cache-Control', 'no-cache')
        next();
    })
    app.use(express.errorHandler());
});

// Routing
require('./routes')(app)
// Cronjobs
require('./cron-jobs')(app)

// Iniciamos o servidor
http.createServer(app).listen(app.get('port'));