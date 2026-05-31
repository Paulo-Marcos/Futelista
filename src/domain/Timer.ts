import { ScreenTime } from './ScreenTime';

export class Timer {
  status = TimerStatus.CREATED;
  restTime: number;
  currentNumberTime: number;
  private timeOutId?: NodeJS.Timeout;
  constructor(
    readonly numberTimes: number,
    readonly timeMatch: number,
  ) {
    this.restTime = timeMatch;
    this.currentNumberTime = 1;
  }

  getTime(): ScreenTime {
    return new ScreenTime(this.currentNumberTime, this.timeMatch - this.restTime);
  }

  start(): void {
    if (this.status === TimerStatus.ENDED) throw Error('Não há mais etapas');
    if (this.status === TimerStatus.PAUSED) return;
    this.status = TimerStatus.STARTED;
    this.timeOutId = setInterval(() => {
      this.restTime--;
      if (this.restTime <= 0) {
        this.restTime = this.timeMatch;
        this.stop();
      }
    }, 1000);
  }

  pause(): void {
    this.status = TimerStatus.PAUSED;
    clearInterval(this.timeOutId);
  }

  continue() {
    this.status = TimerStatus.STARTED;
    this.start();
  }

  stop(): void {
    clearInterval(this.timeOutId);
    if (this.currentNumberTime + 1 > this.numberTimes) {
      this.status = TimerStatus.ENDED;
      return;
    }
    this.currentNumberTime++;
    this.status = TimerStatus.INTERVAL;
  }
}

export enum TimerStatus {
  CREATED,
  STARTED,
  PAUSED,
  INTERVAL,
  ENDED,
}
