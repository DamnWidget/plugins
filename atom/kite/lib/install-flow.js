var InstallForm = require('./install-form.js');
var CreateAccountForm = require('./create-account-form.js');
var LoginForm = require('./login-form.js');
var WhitelistForm = require('./whitelist-form.js');

var InstallFlow = class {
  static get STATES() {
    return {
      STARTED: 0,
      CREATE_ACCOUNT: 1,
      LOGIN: 2,
      WHITELIST: 3,
      WHITELISTED: 4,
    };
  }

  constructor(classes=[]) {
    this.element = document.createElement('div');
    this.element.classList.add('install-flow');
    this.element.classList.add('native-key-bindings');
    this.element.classList.add('native-key-bindings');

    this.state = InstallFlow.STATES.STARTED;

    this.installForm = new InstallForm({}, []);
    this.element.appendChild(this.installForm.element);

    this.createAccountForm = new CreateAccountForm({}, ['hidden']);
    this.element.appendChild(this.createAccountForm.element);

    this.loginForm = new LoginForm({}, ['hidden']);
    this.element.appendChild(this.loginForm.element);

    this.whitelistForm = new WhitelistForm({}, ['hidden']);
    this.element.appendChild(this.whitelistForm.element);
  }

  destroy() {
    this.installForm.destroy();
    this.createAccountForm.destroy();
    this.loginForm.destroy();
    this.whitelistForm.destroy();
    this.element.remove();
  }

  clickInstall(email=null) {
    if (this.state !== InstallFlow.STATES.STARTED) {
      return;
    }
    this.installForm.setStatus("Installing...");
    if (email) {
      this.createAccountForm.setEmail(email);
    }
    this.createAccountForm.show();
    this.state = InstallFlow.STATES.CREATE_ACCOUNT;
  }

  showLogin() {
    if (this.state !== InstallFlow.STATES.CREATE_ACCOUNT) {
      return;
    }
    if (this.createAccountForm.email.value) {
      this.loginForm.setEmail(this.createAccountForm.email.value);
    }
    this.createAccountForm.hide();
    this.loginForm.show();
    this.state = InstallFlow.STATES.LOGIN;
  }

  accountValidated() {
    if (this.state !== InstallFlow.STATES.CREATE_ACCOUNT &&
        this.state !== InstallFlow.STATES.LOGIN) {
      return;
    }
    this.createAccountForm.hide();
    this.loginForm.hide();
    this.whitelistForm.show();
    this.state = InstallFlow.STATES.WHITELIST;
  }

  whitelisted() {
    if (this.state !== InstallFlow.STATES.WHITELIST) {
      return;
    }
    this.whitelistForm.hide();
    this.state = InstallFlow.STATES.WHITELISTED;
  }
};

module.exports = InstallFlow;
