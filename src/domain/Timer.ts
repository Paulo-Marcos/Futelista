import { ScreenTime } from "./ScreenTime";

/** Fonte do instante atual, em milissegundos. Injetável para teste. */
export type Relogio = () => number;

/**
 * O que mudou no cronômetro: `tick` só avança o relógio (o tempo deriva do
 * relógio, nada novo a persistir); `estado` muda status ou tempo corrente.
 */
export type EventoTimer = "tick" | "estado";

/** Retrato persistível do cronômetro, usado para reidratar após reabrir. */
export type EstadoTimer = {
  numberTimes: number;
  timeMatch: number;
  currentNumberTime: number;
  status: TimerStatus;
  decorridoMs: number;
  iniciadoEm?: number;
};

/**
 * Timer da partida.
 *
 * O tempo restante é DERIVADO do relógio real (`iniciadoEm` + tempo já
 * acumulado), não contado tick a tick: em segundo plano o SO congela ou
 * atrasa o `setInterval`, e um contador perderia esse tempo. O tick só
 * avisa a UI e detecta o fim do tempo.
 *
 * Aceita `onChange` opcional no construtor para que o GestorJogo seja
 * notificado a cada tick e em mudancas de status.
 */
export class Timer {
  status = TimerStatus.CREATED;
  currentNumberTime: number;
  /** Tempo já corrido no tempo atual até a última largada (`iniciadoEm`). */
  private acumuladoMs = 0;
  /** Instante da última largada; definido só enquanto o relógio corre. */
  private iniciadoEm?: number;
  private timeOutId?: ReturnType<typeof setInterval>;
  private readonly onChange?: (evento: EventoTimer) => void;
  private readonly relogio: Relogio;

  constructor(
    readonly numberTimes: number,
    readonly timeMatch: number,
    onChange?: (evento: EventoTimer) => void,
    relogio: Relogio = () => Date.now(),
  ) {
    this.currentNumberTime = 1;
    this.onChange = onChange;
    this.relogio = relogio;
  }

  /**
   * Reidrata um cronômetro salvo. Se ele estava correndo quando o app
   * morreu, o jogo seguiu: o tempo até agora conta, e ele volta PAUSADO
   * (ou já no intervalo/fim, se o tempo acabou enquanto o app estava fechado).
   */
  static restaurar(
    estado: EstadoTimer,
    onChange?: (evento: EventoTimer) => void,
    relogio?: Relogio,
  ): Timer {
    const timer = new Timer(
      estado.numberTimes,
      estado.timeMatch,
      onChange,
      relogio,
    );
    timer.currentNumberTime = estado.currentNumberTime;
    timer.status = estado.status;
    timer.acumuladoMs = estado.decorridoMs;
    if (estado.status !== TimerStatus.STARTED) return timer;
    if (estado.iniciadoEm !== undefined)
      timer.acumuladoMs += Math.max(0, timer.relogio() - estado.iniciadoEm);
    timer.status = TimerStatus.PAUSED;
    if (timer.restTime <= 0) timer.stop();
    return timer;
  }

  get restTime(): number {
    const decorrido = Math.floor(this.decorridoMs / 1000);
    return Math.max(0, this.timeMatch - decorrido);
  }

  /** Ajusta o tempo restante; com o relógio correndo, segue dali. */
  set restTime(segundos: number) {
    this.acumuladoMs = (this.timeMatch - segundos) * 1000;
    if (this.iniciadoEm !== undefined) this.iniciadoEm = this.relogio();
  }

  /** Tempo corrido no tempo atual, incluindo a largada em curso. */
  get decorridoMs(): number {
    if (this.iniciadoEm === undefined) return this.acumuladoMs;
    return this.acumuladoMs + Math.max(0, this.relogio() - this.iniciadoEm);
  }

  /** Retrato persistível: o relógio em curso vai como `iniciadoEm`. */
  exportarEstado(): EstadoTimer {
    return {
      numberTimes: this.numberTimes,
      timeMatch: this.timeMatch,
      currentNumberTime: this.currentNumberTime,
      status: this.status,
      decorridoMs: this.acumuladoMs,
      iniciadoEm: this.iniciadoEm,
    };
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
    this.correr();
  }

  pause(): void {
    if (this.status === TimerStatus.ENDED) return;
    this.congelar();
    this.status = TimerStatus.PAUSED;
    this.onChange?.("estado");
  }

  continue(): void {
    if (this.status !== TimerStatus.PAUSED) return;
    this.status = TimerStatus.STARTED;
    this.correr();
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

  /**
   * Recalcula pelo relógio real — ao voltar do segundo plano o tick pode
   * ter ficado congelado — e religa o tick se ele foi desligado.
   */
  sincronizar(): void {
    if (this.status !== TimerStatus.STARTED) return;
    if (this.timeOutId === undefined) this.agendarTick();
    if (this.restTime <= 0) {
      this.stop();
      return;
    }
    this.onChange?.("tick");
  }

  /**
   * Solta o `setInterval` sem mexer no estado: o tempo segue derivado do
   * relógio. Para quem descarta o cronômetro (execução trocada/fechada).
   */
  desligarTick(): void {
    clearInterval(this.timeOutId);
    this.timeOutId = undefined;
  }

  private correr(): void {
    this.iniciadoEm = this.relogio();
    this.agendarTick();
  }

  private congelar(): void {
    this.desligarTick();
    this.acumuladoMs = this.decorridoMs;
    this.iniciadoEm = undefined;
  }

  private agendarTick(): void {
    this.timeOutId = setInterval(() => this.sincronizar(), 1000);
  }

  stop(): void {
    this.congelar();
    if (this.currentNumberTime + 1 > this.numberTimes) {
      this.status = TimerStatus.ENDED;
      this.onChange?.("estado");
      return;
    }
    this.currentNumberTime++;
    // Só o próximo tempo recomeça cheio; no fim natural o relógio fica zerado.
    this.acumuladoMs = 0;
    this.status = TimerStatus.INTERVAL;
    this.onChange?.("estado");
  }

  /**
   * Encerra o cronômetro imediatamente: interrompe o tick e marca ENDED.
   * Diferente de `stop()`, não avança para o próximo tempo — encerra a
   * partida inteira (encerramento manual ou por gol-limite). Não notifica:
   * quem chama (GestorJogo) já dispara o `notify()` da mudança de estado.
   */
  encerrar(): void {
    this.congelar();
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
