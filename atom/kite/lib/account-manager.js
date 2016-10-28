var fs = require('fs');
var http = require('http');
var process = require('process');
var querystring = require('querystring');

var utils = require('./utils.js');

const HOSTNAME = 'test-3.kite.com';
const PORT = 9090;
const BASE_PATH = '/api/account';

const SESSION_FILE_PATH = process.env.HOME + '/.kite/session.json';

var createAccount = function(data, params) {
  if (!data.email) {
    throw new Error("No email provided");
  }
  var content = querystring.stringify(data);
  var opts = {
    hostname: params.hostname,
    port: params.port,
    path: BASE_PATH + '/createPasswordless',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(content),
    },
  };
  var req = http.request(opts, params.callback);
  req.write(content);
  req.end();
  return req;
};

var login = function(data, params) {
  if (!data.email) {
    throw new Error("No email provided");
  }
  if (!data.password) {
    throw new Error("No password provided");
  }
  var content = querystring.stringify(data);
  var opts = {
    hostname: params.hostname,
    port: params.port,
    path: BASE_PATH + '/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(content),
    },
  };
  var req = http.request(opts, params.callback);
  req.write(content);
  req.end();
  return req;
};

var saveSession = function(resp) {
  var cookies = utils.parseCookies(resp.headers['set-cookie']);
  fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(cookies, null, 2), {
    mode: 0o755,
  });
};

module.exports = {
  createAccount: createAccount,
  login: login,
  saveSession, saveSession,
};
