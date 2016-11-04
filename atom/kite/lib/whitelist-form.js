var WhitelistForm = class {
  constructor(listeners, classes=[]) {
    this.element = document.createElement('div');
    this.element.classList.add('whitelist-form');
    this.element.classList.add('native-key-bindings');
    classes.forEach((c) => this.element.classList.add(c));

    let form = document.createElement('form');
    this.element.appendChild(form);

    let submitBtn = document.createElement('button');
    submitBtn.textContent = "Enable access";
    submitBtn.onclick = listeners.submit;
    this.element.appendChild(submitBtn);

    let closeBtn = document.createElement('button');
    closeBtn.textContent = "Close";
    closeBtn.onclick = listeners.close;
    this.element.appendChild(closeBtn);
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
};

module.exports = WhitelistForm;
