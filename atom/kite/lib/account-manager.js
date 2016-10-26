var http = require('http');
var querystring = require('querystring');

var utils = require('./utils.js');

const HOSTNAME = 'test-3.kite.com';
const PORT = 9090;
const BASE_PATH = '/api/account';

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
  var cookies = resp.headers['set-cookie'];
  window.cookies = utils.parseCookies(cookies);
  console.log(utils.parseCookies(cookies));
};

module.exports = {
  createAccount: createAccount,
  login: login,
  saveSession, saveSession,
};
