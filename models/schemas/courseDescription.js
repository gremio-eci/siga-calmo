var mongoose = require('mongoose'),
    utils = require('../../lib/utils')

/**
 * Registro de um voto do usuário
 */

var Schema = new mongoose.Schema({
    code:String, // Course code, e.g. MAC118
    description:String // Long description about the course
});

module.exports = Schema;