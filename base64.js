'use strict';

var TABLE = Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/');
var PADDING_CHAR = 61;

function encodeBlock(blockIn, blockOut) {
  blockOut[0] = blockIn[0] >> 2;
  blockOut[1] = ((blockIn[0] & 0x03) << 4) | (blockIn[1] >> 4);
  blockOut[2] = ((blockIn[1] & 0x0f) << 2) | (blockIn[2] >> 6);
  blockOut[3] = blockIn[2] & 0x3f;
}

function decodeBlock(blockIn, blockOut) {
  blockOut[0] = (blockIn[0] << 2) | (blockIn[1] >> 4);
  blockOut[1] = ((blockIn[1] & 0x0f) << 4) | (blockIn[2] >> 2);
  blockOut[2] = ((blockIn[2] & 0x03) << 6) | blockIn[3];
}

function findIndex(encoded, table) {
  for (var i = 0; i < 64; ++i)
    if (table[i] === encoded)
      return i;
  return -1;
}

exports.encode = function(params) {
  var table = params.table || TABLE;
  var paddingChar = params.pad !== undefined ? params.pad : PADDING_CHAR;
  var input = params.input;
  var output = params.output;
  var outputOffset = params.outputOffset || 0;
  var extra = params.extra;
  var extraLength = 0;

  var blockIn = [], blockOut = [];
  var i = 0, j = outputOffset, len = input.length;
  var missingBytes = 0, ii;
  while (i < len) {
    ii = 0;
    while (ii < 3) {
      if (i < len) {
        blockIn[ii] = input[i];
        ++i;
      } else {
        blockIn[ii] = 0;
        ++missingBytes;
      }
      ++ii;
    }

    if (missingBytes && extra) {
      if (missingBytes === 1) {
        extra[0] = blockIn[0];
        extra[1] = blockIn[1];
        extraLength = 2;
      } else if (missingBytes === 2) {
        extra[0] = blockIn[0];
        extraLength = 1;
      }
      break;
    }

    encodeBlock(blockIn, blockOut);

    if (!missingBytes) {
      output[j++] = table[blockOut[0]];
      output[j++] = table[blockOut[1]];
      output[j++] = table[blockOut[2]];
      output[j++] = table[blockOut[3]];
    } else if (missingBytes === 1) {
      output[j++] = table[blockOut[0]];
      output[j++] = table[blockOut[1]];
      output[j++] = table[blockOut[2]];
      if (paddingChar || paddingChar === 0) {
        output[j++] = paddingChar;
      }
    } else if (missingBytes === 2) {
      output[j++] = table[blockOut[0]];
      output[j++] = table[blockOut[1]];
      if (paddingChar || paddingChar === 0) {
        output[j++] = paddingChar;
        output[j++] = paddingChar;
      }
    }
  }

  if (extra) {
    params.extraLength = extraLength;
  }
};

exports.decode = function(params) {
  var table = params.table || TABLE;
  var paddingChar = params.pad !== undefined ? params.pad : PADDING_CHAR;
  var input = params.input;
  var output = params.output;
  var outputOffset = params.outputOffset || 0;
  var extra = params.extra;
  var extraLength = 0;

  var encoded = [], blockIn = [], blockOut = [];
  var i = 0, j = outputOffset, len = input.length;
  var missingBytes = 0, ii;
  var index, paddingBytes, unwantedBytes;
  while (i < len) {
    ii = 0;
    paddingBytes = 0;
    while (ii < 4) {
      if (i < len) {
        encoded[ii] = input[i];
        ++i;
        index = findIndex(encoded[ii], table);
        if (index === -1) {
          if (encoded[ii] !== paddingChar)
            continue;
          index = 0;
          ++paddingBytes;
        }
      } else {
        index = 0;
        ++missingBytes;
      }
      blockIn[ii] = index;
      ++ii;
    }

    if (missingBytes && extra) {
      if (missingBytes === 1) {
        extra[0] = encoded[0];
        extra[1] = encoded[1];
        extra[2] = encoded[2];
        extraLength = 3;
      } else if (missingBytes === 2) {
        extra[0] = encoded[0];
        extra[1] = encoded[1];
        extraLength = 2;
      } else if (missingBytes === 3) {
        extra[0] = encoded[0];
        extraLength = 1;
      }
      break;
    }

    decodeBlock(blockIn, blockOut);
    if (paddingBytes) {
      unwantedBytes = paddingBytes;
    } else {
      unwantedBytes = missingBytes;
    }

    if (!unwantedBytes) {
      output[j++] = blockOut[0];
      output[j++] = blockOut[1];
      output[j++] = blockOut[2];
    } else if (unwantedBytes === 1) {
      output[j++] = blockOut[0];
      output[j++] = blockOut[1];
    } else if (unwantedBytes === 2) {
      output[j++] = blockOut[0];
    }
  }

  if (extra) {
    params.extraLength = extraLength;
  }
};