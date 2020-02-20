var mongoose = require('mongoose');

try {
    mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/sigav1');
} catch(e){
    console.log(e)
}

//
// Schemas > Modelos, sendo exportados
//

module.exports = {
    Course:mongoose.model('Course', require('./schemas/course')),
    Horario:mongoose.model('Horario', require('./schemas/horario')),
    CourseDescription:mongoose.model('CourseDescription', require('./schemas/courseDescription')),
    Program:mongoose.model('Program', require('./schemas/program'))
};

