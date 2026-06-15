import { GestorJogo, PeladaStatus } from "@/src/domain/GestorJogo";
import { Player, PlayerSituation } from "@/src/domain/Player";
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

    // Sobrevivência a reload: roster do time em campo reflete a troca, e o
    // evento Switch registrado em team.switches volta após round-trip.
    const teamARecriado = recriada.playing!.teamA;
    expect(teamARecriado.players.map((p) => p.name)).toContain(reserva.name);
    expect(teamARecriado.players.map((p) => p.name)).not.toContain(saindo.name);
    expect(teamARecriado.switches.length).toBeGreaterThan(0);
  });

  it("[F-19] preserva fotoUri dos jogadores entre reloads", () => {
    const original = buildPeladaComJogadores();
    original.players[0].definirFoto("file:///tmp/ana.jpg");
    original.players[1].definirFoto("https://exemplo.com/bia.png");

    const recriada = deserializeGestorJogo(serializeGestorJogo(original));

    expect(recriada.players[0].fotoUri).toBe("file:///tmp/ana.jpg");
    expect(recriada.players[1].fotoUri).toBe("https://exemplo.com/bia.png");
    expect(recriada.players[2].fotoUri).toBeUndefined();
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

  // Regressão do bug "Cannot read properties of undefined (reading 'id')"
  // que estourava ao voltar da Home (voltarParaGestao → salvar → serializar).
  // Remover um jogador de um time em campo com a fila vazia deixava um
  // undefined no roster; `team.players.map(p => p.id)` quebrava no save.
  it("serializa após remover jogador de time em campo com fila vazia", () => {
    const jogo = new GestorJogo(
      "Fila vazia",
      new Rules({
        playersPerTeam: 2,
        timeMatch: "00:01:00",
        choosingTeams: ChoosingTeams.BY_ORDER,
      }),
    );
    jogo.setPlayers(["Ana", "Bia", "Caio", "Davi"]);
    jogo.createTeams(); // 2 times de 2
    jogo.setPlayingGame(); // ambos em campo → fila vazia
    jogo.start();

    // Tira um jogador do time em campo sem reserva pra puxar.
    jogo.removeFromGame(jogo.playing!.teamA.players[0]);

    expect(() => serializeGestorJogo(jogo)).not.toThrow();
    const recriada = deserializeGestorJogo(serializeGestorJogo(jogo));
    expect(recriada.playing!.teamA.players).toHaveLength(1);
    expect(recriada.playing!.teamA.players.every((p) => p !== undefined)).toBe(
      true,
    );
  });

  // Regressão do crash "Cannot read properties of undefined (reading 'id')"
  // ao salvar DEPOIS de um reload (ex.: botão voltar da Home →
  // voltarParaGestao → salvar). O payload não fechava sobre o grafo
  // alcançável: partida encerrada (referenciada só por team.matches /
  // player.matches) e jogador removido da pelada (referenciado por gols e
  // escalações antigas) ficavam fora de `matches`/`players`. Na
  // reidratação essas referências viravam `undefined` e o save seguinte
  // estourava no `.id`.
  describe("fechamento do grafo alcançável", () => {
    function buildPeladaComPartidaEncerrada(): {
      jogo: GestorJogo;
      artilheiroDoPerdedor: Player;
    } {
      const jogo = buildPeladaComJogadores(); // 6 jogadores, 2 por time
      jogo.createTeams(); // 3 times (BY_ORDER)
      jogo.setPlayingGame(); // A x B em campo; fila: [C]
      jogo.start();
      const teamA = jogo.playing!.teamA;
      const teamB = jogo.playing!.teamB;
      const artilheiroDoPerdedor = teamB.players[0];
      jogo.addGoal(teamA, teamA.players[0]);
      jogo.addGoal(teamA, teamA.players[1]);
      jogo.addGoal(teamB, artilheiroDoPerdedor);
      jogo.setResult(); // A vence 2x1
      jogo.setNextMatch(); // B vai pra fila; A x C em campo
      return { jogo, artilheiroDoPerdedor };
    }

    it("salva de novo após reload com partida encerrada no histórico dos times", () => {
      const { jogo } = buildPeladaComPartidaEncerrada();

      const reidratada = deserializeGestorJogo(serializeGestorJogo(jogo));

      expect(() => serializeGestorJogo(reidratada)).not.toThrow();
    });

    it("preserva no round-trip a partida encerrada referenciada pelos times", () => {
      const { jogo } = buildPeladaComPartidaEncerrada();

      const reidratada = deserializeGestorJogo(serializeGestorJogo(jogo));

      // Vencedor (em campo) tem 2 partidas no histórico: encerrada + atual.
      const vencedor = reidratada.playing!.teamA;
      expect(vencedor.matches).toHaveLength(2);
      expect(vencedor.matches[0].countGoals()).toEqual({ teamA: 2, teamB: 1 });
    });

    it("salva de novo após reload com jogador removido que tinha gol marcado", () => {
      const { jogo, artilheiroDoPerdedor } = buildPeladaComPartidaEncerrada();
      jogo.removePlayer(artilheiroDoPerdedor);

      const reidratada = deserializeGestorJogo(serializeGestorJogo(jogo));

      expect(() => serializeGestorJogo(reidratada)).not.toThrow();
      // Removido não ressuscita no elenco…
      expect(reidratada.players.map((p) => p.name)).not.toContain(
        artilheiroDoPerdedor.name,
      );
      // …mas o placar da partida encerrada permanece íntegro.
      const encerrada = reidratada.playing!.teamA.matches[0];
      expect(encerrada.countGoals()).toEqual({ teamA: 2, teamB: 1 });
    });

    it("cura save antigo (v3) sem a partida encerrada na lista de matches", () => {
      const { jogo } = buildPeladaComPartidaEncerrada();
      const payload = JSON.parse(serializeGestorJogo(jogo));
      // Simula o save antigo: só a partida em andamento era serializada.
      payload.version = 3;
      delete payload.rosterPlayerIds;
      payload.matches = payload.matches.filter(
        (m: { id: string }) => m.id === payload.pelada.playingMatchId,
      );

      const reidratada = deserializeGestorJogo(JSON.stringify(payload));

      // Histórico daquela partida se perdeu, mas o save volta a funcionar.
      expect(() => serializeGestorJogo(reidratada)).not.toThrow();
      expect(reidratada.playing).toBeDefined();
    });

    it("cura save antigo (v3) com gol de jogador que não está no payload", () => {
      const { jogo, artilheiroDoPerdedor } = buildPeladaComPartidaEncerrada();
      const payload = JSON.parse(serializeGestorJogo(jogo));
      // Simula o save antigo pós-remoção: jogador fora de players e dos
      // rosters, mas o gol dele segue na partida encerrada.
      payload.version = 3;
      delete payload.rosterPlayerIds;
      payload.players = payload.players.filter(
        (p: { id: string }) => p.id !== artilheiroDoPerdedor.id,
      );
      payload.teams.forEach((t: { playerIds: string[] }) => {
        t.playerIds = t.playerIds.filter(
          (id) => id !== artilheiroDoPerdedor.id,
        );
      });

      const reidratada = deserializeGestorJogo(JSON.stringify(payload));

      expect(() => serializeGestorJogo(reidratada)).not.toThrow();
      // Placeholder preserva o placar mesmo sem o nome original.
      const encerrada = reidratada.playing!.teamA.matches[0];
      expect(encerrada.countGoals()).toEqual({ teamA: 2, teamB: 1 });
    });
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
