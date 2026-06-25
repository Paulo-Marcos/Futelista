import { GestorJogo } from "./GestorJogo";
import { ChoosingTeams, Rules } from "./Rules";
import { TimerStatus } from "./Timer";

/**
 * Cobre `reabrirPartida` — suporte ao botão "Voltar à partida" da tela de
 * resultado: limpa o resultado e pausa o cronômetro para análise.
 */
describe("GestorJogo.reabrirPartida", () => {
  function jogoComPartidaEncerrada(): GestorJogo {
    const rules = new Rules({
      playersPerTeam: 2,
      goalLimit: 5, // alto pra não encerrar sozinho ao marcar 1 gol
      choosingTeams: ChoosingTeams.BY_ORDER,
    });
    const jogo = new GestorJogo("Pelada", rules);
    jogo.setPlayers(["Paulo", "Marcos", "Rodrigues", "Oliveira"]);
    jogo.createTeams();
    jogo.setPlayingGame();
    jogo.start();
    const vencedor = jogo.playing!.teamA;
    jogo.addGoal(vencedor, vencedor.players[0]);
    jogo.setResult();
    return jogo;
  }

  it("limpa resultado/vencedor e pausa o cronômetro", () => {
    const jogo = jogoComPartidaEncerrada();
    expect(jogo.playing!.result).toBeDefined();

    jogo.reabrirPartida();

    expect(jogo.playing!.result).toBeUndefined();
    expect(jogo.playing!.winner).toBeUndefined();
    expect(jogo.playing!.loser).toBeUndefined();
    expect(jogo.timer!.status).toBe(TimerStatus.PAUSED);
  });

  it("preserva os gols já marcados ao reabrir", () => {
    const jogo = jogoComPartidaEncerrada();
    const golsAntes = jogo.playing!.goals.length;
    jogo.reabrirPartida();
    expect(jogo.playing!.goals.length).toBe(golsAntes);
  });

  it("é no-op quando não há partida em andamento", () => {
    const jogo = new GestorJogo("Pelada", new Rules());
    expect(() => jogo.reabrirPartida()).not.toThrow();
    expect(jogo.playing).toBeUndefined();
  });
});
