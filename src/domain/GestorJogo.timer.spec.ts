import { GestorJogo } from "./GestorJogo";
import { ChoosingTeams, Rules } from "./Rules";
import { TimerStatus } from "./Timer";

/**
 * Regressão: o cronômetro precisa reiniciar a cada partida. Encerrar uma
 * partida deve parar o tick, e mudar de jogo deve descartar o Timer para
 * que a próxima comece com o tempo cheio (nunca "pela metade").
 */
describe("GestorJogo — ciclo de vida do cronômetro", () => {
  const DURACAO = 60; // "00:01:00" => 60s

  function jogoComTresTimes(): GestorJogo {
    const rules = new Rules({
      playersPerTeam: 2,
      timeMatch: "00:01:00",
      goalLimit: 5, // alto para não encerrar sozinho ao marcar 1 gol
      choosingTeams: ChoosingTeams.BY_ORDER,
    });
    const jogo = new GestorJogo("Pelada", rules);
    jogo.setPlayers(["A1", "A2", "B1", "B2", "C1", "C2"]);
    jogo.criarTimes();
    jogo.setPlayingGame();
    return jogo;
  }

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("encerrar a partida (setResult) para o cronômetro e marca ENDED", () => {
    const jogo = jogoComTresTimes();
    jogo.start();
    jest.advanceTimersByTime(10_000); // 10s correm

    jogo.setResult();
    expect(jogo.timer!.status).toBe(TimerStatus.ENDED);

    // Não pode continuar decrementando em segundo plano.
    const restTimeAoEncerrar = jogo.timer!.restTime;
    jest.advanceTimersByTime(10_000);
    expect(jogo.timer!.restTime).toBe(restTimeAoEncerrar);
  });

  it("mudar de jogo (definirProximaPartida) descarta o Timer da partida anterior", () => {
    const jogo = jogoComTresTimes();
    jogo.start();
    jest.advanceTimersByTime(20_000); // 20s correm
    const vencedor = jogo.playing!.teamA;
    jogo.marcarGol(vencedor, vencedor.players[0]);
    jogo.setResult();

    jogo.definirProximaPartida();

    expect(jogo.timer).toBeUndefined();
  });

  it("a próxima partida começa com o cronômetro cheio", () => {
    const jogo = jogoComTresTimes();
    jogo.start();
    jest.advanceTimersByTime(20_000); // gasta 20s da primeira partida
    const vencedor = jogo.playing!.teamA;
    jogo.marcarGol(vencedor, vencedor.players[0]);
    jogo.setResult();
    jogo.definirProximaPartida();

    // Nova partida, novo apito: tempo cheio, não os 40s restantes.
    jogo.start();
    expect(jogo.timer!.restTime).toBe(DURACAO);
    expect(jogo.timer!.currentNumberTime).toBe(1);
  });
});
