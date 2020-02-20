var Schema = require('mongoose').Schema,
    utils = require('../../lib/utils')

/**
 * Registro de um voto do usuário
 */

var MySchema = new Schema({
    code:String, // Course code, e.g. MAC118
    sigaId:String, // Unique identifier in SIGA e.g. (6836)
    name:String, // Descriptive title e.g. Cálculo Difer e Integ I - IQA/IGL
    hash:String, // Hash identifier, e.g. 0AA1E9C0-92A4-F79A-5834-49B8E9C660FB
    programs:[String], // Name of associated programs
    credits:Number,
    updatedAt:Date, // Last time at which this was updated from SIGA
    teachers:[String],
    // Weekdays
    days:[
        {
            // 0-6 (sun-sat)
            weekday:Number,
            // 1200
            start:Number,
            // 1500
            end:Number
        }
    ],
    semester:String
});

MySchema.index({name:1})
MySchema.index({code:1, name:1}, {unique:true, sparse:true})
//MySchema.index({programs:1, name:1, code:1, teachers:1}, {sparse:true})

module.exports = MySchema;