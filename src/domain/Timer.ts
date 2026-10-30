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
    // Já rodando: um 2º setInterval faria o relógio correr em dobro (toque duplo).
    if (
      this.status === TimerStatus.PAUSED ||
      this.status === TimerStatus.STARTED
    )
      return;
    this.status = TimerStatus.STARTED;
    this.agendarTick();
  }

  pause(): void {
    if (this.status === TimerStatus.ENDED) return;
    this.status = TimerStatus.PAUSED;
    clearInterval(this.timeOutId);
    this.onChange?.();
  }

  continue(): void {
    if (this.status !== TimerStatus.PAUSED) return;
    this.status = TimerStatus.STARTED;
    this.agendarTick();
  }

  /**
   * Reabre o cronômetro encerrado para revisão ("Voltar à partida"): fica
   * PAUSADO só se ainda sobra tempo no tempo atual. No fim natural (tempo
   * zerado) continua ENDED — pausar ali daria um tempo extra inteiro.
   */
  reabrir(): void {
    if (this.status !== TimerStatus.ENDED || this.restTime <= 0) return;
    this.status = TimerStatus.PAUSED;
  }

  private agendarTick(): void {
    this.timeOutId = setInterval(() => {
      this.restTime--;
      this.onChange?.();
      if (this.restTime <= 0) this.stop();
    }, 1000);
  }

  stop(): void {
    clearInterval(this.timeOutId);
    if (this.currentNumberTime + 1 > this.numberTimes) {
      this.status = TimerStatus.ENDED;
      this.onChange?.();
      return;
    }
    this.currentNumberTime++;
    // Só o próximo tempo recomeça cheio; no fim natural o relógio fica zerado.
    this.restTime = this.timeMatch;
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
