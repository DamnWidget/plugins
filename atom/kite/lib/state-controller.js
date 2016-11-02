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
          resolve() : reject(this.STATES.UNSUPPORTED);
      }, 0);
    });
  },

  isKiteInstalled: function() {
    return new Promise((resolve, reject) => {
      this.isKiteSupported().catch((state) => {
        reject(state);
      }).then(() => {
        var ls = child_process.spawnSync('ls', [this.KITE_APP_PATH.installed]);
        ls.stdout.length != 0 ? resolve() : reject(this.STATES.UNINSTALLED);
      });
    });
  },

  canInstallKite: function() {
    return new Promise((resolve, reject) => {
      this.isKiteSupported().catch((state) => {
        reject(state);
      }).then(() => {
        this.isKiteInstalled().then(() => {
          reject(this.states.INSTALLED);
        }).catch((state) => {
          resolve();
        });
      });
    });
  },

  installKite: function(url, opts={}) {
    var handle = (resp, resolve, reject) => {
      if (resp.statusCode === 303) {
        this.installKite(resp.headers.location, opts)
          .then(resolve).catch(reject);
        return;
      }
      if (resp.statusCode !== 200) {
        if (typeof(opts.badStatus) === 'function') {
          opts.badStatus(resp.statusCode);
        }
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
        if (typeof(opts.finish) === 'function') {
          opts.finish();
        }
      });
      resp.pipe(file);
    };

    return new Promise((resolve, reject) => {
      this.canInstallKite().catch((state) => {
        reject(state);
      }).then(() => {
        resolve(https.get(url, (resp) => {
          handle(resp, resolve, reject);
        }));
      });
    });
  },

  isKiteRunning: function() {
    return new Promise((resolve, reject) => {
      this.isKiteInstalled().catch((state) => {
        reject(state);
      }).then(() => {
        var ps = child_process.spawnSync('/bin/ps', ['-axco', 'command'], {
          encoding: 'utf8',
        });
        var procs = ps.stdout.split('\n');
        procs.indexOf('Kite') !== -1 ?
          resolve() : reject(this.state.INSTALLED);
      });
    });
  },

  canRunKite: function() {
    return new Promise((resolve, reject) => {
      this.isKiteInstalled().catch((state) => {
        reject(state);
      }).then(() => {
        this.isKiteRunning().then(() => {
          reject(this.STATES.RUNNING);
        }).catch((state) => {
          resolve();
        })
      });
    });
  },

  runKite: function() {
    return new Promise((resolve, reject) => {
      this.canRunKite().catch((state) => {
        reject(state);
      }).then(() => {
        child_process.spawnSync('open', ['-a', this.KITE_APP_PATH.installed]);
        resolve();
      });
    });
  },

  isUserAuthenticated: function(opts={}) {
    var handle = (resp) => {
      if (resp.statusCode !== 200) {
        if (typeof(opts.badStatus) === 'function') {
          opts.badStatus(resp.statusCode);
        }
        return;
      }
      var raw = '';
      resp.on('data', (chunk) => raw += chunk);
      resp.on('end', () => {
        if (raw === 'authenticated') {
          if (typeof(opts.authenticated) === 'function') {
            opts.authenticated();
          }
        } else {
          if (typeof(opts.unauthenticated) === 'function') {
            opts.unauthenticated();
          }
        }
      });
    };

    return new Promise((resolve, reject) => {
      this.isKiteRunning().catch((state) => {
        reject(state);
      }).then(() => {
        resolve(this.client.request({
          path: '/api/account/authenticated',
          method: 'GET',
        }, handle));
      })
    });
  },

  canAuthenticateUser: function() {
    return new Promise((resolve, reject) => {
      this.isKiteRunning().catch((state) => {
        reject(state);
      }).then(() => {
        this.isUserAuthenticated().then(() => {
          reject(this.STATES.AUTHENTICATED);
        }).catch(() => {
          resolve();
        });
      });
    });
  },

  authenticateUser: function(email, password, opts={}) {
    var handle = (resp) => {
      switch (resp.statusCode) {
      case 200:
        if (typeof(opts.authenticated) === 'function') {
          opts.authenticated();
        }
        break;
      case 400:
        if (typeof(opts.unauthorized) === 'function') {
          opts.unauthorized();
        }
        break;
      default:
        if (typeof(opts.badStatus) === 'function') {
          opts.badStatus(resp.statusCode);
        }
      }
    };

    return new Promise((resolve, reject) => {
      this.canAuthenticateUser().catch((state) => {
        reject(state);
      }).then(() => {
        var content = querystring.stringify({
          email: email,
          password: password,
        });
        resolve(this.client.request({
          path: '/api/account/login',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(content),
          },
        }, handle, content));
      });
    });
  },

  isPathWhitelisted: function(path, opts={}) {
    var handle = (resp) => {
      if (resp.statusCode !== 200) {
        if (typeof(opts.badStatus) === 'function') {
          opts.badStatus(resp.statusCode);
        }
        return;
      }
      var raw = '';
      resp.on('data', (chunk) => raw += chunk);
      resp.on('end', () => {
        var whitelisted = false;
        try {
          var settings = JSON.parse(raw);
          whitelisted = settings.inclusions.indexOf(path) !== -1;
        } catch(e) {
          whitelisted = false;
        }
        if (whitelisted) {
          if (typeof(opts.whitelisted) === 'function') {
            opts.whitelisted();
          }
        } else {
          if (typeof(opts.unwhitelisted) === 'function') {
            opts.unwhitelisted();
          }
        }
      });
    };

    return new Promise((resolve, reject) => {
      this.isKiteRunning().catch((state) => {
        reject(state);
      }).then(() => {
        resolve(this.client.request({
          path: '/clientapi/settings',
          method: 'GET',
        }, handle));
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

  installKiteRelease: function(opts) {
    return this.installKite(this.releaseURL, opts);
  },
};

module.exports = StateController;
