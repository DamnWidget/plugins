const ProgressBar = require('./progress-bar.js');

var InstallForm = class {
  constructor(listeners, classes=[]) {
    this.element = document.createElement('div');
    this.element.classList.add('install-form');
    this.element.classList.add('native-key-bindings');
    classes.forEach((c) => this.element.classList.add(c));

    let ctaRow = document.createElement('div');
    ctaRow.classList.add('row');
    ctaRow.classList.add('vertical-align');
    ctaRow.classList.add('cta-row');
    this.element.appendChild(ctaRow);

    let logo = document.createElement('div');
    logo.classList.add('inline');
    logo.classList.add('logo');
    ctaRow.appendChild(logo);

    this.submitBtn = document.createElement('button');
    this.submitBtn.classList.add('cta-btn');
    this.submitBtn.textContent = "Enable Kite";
    this.submitBtn.onclick = listeners.submit;
    ctaRow.appendChild(this.submitBtn);

    this.status = document.createElement('div');
    this.element.appendChild(this.status);

    this.progress = new ProgressBar('Installing...');
    this.element.appendChild(this.progress.element);
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

  setStatus(text) {
    this.status.textContent = text;
  }

  onSubmit(func) {
    this.submitBtn.onclick = func;
  }
};

module.exports = InstallForm;
