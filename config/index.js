/**
 * Created by dmytro on 12.07.16.
 */
var nconf = require('nconf');
var path = require('path');
nconf.argv()
    .env()
    .file({file: path.join(__dirname, 'config.json')});
module.exports = nconf;