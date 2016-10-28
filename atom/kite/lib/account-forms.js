var CreateAccount = class {
  constructor(state, submit, close) {
    this.element = document.createElement('div');
    this.element.classList.add('account-form')
    this.element.classList.add('native-key-bindings');
    this.element.classList.add('create-account');

    let form = document.createElement('form');
    this.element.appendChild(form);

    let email = document.createElement('input');
    email.type = 'email';
    email.name = 'email';
    email.placeholder = 'Email';
    form.appendChild(email);

    let submitBtn = document.createElement('button');
    submitBtn.textContent = "Sign up";
    submitBtn.addEventListener('click', submit);
    this.element.appendChild(submitBtn);

    let closeBtn = document.createElement('button');
    closeBtn.textContent = "Close";
    closeBtn.addEventListener('click', close);
    this.element.appendChild(closeBtn);
  }

  serialize() {

  }

  destroy() {
    this.element.remove();
  }

  get data() {
    return { email: this.email.value };
  }
};

var Login = class {
  constructor(state, submit, close) {
    this.element = document.createElement('div');
    this.element.classList.add('account-form')
    this.element.classList.add('native-key-bindings');
    this.element.classList.add('login');

    let form = document.createElement('form');
    this.element.appendChild(form);

    this.email = document.createElement('input');
    this.email.type = 'email';
    this.email.name = 'email';
    this.email.placeholder = 'Email';
    form.appendChild(this.email);

    this.password = document.createElement('input');
    this.password.type = 'password';
    this.password.name = 'password';
    this.password.placeholder = 'Password';
    form.appendChild(this.password);

    let submitBtn = document.createElement('button');
    submitBtn.textContent = "Login";
    submitBtn.addEventListener('click', submit);
    this.element.appendChild(submitBtn);

    let closeBtn = document.createElement('button');
    closeBtn.textContent = "Close";
    closeBtn.addEventListener('click', close);
    this.element.appendChild(closeBtn);
  }

  serialize() {

  }

  destroy() {
    this.element.remove();
  }

  get data() {
    return {
      email: this.email.value,
      password: this.password.value,
    };
  }
};

module.exports = {
  CreateAccount: CreateAccount,
  Login: Login,
};
