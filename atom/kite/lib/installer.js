var child_process = require('child_process');
var fs = require('fs');
var https = require('https');
var os = require('os');

var Installer = {
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
    return os.platform() === 'darwin';
  },

  isKiteInstalled: function() {
    if (!this.isKiteSupported()) {
      return false;
    }
    var _this = this;
    var ls = child_process.spawnSync('ls', [_this.KITE_APP_PATH.installed]);
    return ls.stdout.length != 0;
  },

  canInstallKite: function() {
    return this.isKiteSupported() && !this.isKiteInstalled();
  },

  installKite: function(url, opts) {
    if (!this.isKiteSupported()) {
      throw new Error("Kite not supported on this machine");
    }
    if (this.isKiteInstalled()) {
      return;
    }
    opts = opts || {};
    return https.get(url, (resp) => {
      if (resp.statusCode === 303) {
        return this.installKite(resp.headers.location, opts);
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
    });
  },

  isKiteRunning: function() {
    if (!this.isKiteSupported()) {
      return false;
    }
    var ps = child_process.spawnSync('/bin/ps', ['-axco', 'command'], {
      encoding: 'utf8',
    });
    var procs = ps.stdout.split('\n');
    return procs.indexOf('Kite') !== -1;
  },

  canRunKite: function() {
    return this.isKiteInstalled() && !this.isKiteRunning();
  },

  runKite: function() {
    if (!this.isKiteInstalled()) {
      throw new Error("Kite not installed on this matchine");
    }
    if (this.isKiteRunning()) {
      return;
    }
    child_process.spawnSync('open', ['-a', this.KITE_APP_PATH.installed]);
  },

  getReleaseURL: function() {
    return this.RELEASE_URLS[os.platform()];
  },

  installKiteRelease: function(opts) {
    this.installKite(this.getReleaseURL(), opts);
  },
};

module.exports = Installer;
