'use strict';

var dummyLogger = require('./logger').dummy;

function bufferData(options, buffers, data) {
  if (options.maxBuffers && buffers.length >= options.maxBuffers)
    return false;
  if (options.maxBufferSize) {
    var size = 0;
    for (var i = 0, l = buffers.length; i < l; i++)
      size += buffers[i].length;
    if (size + data.length > options.maxBufferSize)
      return false;
  }
  buffers.push(data);
  return true;
}

function socketSend(socket, data) {
  if (!socket)
    return;
  socket.write(data);
}

function socketClose(socket, delay) {
  if (!socket)
    return;
  socket.removeAllListeners('close');
  socket.removeAllListeners('data');
  if (!delay) {
    socket.end();
    return;
  }
  setTimeout(socket.end.bind(socket), delay);
}

exports.forward = function(leftSocket, rightSocket, options) {
  var logger = options.logger || dummyLogger;
  var leftEncode = options.leftEncode;
  var rightEncode = options.rightEncode;
  var leftCloseDelay = options.leftCloseDelay;
  var rightCloseDelay = options.rightCloseDelay;

  var buffers = [];
  var rightSocketReady = false;
  rightSocket.on('connect', function() {
    logger.log('right socket connected');
    rightSocketReady = true;
    for (var i = 0, l = buffers.length; i < l; i++) {
      socketSend(rightSocket, buffers[i]);
    }
    buffers = [];
  });

  leftSocket.on('data', function(data) {
    if (leftEncode)
      data = leftEncode(data);
    logger.log('left socket', data.length);
    logger.debug(data);
    if (!rightSocketReady) {
      if (!bufferData(options, buffers, data)) {
        logger.warn('left socket data too big');
        socketClose(leftSocket, leftCloseDelay);
        leftSocket = null;
        socketClose(rightSocket, rightCloseDelay);
        rightSocket = null;
        buffers = [];
      }
    } else {
      socketSend(rightSocket, data);
    }
  });

  rightSocket.on('data', function(data) {
    if (rightEncode)
      data = rightEncode(data);
    logger.log('right socket', data.length);
    logger.debug(data);
    socketSend(leftSocket, data);
  });

  leftSocket.on('close', function() {
    logger.log('left socket closed');
    leftSocket = null;
    socketClose(rightSocket, rightCloseDelay);
    rightSocket = null;
    buffers = [];
  });

  rightSocket.on('close', function() {
    logger.log('right socket closed');
    rightSocket = null;
    socketClose(leftSocket, leftCloseDelay);
    leftSocket = null;
    buffers = [];
  });

  leftSocket.on('error', function(e) {
    logger.warn('left socket error');
    logger.error(e);
    socketClose(leftSocket, leftCloseDelay);
    leftSocket = null;
    socketClose(rightSocket, rightCloseDelay);
    rightSocket = null;
    buffers = [];
  });

  rightSocket.on('error', function(e) {
    logger.warn('right socket error');
    logger.error(e);
    socketClose(rightSocket, rightCloseDelay);
    rightSocket = null;
    socketClose(leftSocket, leftCloseDelay);
    leftSocket = null;
    buffers = [];
  });
};
