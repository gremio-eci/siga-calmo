var utils = require(__approot + '/lib/utils')
module.exports = utils.dirStructure(__dirname, {exclude:['index.js']});