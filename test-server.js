var express = require('express')
    , http = require('http')
    , fs = require('fs')

    , fixture = function (f) {
        return fs.readFileSync(path.resolve(__dirname, './test/fixtures/' + f)).toString()
    }

var test = express()


test.configure(function () {

    // Configurações básicas
    test.set('port', process.env.PORT || 5040);
    test.use(express.static(__dirname + '/test/fixture'));
    test.use(express.static(__dirname + '/var'));
})

http.createServer(test).listen(test.get('port'), function () {
    console.log('Test server listening on port ' + test.get('port'));
});