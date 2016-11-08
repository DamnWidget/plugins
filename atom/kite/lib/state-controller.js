const child_process = require('child_process');
const fs = require('fs');
const https = require('https');
const os = require('os');
const querystring = require('querystring');

const Client = require('./client.js');
const utils = require('./utils.js');

var StateController = {
  client: new Client('127.0.0.1', 46624, '', false),

  STATES: {
    UNSUPPORTED: 0,
    UNINSTALLED: 1,
    INSTALLED: 2,
    RUNNING: 3,
    AUTHENTICATED: 4,
    WHITELISTED: 5,
  },

  RELEASE_URLS: {
    darwin: 'https://alpha.kite.com/release/dls/mac/current',
  },
  APPS_PATH: '/Applications/',
  KITE_DMG_PATH: '/Applications/Kite.dmg',
  KITE_VOLUME_PATH: '/Volumes/Kite/',
  KITE_APP_PATH: {
    mounted: '/Volumes/Kite/Kite.app',
    installed: '/Applications/Kite.app',
  },
  KITE_SIDEBAR_PATH: '/Applications/Kite.app/Contents/MacOS/KiteSidebar.app',

  isKiteSupported: function() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        os.platform() === 'darwin' ?
          resolve() :
          reject({ type: 'bad_state', data: this.STATES.UNSUPPORTED });
      }, 0);
    });
  },

  isKiteInstalled: function() {
    return new Promise((resolve, reject) => {
      this.isKiteSupported().then(() => {
        var ls = child_process.spawnSync('ls', [this.KITE_APP_PATH.installed]);
        ls.stdout.length !== 0 ?
          resolve() :
          reject({ type: 'bad_state', data: this.STATES.UNINSTALLED });
      }, (err) => {
        reject(err);
      });
    });
  },

  canInstallKite: function() {
    return new Promise((resolve, reject) => {
      this.isKiteSupported().then(() => {
        this.isKiteInstalled().then(() => {
          reject({ type: 'bad_state', data: this.STATES.INSTALLED });
        }).catch((err) => {
          resolve();
        });
      }, (err) => {
        reject(err);
      });
    });
  },

  installKite: function(url) {
    var handle = (resp, resolve, reject) => {
      if (resp.statusCode === 303) {
        this.installKite(resp.headers.location).then(resolve, reject);
        return;
      }
      if (resp.statusCode !== 200) {
        reject({ type: 'bad_status', data: resp.statusCode });
        return;
      }

      var rm = () => {
        var proc = child_process.spawn('rm', [this.KITE_DMG_PATH]);
        proc.on('close', (code) => {
          resolve();
        });
      };

      var unmount = () => {
        var proc = child_process.spawn(
          'hdiutil', ['detach', this.KITE_VOLUME_PATH]);
        proc.on('close', (code) => {
          rm();
        });
      };

      var cp = () => {
        var proc = child_process.spawn(
          'cp', ['-r', this.KITE_APP_PATH.mounted, this.APPS_PATH]);
        proc.on('close', (code) => {
          unmount();
        });
      };

      var mount = () => {
        var proc = child_process.spawn(
          'hdiutil', ['attach', this.KITE_DMG_PATH]);
        proc.on('close', (code) => {
          cp();
        });
      };

      var file = fs.createWriteStream(this.KITE_DMG_PATH);
      file.on('finish', () => {
        mount();
      });
      resp.pipe(file);
    };

    return new Promise((resolve, reject) => {
      this.canInstallKite().then(() => {
        https.get(url, (resp) => {
          handle(resp, resolve, reject);
        }).on('error', (e) => {
          reject({ type: 'http_error', data: e });
        });
      }, (err) => {
        reject(err);
      });
    });
  },

  isKiteRunning: function() {
    return new Promise((resolve, reject) => {
      this.isKiteInstalled().then(() => {
        var ps = child_process.spawnSync('/bin/ps', ['-axco', 'command'], {
          encoding: 'utf8',
        });
        var procs = ps.stdout.split('\n');
        procs.indexOf('Kite') !== -1 ?
          resolve() :
          reject({ type: 'bad_state', data: this.STATES.INSTALLED });
      }, (err) => {
        reject(err);
      });
    });
  },

  canRunKite: function() {
    return new Promise((resolve, reject) => {
      this.isKiteInstalled().then(() => {
        this.isKiteRunning().then(() => {
          reject({ type: 'bad_state', data: this.STATES.RUNNING });
        }).catch((err) => {
          resolve();
        });
      }, (err) => {
        reject(err);
      });
    });
  },

  runKite: function() {
    return new Promise((resolve, reject) => {
      this.canRunKite().then(() => {
        child_process.spawnSync('open', ['-a', this.KITE_APP_PATH.installed]);
        resolve();
      }, (err) => {
        reject(err);
      });
    });
  },

  isUserAuthenticated: function() {
    var handle = (resp, resolve, reject) => {
      if (resp.statusCode !== 200) {
        reject({ type: 'bad_status', data: resp.statusCode });
        return;
      }
      utils.handleResponseData(resp, (data) => {
        if (data === 'authenticated') {
          resolve();
        } else {
          reject({ type: 'unauthenticated' });
        }
      });
    };

    return new Promise((resolve, reject) => {
      this.isKiteRunning().then(() => {
        this.client.request({
          path: '/api/account/authenticated',
          method: 'GET',
        }, (resp) => handle(resp, resolve, reject));
      }, (err) => {
        reject(err);
      });
    });
  },

  canAuthenticateUser: function() {
    return new Promise((resolve, reject) => {
      this.isKiteRunning().then(() => {
        this.isUserAuthenticated().then(() => {
          reject({ type: 'bad_state', data: this.STATES.AUTHENTICATED });
        }).catch(() => {
          resolve();
        });
      }, (err) => {
        reject(err);
      });
    });
  },

  authenticateUser: function(email, password) {
    var handle = (resp, resolve, reject) => {
      switch (resp.statusCode) {
      case 200:
        resolve();
        break;
      case 400:
        reject({ type: 'unauthorized' });
        break;
      default:
        reject({ type: 'bad_status', data: resp.statusCode });
      }
    };

    return new Promise((resolve, reject) => {
      this.canAuthenticateUser().then(() => {
        var content = querystring.stringify({
          email: email,
          password: password,
        });
        this.client.request({
          path: '/api/account/login',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(content),
          },
        }, (resp) => handle(resp, resolve, reject), content);
      }, (err) => {
        reject(err);
      });
    });
  },

  isPathWhitelisted: function(path) {
    var handle = (resp, resolve, reject) => {
      if (resp.statusCode !== 200) {
        reject({ type: 'bad_status', data: resp.statusCode });
      }
      utils.handleResponseData(resp, (data) => {
        var whitelisted = false;
        try {
          var dirs = JSON.parse(data);
          whitelisted = dirs.indexOf(path) !== -1;
        } catch (e) {
          whitelisted = false;
        }
        if (whitelisted) {
          resolve();
        } else {
          reject({ type: 'unwhitelisted' });
        }
      });
    };

    return new Promise((resolve, reject) => {
      this.isKiteRunning().then(() => {
        this.client.request({
          path: '/clientapi/settings/inclusions',
          method: 'GET',
        }, (resp) => handle(resp, resolve, reject));
      }, (err) => {
        reject(err);
      });
    });
  },

  canWhitelistPath: function(path) {
    return new Promise((resolve, reject) => {
      this.isUserAuthenticated().then(() => {
        this.isPathWhitelisted(path).then(() => {
          reject({ type: 'bad_state', data: this.STATES.WHITELISTED });
        }).catch((err) => {
          resolve();
        });
      }, (err) => {
        reject(err);
      });
    });
  },

  whitelistPath: function(path) {
    var handle = (resp, resolve, reject) => {
      if (resp.statusCode !== 200) {
        reject({ type: 'bad_status', data: resp.statusCode });
      } else {
        resolve();
      }
    };

    return new Promise((resolve, reject) => {
      this.canWhitelistPath(path).then(() => {
        var content = querystring.stringify({
          inclusions: path,
        });
        this.client.request({
          path: '/clientapi/settings/inclusions',
          method: 'PUT',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(content),
          },
        }, (resp) => handle(resp, resolve, reject), content);
      }, (err) => {
        reject(err);
      });
    });
  },

  handleState: function(path) {
    return new Promise((resolve, reject) => {
      this.isPathWhitelisted(path).then(() => {
        resolve(this.STATES.WHITELISTED);
      }, (err) => {
        if (err.type === 'bad_state') {
          resolve(err.data);
        } else {
          reject(err);
        }
      });
    });
  },

  get releaseURL() {
    return this.RELEASE_URLS[os.platform()];
  },

  installKiteRelease: function() {
    return this.installKite(this.releaseURL);
  },
};

module.exports = StateController;
