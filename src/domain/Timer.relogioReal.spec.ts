import { EventoTimer, Timer, TimerStatus } from "./Timer";

/**
 * D-051: o cronômetro deriva o tempo do relógio real. O relógio injetado
 * anda separado do `setInterval` (fake timers), o que permite simular o SO
 * congelando o tick em segundo plano enquanto o tempo de verdade passa.
 */
function relogioManual(inicio = 1_000_000) {
  let agora = inicio;
  return {
    relogio: () => agora,
    avancar: (ms: number) => {
      agora += ms;
    },
  };
}

describe("Timer — ancorado no relógio real (D-051)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("caminho feliz: o restante acompanha o relógio enquanto corre", () => {
    const { relogio, avancar } = relogioManual();
    const timer = new Timer(1, 60, undefined, relogio);
    timer.start();

    avancar(15_000);

    expect(timer.restTime).toBe(45);
  });

  it("segundo plano: tick congelado não perde o tempo que passou", () => {
    const { relogio, avancar } = relogioManual();
    const eventos: EventoTimer[] = [];
    const timer = new Timer(1, 60, (e) => eventos.push(e), relogio);
    timer.start();

    avancar(40_000); // SO congelou o setInterval: nenhum tick rodou
    timer.sincronizar(); // app voltou para o primeiro plano

    expect(timer.restTime).toBe(20);
    expect(eventos).toEqual(["tick"]);
  });

  it("segundo plano além do fim do tempo encerra o tempo ao voltar", () => {
    const { relogio, avancar } = relogioManual();
    const timer = new Timer(2, 60, undefined, relogio);
    timer.start();

    avancar(90_000);
    timer.sincronizar();

    expect(timer.status).toBe(TimerStatus.INTERVAL);
    expect(timer.currentNumberTime).toBe(2);
    expect(timer.restTime).toBe(60);
  });

  it("pausa congela o tempo mesmo com o relógio andando", () => {
    const { relogio, avancar } = relogioManual();
    const timer = new Timer(1, 60, undefined, relogio);
    timer.start();
    avancar(10_000);
    timer.pause();

    avancar(30_000);

    expect(timer.restTime).toBe(50);
  });

  it("tick avisa 'tick'; fim do tempo avisa 'estado'", () => {
    const eventos: EventoTimer[] = [];
    const timer = new Timer(1, 2, (e) => eventos.push(e));
    timer.start();

    jest.advanceTimersByTime(2_000);

    expect(eventos).toEqual(["tick", "estado"]);
  });

  it("desligarTick solta o setInterval sem mudar o estado", () => {
    const { relogio, avancar } = relogioManual();
    const timer = new Timer(1, 60, undefined, relogio);
    timer.start();

    timer.desligarTick();
    avancar(10_000);

    expect(jest.getTimerCount()).toBe(0);
    expect(timer.status).toBe(TimerStatus.STARTED);
    expect(timer.restTime).toBe(50);
  });

  it("sincronizar religa o tick desligado de um cronômetro correndo", () => {
    const timer = new Timer(1, 60);
    timer.start();
    timer.desligarTick();

    timer.sincronizar();

    expect(jest.getTimerCount()).toBe(1);
  });
});

describe("Timer.restaurar — reabrir o app (D-051)", () => {
  it("app morto com o relógio correndo: o tempo fechado conta e volta pausado", () => {
    const { relogio, avancar } = relogioManual();
    const original = new Timer(1, 600, undefined, relogio);
    original.start();
    avancar(100_000);
    const salvo = original.exportarEstado();
    original.desligarTick(); // o processo morreu

    avancar(200_000); // app fechado por 200s
    const reaberto = Timer.restaurar(salvo, undefined, relogio);

    expect(reaberto.status).toBe(TimerStatus.PAUSED);
    expect(reaberto.restTime).toBe(300);
  });

  it("tempo acabou com o app fechado: reabre no fim, sem tempo extra", () => {
    const { relogio, avancar } = relogioManual();
    const original = new Timer(1, 600, undefined, relogio);
    original.start();
    const salvo = original.exportarEstado();
    original.desligarTick();

    avancar(900_000);
    const reaberto = Timer.restaurar(salvo, undefined, relogio);
    reaberto.reabrir();

    expect(reaberto.status).toBe(TimerStatus.ENDED);
    expect(reaberto.restTime).toBe(0);
  });

  it("cronômetro pausado reabre igual, sem contar o tempo fechado", () => {
    const { relogio, avancar } = relogioManual();
    const original = new Timer(2, 600, undefined, relogio);
    original.start();
    avancar(30_000);
    original.pause();

    avancar(500_000);
    const reaberto = Timer.restaurar(
      original.exportarEstado(),
      undefined,
      relogio,
    );

    expect(reaberto.status).toBe(TimerStatus.PAUSED);
    expect(reaberto.restTime).toBe(570);
  });
});
