var CreateAccountForm = class {
  constructor(listeners, classes=[]) {
    this.element = document.createElement('div');
    this.element.classList.add('create-account-form');
    this.element.classList.add('native-key-bindings');
    classes.forEach((c) => this.element.classList.add(c));

    let form = document.createElement('form');
    this.element.appendChild(form);

    this.email = document.createElement('input');
    this.email.type = 'email';
    this.email.name = 'email';
    this.email.placeholder = 'Email';
    form.appendChild(this.email);

    this.submitBtn = document.createElement('button');
    this.submitBtn.textContent = "Sign up";
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

  onSubmit(func) {
    this.submitBtn.onclick = func;
  }

  get data() {
    return { email: this.email.value };
  }
};

module.exports = CreateAccountForm;
