var child_process = require('child_process');
var fs = require('fs');
var https = require('https');
var os = require('os');
var querystring = require('querystring');

var Client = require('./client.js');

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
      this.isKiteSupported().catch((state) => {
        reject({ type: 'bad_state', data: state });
      }).then(() => {
        var ls = child_process.spawnSync('ls', [this.KITE_APP_PATH.installed]);
        ls.stdout.length !== 0 ?
          resolve() :
          reject({ type: 'bad_state', data: this.STATES.UNINSTALLED });
      });
    });
  },

  canInstallKite: function() {
    return new Promise((resolve, reject) => {
      this.isKiteSupported().catch((state) => {
        reject({ type: 'bad_state', data: state });
      }).then(() => {
        this.isKiteInstalled().then(() => {
          reject({ type: 'bad_state', data: this.states.INSTALLED });
        }).catch((state) => {
          resolve();
        });
      });
    });
  },

  installKite: function(url) {
    var handle = (resp, resolve, reject) => {
      if (resp.statusCode === 303) {
        this.installKite(resp.headers.location)
          .then(resolve).catch(reject);
        return;
      }
      if (resp.statusCode !== 200) {
        reject({ type: 'bad_status', data: resp.statusCode });
        return;
      }
      var file = fs.createWriteStream(this.KITE_DMG_PATH);
      file.on('finish', () => {
        child_process.spawnSync(
          'hdiutil', ['attach', this.KITE_DMG_PATH]);
        child_process.spawnSync(
          'cp', ['-r', this.KITE_APP_PATH.mounted, this.APPS_PATH]);
        child_process.spawnSync(
          'hdiutil', ['detach', this.KITE_VOLUME_PATH]);
        child_process.spawnSync(
          'rm', [this.KITE_DMG_PATH]);
        resolve();
      });
      resp.pipe(file);
    };

    return new Promise((resolve, reject) => {
      this.canInstallKite().catch((state) => {
        reject({ type: 'bad_state', data: state });
      }).then(() => {
        https.get(url, (resp) => {
          handle(resp, resolve, reject);
        }).on('error', (e) => {
          reject({ type: 'http_error', data: e });
        });
      });
    });
  },

  isKiteRunning: function() {
    return new Promise((resolve, reject) => {
      this.isKiteInstalled().catch((state) => {
        reject({ type: 'bad_state', data: state });
      }).then(() => {
        var ps = child_process.spawnSync('/bin/ps', ['-axco', 'command'], {
          encoding: 'utf8',
        });
        var procs = ps.stdout.split('\n');
        procs.indexOf('Kite') !== -1 ?
          resolve() :
          reject({ type: 'bad_state', data: this.state.INSTALLED });
      });
    });
  },

  canRunKite: function() {
    return new Promise((resolve, reject) => {
      this.isKiteInstalled().catch((state) => {
        reject({ type: 'bad_state', data: state });
      }).then(() => {
        this.isKiteRunning().then(() => {
          reject({ type: 'bad_state', data: this.STATES.RUNNING });
        }).catch((state) => {
          resolve();
        })
      });
    });
  },

  runKite: function() {
    return new Promise((resolve, reject) => {
      this.canRunKite().catch((state) => {
        reject({ type: 'bad_state', data: state });
      }).then(() => {
        child_process.spawnSync('open', ['-a', this.KITE_APP_PATH.installed]);
        resolve();
      });
    });
  },

  isUserAuthenticated: function() {
    var handle = (resp, resolve, reject) => {
      if (resp.statusCode !== 200) {
        reject({ type: 'bad_status', data: resp.statusCode });
        return;
      }
      var raw = '';
      resp.on('data', (chunk) => raw += chunk);
      resp.on('end', () => {
        if (raw === 'authenticated') {
          resolve();
        } else {
          reject({ type: 'unauthenticated' });
        }
      });
    };

    return new Promise((resolve, reject) => {
      this.isKiteRunning().catch((state) => {
        reject({ type: 'bad_state', data: state });
      }).then(() => {
        this.client.request({
          path: '/api/account/authenticated',
          method: 'GET',
        }, (resp) => handle(resp, resolve, reject));
      })
    });
  },

  canAuthenticateUser: function() {
    return new Promise((resolve, reject) => {
      this.isKiteRunning().catch((state) => {
        reject({ type: 'bad_state', data: state });
      }).then(() => {
        this.isUserAuthenticated().then(() => {
          reject({ type: 'bad_state', data: this.STATES.AUTHENTICATED });
        }).catch(() => {
          resolve();
        });
      });
    });
  },

  authenticateUser: function(email, password) {
    var handle = (resp, reject) => {
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
      this.canAuthenticateUser().catch((state) => {
        reject({ type: 'bad_state', data: state });
      }).then(() => {
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
      });
    });
  },

  isPathWhitelisted: function(path) {
    var handle = (resp, resolve, reject) => {
      if (resp.statusCode !== 200) {
        reject({ type: 'bad_status', data: resp.statusCode });
      }
      var raw = '';
      resp.on('data', (chunk) => raw += chunk);
      resp.on('end', () => {
        var whitelisted = false;
        try {
          var dirs = JSON.parse(raw);
          whitelisted = dirs.indexOf(path) !== -1;
        } catch(e) {
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
      this.isKiteRunning().catch((state) => {
        reject({ type: 'bad_state', data: state });
      }).then(() => {
        this.client.request({
          path: '/clientapi/settings/inclusions',
          method: 'GET',
        }, (resp) => handle(resp, resolve, reject));
      });
    });
  },

  canWhitelistPath: function(path) {
    return new Promise((resolve, reject) => {
      this.isUserAuthenticated().catch((state) => {
        reject({ type: 'bad_state', data: state });
      }).then(() => {
        this.isPathWhitelisted(path).then(() => {
          reject({ type: 'bad_state', data: this.STATES.WHITELISTED });
        }).catch((state) => {
          resolve();
        });
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
      this.canWhitelistPath(path).catch((state) => {
        reject({ type: 'bad_state', data: state });
      }).then(() => {
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
      });
    });
  },

  handleState: function(path) {
    return new Promise((resolve, reject) => {
      this.isPathWhitelisted(path).catch((state) => {
        resolve(state);
      }).then(() => {
        resolve(this.STATES.WHITELISTED);
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
