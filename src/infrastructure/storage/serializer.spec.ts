import { GameManager } from "@/src/domain/GameManager";
import { PlayerSituation } from "@/src/domain/Player";
import { ChoosingTeams, Rules } from "@/src/domain/Rules";
import { TeamSituation } from "@/src/domain/Team";
import { TimerStatus } from "@/src/domain/Timer";

import { deserializeGameManager, serializeGameManager } from "./serializer";

describe("serializer (round-trip GameManager)", () => {
  function buildPeladaComJogadores(): GameManager {
    const game = new GameManager(
      "Pelada do Sábado",
      new Rules({
        name: "Padrão",
        playersPerTeam: 2,
        timeMatch: "00:01:00",
        numberTimes: 2,
        goalLimit: 3,
        choosingTeams: ChoosingTeams.BY_ORDER,
      }),
    );
    game.addPlayerList(["Ana", "Bia", "Caio", "Davi", "Eva", "Fê"]);
    return game;
  }

  it("preserva nome, regras e jogadores em uma pelada recém-criada", () => {
    const original = buildPeladaComJogadores();

    const recriada = deserializeGameManager(serializeGameManager(original));

    expect(recriada.name).toBe("Pelada do Sábado");
    expect(recriada.rules.playersPerTeam).toBe(2);
    expect(recriada.rules.timeMatch).toBe("00:01:00");
    expect(recriada.rules.choosingTeams).toBe(ChoosingTeams.BY_ORDER);
    expect(recriada.players.map((p) => p.name)).toEqual([
      "Ana",
      "Bia",
      "Caio",
      "Davi",
      "Eva",
      "Fê",
    ]);
  });

  it("preserva fila de próximos com mesmos jogadores em cada time", () => {
    const original = buildPeladaComJogadores();
    original.createTeams();

    const recriada = deserializeGameManager(serializeGameManager(original));

    expect(recriada.next).toHaveLength(original.next.length);
    recriada.next.forEach((team, index) => {
      expect(team.players.map((p) => p.name)).toEqual(
        original.next[index].players.map((p) => p.name),
      );
    });
  });

  it("religa Player.currentTeam para o mesmo Team reidratado (mesma referência)", () => {
    const original = buildPeladaComJogadores();
    original.createTeams();

    const recriada = deserializeGameManager(serializeGameManager(original));

    const primeiroTime = recriada.next[0];
    primeiroTime.players.forEach((player) => {
      expect(player.currentTeam).toBe(primeiroTime);
      expect(player.situation).toBe(PlayerSituation.ACTIVE);
    });
  });

  it("preserva partida em andamento com gols e placar", () => {
    const original = buildPeladaComJogadores();
    original.createTeams();
    original.setPlayingGame();
    original.start();
    const teamA = original.playing!.teamA;
    const teamB = original.playing!.teamB;
    original.addGoal(teamA, teamA.players[0]);
    original.addGoal(teamA, teamA.players[1]);
    original.addGoal(teamB, teamB.players[0]);

    const recriada = deserializeGameManager(serializeGameManager(original));

    expect(recriada.playing).toBeDefined();
    expect(recriada.playing!.countGoals()).toEqual({ teamA: 2, teamB: 1 });
    expect(recriada.playing!.goals).toHaveLength(3);
    expect(recriada.playing!.teamA.situation).toBe(TeamSituation.PLAYING);
  });

  it("Timer que estava STARTED volta como PAUSED no reload", () => {
    const original = buildPeladaComJogadores();
    original.createTeams();
    original.setPlayingGame();
    original.start();
    expect(original.timer!.status).toBe(TimerStatus.STARTED);
    original.pause();
    original.timer!.status = TimerStatus.STARTED; // simula estado salvo enquanto rodava

    const recriada = deserializeGameManager(serializeGameManager(original));

    expect(recriada.timer!.status).toBe(TimerStatus.PAUSED);
    expect(recriada.timer!.numberTimes).toBe(2);
  });

  it("após vitória, preserva o time com vantagem para a próxima partida", () => {
    const original = buildPeladaComJogadores();
    original.createTeams();
    original.setPlayingGame();
    original.start();
    const teamVencedor = original.playing!.teamA;
    original.addGoal(teamVencedor, teamVencedor.players[0]);
    original.setResult();
    original.setNextMatch();

    const recriada = deserializeGameManager(serializeGameManager(original));

    // O domínio substitui playing pela próxima partida com o vencedor;
    // o vencedor da partida anterior continua jogando agora.
    expect(recriada.advantageToNext?.id).toBe(teamVencedor.id);
    expect(recriada.playing).toBeDefined();
    expect(recriada.playing!.teamA.id).toBe(teamVencedor.id);
  });

  it("dispara notify do GameManager reidratado quando o Timer ticka", () => {
    const original = buildPeladaComJogadores();
    original.createTeams();
    original.setPlayingGame();
    original.start();
    original.pause();

    const recriada = deserializeGameManager(serializeGameManager(original));
    const versionAntes = recriada.version;
    // O onChange é privado; chamamos via cast intencional para checar
    // que o Timer reidratado está conectado ao notify do GameManager.
    const onChange = (recriada.timer as unknown as { onChange?: () => void })
      .onChange;
    onChange?.();

    expect(recriada.version).toBeGreaterThan(versionAntes);
  });
});
