import { GestorJogo, PeladaStatus } from "@/src/domain/GestorJogo";
import { PlayerSituation } from "@/src/domain/Player";
import { ChoosingTeams, Rules } from "@/src/domain/Rules";
import { TeamSituation } from "@/src/domain/Team";
import { TimerStatus } from "@/src/domain/Timer";

import { deserializeGestorJogo, serializeGestorJogo } from "./serializer";

describe("serializer (round-trip GestorJogo)", () => {
  function buildPeladaComJogadores(): GestorJogo {
    const jogo = new GestorJogo(
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
    jogo.setPlayers(["Ana", "Bia", "Caio", "Davi", "Eva", "Fê"]);
    return jogo;
  }

  it("preserva nome, regras e jogadores em uma pelada recém-criada", () => {
    const original = buildPeladaComJogadores();

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

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

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

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

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

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

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

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

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

    expect(recriada.timer!.status).toBe(TimerStatus.PAUSED);
    expect(recriada.timer!.numberTimes).toBe(2);
  });

  // ----- F-17: garantias adicionais de round-trip da partida em andamento -----

  it("[F-17] preserva o restTime exato do cronômetro entre reloads", () => {
    const original = buildPeladaComJogadores();
    original.createTeams();
    original.setPlayingGame();
    original.start();
    // Pausa e decrementa manualmente o restTime — simula app fechado
    // com 37s restantes no meio do tempo.
    original.pause();
    original.timer!.restTime = 37;

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

    expect(recriada.timer!.restTime).toBe(37);
  });

  it("[F-17] preserva currentNumberTime > 1 (partida no 2º tempo)", () => {
    const original = buildPeladaComJogadores();
    original.createTeams();
    original.setPlayingGame();
    original.start();
    original.pause();
    // Avança manualmente pro 2º tempo (numberTimes=2).
    original.timer!.currentNumberTime = 2;
    original.timer!.status = TimerStatus.INTERVAL;

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

    expect(recriada.timer!.currentNumberTime).toBe(2);
    expect(recriada.timer!.status).toBe(TimerStatus.INTERVAL);
  });

  it("[F-17] preserva substituições banco→campo no roster após reload", () => {
    const original = buildPeladaComJogadores();
    original.createTeams();
    original.setPlayingGame();
    original.start();
    const teamA = original.playing!.teamA;
    const reserva = original.next[0].players[0];
    const saindo = teamA.players[0];
    original.switchPlayerLeft(reserva, saindo);

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

    // O importante para o "sobreviver a reload": o roster do time em campo
    // reflete a troca aplicada. `team.switches[]` é uma estatística que só
    // o caminho `trocarJogadoresDeTimes` popula hoje — `switchPlayerLeft`
    // do banco mexe direto em players[] sem registrar o evento. Fora do
    // escopo do F-17.
    const teamARecriado = recriada.playing!.teamA;
    expect(teamARecriado.players.map((p) => p.name)).toContain(reserva.name);
    expect(teamARecriado.players.map((p) => p.name)).not.toContain(
      saindo.name,
    );
  });

  it("[F-18] preserva nomeCustom e corCustom do time entre reloads", () => {
    const original = buildPeladaComJogadores();
    original.createTeams();
    original.next[0].renomear("Vermelhos");
    original.next[0].mudarCor("#E11D2A");

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

    expect(recriada.next[0].nomeCustom).toBe("Vermelhos");
    expect(recriada.next[0].corCustom).toBe("#E11D2A");
  });

  it("[F-17] preserva instante do gol (ScreenTime) entre reloads", () => {
    const original = buildPeladaComJogadores();
    original.createTeams();
    original.setPlayingGame();
    original.start();
    // Simula que passaram 45s no cronômetro antes do gol.
    original.timer!.restTime = original.timer!.timeMatch - 45;
    const team = original.playing!.teamA;
    original.addGoal(team, team.players[0]);
    const golOriginal = original.playing!.goals[0];

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

    const golRecriado = recriada.playing!.goals[0];
    expect(golRecriado.time.stroke).toBe(golOriginal.time.stroke);
    expect(golRecriado.time.timeStroke).toBe(golOriginal.time.timeStroke);
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

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

    // O domínio substitui playing pela próxima partida com o vencedor;
    // o vencedor da partida anterior continua jogando agora.
    expect(recriada.advantageToNext?.id).toBe(teamVencedor.id);
    expect(recriada.playing).toBeDefined();
    expect(recriada.playing!.teamA.id).toBe(teamVencedor.id);
  });

  it("preserva status e timestamps de ciclo de vida da pelada", () => {
    const original = buildPeladaComJogadores();
    original.iniciar();
    original.finalizar();

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

    expect(recriada.status).toBe(PeladaStatus.FINALIZADA);
    expect(recriada.createdAt).toBe(original.createdAt);
    expect(recriada.startedAt).toBe(original.startedAt);
    expect(recriada.endedAt).toBe(original.endedAt);
  });

  it("migra payload v1 (sem status/timestamps) marcando como ATIVA", () => {
    const original = buildPeladaComJogadores();
    const raw = serializeGestorJogo(original);
    const payload = JSON.parse(raw);
    payload.version = 1;
    delete payload.pelada.status;
    delete payload.pelada.createdAt;
    delete payload.pelada.startedAt;
    delete payload.pelada.endedAt;
    delete payload.pelada.peladaId;

    const recriada = deserializeGestorJogo(JSON.stringify(payload));

    expect(recriada.status).toBe(PeladaStatus.ATIVA);
    expect(recriada.createdAt).toBe(0);
    expect(recriada.startedAt).toBeUndefined();
    expect(recriada.endedAt).toBeUndefined();
    expect(recriada.peladaId).toBeUndefined();
  });

  it("preserva peladaId (vínculo com Pelada tipo) no round-trip", () => {
    const original = buildPeladaComJogadores();
    original.peladaId = "pelada-tipo-123";

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

    expect(recriada.peladaId).toBe("pelada-tipo-123");
  });

  it("migra payload v2 (com lifecycle, sem peladaId) preservando os campos", () => {
    const original = buildPeladaComJogadores();
    original.iniciar();
    const raw = serializeGestorJogo(original);
    const payload = JSON.parse(raw);
    payload.version = 2;
    delete payload.pelada.peladaId;

    const recriada = deserializeGestorJogo(JSON.stringify(payload));

    expect(recriada.status).toBe(PeladaStatus.ATIVA);
    expect(recriada.startedAt).toBe(original.startedAt);
    expect(recriada.peladaId).toBeUndefined();
  });

  it("dispara notify do GestorJogo reidratado quando o Timer ticka", () => {
    const original = buildPeladaComJogadores();
    original.createTeams();
    original.setPlayingGame();
    original.start();
    original.pause();

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));
    const versionAntes = recriada.version;
    // O onChange é privado; chamamos via cast intencional para checar
    // que o Timer reidratado está conectado ao notify do GestorJogo.
    const onChange = (recriada.timer as unknown as { onChange?: () => void })
      .onChange;
    onChange?.();

    expect(recriada.version).toBeGreaterThan(versionAntes);
  });
});
