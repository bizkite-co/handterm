class GameClock {
  private startTime: number;
  private currentTime: number;
  private running: boolean;

  constructor() {
    this.startTime = 0;
    this.currentTime = 0;
    this.running = false;
  }

  start() {
    if (!this.running) {
      this.startTime = Date.now();
      this.running = true;
    }
  }

  stop() {
    if (this.running) {
      this.currentTime = this.getTime();
      this.running = false;
    }
  }

  reset() {
    this.startTime = Date.now();
    this.currentTime = 0;
  }

  getTime() {
    if (this.running) {
      return Date.now() - this.startTime;
    }
    return this.currentTime;
  }
}