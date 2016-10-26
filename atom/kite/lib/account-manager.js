var http = require('http');

const HOSTNAME = 'test-3.kite.com:9090';
const BASE_PATH = '/api/account';

var createAccount = function(email, callback) {
  if (!email.length) {
    throw new Error("No email provided");
  }
  var data = { 'email': email };
  var opts = {
    hostname: HOSTNAME,
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

var saveSession = function(resp) {
  var cookies = resp.headers['set-cookie'];
  console.log(cookies);
};

module.exports = {
  createAccount: createAccount,
};
