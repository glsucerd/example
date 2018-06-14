'use strict';

function Logger() {}
Logger.prototype.log = function() {};
Logger.prototype.debug = function() {};
Logger.prototype.info = function() {};
Logger.prototype.warn = function() {};
Logger.prototype.error = function() {};

module.exports = Logger;
module.exports.dummy = new Logger();