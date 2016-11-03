var CreateAccountForm = class {
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
    submitBtn.onclick = submit;
    this.element.appendChild(submitBtn);

    let closeBtn = document.createElement('button');
    closeBtn.textContent = "Close";
    closeBtn.onclick = close;
    this.element.appendChild(closeBtn);
  }

  serialize() {
    return this.data;
  }

  destroy() {
    this.element.remove();
  }

  get data() {
    return { email: this.email.value };
  }
};

module.exports = CreateAccountForm;
