var WhitelistForm = class {
  constructor(state, listeners) {
    this.element = document.createElement('div');
    this.element.classList.add('whitelist-form');
    this.element.classList.add('native-key-bindings');

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

  serialize() { }

  destroy() {
    this.element.remove();
  }
};

module.exports = WhitelistForm;
