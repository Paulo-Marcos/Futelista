import { ScreenTime } from "./ScreenTime";

/**
 * Timer da partida.
 *
 * Aceita `onChange` opcional no construtor para que o GestorJogo seja
 * notificado a cada tick e em mudancas de status. Sem o callback, o
 * comportamento e identico ao original (util para testes e uso puro).
 */
export class Timer {
  status = TimerStatus.CREATED;
  restTime: number;
  currentNumberTime: number;
  private timeOutId?: ReturnType<typeof setInterval>;
  private readonly onChange?: () => void;

  constructor(
    readonly numberTimes: number,
    readonly timeMatch: number,
    onChange?: () => void,
  ) {
    this.restTime = timeMatch;
    this.currentNumberTime = 1;
    this.onChange = onChange;
  }

  getTime(): ScreenTime {
    return new ScreenTime(
      this.currentNumberTime,
      this.timeMatch - this.restTime,
    );
  }

  start(): void {
    if (this.status === TimerStatus.ENDED) throw Error("Não há mais etapas");
    if (this.status === TimerStatus.PAUSED) return;
    this.status = TimerStatus.STARTED;
    this.timeOutId = setInterval(() => {
      this.restTime--;
      this.onChange?.();
      if (this.restTime <= 0) {
        this.restTime = this.timeMatch;
        this.stop();
      }
    }, 1000);
  }

  pause(): void {
    this.status = TimerStatus.PAUSED;
    clearInterval(this.timeOutId);
    this.onChange?.();
  }

  continue(): void {
    this.status = TimerStatus.STARTED;
    this.start();
  }

  stop(): void {
    clearInterval(this.timeOutId);
    if (this.currentNumberTime + 1 > this.numberTimes) {
      this.status = TimerStatus.ENDED;
      this.onChange?.();
      return;
    }
    this.currentNumberTime++;
    this.status = TimerStatus.INTERVAL;
    this.onChange?.();
  }

  /**
   * Encerra o cronômetro imediatamente: interrompe o tick e marca ENDED.
   * Diferente de `stop()`, não avança para o próximo tempo — encerra a
   * partida inteira (encerramento manual ou por gol-limite). Não notifica:
   * quem chama (GestorJogo) já dispara o `notify()` da mudança de estado.
   */
  encerrar(): void {
    clearInterval(this.timeOutId);
    this.status = TimerStatus.ENDED;
  }
}

export enum TimerStatus {
  CREATED,
  STARTED,
  PAUSED,
  INTERVAL,
  ENDED,
}
