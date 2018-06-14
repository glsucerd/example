'use strict';

var Base64Chunk = require('./base64-chunk');
var dummyLogger = require('./logger').dummy;

var TABLE = [];

function initTable() {
  for (var i = 0; i < 65; i++)
    TABLE[i] = 255 - i;
}
initTable();

function random(len) {
  return Math.floor(Math.random() * len);
}

function obfuscate(dataArray, patterns) {
  var num = 0, len = dataArray.length;
  var charCode, i;
  for (i = 0; i < patterns.length; i++) {
    if (len < patterns[i][0]) {
      num = random(patterns[i][1]);
      break;
    }
  }
  for (i = 0; i < num; i++) {
    charCode = random(190);
    dataArray.splice(random(dataArray.length + 1), 0, charCode);
  }
}

function Encoder(options) {
  this.base64Chunk = new Base64Chunk({
    table: TABLE,
    pad: TABLE[64]
  });
  this.patterns = options.patterns || [];
  this.logger = options.logger || dummyLogger;
}

Encoder.prototype.encode = function(chunk) {
  var output = [];
  this.base64Chunk.encode(chunk, output);
  obfuscate(output, this.patterns);
  output = Buffer.from(output);
  this.logger.log('encoded', chunk.length, output.length);
  this.logger.debug(chunk);
  this.logger.debug(output);
  return output;
};

Encoder.prototype.decode = function(chunk) {
  var output = [];
  this.base64Chunk.decode(chunk, output);
  output = Buffer.from(output);
  this.logger.log('decoded', chunk.length, output.length);
  this.logger.debug(chunk);
  this.logger.debug(output);
  return output;
};

module.exports = Encoder;