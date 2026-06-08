import { GestorJogo, PeladaStatus } from './GestorJogo';
import { ResultMatch } from './Match';
import { Player, PlayerSituation } from './Player';
import { ChoosingTeams, Rules } from './Rules';
import { Team } from './Team';
import { CreateTeamFactory } from './TeamBuilder/CreateTeam.factory';
import { TimerStatus } from './Timer';

describe('Teste da classe Game', () => {
  it('Deverá criar uma jogo qualquer', () => {
    const jogo = new GestorJogo('Futebol de quarta', new Rules());
    expect(jogo).toBeDefined();
  });
  describe('Quando for tratar a lista de jogadores', () => {
    it('Deverá cadastrar uma lista de jogadores', () => {
      const jogo = new GestorJogo('Futebol de quarta', new Rules());
      jogo.setPlayers(['Paulo', 'Marcos', 'Rodrigues', 'Oliveira']);
      expect(jogo.players.length).toBe(4);
      expect(jogo.players[0]).toBeInstanceOf(Player);
      expect(jogo.playersWithoutTeam).toBe(4);
    });
    it('Deverá adicionar um jogador', () => {
      const jogo = new GestorJogo('Futebol de quarta', new Rules());
      jogo.addPlayer('Pedro');
      expect(jogo.players.find((player) => player.name === 'Pedro')).toBeInstanceOf(
        Player,
      );
      expect(jogo.playersWithoutTeam).toBe(1);
    });
  });
  describe('Quando for lidar com times', () => {
    let jogo: GestorJogo;
    beforeEach(() => {
      const rules = new Rules({
        playersPerTeam: 2,
        choosingTeams: ChoosingTeams.BY_ORDER,
      });
      jogo = new GestorJogo('Futebol de quarta', rules);
      jogo.setPlayers(['Paulo', 'Marcos', 'Rodrigues', 'Oliveira']);
    });

    it('deve chamar CreateTeamFactory corretamente e definir this.next', () => {
      const choosingTeams = ChoosingTeams.BY_ORDER;
      jest.spyOn(CreateTeamFactory, 'fabricate');
      const next = jogo.createTeams();
      expect(CreateTeamFactory.fabricate).toHaveBeenCalledWith(choosingTeams);
      expect(next).toBeDefined();
      expect(next.length).toBeGreaterThan(0);
    });

    it('createTeams zera playersWithoutTeam (todos passam a ter time)', () => {
      // Regressão: o contador continuava marcando o nº original de jogadores
      // mesmo após todos serem distribuídos em times.
      expect(jogo.playersWithoutTeam).toBe(4);
      jogo.createTeams();
      expect(jogo.playersWithoutTeam).toBe(0);
      jogo.players.forEach((p) => expect(p.currentTeam).toBeDefined());
    });

    it('createTeams reflete jogadores que sobraram sem time', () => {
      // 5 jogadores em times de 2 → 2 times de 2 + 1 sobrando.
      jogo.addPlayer('Quinto');
      jogo.createTeams();
      const semTime = jogo.players.filter((p) => !p.currentTeam).length;
      expect(jogo.playersWithoutTeam).toBe(semTime);
    });

    it('deverá criar uma partida a partir das próximas', () => {
      const next = jogo.createTeams();
      const teamA = next[0];
      const teamB = next[1];
      jogo.setPlayingGame();
      expect(jogo.playing!.teamA).toEqual(teamA);
      expect(jogo.playing!.teamB).toEqual(teamB);
    });

    it('deverá lançar erro se já estiver uma partida acontecendo', () => {
      jogo.createTeams();
      jogo.setPlayingGame();
      expect(() => jogo.setPlayingGame()).toThrowError(
        'Já existe uma partida acontecendo.',
      );
    });

    it('deve lançar um erro se times já foram criados', () => {
      jogo.createTeams();
      expect(() => jogo.createTeams()).toThrowError('Times já foram criados');
    });

    it('deve retirar um n-ésimo time', () => {
      const teams = jogo.createTeams();
      expect(teams[0]).toEqual(jogo.getNthNext(1));
      expect(teams[1]).toEqual(jogo.getNthNext(2));
    });

    it('deve retirar um time das próximas', () => {
      jogo.createTeams();
      const team = jogo.getNthNext(1);
      expect(jogo.tirarDaFila()).toEqual(team);
    });

    it('getLastTeam deve retornar o último time', () => {
      const teams = jogo.createTeams();
      const result = jogo.getLastTeam();
      expect(result).toBe(teams[1]);
    });

    it('addToNewTeam deve adicionar jogador a um novo time', () => {
      const mockPlayer = new Player({ name: 'JogadorTeste' });
      jogo.addToNewTeam(mockPlayer);
      expect(jogo.getNthNext(1).players.length).toBe(1);
      expect(jogo.getNthNext(1).players[0]).toBe(mockPlayer);
    });

    it('addToLastTeam deve adicionar jogador ao último time', () => {
      const mockPlayer = new Player({ name: 'JogadorTeste' });
      const mockLastTeam = new Team({ limit: 3 });
      jest.spyOn(jogo, 'getLastTeam').mockReturnValue(mockLastTeam);
      jogo.addToLastTeam(mockPlayer);
      expect(mockLastTeam.players.length).toBe(1);
      expect(mockLastTeam.players[0]).toBe(mockPlayer);
    });

    it('addToLastTeam deve criar novo time se o último estiver cheio', () => {
      const mockPlayer = new Player({ name: 'JogadorTeste' });
      const mockLastTeam = new Team({ limit: 1 });
      mockLastTeam.addPlayer(new Player({ name: 'teste' }));
      jest.spyOn(jogo, 'getLastTeam').mockReturnValue(mockLastTeam);
      jogo.addToLastTeam(mockPlayer);
      expect(jogo.getNthNext(1).players.length).toBe(1);
      expect(jogo.getNthNext(1).players[0]).toBe(mockPlayer);
    });

    it('relocatePlayersWithoutTeam deve adicionar jogadores sem time ao último time', () => {
      jogo.createTeams();
      const mockLastTeam = new Team({ limit: 3 });
      jest.spyOn(jogo, 'getLastTeam').mockReturnValue(mockLastTeam);
      const addedPlayer = jogo.addPlayer('JogadorSemTime');
      jogo.relocatePlayersWithoutTeam();
      expect(mockLastTeam.players.length).toBe(1);
      expect(mockLastTeam.players[0]).toBe(addedPlayer);
    });

    it('relocatePlayersWithoutTeam não deve fazer nada se playersWithoutTeam for zerado', () => {
      jogo.playersWithoutTeam = 0;
      jogo.relocatePlayersWithoutTeam();
      expect(jogo.getLastTeam()).toBeUndefined();
    });
  });

  describe('Quando houver troca de jogador', () => {
    let jogo: GestorJogo;
    let players: Player[];
    let teams: Team[];
    beforeEach(() => {
      const rules = new Rules({
        playersPerTeam: 2,
        choosingTeams: ChoosingTeams.BY_ORDER,
      });
      jogo = new GestorJogo('Futebol de quarta', rules);
      players = jogo.setPlayers([
        'Paulo',
        'Marcos',
        'Rodrigues',
        'Oliveira',
        'Matos',
        'Peres',
        'Solto',
        'Ramos',
        'Otavio',
      ]);
      teams = jogo.createTeams();
    });

    it('relocatePlayers deve realocar jogadores corretamente', () => {
      jest.spyOn(teams[3], 'addPlayer');
      jest.spyOn(teams[4], 'removeNewestPlayer');
      teams[3].removeNewestPlayer();
      teams[3].removeNewestPlayer();
      const relocatedPlayer = teams[4].players[0];
      jogo.relocatePlayers(teams[4], teams[3]);

      expect(teams[3].addPlayer).toHaveBeenCalled();
      expect(teams[3].players.find((player) => player === relocatedPlayer)).toEqual(
        relocatedPlayer,
      );
      expect(teams[4].hasPlayer(relocatedPlayer)).toBe(false);
    });

    it('resizeTeams deve redimensionar times corretamente', () => {
      jest.spyOn(jogo, 'relocatePlayers');
      teams[2].removeNewestPlayer();
      jogo.resizeTeams(teams[2]);
      expect(jogo.relocatePlayers).toHaveBeenCalledTimes(2);
      expect(jogo.relocatePlayers).toHaveBeenCalledWith(teams[3], teams[2]);
    });

    it('resizeTeams não deverá chamar relocatePlayers quando o time estiver completo', () => {
      jest.spyOn(jogo, 'relocatePlayers');
      jogo.resizeTeams(teams[2]);
      expect(jogo.relocatePlayers).toHaveBeenCalledTimes(0);
    });

    it('resizePlayingGame deverá redimensionar os times quando faltar um no jogo atual', () => {
      jogo.setPlayingGame();
      jogo.playing?.teamA.removeNewestPlayer();
      jest.spyOn(jogo, 'resizeTeams');
      jogo.resizePlayingGame(jogo.playing!.teamA);
      expect(jogo.resizeTeams).toHaveBeenCalledTimes(1);
    });

    it('switchPlayerLeft deve trocar jogadores entre times corretamente', () => {
      const teamA = players[1].currentTeam!;
      const teamB = players[4].currentTeam!;

      jest.spyOn(teamB, 'removePlayer');
      jest.spyOn(teamA, 'removePlayer');
      jest.spyOn(teamA, 'addPlayer');
      jest.spyOn(jogo, 'resizeTeams');

      jogo.switchPlayerLeft(players[4], players[1]);

      expect(teamB.removePlayer).toHaveBeenCalledWith(players[4]);
      expect(teamA.removePlayer).toHaveBeenCalledWith(players[1]);
      expect(teamA.addPlayer).toHaveBeenCalledWith(players[4]);
      expect(jogo.resizeTeams).toHaveBeenCalledWith(teamB);
    });

    it('switchPlayerLeft deve trocar jogadores entre atualizado o jogo atual', () => {
      jogo.setPlayingGame();
      const teamA = players[0].currentTeam!;
      const teamB = players[2].currentTeam!;

      jest.spyOn(teamB, 'removePlayer');
      jest.spyOn(teamA, 'removePlayer');
      jest.spyOn(teamA, 'addPlayer');
      jest.spyOn(jogo, 'updateTeams');

      jogo.switchPlayerLeft(players[2], players[0]);

      expect(teamB.removePlayer).toHaveBeenCalledWith(players[2]);
      expect(teamA.removePlayer).toHaveBeenCalledWith(players[0]);
      expect(teamA.addPlayer).toHaveBeenCalledWith(players[2]);
      expect(jogo.updateTeams).toHaveBeenCalledWith(teamB);
    });

    it('updateTeams atualiza os times quando faltar jogador no jogo atual', () => {
      jest.spyOn(jogo, 'resizePlayingGame');
      jogo.setPlayingGame();
      const teamA = jogo.playing!.teamA;
      teamA.removeNewestPlayer();
      jogo.updateTeams(teamA);
      expect(jogo.resizePlayingGame).toHaveBeenCalledWith(teamA);
    });

    it('updateTeams atualiza os times quando faltar jogador nas próximas', () => {
      jest.spyOn(jogo, 'resizeTeams');
      jogo.setPlayingGame();
      teams[2].removeNewestPlayer();
      jogo.updateTeams(teams[2]);
      expect(jogo.resizeTeams).toHaveBeenCalledWith(teams[2]);
    });

    it('removeFromGame deverá remover um jogador da pelada', () => {
      jogo.setPlayingGame();
      const player = jogo.players[2];
      const team = jogo.players[2].currentTeam!;
      jest.spyOn(jogo, 'updateTeams');
      jogo.removeFromGame(player);
      expect(jogo.updateTeams).toHaveBeenCalledWith(team);
      expect(team.hasPlayer(player)).toBe(false);
      expect(player.situation).toBe(PlayerSituation.STOPPED);
    });

    it('switchPlayerFromTeam deverá trocar 2 jogadores', () => {
      jogo.setPlayingGame();
      const player1 = jogo.players[2];
      const team1 = player1.currentTeam!;
      const player2 = jogo.players[6];
      const team2 = player2.currentTeam!;
      jogo.switchPlayerFromTeam(player1, player2);
      expect(team1.hasPlayer(player1)).toBe(false);
      expect(team1.hasPlayer(player2)).toBe(true);
      expect(team2.hasPlayer(player2)).toBe(false);
      expect(team2.hasPlayer(player1)).toBe(true);
    });
  });

  describe('Quando for controlar a partida atual', () => {
    let jogo: GestorJogo;
    let players: Player[];
    let teams: Team[];
    let rules: Rules;
    beforeEach(() => {
      rules = new Rules({
        playersPerTeam: 2,
        choosingTeams: ChoosingTeams.BY_ORDER,
      });
      jogo = new GestorJogo('Futebol de quarta', rules);
      players = jogo.setPlayers([
        'Paulo',
        'Marcos',
        'Rodrigues',
        'Oliveira',
        'Matos',
        'Peres',
        'Solto',
        'Ramos',
        'Otavio',
      ]);
      teams = jogo.createTeams();
      jogo.setPlayingGame();
    });

    it('deve iniciar o temporizador quando start() é chamado', () => {
      jest.spyOn(jogo, 'start');
      jogo.start();
      expect(jogo.timer).toBeDefined();
      expect(jogo.timer!.status).toBe(TimerStatus.STARTED);
    });

    it('deve pausar o temporizador quando pause() é chamado', () => {
      jogo.start();
      jogo.pause();
      expect(jogo.timer!.status).toBe(TimerStatus.PAUSED);
    });

    it('deve continuar o temporizador quando continue() é chamado', () => {
      jogo.start();
      jogo.pause();
      jogo.continue();
      expect(jogo.timer!.status).toBe(TimerStatus.STARTED);
    });

    it('deve adicionar um gol quando addGoal() é chamado', () => {
      jogo.start();
      jest.spyOn(jogo.timer!, 'getTime');
      const team = jogo.playing!.teamA;
      const playerGoal = team.players[0];
      jogo.addGoal(team, playerGoal);
      expect(team.goals.length).toBe(1);
      expect(playerGoal.goals.length).toBe(1);
      expect(playerGoal.goals[0]).toEqual(team.goals[0]);
    });

    it('undoLastGoal desfaz o gol mais recente e zera as estatísticas do autor', () => {
      jogo.start();
      const team = jogo.playing!.teamA;
      const playerGoal = team.players[0];
      jogo.addGoal(team, playerGoal);
      expect(jogo.playing!.goals.length).toBe(1);

      const desfeito = jogo.undoLastGoal();

      expect(desfeito).toBe(true);
      expect(jogo.playing!.goals.length).toBe(0);
      expect(team.goals.length).toBe(0);
      expect(playerGoal.goals.length).toBe(0);
    });

    it('undoLastGoal retorna false quando não há gols para desfazer', () => {
      jogo.start();
      expect(jogo.undoLastGoal()).toBe(false);
    });

    it('removerGol apaga gol arbitrário sem mexer nos outros', () => {
      jogo.start();
      const team = jogo.playing!.teamA;
      const p1 = team.players[0];
      const p2 = team.players[1];
      jogo.addGoal(team, p1);
      jogo.addGoal(team, p2);
      const golDoP1 = jogo.playing!.goals[0];
      expect(jogo.playing!.goals.length).toBe(2);

      const removeu = jogo.removerGol(golDoP1);

      expect(removeu).toBe(true);
      expect(jogo.playing!.goals.length).toBe(1);
      expect(jogo.playing!.goals[0].player).toBe(p2);
      expect(p1.goals.length).toBe(0);
      expect(p2.goals.length).toBe(1);
      expect(team.goals.length).toBe(1);
    });

    it('removerGol retorna false quando gol não pertence à partida', () => {
      jogo.start();
      const team = jogo.playing!.teamA;
      jogo.addGoal(team, team.players[0]);
      const golValido = jogo.playing!.goals[0];
      jogo.undoLastGoal(); // remove de partida.goals
      expect(jogo.removerGol(golValido)).toBe(false);
    });

    it('corrigirAutorDoGol troca o creditado preservando time e instante', () => {
      jogo.start();
      const team = jogo.playing!.teamA;
      const errado = team.players[0];
      const certo = team.players[1];
      jogo.addGoal(team, errado);
      const golOriginal = jogo.playing!.goals[0];

      const ok = jogo.corrigirAutorDoGol(golOriginal, certo);

      expect(ok).toBe(true);
      expect(errado.goals.length).toBe(0);
      expect(certo.goals.length).toBe(1);
      const golCorrigido = jogo.playing!.goals[0];
      expect(golCorrigido.player).toBe(certo);
      expect(golCorrigido.team).toBe(team);
      expect(golCorrigido.time).toBe(golOriginal.time);
      expect(golCorrigido.ownGoal).toBe(false);
    });

    it('corrigirAutorDoGol vira ownGoal quando novo autor é do time adversário', () => {
      jogo.start();
      const teamA = jogo.playing!.teamA;
      const teamB = jogo.playing!.teamB;
      jogo.addGoal(teamA, teamA.players[0]);
      const gol = jogo.playing!.goals[0];

      const adversario = teamB.players[0];
      jogo.corrigirAutorDoGol(gol, adversario);

      const golCorrigido = jogo.playing!.goals[0];
      expect(golCorrigido.team).toBe(teamA); // gol continua creditado ao A
      expect(golCorrigido.player).toBe(adversario);
      expect(golCorrigido.ownGoal).toBe(true);
      // ownGoal não soma para o autor — preserva estatística individual.
      expect(adversario.goals.length).toBe(0);
    });

    it('corrigirAutorDoGol no-op quando o autor é o mesmo', () => {
      jogo.start();
      const team = jogo.playing!.teamA;
      jogo.addGoal(team, team.players[0]);
      const gol = jogo.playing!.goals[0];

      expect(jogo.corrigirAutorDoGol(gol, team.players[0])).toBe(false);
      expect(team.players[0].goals.length).toBe(1);
    });

    it('deve definir o resultado quando setResult() é chamado', (done) => {
      rules.timeMatch = '00:00:01';
      jogo.start();
      const team = jogo.playing!.teamA;
      const playerGoal = team.players[0];
      jogo.addGoal(team, playerGoal);
      setTimeout(() => {
        jogo.setResult();
        expect(jogo.playing!.result).toBe(ResultMatch.VICTORY);
        expect(jogo.playing!.winner).toBe(team);
        done();
      }, 2000);
    });
  });

  describe('Quando remover um jogador da pelada', () => {
    it('deverá remover jogador sem time e decrementar playersWithoutTeam', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      const ana = jogo.addPlayer('Ana');
      jogo.addPlayer('Bia');
      jogo.removePlayer(ana);
      expect(jogo.players).toHaveLength(1);
      expect(jogo.players[0].name).toBe('Bia');
      expect(jogo.playersWithoutTeam).toBe(1);
    });

    it('deverá tirar o jogador do time antes de remover da pelada', () => {
      const jogo = new GestorJogo('Pelada', new Rules({ playersPerTeam: 2 }));
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      jogo.createTeams();
      const ana = jogo.players.find((p) => p.name === 'Ana')!;
      const time = ana.currentTeam!;
      jogo.removePlayer(ana);
      expect(jogo.players).toHaveLength(3);
      expect(time.hasPlayer(ana)).toBe(false);
      expect(ana.situation).toBe(PlayerSituation.STOPPED);
    });

    it('deverá lançar erro ao tentar remover jogador inexistente', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      const fantasma = new Player({ name: 'Fantasma' });
      expect(() => jogo.removePlayer(fantasma)).toThrowError(
        'Jogador não está na pelada.',
      );
    });
  });

  describe('Quando renomear um jogador da pelada', () => {
    it('deverá renomear o jogador via Player.rename', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      const player = jogo.addPlayer('Antigo');
      jogo.renamePlayer(player, 'Novo');
      expect(player.name).toBe('Novo');
    });

    it('deverá lançar erro ao renomear jogador que não está na pelada', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      const fantasma = new Player({ name: 'Fantasma' });
      expect(() => jogo.renamePlayer(fantasma, 'Algo')).toThrowError(
        'Jogador não está na pelada.',
      );
    });

    it('deverá lançar erro ao renomear para nome já usado por outro jogador', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      jogo.addPlayer('Ana');
      const bia = jogo.addPlayer('Bia');
      expect(() => jogo.renamePlayer(bia, 'Ana')).toThrowError(
        'Já existe jogador chamado "Ana" na pelada.',
      );
    });

    it('deverá tratar duplicata na renomeação ignorando caixa e espaços', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      jogo.addPlayer('Ana');
      const bia = jogo.addPlayer('Bia');
      expect(() => jogo.renamePlayer(bia, '  ana  ')).toThrowError(
        'Já existe jogador chamado "ana" na pelada.',
      );
    });

    it('deverá permitir renomear para o mesmo nome (no-op de duplicata)', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      const ana = jogo.addPlayer('Ana');
      expect(() => jogo.renamePlayer(ana, 'Ana')).not.toThrow();
    });
  });

  describe('Quando adicionar um jogador (addPlayer)', () => {
    it('deverá fazer trim do nome antes de criar', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      const p = jogo.addPlayer('   Pedro   ');
      expect(p.name).toBe('Pedro');
    });

    it('deverá lançar erro quando o nome é vazio', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      expect(() => jogo.addPlayer('')).toThrowError(
        'Nome do jogador não pode ser vazio.',
      );
    });

    it('deverá lançar erro quando o nome só tem espaços', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      expect(() => jogo.addPlayer('    ')).toThrowError(
        'Nome do jogador não pode ser vazio.',
      );
    });

    it('deverá lançar erro ao adicionar jogador com nome já existente', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      jogo.addPlayer('Ana');
      expect(() => jogo.addPlayer('Ana')).toThrowError(
        'Já existe jogador chamado "Ana" na pelada.',
      );
    });

    it('deverá considerar duplicata ignorando caixa e espaços', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      jogo.addPlayer('Ana');
      expect(() => jogo.addPlayer('  ANA  ')).toThrowError(
        'Já existe jogador chamado "ANA" na pelada.',
      );
    });
  });

  describe('Quando adicionar vários jogadores em lote (addPlayers)', () => {
    it('deverá acrescentar todos os nomes válidos sem resetar a lista', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      jogo.addPlayer('Ana');
      const criados = jogo.addPlayers(['Bia', 'Caio', 'Davi']);
      expect(criados).toHaveLength(3);
      expect(jogo.players.map((p) => p.name)).toEqual([
        'Ana',
        'Bia',
        'Caio',
        'Davi',
      ]);
      expect(jogo.playersWithoutTeam).toBe(4);
    });

    it('deverá ignorar nomes vazios e duplicatas sem lançar erro', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      jogo.addPlayer('Ana');
      const criados = jogo.addPlayers([
        '',
        '   ',
        'Bia',
        'Ana',
        'bia',
        '  Caio  ',
      ]);
      expect(criados.map((p) => p.name)).toEqual(['Bia', 'Caio']);
      expect(jogo.players.map((p) => p.name)).toEqual(['Ana', 'Bia', 'Caio']);
    });

    it('deverá retornar lista vazia quando nada é criado', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      jogo.addPlayer('Ana');
      const criados = jogo.addPlayers(['', 'Ana', '   ']);
      expect(criados).toEqual([]);
      expect(jogo.players).toHaveLength(1);
    });
  });

  describe('Quando mover um time para o fim da fila', () => {
    function peladaComTimes(): GestorJogo {
      const jogo = new GestorJogo(
        'Pelada',
        new Rules({ playersPerTeam: 2, choosingTeams: ChoosingTeams.BY_ORDER }),
      );
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi', 'Edu', 'Fê']);
      jogo.createTeams();
      return jogo;
    }

    it('deverá reposicionar o time mantendo os jogadores', () => {
      const jogo = peladaComTimes();
      const time1 = jogo.next[0];
      const playersAntes = [...time1.players];
      jogo.moverTimeParaFim(time1);
      expect(jogo.next.indexOf(time1)).toBe(jogo.next.length - 1);
      expect(time1.players).toEqual(playersAntes);
    });

    it('deverá ser no-op se o time já é o último', () => {
      const jogo = peladaComTimes();
      const ultimo = jogo.next[jogo.next.length - 1];
      const ordemAntes = [...jogo.next];
      jogo.moverTimeParaFim(ultimo);
      expect(jogo.next).toEqual(ordemAntes);
    });

    it('deverá lançar erro se o time não está na fila', () => {
      const jogo = peladaComTimes();
      const fantasma = new Team({ limit: 2 });
      expect(() => jogo.moverTimeParaFim(fantasma)).toThrowError(
        'Time não está na fila.',
      );
    });

    it('deverá lançar erro ao mover time em partida em andamento', () => {
      const jogo = peladaComTimes();
      jogo.setPlayingGame();
      const emPartida = [...jogo.playing!.teams][0];
      expect(() => jogo.moverTimeParaFim(emPartida)).toThrowError(
        'Não é possível mover time que está em partida em andamento.',
      );
    });
  });

  describe('Quando esvaziar um time', () => {
    function peladaComTimes(): GestorJogo {
      const jogo = new GestorJogo(
        'Pelada',
        new Rules({ playersPerTeam: 2, choosingTeams: ChoosingTeams.BY_ORDER }),
      );
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      jogo.createTeams();
      return jogo;
    }

    it('deverá remover o time da fila', () => {
      const jogo = peladaComTimes();
      const tamanhoAntes = jogo.next.length;
      const time = jogo.next[0];
      jogo.esvaziarTime(time);
      expect(jogo.next).toHaveLength(tamanhoAntes - 1);
      expect(jogo.next.includes(time)).toBe(false);
    });

    it('deverá devolver os jogadores para a situação sem time', () => {
      const jogo = peladaComTimes();
      const time = jogo.next[0];
      const jogadoresDoTime = [...time.players];
      jogo.esvaziarTime(time);
      jogadoresDoTime.forEach((p) => {
        expect(p.currentTeam).toBeUndefined();
        expect(p.situation).toBe(PlayerSituation.NO_TEAM);
      });
    });

    it('deverá incrementar playersWithoutTeam pelos jogadores liberados', () => {
      const jogo = peladaComTimes();
      const time = jogo.next[0];
      const liberados = time.players.length;
      const antes = jogo.playersWithoutTeam;
      jogo.esvaziarTime(time);
      expect(jogo.playersWithoutTeam).toBe(antes + liberados);
    });

    it('deverá zerar advantageToNext se o time esvaziado tinha vantagem', () => {
      const jogo = peladaComTimes();
      const time = jogo.next[0];
      jogo.advantageToNext = time;
      jogo.esvaziarTime(time);
      expect(jogo.advantageToNext).toBeUndefined();
    });

    it('deverá lançar erro se o time não está na fila', () => {
      const jogo = peladaComTimes();
      const fantasma = new Team({ limit: 2 });
      expect(() => jogo.esvaziarTime(fantasma)).toThrowError(
        'Time não está na fila.',
      );
    });

    it('deverá lançar erro ao esvaziar time em partida em andamento', () => {
      const jogo = peladaComTimes();
      jogo.setPlayingGame();
      const emPartida = [...jogo.playing!.teams][0];
      expect(() => jogo.esvaziarTime(emPartida)).toThrowError(
        'Não é possível esvaziar time que está em partida em andamento.',
      );
    });
  });

  describe('Quando bloquear remoção em partida ativa', () => {
    it('deverá lançar erro ao remover jogador de time que está em partida', () => {
      const jogo = new GestorJogo('Pelada', new Rules({ playersPerTeam: 2 }));
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      jogo.createTeams();
      jogo.setPlayingGame();
      const playingPlayer = [...jogo.playing!.teams]
        .flatMap((t) => t.players)[0];
      expect(() => jogo.removePlayer(playingPlayer)).toThrowError(
        'Não é possível remover jogador que está em partida em andamento.',
      );
    });

    it('deverá permitir remover jogador que NÃO está na partida atual', () => {
      const jogo = new GestorJogo('Pelada', new Rules({ playersPerTeam: 2 }));
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi', 'Edu', 'Fê']);
      jogo.createTeams();
      jogo.setPlayingGame();
      const semPartida = jogo.players.find(
        (p) => p.currentTeam && !jogo.playing!.teams.has(p.currentTeam),
      )!;
      expect(() => jogo.removePlayer(semPartida)).not.toThrow();
    });
  });

  describe('Quando resetar os times', () => {
    let jogo: GestorJogo;
    beforeEach(() => {
      jogo = new GestorJogo('Pelada', new Rules({ playersPerTeam: 2 }));
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      jogo.createTeams();
    });

    it('deverá esvaziar a fila de próximos', () => {
      jogo.resetTimes();
      expect(jogo.next).toHaveLength(0);
    });

    it('deverá zerar advantageToNext', () => {
      jogo.advantageToNext = jogo.players[0].currentTeam!;
      jogo.resetTimes();
      expect(jogo.advantageToNext).toBeUndefined();
    });

    it('deverá deixar todos os jogadores sem time e sem situação ACTIVE', () => {
      jogo.resetTimes();
      jogo.players.forEach((p) => {
        expect(p.currentTeam).toBeUndefined();
        expect(p.situation).toBe(PlayerSituation.NO_TEAM);
      });
      expect(jogo.playersWithoutTeam).toBe(4);
    });

    it('deverá permitir createTeams novamente após reset', () => {
      jogo.resetTimes();
      expect(() => jogo.createTeams()).not.toThrow();
      expect(jogo.next.length).toBeGreaterThan(0);
    });

    it('deverá lançar erro se houver partida em andamento', () => {
      jogo.setPlayingGame();
      expect(() => jogo.resetTimes()).toThrowError(
        'Não é possível resetar times com partida em andamento.',
      );
    });
  });

  describe('Quando atualizar as regras da pelada', () => {
    function pelada(): GestorJogo {
      return new GestorJogo('Pelada', new Rules({ playersPerTeam: 2 }));
    }

    it('deverá atualizar apenas os campos informados', () => {
      const jogo = pelada();
      jogo.atualizarRegras({ goalLimit: 5, name: 'Champions' });
      expect(jogo.rules.goalLimit).toBe(5);
      expect(jogo.rules.name).toBe('Champions');
      expect(jogo.rules.playersPerTeam).toBe(2);
    });

    it('deverá preservar o id das regras ao atualizar', () => {
      const jogo = pelada();
      const idAntes = jogo.rules.id;
      jogo.atualizarRegras({ goalLimit: 3 });
      expect(jogo.rules.id).toBe(idAntes);
    });

    it('deverá validar o novo valor via Rules (faixa)', () => {
      const jogo = pelada();
      expect(() => jogo.atualizarRegras({ playersPerTeam: 0 })).toThrowError(
        'Limite mínimo de jogadores por time é 1.',
      );
    });

    it('deverá lançar erro ao mudar playersPerTeam com times montados', () => {
      const jogo = pelada();
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      jogo.createTeams();
      expect(() => jogo.atualizarRegras({ playersPerTeam: 3 })).toThrowError(
        /Não é possível mudar jogadores por time/,
      );
    });

    it('deverá lançar erro ao mudar choosingTeams com times montados', () => {
      const jogo = pelada();
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      jogo.createTeams();
      expect(() =>
        jogo.atualizarRegras({ choosingTeams: ChoosingTeams.BY_MIXING_TEAMS }),
      ).toThrowError(/modo de sorteio/);
    });

    it('deverá permitir alterar timeMatch e goalLimit a qualquer momento', () => {
      const jogo = pelada();
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      jogo.createTeams();
      jogo.setPlayingGame();
      jogo.atualizarRegras({ timeMatch: '00:05:00', goalLimit: 10 });
      expect(jogo.rules.timeMatch).toBe('00:05:00');
      expect(jogo.rules.goalLimit).toBe(10);
    });
  });

  describe('Ciclo de vida da pelada', () => {
    it('nasce com status CREATED e createdAt populado', () => {
      const antes = Date.now();
      const jogo = new GestorJogo('Pelada', new Rules());
      const depois = Date.now();
      expect(jogo.status).toBe(PeladaStatus.CREATED);
      expect(jogo.createdAt).toBeGreaterThanOrEqual(antes);
      expect(jogo.createdAt).toBeLessThanOrEqual(depois);
      expect(jogo.startedAt).toBeUndefined();
      expect(jogo.endedAt).toBeUndefined();
    });

    it('aceita timestamps no construtor (para reidratação)', () => {
      const jogo = new GestorJogo('Pelada', new Rules(), {
        status: PeladaStatus.ATIVA,
        createdAt: 123,
        startedAt: 456,
      });
      expect(jogo.status).toBe(PeladaStatus.ATIVA);
      expect(jogo.createdAt).toBe(123);
      expect(jogo.startedAt).toBe(456);
    });

    it('iniciar() transiciona CREATED → ATIVA e marca startedAt', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      jogo.iniciar();
      expect(jogo.status).toBe(PeladaStatus.ATIVA);
      expect(jogo.startedAt).toBeDefined();
    });

    it('iniciar() falha quando já está ATIVA', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      jogo.iniciar();
      expect(() => jogo.iniciar()).toThrowError('Pelada já foi iniciada.');
    });

    it('finalizar() transiciona ATIVA → FINALIZADA e marca endedAt', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      jogo.iniciar();
      jogo.finalizar();
      expect(jogo.status).toBe(PeladaStatus.FINALIZADA);
      expect(jogo.endedAt).toBeDefined();
    });

    it('finalizar() falha se houver partida em andamento', () => {
      const jogo = new GestorJogo('Pelada', new Rules({ playersPerTeam: 2 }));
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      jogo.createTeams();
      jogo.iniciar();
      jogo.setPlayingGame();
      expect(() => jogo.finalizar()).toThrowError(
        /partida em andamento/,
      );
    });

    it('finalizar() é idempotência-protegido', () => {
      const jogo = new GestorJogo('Pelada', new Rules());
      jogo.iniciar();
      jogo.finalizar();
      expect(() => jogo.finalizar()).toThrowError('Pelada já foi finalizada.');
    });
  });

  describe('Quando limpar jogadores e times', () => {
    it('esvazia jogadores, fila e jogadores-sem-time preservando regras e nome', () => {
      const jogo = new GestorJogo('Sábado', new Rules({ playersPerTeam: 2 }));
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      jogo.createTeams();
      jogo.limparJogadoresETimes();
      expect(jogo.players).toHaveLength(0);
      expect(jogo.next).toHaveLength(0);
      expect(jogo.playersWithoutTeam).toBe(0);
      expect(jogo.advantageToNext).toBeUndefined();
      expect(jogo.name).toBe('Sábado');
      expect(jogo.rules.playersPerTeam).toBe(2);
    });

    it('preserva o histórico de partidas', () => {
      const jogo = new GestorJogo('Pelada', new Rules({ playersPerTeam: 2 }));
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      jogo.createTeams();
      jogo.setPlayingGame();
      jogo.setResult();
      // Move playing para matches manualmente para simular fim de partida.
      jogo.matches.push(jogo.playing!);
      jogo.playing = undefined;
      jogo.limparJogadoresETimes();
      expect(jogo.matches).toHaveLength(1);
    });

    it('bloqueia limpeza com partida em andamento', () => {
      const jogo = new GestorJogo('Pelada', new Rules({ playersPerTeam: 2 }));
      jogo.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      jogo.createTeams();
      jogo.setPlayingGame();
      expect(() => jogo.limparJogadoresETimes()).toThrowError(
        /partida em andamento/,
      );
    });
  });
});
