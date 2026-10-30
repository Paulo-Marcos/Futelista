import { GestorJogo } from "./GestorJogo";
import { ChoosingTeams, Rules } from "./Rules";

/**
 * D-051: o autosave grava por mudança de estado, não por tick. A
 * `versaoEstado` é o sinal — o tick avisa a UI (`version`) mas não muda
 * nada persistível, porque o tempo deriva do relógio.
 */
describe("GestorJogo — versaoEstado (D-051)", () => {
  function jogoEmPartida(): GestorJogo {
    const jogo = new GestorJogo(
      "Pelada",
      new Rules({
        playersPerTeam: 2,
        timeMatch: "00:01:00",
        numberTimes: 1,
        choosingTeams: ChoosingTeams.BY_ORDER,
      }),
    );
    jogo.setPlayers(["A1", "A2", "B1", "B2"]);
    jogo.criarTimes();
    jogo.setPlayingGame();
    return jogo;
  }

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("ticks do cronômetro avisam a UI sem contar como mudança de estado", () => {
    const jogo = jogoEmPartida();
    jogo.start();
    const versaoEstado = jogo.versaoEstado;
    const version = jogo.version;

    jest.advanceTimersByTime(5_000);

    expect(jogo.version).toBeGreaterThan(version);
    expect(jogo.versaoEstado).toBe(versaoEstado);
  });

  it("pausar e o fim natural do tempo contam como mudança de estado", () => {
    const jogo = jogoEmPartida();
    jogo.start();
    const antesDaPausa = jogo.versaoEstado;
    jogo.pause();
    expect(jogo.versaoEstado).toBeGreaterThan(antesDaPausa);

    jogo.continue();
    const antesDoFim = jogo.versaoEstado;
    jest.advanceTimersByTime(60_000);

    expect(jogo.versaoEstado).toBeGreaterThan(antesDoFim);
  });

  it("liberarCronometro solta o tick de uma execução descartada", () => {
    const jogo = jogoEmPartida();
    jogo.start();

    jogo.liberarCronometro();

    expect(jest.getTimerCount()).toBe(0);
  });
});
