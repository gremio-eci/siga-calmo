var Schema = require('mongoose').Schema,
    utils = require('../../lib/utils')

/**
 * Registro de um voto do usuário
 */

var MySchema = new Schema({
    courses: [String]
});

MySchema.index({courses:1})

module.exports = MySchema;