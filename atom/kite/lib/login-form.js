var LoginForm = class {
  constructor(listeners, classes=[]) {
    this.element = document.createElement('div');
    this.element.classList.add('login-form');
    this.element.classList.add('native-key-bindings');
    classes.forEach((c) => this.element.classList.add(c));

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

    this.error = document.createElement('div');
    this.error.classList.add('error');
    this.error.classList.add('hidden');
    this.element.appendChild(this.error);

    this.submitBtn = document.createElement('button');
    this.submitBtn.textContent = "Login";
    this.submitBtn.onclick = listeners.submit;
    this.element.appendChild(this.submitBtn);

    this.closeBtn = document.createElement('button');
    this.closeBtn.textContent = "Close";
    this.closeBtn.onclick = listeners.close;
    this.element.appendChild(this.closeBtn);
  }

  destroy() {
    this.element.remove();
  }

  hide() {
    this.element.classList.add('hidden');
  }

  show() {
    this.element.classList.remove('hidden');
  }

  setEmail(email) {
    this.email.value = email;
  }

  showError(text) {
    this.error.textContent = text;
    this.error.classList.remove('hidden');
  }

  hideError() {
    this.error.textContent = "";
    this.error.classList.add('hidden');
  }

  onSubmit(func) {
    this.submitBtn.onclick = func;
  }

  get data() {
    return {
      email: this.email.value,
      password: this.password.value,
    };
  }
};

module.exports = LoginForm;
