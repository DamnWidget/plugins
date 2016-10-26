var CreateAccount = class {
  constructor(state, submit, close) {
    this.element = document.createElement('div');
    this.element.classList.add('account-form')
    this.element.classList.add('native-key-bindings');
    this.element.classList.add('create-account');

    let form = document.createElement('form');

    let email = document.createElement('input');
    email.type = 'email';
    email.name = 'email';
    email.placeholder = 'Email';
    form.appendChild(email);

    this.element.appendChild(form);

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

  getElement() {
    return this.element;
  }
};

var Login = class {
  constructor(state, submit, close) {
    this.element = document.createElement('div');
    this.element.classList.add('account-form')
    this.element.classList.add('native-key-bindings');
    this.element.classList.add('login');

    let form = document.createElement('form');

    let email = document.createElement('input');
    email.type = 'email';
    email.name = 'email';
    email.placeholder = 'Email';
    form.appendChild(email);

    let password = document.createElement('input');
    password.type = 'password';
    password.name = 'password';
    password.placeholder = 'Password';
    form.appendChild(password);

    this.element.appendChild(form);

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

  getElement() {
    return this.element;
  }
};

module.exports = {
  CreateAccount: CreateAccount,
  Login: Login,
};
