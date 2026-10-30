import { GestorJogo } from "./GestorJogo";
import { ChoosingTeams, Rules } from "./Rules";
import { TimerStatus } from "./Timer";

/**
 * Ciclo de vida da partida: uma partida com resultado não volta a rodar
 * nem aceita gols; trocar de partida sem resultado não perde o cronômetro;
 * reabrir após o fim natural não dá tempo extra.
 */
describe("GestorJogo — ciclo de vida da partida", () => {
  const DURACAO = 60; // "00:01:00"

  function jogoComTresTimes(): GestorJogo {
    const rules = new Rules({
      playersPerTeam: 2,
      timeMatch: "00:01:00",
      numberTimes: 1,
      goalLimit: 5, // alto para não encerrar sozinho ao marcar 1 gol
      choosingTeams: ChoosingTeams.BY_ORDER,
    });
    const jogo = new GestorJogo("Pelada", rules);
    jogo.setPlayers(["A1", "A2", "B1", "B2", "C1", "C2"]);
    jogo.criarTimes();
    jogo.setPlayingGame();
    return jogo;
  }

  function marcarGolDoTimeA(jogo: GestorJogo): boolean {
    const time = jogo.playing!.teamA;
    return jogo.marcarGol(time, time.players[0]);
  }

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("partida com resultado recusa start()", () => {
    const jogo = jogoComTresTimes();
    jogo.start();
    jogo.setResult();

    expect(() => jogo.start()).toThrow("A partida já foi encerrada");
    expect(jogo.timer!.status).toBe(TimerStatus.ENDED);
  });

  it("partida com resultado recusa gols e mantém o placar", () => {
    const jogo = jogoComTresTimes();
    jogo.start();
    marcarGolDoTimeA(jogo);
    jogo.setResult();
    const resultado = jogo.playing!.result;

    expect(marcarGolDoTimeA(jogo)).toBe(false);
    expect(jogo.playing!.goals).toHaveLength(1);
    expect(jogo.playing!.result).toBe(resultado);
  });

  it("gol antes do apito não é registrado", () => {
    const jogo = jogoComTresTimes();

    expect(marcarGolDoTimeA(jogo)).toBe(false);
    expect(jogo.playing!.goals).toHaveLength(0);
  });

  it("gol com a partida rolando é registrado", () => {
    const jogo = jogoComTresTimes();
    jogo.start();

    expect(marcarGolDoTimeA(jogo)).toBe(true);
    expect(jogo.playing!.goals).toHaveLength(1);
  });

  it("start() após o fim natural recusa em vez de criar cronômetro novo", () => {
    const jogo = jogoComTresTimes();
    jogo.start();
    jest.advanceTimersByTime(DURACAO * 1000);
    const timerDaPartida = jogo.timer;

    expect(() => jogo.start()).toThrow("O tempo da partida acabou");
    expect(jogo.timer).toBe(timerDaPartida);
  });

  it("definirProximaPartida sem resultado preserva o cronômetro em andamento", () => {
    const jogo = jogoComTresTimes();
    jogo.start();
    jest.advanceTimersByTime(20_000);
    const partida = jogo.playing;

    jogo.definirProximaPartida();

    expect(jogo.playing).toBe(partida);
    expect(jogo.timer!.status).toBe(TimerStatus.STARTED);
    expect(jogo.timer!.restTime).toBe(DURACAO - 20);
  });

  it("reabrirPartida após o fim natural não devolve tempo extra", () => {
    const jogo = jogoComTresTimes();
    jogo.start();
    marcarGolDoTimeA(jogo);
    jest.advanceTimersByTime(DURACAO * 1000);
    jogo.setResult();

    jogo.reabrirPartida();
    jogo.continue();
    jest.advanceTimersByTime(10_000);

    expect(jogo.playing!.result).toBeUndefined();
    expect(jogo.timer!.status).toBe(TimerStatus.ENDED);
    expect(jogo.timer!.restTime).toBe(0);
  });
});
