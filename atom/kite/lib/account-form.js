var Form = class {
  constructor(state, submit, close) {
    this.element = document.createElement('div');
    this.element.classList.add('create-account-form');
    this.element.classList.add('native-key-bindings');

    let form = document.createElement('form');
    let email = document.createElement('input');
    email.type = 'email';
    email.name = 'email';
    email.placeholder = 'Email';
    email.tabIndex = 0;
    form.appendChild(email);
    let password = document.createElement('input');
    password.type = 'password';
    password.placeholder = 'Password';
    password.name = 'password';
    password.tabIndex = 0;
    form.appendChild(password);
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

module.exports = Form;
