var WhitelistForm = class {
  constructor(listeners, classes=[]) {
    this.element = document.createElement('div');
    this.element.classList.add('whitelist-form');
    this.element.classList.add('native-key-bindings');
    classes.forEach((c) => this.element.classList.add(c));

    let form = document.createElement('form');
    this.element.appendChild(form);

    this.finished = document.createElement('div');
    this.finished.classList.add('hidden');
    this.element.appendChild(this.finished);

    this.btnContainer = document.createElement('div');
    this.element.appendChild(this.btnContainer);

    this.submitBtn = document.createElement('button');
    this.submitBtn.textContent = "Enable access";
    this.submitBtn.onclick = listeners.submit;
    this.btnContainer.appendChild(this.submitBtn);

    this.closeBtn = document.createElement('button');
    this.closeBtn.textContent = "Close";
    this.closeBtn.onclick = listeners.close;
    this.btnContainer.appendChild(this.closeBtn);
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

  setFinished(text) {
    this.finished.textContent = text;
    this.btnContainer.classList.add('hidden');
    this.finished.classList.remove('hidden');
  }

  onSubmit(func) {
    this.submitBtn.onclick = func;
  }
};

module.exports = WhitelistForm;
