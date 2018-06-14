'use strict';

var base64 = require('./base64');

function Base64Chunk(options) {
  if (options) {
    this.table = options.table;
    this.pad = options.pad;
  }
  this.decodingExtra = Buffer.alloc(4);
  this.decodingExtraLength = 0;
}

Base64Chunk.prototype.encode = function(chunk, output, outputOffset) {
  var params = {
    table: this.table,
    pad: this.pad,
    input: chunk,
    output: output,
    outputOffset: outputOffset
  }
  base64.encode(params);
};

Base64Chunk.prototype.decode = function(chunk, output, outputOffset) {
  var params = {
    table: this.table,
    pad: this.pad,
    input: this.decodingExtraLength ? Buffer.concat([this.decodingExtra.slice(0, this.decodingExtraLength), chunk]) : chunk,
    output: output,
    outputOffset: outputOffset,
    extra: this.decodingExtra
  }
  base64.decode(params);
  this.decodingExtraLength = params.extraLength;
};

module.exports = Base64Chunk;