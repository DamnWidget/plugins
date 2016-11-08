const child_process = require('child_process');

const AccountManager = require('./account-manager.js');
const StateController = require('./state-controller.js');
const utils = require('./utils.js');

var Installer = class {
  constructor() {
    this.flow = null;
  }

  init(flow) {
    this.flow = flow;
    this.flow.onInstall(this.install.bind(this));
    this.flow.onCreateAccount(this.createAccount.bind(this));
    this.flow.onLogin(this.login.bind(this));
    this.flow.onWhitelist(this.whitelist.bind(this));
  }

  install() {
    this.flow.clickInstall(this.getUserEmail());
    StateController.installKiteRelease().then(() => {
      this.flow.finishedInstall();
      StateController.runKite().then(() => {
        console.log("Kite running!");
      }).catch((err) => {
        console.log("can't run Kite", err);
      });
    }).catch((err) => {
      console.error(`error installing kite: ${ err.type }`);
    });
  }

  createAccount() {
    try {
      var data = this.flow.createAccountForm.data;
      var req = AccountManager.createAccount(data, (resp) => {
        switch (resp.statusCode) {
        case 200:
          this.accountValidated();
          break;
        case 409:
          this.flow.showLogin();
          break;
        default:
          this.flow.createAccountForm.showError("An error occurred");
          break;
        }
      });
    } catch (err) {
      console.log(`error creating account: ${ err.message }`);
    }
  }

  login() {
    var handle = (resp) => {
      switch (resp.statusCode) {
      case 200:
        this.accountValidated();
        break;
      case 401:
        utils.handleResponseData(resp, (raw) => {
          try {
            var data = JSON.parse(raw);
            if (data.code === 9) {
              this.flow.loginForm.showError(
                "To login, set your password first");
            } else {
              this.flow.loginForm.showError(
                "Wrong email/password combination");
            }
          } catch (e) {
            this.flow.loginForm.showError("An error occurred");
          }
        });
        break;
      default:
        this.flow.loginForm.showError("An error occurred");
        break;
      }
    };

    try {
      var data = this.flow.loginForm.data;
      var req = AccountManager.login(data, handle);
    } catch (err) {
      console.log(`error logging in: ${ err.message }`);
    }
  }

  whitelist() {
    var paths = atom.project.getPaths();
    if (!paths.length) {
      this.flow.whitelisted();
      return;
    }

    var p = StateController.whitelistPath(paths[0]).then(() => {
      this.flow.whitelisted();
    }).catch((err) => {

    });
  }

  getUserEmail() {
    var proc = child_process.spawnSync('git', ['config', 'user.email'], {
      encoding: 'utf8',
    });
    return proc.stdout.trim();
  }
};

module.exports = Installer;
