var CreateAccountForm = class {
  constructor(state, listeners) {
    this.element = document.createElement('div');
    this.element.classList.add('account-form')
    this.element.classList.add('native-key-bindings');
    this.element.classList.add('create-account');

    let form = document.createElement('form');
    this.element.appendChild(form);

    this.email = document.createElement('input');
    this.type = 'email';
    this.name = 'email';
    this.placeholder = 'Email';
    form.appendChild(this.email);

    let submitBtn = document.createElement('button');
    submitBtn.textContent = "Sign up";
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
    return { email: this.email.value };
  }
};

module.exports = CreateAccountForm;
