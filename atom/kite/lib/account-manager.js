var fs = require('fs');
var http = require('http');
var process = require('process');
var querystring = require('querystring');

var utils = require('./utils.js');

const HOSTNAME = 'test-3.kite.com';
const PORT = 9090;
const BASE_PATH = '/api/account';

const SESSION_FILE_PATH = process.env.HOME + '/.kite/session.json';

var createAccount = function(email, callback) {
  if (!email.length) {
    throw new Error("No email provided");
  }
  var data = querystring.stringify({
    'email': email
  });
  var opts = {
    hostname: HOSTNAME,
    port: PORT,
    path: BASE_PATH + '/createPasswordless',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data),
    },
  };
  var req = http.request(opts, callback);
  req.write(data);
  req.end();
  return req;
};

var login = function(email, password, callback) {
  if (!email.length) {
    throw new Error("No email provided");
  }
  if (!password.length) {
    throw new Error("No password provided");
  }
  var data = querystring.stringify({
    'email': email,
    'password': password,
  });
  var opts = {
    hostname: HOSTNAME,
    port: PORT,
    path: BASE_PATH + '/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data),
    },
  };
  var req = http.request(opts, callback);
  req.write(data);
  req.end();
  return req;
};

var saveSession = function(resp) {
  var cookies = utils.parseSetCookies(resp.headers['set-cookie']);
  fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(cookies, null, 2), {
    mode: 0o755,
  });
};

module.exports = {
  createAccount: createAccount,
  login: login,
  saveSession, saveSession,
};
