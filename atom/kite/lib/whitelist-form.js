var WhitelistForm = class {
  constructor(listeners, classes=[]) {
    this.element = document.createElement('div');
    this.element.classList.add('whitelist-form');
    this.element.classList.add('native-key-bindings');
    classes.forEach((c) => this.element.classList.add(c));

    let form = document.createElement('form');
    this.element.appendChild(form);

    this.submitBtn = document.createElement('button');
    this.submitBtn.textContent = "Enable access";
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

  onSubmit(func) {
    this.submitBtn.onclick = func;
  }
};

module.exports = WhitelistForm;
