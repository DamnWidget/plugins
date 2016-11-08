var fs = require('fs');
var process = require('process');
var querystring = require('querystring');

var Client = require('./client.js');
var utils = require('./utils.js');

var AccountManager = {
  createAccount: function(data, callback) {
    if (!data.email) {
      throw new Error("No email provided");
    }
    var hostname = atom.config.get('kite.hostname');
    var port = atom.config.get('kite.port');
    var ssl = atom.config.get('kite.ssl');
    var client = new Client(hostname, port, '/api/account', ssl);
    var content = querystring.stringify(data);
    return client.request({
      path: '/createPasswordless',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(content),
      },
    }, callback, content);
  },

  login: function(data, callback) {
    if (!data.email) {
      throw new Error("No email provided");
    }
    if (!data.password) {
      throw new Error("No password provided");
    }
    var hostname = atom.config.get('kite.hostname');
    var port = atom.config.get('kite.port');
    var ssl = atom.config.get('kite.ssl');
    var client = new Client(hostname, port, '/api/account', ssl);
    var content = querystring.stringify(data);
    return client.request({
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(content),
      },
    }, callback, content);
  },

  saveSession: function(resp, callback) {
    var cookies = utils.parseSetCookies(resp.headers['set-cookie']);
    var data = JSON.stringify(cookies, null, 2);
    fs.writeFile(this.SESSION_FILE_PATH, data, {
      mode: 0o755,
    }, callback);
  }
};

module.exports = AccountManager;