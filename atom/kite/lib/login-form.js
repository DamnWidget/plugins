var LoginForm = class {
  constructor(state, listeners) {
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
    submitBtn.onclick = listeners.submit;
    this.element.appendChild(submitBtn);

    let closeBtn = document.createElement('button');
    closeBtn.textContent = "Close";
    closeBtn.onclick = listeners.close;
    this.element.appendChild(closeBtn);
  }

  serialize() { }

  destroy() {
    this.element.remove();
  }

  setEmail(email) {
    this.email.value = email;
  }

  get data() {
    return {
      email: this.email.value,
      password: this.password.value,
    };
  }
};

module.exports = LoginForm;
