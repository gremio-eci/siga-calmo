//
// Script simples para adicionar dados de teste
//
global.__approot = __dirname;
var
    models = require('./models')
    , fs = require('fs')
    , SIGA = require('./lib/siga')

require('sugar')

var courses = SIGA.extractCoursesFromPage(fs.readFileSync('./test/fixture/courses-page.html').toString());
models.Course.collection.insert(courses, function(){
    process.exit()
});