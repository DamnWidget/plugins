const child_process = require('child_process');

const AccountManager = require('./account-manager.js');
const StateController = require('./state-controller.js');

var Installer = class {
  constructor() {
    this.flow = null;
  }

  init(flow) {
    this.flow = flow;
    this.flow.onInstall(this.install.bind(this));
    this.flow.onCreateAccount(this.createAccount.bind(this));
  }

  install() {
    this.flow.clickInstall(this.getUserEmail());
    StateController.installKiteRelease().then(() => {
      this.flow.finishedInstall();
    }).catch((err) => {
      console.error(`error installing kite: ${ err.type }`);
    });
  }

  createAccount() {
    try {
      var data = this.flow.createAccountForm.data;
      var req = AccountManager.createAccount(data, (resp) => {
        if (resp.statusCode === 409) {
          this.flow.showLogin();
        }
      });
    } catch (err) {
      console.log(`error creating account: ${ err.message }`);
    }
  }

  getUserEmail() {
    var proc = child_process.spawnSync('git', ['config', 'user.email'], {
      encoding: 'utf8',
    });
    return proc.stdout.trim();
  }
};

module.exports = Installer;
