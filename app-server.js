'use strict';

var assert = require('assert');
var http = require('http');
var server = require('./server');

var cfg;
try {
  cfg = require('./config').server;
} catch(e) {
  cfg = JSON.parse(process.env.app_config_server);
}

function createHttpServer() {
  return http.createServer(function(req, res) {
    res.writeHead(404, {
      'Content-Type': 'text/html'
    });
    res.end();
  });
}

function run(opts) {
  assert(opts.query);
  assert(opts.port);
  assert(opts.host);
  var httpServer = createHttpServer();
  server.createServer(httpServer, opts);
  httpServer.listen(opts.port, opts.host, function() {
    console.log('listening', opts.port, opts.host);
  });
}

run(cfg);