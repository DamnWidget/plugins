const http = require('http');
const https = require('https');

const utils = require('./utils.js');

var Client = class {
  constructor(hostname, port, base, ssl) {
    this.hostname = hostname;
    this.port = port;
    this.base = base || '';
    this.proto = ssl ? https : http;
    this.cookies = {};
  }

  request(opts, callback, data=null) {
    opts.hostname = this.hostname;
    opts.port = this.port;
    opts.path = this.base + opts.path;
    if (!('headers' in opts)) {
      opts.headers = {};
    }
    this.writeCookies(opts.headers);
    var req = this.proto.request(opts, (resp) => {
      this.readCookies(resp);
      if (typeof(callback) === 'function') {
        callback(resp);
      }
    });
    if (data !== null) {
      req.write(data);
    }
    req.end();
    return req;
  }

  getCookies() {
    return this.cookies;
  }

  readCookies(resp) {
    var cookies = utils.parseCookies(resp['set-cookie']);
    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i];
      this.cookies[c.Name] = c;
    }
  }

  writeCookies(hdrs) {
    var cookies = [];
    for (k in this.cookies) {
      cookies.push(this.cookies[k]);
    }
    if (cookies.length) {
      hdrs.Cookies = utils.dumpCookies(cookies);
    }
  }
};

module.exports = Client;
