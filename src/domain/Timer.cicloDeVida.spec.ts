import { Timer, TimerStatus } from "./Timer";

/**
 * Ciclo de estados do cronômetro: toque duplo não acelera o relógio,
 * ENDED é terminal e o fim natural não deixa tempo sobrando para reabrir.
 */
describe("Timer — ciclo de vida", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("start() repetido com o relógio rodando não acelera o tempo", () => {
    const timer = new Timer(1, 60);
    timer.start();
    timer.start();

    jest.advanceTimersByTime(10_000);

    expect(timer.restTime).toBe(50);
  });

  it("continue() repetido após a pausa não acelera o tempo", () => {
    const timer = new Timer(1, 60);
    timer.start();
    timer.pause();
    timer.continue();
    timer.continue();

    jest.advanceTimersByTime(10_000);

    expect(timer.restTime).toBe(50);
  });

  it("continue() não reabre um cronômetro ENDED", () => {
    const timer = new Timer(1, 5);
    timer.start();
    jest.advanceTimersByTime(5_000);
    expect(timer.status).toBe(TimerStatus.ENDED);

    timer.continue();

    expect(timer.status).toBe(TimerStatus.ENDED);
  });

  it("pause() não tira um cronômetro do ENDED", () => {
    const timer = new Timer(1, 5);
    timer.start();
    timer.encerrar();

    timer.pause();

    expect(timer.status).toBe(TimerStatus.ENDED);
  });

  it("fim natural do último tempo deixa o relógio zerado", () => {
    const timer = new Timer(1, 5);
    timer.start();

    jest.advanceTimersByTime(5_000);

    expect(timer.status).toBe(TimerStatus.ENDED);
    expect(timer.restTime).toBe(0);
  });

  it("fim de um tempo intermediário recomeça o próximo cheio", () => {
    const timer = new Timer(2, 5);
    timer.start();

    jest.advanceTimersByTime(5_000);

    expect(timer.status).toBe(TimerStatus.INTERVAL);
    expect(timer.restTime).toBe(5);
    expect(timer.currentNumberTime).toBe(2);
  });

  it("reabrir() após encerramento manual com tempo sobrando pausa", () => {
    const timer = new Timer(1, 60);
    timer.start();
    jest.advanceTimersByTime(10_000);
    timer.encerrar();

    timer.reabrir();

    expect(timer.status).toBe(TimerStatus.PAUSED);
    expect(timer.restTime).toBe(50);
  });

  it("reabrir() após o fim natural continua ENDED", () => {
    const timer = new Timer(1, 5);
    timer.start();
    jest.advanceTimersByTime(5_000);

    timer.reabrir();

    expect(timer.status).toBe(TimerStatus.ENDED);
  });
});
