export class GameClock {
  private startTime: number;
  private currentTime: number;
  private running: boolean;

  public constructor() {
    this.startTime = 0;
    this.currentTime = 0;
    this.running = false;
  }

  public start(): void {
    if (!this.running) {
      this.startTime = Date.now();
      this.running = true;
    }
  }

  public stop(): void {
    if (this.running) {
      this.currentTime = this.getTime();
      this.running = false;
    }
  }

  public reset(): void {
    this.startTime = Date.now();
    this.currentTime = 0;
  }

  public getTime(): number {
    if (this.running) {
      return Date.now() - this.startTime;
    }
    return this.currentTime;
  }
}
