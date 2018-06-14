'use strict';

var WebSocket = require('ws');

function convertWebSocketEventName(eventName) {
  switch (eventName) {
    case 'connect':
      eventName = 'open';
      break;

    case 'data':
      eventName = 'message';
      break;
  }
  return eventName;
}

function WrappedSocket(rawSocket, isWebSocket) {
  this.rawSocket = rawSocket;
  this.isWebSocket = !!isWebSocket;
}

WrappedSocket.prototype.on = function(eventName, listener) {
  if (this.isWebSocket) {
    eventName = convertWebSocketEventName(eventName);
  }
  this.rawSocket.on(eventName, listener);
};

WrappedSocket.prototype.removeAllListeners = function(eventName) {
  if (this.isWebSocket) {
    eventName = convertWebSocketEventName(eventName);
  }
  this.rawSocket.removeAllListeners(eventName);
};

WrappedSocket.prototype.write = function(data) {
  if (this.isWebSocket) {
    if (this.rawSocket.readyState != WebSocket.OPEN)
      return;
    this.rawSocket.send(data, {binary: true});
    return;
  }
  this.rawSocket.write(data);
};

WrappedSocket.prototype.end = function() {
  if (this.isWebSocket) {
    this.rawSocket.close();
    return;
  }
  this.rawSocket.end();
};

module.exports = WrappedSocket;