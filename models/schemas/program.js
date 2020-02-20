var Schema = require('mongoose').Schema,
    utils = require('../../lib/utils')

/**
 * Registro de um voto do usuário
 */

var MySchema = new Schema({
    sigaId:String, // Unique identifier in SIGA e.g.
    hash:'', // Hash identifier, e.g. 0AA1E9C0-92A4-F79A-5834-49B8E9C660FB
    officialName:String, // Oficial name, e.g. "Engenharia Eletrônica e de Computação", sometimes not present
    degree:String, // Type of degree being acheived, e.g. Graduação, Ênfase em graduação
    fullTitle:String, // Full title as displayed in SIGA
    name:String, // Readable name, e.g. "Engenharia Eletrônica e de Computação"
    updatedAt:Date, // Last time at which this was updated from SIGA
    state:String, // Whether this is active or not
    hours:String, // Carga horária
    // Periods which comprise this course
    periods:[
        {
            index:Number,
            courses:[String]
        }
    ],
    restricted:[String],
    conditional:[String],
    startSemester:String, // Date in which this program has begun
    endSemester:String // Date (if present) when this became outdated
});

MySchema.index({hash:1}, {unique:1})
MySchema.index({name:1, startSemester:1}, {sparse:true})
MySchema.index({name:1}, {sparse:true})

module.exports = MySchema;