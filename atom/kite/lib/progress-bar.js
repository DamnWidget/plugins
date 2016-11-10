var ProgressBar = class {
  constructor(status, classes=[]) {
    this.element = document.createElement('div');
    this.element.classList.add('progress-bar');
    classes.forEach((c) => this.element.classList.add(c));

    this.status = document.createElement('div');
    this.status.classList.add('progress-bar-status');
    this.status.textContent = status;
    this.element.appendChild(this.status);

    this.progress = 0;
    this.percentage = document.createElement('div');
    this.percentage.classList.add('progress-bar-percentage');
    this.setPercentage();
    this.element.appendChild(this.percentage);

    this.timerID = null;
  }

  setPercentage() {
    if (this.progress === 100) {
      this.percentage.classList.add('finished');
    } else {
      this.percentage.classList.remove('finished');
    }
    this.percentage.style.width = this.progress + '%';
  }

  increment(delta) {
    if (this.progress <= 0 || this.progress >= 100) {
      return;
    }
    this.progress = Math.max(0, Math.min(100, this.progress + delta));
    this.setPercentage();
  }
};

module.exports = ProgressBar;
