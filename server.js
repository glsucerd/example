'use strict';

var net = require('net');
var http = require('http');
var urlParse = require('url').parse;
var WebSocketServer = require('ws').Server;
var forwarder = require('./forwarder');
var WrappedSocket = require('./wrapped-socket');
var Encoder = require('./encoder');

var dummyLogger = require('./logger').dummy;

function handelConnection(opts, leftSocket) {
  var loggers = opts.loggers || {};
  var logger = loggers.server || dummyLogger;

  // leftSocket     : local <--> server
  // rightSocket    : server <--> remote(e.g. web site)

  var req = leftSocket.upgradeReq;
  var remoteHost, remotePort;
  var addr = urlParse(req.url, true).query[opts.query];
  if (addr) {
    addr = urlParse('tcp://' + addr);
    remoteHost = addr.hostname;
    remotePort = addr.port;
  }

  if (!remoteHost || !remotePort) {
    logger.warn('address error', remoteHost, remotePort);
    leftSocket.close();
    return;
  }

  var rightSocket = net.connect(remotePort, remoteHost);
  logger.log('connect', remoteHost, remotePort);

  var encoder = new Encoder({
    patterns: opts.patterns,
    logger: loggers.encoder
  });

  var fwdOpts = {
    leftCloseDelay: opts.closeDelay,
    leftEncode: encoder.decode.bind(encoder),
    rightEncode: encoder.encode.bind(encoder),
    logger: loggers.forwarder
  };
  forwarder.forward(
    new WrappedSocket(leftSocket, true),
    new WrappedSocket(rightSocket),
    fwdOpts
  );
}

exports.createServer = function(httpServer, opts) {
  var server = new WebSocketServer({
    server: httpServer,
    path: opts.path,
    disableHixie: true,
    clientTracking: false,
    perMessageDeflate: opts.deflate
  });
  server.on('connection', function(leftSocket) {
    handelConnection(opts, leftSocket);
  });
  return server;
};