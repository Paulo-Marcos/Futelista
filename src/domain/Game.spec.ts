import { GameManager, PeladaStatus } from './GameManager';
import { ResultMatch } from './Match';
import { Player, PlayerSituation } from './Player';
import { ChoosingTeams, Rules } from './Rules';
import { Team } from './Team';
import { CreateTeamFactory } from './TeamBuilder/CreateTeam.factory';
import { TimerStatus } from './Timer';

describe('Teste da classe Game', () => {
  it('Deverá criar uma jogo qualquer', () => {
    const game = new GameManager('Futebol de quarta', new Rules());
    expect(game).toBeDefined();
  });
  describe('Quando for tratar a lista de jogadores', () => {
    it('Deverá cadastrar uma lista de jogadores', () => {
      const game = new GameManager('Futebol de quarta', new Rules());
      game.setPlayers(['Paulo', 'Marcos', 'Rodrigues', 'Oliveira']);
      expect(game.players.length).toBe(4);
      expect(game.players[0]).toBeInstanceOf(Player);
      expect(game.playersWithoutTeam).toBe(4);
    });
    it('Deverá adicionar um jogador', () => {
      const game = new GameManager('Futebol de quarta', new Rules());
      game.addPlayer('Pedro');
      expect(game.players.find((player) => player.name === 'Pedro')).toBeInstanceOf(
        Player,
      );
      expect(game.playersWithoutTeam).toBe(1);
    });
  });
  describe('Quando for lidar com times', () => {
    let game: GameManager;
    beforeEach(() => {
      const rules = new Rules({
        playersPerTeam: 2,
        choosingTeams: ChoosingTeams.BY_ORDER,
      });
      game = new GameManager('Futebol de quarta', rules);
      game.setPlayers(['Paulo', 'Marcos', 'Rodrigues', 'Oliveira']);
    });

    it('deve chamar CreateTeamFactory corretamente e definir this.next', () => {
      const choosingTeams = ChoosingTeams.BY_ORDER;
      jest.spyOn(CreateTeamFactory, 'fabricate');
      const next = game.createTeams();
      expect(CreateTeamFactory.fabricate).toHaveBeenCalledWith(choosingTeams);
      expect(next).toBeDefined();
      expect(next.length).toBeGreaterThan(0);
    });

    it('createTeams zera playersWithoutTeam (todos passam a ter time)', () => {
      // Regressão: o contador continuava marcando o nº original de jogadores
      // mesmo após todos serem distribuídos em times.
      expect(game.playersWithoutTeam).toBe(4);
      game.createTeams();
      expect(game.playersWithoutTeam).toBe(0);
      game.players.forEach((p) => expect(p.currentTeam).toBeDefined());
    });

    it('createTeams reflete jogadores que sobraram sem time', () => {
      // 5 jogadores em times de 2 → 2 times de 2 + 1 sobrando.
      game.addPlayer('Quinto');
      game.createTeams();
      const semTime = game.players.filter((p) => !p.currentTeam).length;
      expect(game.playersWithoutTeam).toBe(semTime);
    });

    it('deverá criar uma partida a partir das próximas', () => {
      const next = game.createTeams();
      const teamA = next[0];
      const teamB = next[1];
      game.setPlayingGame();
      expect(game.playing!.teamA).toEqual(teamA);
      expect(game.playing!.teamB).toEqual(teamB);
    });

    it('deverá lançar erro se já estiver uma partida acontecendo', () => {
      game.createTeams();
      game.setPlayingGame();
      expect(() => game.setPlayingGame()).toThrowError(
        'Já existe uma partida acontecendo.',
      );
    });

    it('deve lançar um erro se times já foram criados', () => {
      game.createTeams();
      expect(() => game.createTeams()).toThrowError('Times já foram criados');
    });

    it('deve retirar um n-ésimo time', () => {
      const teams = game.createTeams();
      expect(teams[0]).toEqual(game.getNthNext(1));
      expect(teams[1]).toEqual(game.getNthNext(2));
    });

    it('deve retirar um time das próximas', () => {
      game.createTeams();
      const team = game.getNthNext(1);
      expect(game.removeFirstNext()).toEqual(team);
    });

    it('getLastTeam deve retornar o último time', () => {
      const teams = game.createTeams();
      const result = game.getLastTeam();
      expect(result).toBe(teams[1]);
    });

    it('addToNewTeam deve adicionar jogador a um novo time', () => {
      const mockPlayer = new Player('JogadorTeste');
      game.addToNewTeam(mockPlayer);
      expect(game.getNthNext(1).players.length).toBe(1);
      expect(game.getNthNext(1).players[0]).toBe(mockPlayer);
    });

    it('addToLastTeam deve adicionar jogador ao último time', () => {
      const mockPlayer = new Player('JogadorTeste');
      const mockLastTeam = new Team(3);
      jest.spyOn(game, 'getLastTeam').mockReturnValue(mockLastTeam);
      game.addToLastTeam(mockPlayer);
      expect(mockLastTeam.players.length).toBe(1);
      expect(mockLastTeam.players[0]).toBe(mockPlayer);
    });

    it('addToLastTeam deve criar novo time se o último estiver cheio', () => {
      const mockPlayer = new Player('JogadorTeste');
      const mockLastTeam = new Team(1);
      mockLastTeam.addPlayer(new Player('teste'));
      jest.spyOn(game, 'getLastTeam').mockReturnValue(mockLastTeam);
      game.addToLastTeam(mockPlayer);
      expect(game.getNthNext(1).players.length).toBe(1);
      expect(game.getNthNext(1).players[0]).toBe(mockPlayer);
    });

    it('relocatePlayersWithoutTeam deve adicionar jogadores sem time ao último time', () => {
      game.createTeams();
      const mockLastTeam = new Team(3);
      jest.spyOn(game, 'getLastTeam').mockReturnValue(mockLastTeam);
      const addedPlayer = game.addPlayer('JogadorSemTime');
      game.relocatePlayersWithoutTeam();
      expect(mockLastTeam.players.length).toBe(1);
      expect(mockLastTeam.players[0]).toBe(addedPlayer);
    });

    it('relocatePlayersWithoutTeam não deve fazer nada se playersWithoutTeam for zerado', () => {
      game.playersWithoutTeam = 0;
      game.relocatePlayersWithoutTeam();
      expect(game.getLastTeam()).toBeUndefined();
    });
  });

  describe('Quando houver troca de jogador', () => {
    let game: GameManager;
    let players: Player[];
    let teams: Team[];
    beforeEach(() => {
      const rules = new Rules({
        playersPerTeam: 2,
        choosingTeams: ChoosingTeams.BY_ORDER,
      });
      game = new GameManager('Futebol de quarta', rules);
      players = game.setPlayers([
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
      teams = game.createTeams();
    });

    it('relocatePlayers deve realocar jogadores corretamente', () => {
      jest.spyOn(teams[3], 'addPlayer');
      jest.spyOn(teams[4], 'removeNewestPlayer');
      teams[3].removeNewestPlayer();
      teams[3].removeNewestPlayer();
      const relocatedPlayer = teams[4].players[0];
      game.relocatePlayers(teams[4], teams[3]);

      expect(teams[3].addPlayer).toHaveBeenCalled();
      expect(teams[3].players.find((player) => player === relocatedPlayer)).toEqual(
        relocatedPlayer,
      );
      expect(teams[4].hasPlayer(relocatedPlayer)).toBe(false);
    });

    it('resizeTeams deve redimensionar times corretamente', () => {
      jest.spyOn(game, 'relocatePlayers');
      teams[2].removeNewestPlayer();
      game.resizeTeams(teams[2]);
      expect(game.relocatePlayers).toHaveBeenCalledTimes(2);
      expect(game.relocatePlayers).toHaveBeenCalledWith(teams[3], teams[2]);
    });

    it('resizeTeams não deverá chamar relocatePlayers quando o time estiver completo', () => {
      jest.spyOn(game, 'relocatePlayers');
      game.resizeTeams(teams[2]);
      expect(game.relocatePlayers).toHaveBeenCalledTimes(0);
    });

    it('resizePlayingGame deverá redimensionar os times quando faltar um no jogo atual', () => {
      game.setPlayingGame();
      game.playing?.teamA.removeNewestPlayer();
      jest.spyOn(game, 'resizeTeams');
      game.resizePlayingGame(game.playing!.teamA);
      expect(game.resizeTeams).toHaveBeenCalledTimes(1);
    });

    it('switchPlayerLeft deve trocar jogadores entre times corretamente', () => {
      const teamA = players[1].currentTeam!;
      const teamB = players[4].currentTeam!;

      jest.spyOn(teamB, 'removePlayer');
      jest.spyOn(teamA, 'removePlayer');
      jest.spyOn(teamA, 'addPlayer');
      jest.spyOn(game, 'resizeTeams');

      game.switchPlayerLeft(players[4], players[1]);

      expect(teamB.removePlayer).toHaveBeenCalledWith(players[4]);
      expect(teamA.removePlayer).toHaveBeenCalledWith(players[1]);
      expect(teamA.addPlayer).toHaveBeenCalledWith(players[4]);
      expect(game.resizeTeams).toHaveBeenCalledWith(teamB);
    });

    it('switchPlayerLeft deve trocar jogadores entre atualizado o jogo atual', () => {
      game.setPlayingGame();
      const teamA = players[0].currentTeam!;
      const teamB = players[2].currentTeam!;

      jest.spyOn(teamB, 'removePlayer');
      jest.spyOn(teamA, 'removePlayer');
      jest.spyOn(teamA, 'addPlayer');
      jest.spyOn(game, 'updateTeams');

      game.switchPlayerLeft(players[2], players[0]);

      expect(teamB.removePlayer).toHaveBeenCalledWith(players[2]);
      expect(teamA.removePlayer).toHaveBeenCalledWith(players[0]);
      expect(teamA.addPlayer).toHaveBeenCalledWith(players[2]);
      expect(game.updateTeams).toHaveBeenCalledWith(teamB);
    });

    it('updateTeams atualiza os times quando faltar jogador no jogo atual', () => {
      jest.spyOn(game, 'resizePlayingGame');
      game.setPlayingGame();
      const teamA = game.playing!.teamA;
      teamA.removeNewestPlayer();
      game.updateTeams(teamA);
      expect(game.resizePlayingGame).toHaveBeenCalledWith(teamA);
    });

    it('updateTeams atualiza os times quando faltar jogador nas próximas', () => {
      jest.spyOn(game, 'resizeTeams');
      game.setPlayingGame();
      teams[2].removeNewestPlayer();
      game.updateTeams(teams[2]);
      expect(game.resizeTeams).toHaveBeenCalledWith(teams[2]);
    });

    it('removeFromGame deverá remover um jogador da pelada', () => {
      game.setPlayingGame();
      const player = game.players[2];
      const team = game.players[2].currentTeam!;
      jest.spyOn(game, 'updateTeams');
      game.removeFromGame(player);
      expect(game.updateTeams).toHaveBeenCalledWith(team);
      expect(team.hasPlayer(player)).toBe(false);
      expect(player.situation).toBe(PlayerSituation.STOPPED);
    });

    it('switchPlayerFromTeam deverá trocar 2 jogadores', () => {
      game.setPlayingGame();
      const player1 = game.players[2];
      const team1 = player1.currentTeam!;
      const player2 = game.players[6];
      const team2 = player2.currentTeam!;
      game.switchPlayerFromTeam(player1, player2);
      expect(team1.hasPlayer(player1)).toBe(false);
      expect(team1.hasPlayer(player2)).toBe(true);
      expect(team2.hasPlayer(player2)).toBe(false);
      expect(team2.hasPlayer(player1)).toBe(true);
    });
  });

  describe('Quando for controlar a partida atual', () => {
    let game: GameManager;
    let players: Player[];
    let teams: Team[];
    let rules: Rules;
    beforeEach(() => {
      rules = new Rules({
        playersPerTeam: 2,
        choosingTeams: ChoosingTeams.BY_ORDER,
      });
      game = new GameManager('Futebol de quarta', rules);
      players = game.setPlayers([
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
      teams = game.createTeams();
      game.setPlayingGame();
    });

    it('deve iniciar o temporizador quando start() é chamado', () => {
      jest.spyOn(game, 'start');
      game.start();
      expect(game.timer).toBeDefined();
      expect(game.timer!.status).toBe(TimerStatus.STARTED);
    });

    it('deve pausar o temporizador quando pause() é chamado', () => {
      game.start();
      game.pause();
      expect(game.timer!.status).toBe(TimerStatus.PAUSED);
    });

    it('deve continuar o temporizador quando continue() é chamado', () => {
      game.start();
      game.pause();
      game.continue();
      expect(game.timer!.status).toBe(TimerStatus.STARTED);
    });

    it('deve adicionar um gol quando addGoal() é chamado', () => {
      game.start();
      jest.spyOn(game.timer!, 'getTime');
      const team = game.playing!.teamA;
      const playerGoal = team.players[0];
      game.addGoal(team, playerGoal);
      expect(team.goals.length).toBe(1);
      expect(playerGoal.goals.length).toBe(1);
      expect(playerGoal.goals[0]).toEqual(team.goals[0]);
    });

    it('deve definir o resultado quando setResult() é chamado', (done) => {
      rules.timeMatch = '00:00:01';
      game.start();
      const team = game.playing!.teamA;
      const playerGoal = team.players[0];
      game.addGoal(team, playerGoal);
      setTimeout(() => {
        game.setResult();
        expect(game.playing!.result).toBe(ResultMatch.VICTORY);
        expect(game.playing!.winner).toBe(team);
        done();
      }, 2000);
    });
  });

  describe('Quando remover um jogador da pelada', () => {
    it('deverá remover jogador sem time e decrementar playersWithoutTeam', () => {
      const game = new GameManager('Pelada', new Rules());
      const ana = game.addPlayer('Ana');
      game.addPlayer('Bia');
      game.removePlayer(ana);
      expect(game.players).toHaveLength(1);
      expect(game.players[0].name).toBe('Bia');
      expect(game.playersWithoutTeam).toBe(1);
    });

    it('deverá tirar o jogador do time antes de remover da pelada', () => {
      const game = new GameManager('Pelada', new Rules({ playersPerTeam: 2 }));
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      game.createTeams();
      const ana = game.players.find((p) => p.name === 'Ana')!;
      const time = ana.currentTeam!;
      game.removePlayer(ana);
      expect(game.players).toHaveLength(3);
      expect(time.hasPlayer(ana)).toBe(false);
      expect(ana.situation).toBe(PlayerSituation.STOPPED);
    });

    it('deverá lançar erro ao tentar remover jogador inexistente', () => {
      const game = new GameManager('Pelada', new Rules());
      const fantasma = new Player('Fantasma');
      expect(() => game.removePlayer(fantasma)).toThrowError(
        'Jogador não está na pelada.',
      );
    });
  });

  describe('Quando renomear um jogador da pelada', () => {
    it('deverá renomear o jogador via Player.rename', () => {
      const game = new GameManager('Pelada', new Rules());
      const player = game.addPlayer('Antigo');
      game.renamePlayer(player, 'Novo');
      expect(player.name).toBe('Novo');
    });

    it('deverá lançar erro ao renomear jogador que não está na pelada', () => {
      const game = new GameManager('Pelada', new Rules());
      const fantasma = new Player('Fantasma');
      expect(() => game.renamePlayer(fantasma, 'Algo')).toThrowError(
        'Jogador não está na pelada.',
      );
    });

    it('deverá lançar erro ao renomear para nome já usado por outro jogador', () => {
      const game = new GameManager('Pelada', new Rules());
      game.addPlayer('Ana');
      const bia = game.addPlayer('Bia');
      expect(() => game.renamePlayer(bia, 'Ana')).toThrowError(
        'Já existe jogador chamado "Ana" na pelada.',
      );
    });

    it('deverá tratar duplicata na renomeação ignorando caixa e espaços', () => {
      const game = new GameManager('Pelada', new Rules());
      game.addPlayer('Ana');
      const bia = game.addPlayer('Bia');
      expect(() => game.renamePlayer(bia, '  ana  ')).toThrowError(
        'Já existe jogador chamado "ana" na pelada.',
      );
    });

    it('deverá permitir renomear para o mesmo nome (no-op de duplicata)', () => {
      const game = new GameManager('Pelada', new Rules());
      const ana = game.addPlayer('Ana');
      expect(() => game.renamePlayer(ana, 'Ana')).not.toThrow();
    });
  });

  describe('Quando adicionar um jogador (addPlayer)', () => {
    it('deverá fazer trim do nome antes de criar', () => {
      const game = new GameManager('Pelada', new Rules());
      const p = game.addPlayer('   Pedro   ');
      expect(p.name).toBe('Pedro');
    });

    it('deverá lançar erro quando o nome é vazio', () => {
      const game = new GameManager('Pelada', new Rules());
      expect(() => game.addPlayer('')).toThrowError(
        'Nome do jogador não pode ser vazio.',
      );
    });

    it('deverá lançar erro quando o nome só tem espaços', () => {
      const game = new GameManager('Pelada', new Rules());
      expect(() => game.addPlayer('    ')).toThrowError(
        'Nome do jogador não pode ser vazio.',
      );
    });

    it('deverá lançar erro ao adicionar jogador com nome já existente', () => {
      const game = new GameManager('Pelada', new Rules());
      game.addPlayer('Ana');
      expect(() => game.addPlayer('Ana')).toThrowError(
        'Já existe jogador chamado "Ana" na pelada.',
      );
    });

    it('deverá considerar duplicata ignorando caixa e espaços', () => {
      const game = new GameManager('Pelada', new Rules());
      game.addPlayer('Ana');
      expect(() => game.addPlayer('  ANA  ')).toThrowError(
        'Já existe jogador chamado "ANA" na pelada.',
      );
    });
  });

  describe('Quando adicionar vários jogadores em lote (addPlayers)', () => {
    it('deverá acrescentar todos os nomes válidos sem resetar a lista', () => {
      const game = new GameManager('Pelada', new Rules());
      game.addPlayer('Ana');
      const criados = game.addPlayers(['Bia', 'Caio', 'Davi']);
      expect(criados).toHaveLength(3);
      expect(game.players.map((p) => p.name)).toEqual([
        'Ana',
        'Bia',
        'Caio',
        'Davi',
      ]);
      expect(game.playersWithoutTeam).toBe(4);
    });

    it('deverá ignorar nomes vazios e duplicatas sem lançar erro', () => {
      const game = new GameManager('Pelada', new Rules());
      game.addPlayer('Ana');
      const criados = game.addPlayers([
        '',
        '   ',
        'Bia',
        'Ana',
        'bia',
        '  Caio  ',
      ]);
      expect(criados.map((p) => p.name)).toEqual(['Bia', 'Caio']);
      expect(game.players.map((p) => p.name)).toEqual(['Ana', 'Bia', 'Caio']);
    });

    it('deverá retornar lista vazia quando nada é criado', () => {
      const game = new GameManager('Pelada', new Rules());
      game.addPlayer('Ana');
      const criados = game.addPlayers(['', 'Ana', '   ']);
      expect(criados).toEqual([]);
      expect(game.players).toHaveLength(1);
    });
  });

  describe('Quando mover um time para o fim da fila', () => {
    function peladaComTimes(): GameManager {
      const game = new GameManager(
        'Pelada',
        new Rules({ playersPerTeam: 2, choosingTeams: ChoosingTeams.BY_ORDER }),
      );
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi', 'Edu', 'Fê']);
      game.createTeams();
      return game;
    }

    it('deverá reposicionar o time mantendo os jogadores', () => {
      const game = peladaComTimes();
      const time1 = game.next[0];
      const playersAntes = [...time1.players];
      game.moverTimeParaFim(time1);
      expect(game.next.indexOf(time1)).toBe(game.next.length - 1);
      expect(time1.players).toEqual(playersAntes);
    });

    it('deverá ser no-op se o time já é o último', () => {
      const game = peladaComTimes();
      const ultimo = game.next[game.next.length - 1];
      const ordemAntes = [...game.next];
      game.moverTimeParaFim(ultimo);
      expect(game.next).toEqual(ordemAntes);
    });

    it('deverá lançar erro se o time não está na fila', () => {
      const game = peladaComTimes();
      const fantasma = new Team(2);
      expect(() => game.moverTimeParaFim(fantasma)).toThrowError(
        'Time não está na fila.',
      );
    });

    it('deverá lançar erro ao mover time em partida em andamento', () => {
      const game = peladaComTimes();
      game.setPlayingGame();
      const emPartida = [...game.playing!.teams][0];
      expect(() => game.moverTimeParaFim(emPartida)).toThrowError(
        'Não é possível mover time que está em partida em andamento.',
      );
    });
  });

  describe('Quando esvaziar um time', () => {
    function peladaComTimes(): GameManager {
      const game = new GameManager(
        'Pelada',
        new Rules({ playersPerTeam: 2, choosingTeams: ChoosingTeams.BY_ORDER }),
      );
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      game.createTeams();
      return game;
    }

    it('deverá remover o time da fila', () => {
      const game = peladaComTimes();
      const tamanhoAntes = game.next.length;
      const time = game.next[0];
      game.esvaziarTime(time);
      expect(game.next).toHaveLength(tamanhoAntes - 1);
      expect(game.next.includes(time)).toBe(false);
    });

    it('deverá devolver os jogadores para a situação sem time', () => {
      const game = peladaComTimes();
      const time = game.next[0];
      const jogadoresDoTime = [...time.players];
      game.esvaziarTime(time);
      jogadoresDoTime.forEach((p) => {
        expect(p.currentTeam).toBeUndefined();
        expect(p.situation).toBe(PlayerSituation.NO_TEAM);
      });
    });

    it('deverá incrementar playersWithoutTeam pelos jogadores liberados', () => {
      const game = peladaComTimes();
      const time = game.next[0];
      const liberados = time.players.length;
      const antes = game.playersWithoutTeam;
      game.esvaziarTime(time);
      expect(game.playersWithoutTeam).toBe(antes + liberados);
    });

    it('deverá zerar advantageToNext se o time esvaziado tinha vantagem', () => {
      const game = peladaComTimes();
      const time = game.next[0];
      game.advantageToNext = time;
      game.esvaziarTime(time);
      expect(game.advantageToNext).toBeUndefined();
    });

    it('deverá lançar erro se o time não está na fila', () => {
      const game = peladaComTimes();
      const fantasma = new Team(2);
      expect(() => game.esvaziarTime(fantasma)).toThrowError(
        'Time não está na fila.',
      );
    });

    it('deverá lançar erro ao esvaziar time em partida em andamento', () => {
      const game = peladaComTimes();
      game.setPlayingGame();
      const emPartida = [...game.playing!.teams][0];
      expect(() => game.esvaziarTime(emPartida)).toThrowError(
        'Não é possível esvaziar time que está em partida em andamento.',
      );
    });
  });

  describe('Quando bloquear remoção em partida ativa', () => {
    it('deverá lançar erro ao remover jogador de time que está em partida', () => {
      const game = new GameManager('Pelada', new Rules({ playersPerTeam: 2 }));
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      game.createTeams();
      game.setPlayingGame();
      const playingPlayer = [...game.playing!.teams]
        .flatMap((t) => t.players)[0];
      expect(() => game.removePlayer(playingPlayer)).toThrowError(
        'Não é possível remover jogador que está em partida em andamento.',
      );
    });

    it('deverá permitir remover jogador que NÃO está na partida atual', () => {
      const game = new GameManager('Pelada', new Rules({ playersPerTeam: 2 }));
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi', 'Edu', 'Fê']);
      game.createTeams();
      game.setPlayingGame();
      const semPartida = game.players.find(
        (p) => p.currentTeam && !game.playing!.teams.has(p.currentTeam),
      )!;
      expect(() => game.removePlayer(semPartida)).not.toThrow();
    });
  });

  describe('Quando resetar os times', () => {
    let game: GameManager;
    beforeEach(() => {
      game = new GameManager('Pelada', new Rules({ playersPerTeam: 2 }));
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      game.createTeams();
    });

    it('deverá esvaziar a fila de próximos', () => {
      game.resetTimes();
      expect(game.next).toHaveLength(0);
    });

    it('deverá zerar advantageToNext', () => {
      game.advantageToNext = game.players[0].currentTeam!;
      game.resetTimes();
      expect(game.advantageToNext).toBeUndefined();
    });

    it('deverá deixar todos os jogadores sem time e sem situação ACTIVE', () => {
      game.resetTimes();
      game.players.forEach((p) => {
        expect(p.currentTeam).toBeUndefined();
        expect(p.situation).toBe(PlayerSituation.NO_TEAM);
      });
      expect(game.playersWithoutTeam).toBe(4);
    });

    it('deverá permitir createTeams novamente após reset', () => {
      game.resetTimes();
      expect(() => game.createTeams()).not.toThrow();
      expect(game.next.length).toBeGreaterThan(0);
    });

    it('deverá lançar erro se houver partida em andamento', () => {
      game.setPlayingGame();
      expect(() => game.resetTimes()).toThrowError(
        'Não é possível resetar times com partida em andamento.',
      );
    });
  });

  describe('Quando atualizar as regras da pelada', () => {
    function pelada(): GameManager {
      return new GameManager('Pelada', new Rules({ playersPerTeam: 2 }));
    }

    it('deverá atualizar apenas os campos informados', () => {
      const game = pelada();
      game.atualizarRegras({ goalLimit: 5, name: 'Champions' });
      expect(game.rules.goalLimit).toBe(5);
      expect(game.rules.name).toBe('Champions');
      expect(game.rules.playersPerTeam).toBe(2);
    });

    it('deverá preservar o id das regras ao atualizar', () => {
      const game = pelada();
      const idAntes = game.rules.id;
      game.atualizarRegras({ goalLimit: 3 });
      expect(game.rules.id).toBe(idAntes);
    });

    it('deverá validar o novo valor via Rules (faixa)', () => {
      const game = pelada();
      expect(() => game.atualizarRegras({ playersPerTeam: 0 })).toThrowError(
        'Limite mínimo de jogadores por time é 1.',
      );
    });

    it('deverá lançar erro ao mudar playersPerTeam com times montados', () => {
      const game = pelada();
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      game.createTeams();
      expect(() => game.atualizarRegras({ playersPerTeam: 3 })).toThrowError(
        /Não é possível mudar jogadores por time/,
      );
    });

    it('deverá lançar erro ao mudar choosingTeams com times montados', () => {
      const game = pelada();
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      game.createTeams();
      expect(() =>
        game.atualizarRegras({ choosingTeams: ChoosingTeams.BY_MIXING_TEAMS }),
      ).toThrowError(/modo de sorteio/);
    });

    it('deverá permitir alterar timeMatch e goalLimit a qualquer momento', () => {
      const game = pelada();
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      game.createTeams();
      game.setPlayingGame();
      game.atualizarRegras({ timeMatch: '00:05:00', goalLimit: 10 });
      expect(game.rules.timeMatch).toBe('00:05:00');
      expect(game.rules.goalLimit).toBe(10);
    });
  });

  describe('Ciclo de vida da pelada', () => {
    it('nasce com status CREATED e createdAt populado', () => {
      const antes = Date.now();
      const game = new GameManager('Pelada', new Rules());
      const depois = Date.now();
      expect(game.status).toBe(PeladaStatus.CREATED);
      expect(game.createdAt).toBeGreaterThanOrEqual(antes);
      expect(game.createdAt).toBeLessThanOrEqual(depois);
      expect(game.startedAt).toBeUndefined();
      expect(game.endedAt).toBeUndefined();
    });

    it('aceita timestamps no construtor (para reidratação)', () => {
      const game = new GameManager('Pelada', new Rules(), {
        status: PeladaStatus.ATIVA,
        createdAt: 123,
        startedAt: 456,
      });
      expect(game.status).toBe(PeladaStatus.ATIVA);
      expect(game.createdAt).toBe(123);
      expect(game.startedAt).toBe(456);
    });

    it('iniciar() transiciona CREATED → ATIVA e marca startedAt', () => {
      const game = new GameManager('Pelada', new Rules());
      game.iniciar();
      expect(game.status).toBe(PeladaStatus.ATIVA);
      expect(game.startedAt).toBeDefined();
    });

    it('iniciar() falha quando já está ATIVA', () => {
      const game = new GameManager('Pelada', new Rules());
      game.iniciar();
      expect(() => game.iniciar()).toThrowError('Pelada já foi iniciada.');
    });

    it('finalizar() transiciona ATIVA → FINALIZADA e marca endedAt', () => {
      const game = new GameManager('Pelada', new Rules());
      game.iniciar();
      game.finalizar();
      expect(game.status).toBe(PeladaStatus.FINALIZADA);
      expect(game.endedAt).toBeDefined();
    });

    it('finalizar() falha se houver partida em andamento', () => {
      const game = new GameManager('Pelada', new Rules({ playersPerTeam: 2 }));
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      game.createTeams();
      game.iniciar();
      game.setPlayingGame();
      expect(() => game.finalizar()).toThrowError(
        /partida em andamento/,
      );
    });

    it('finalizar() é idempotência-protegido', () => {
      const game = new GameManager('Pelada', new Rules());
      game.iniciar();
      game.finalizar();
      expect(() => game.finalizar()).toThrowError('Pelada já foi finalizada.');
    });
  });

  describe('Quando limpar jogadores e times', () => {
    it('esvazia jogadores, fila e jogadores-sem-time preservando regras e nome', () => {
      const game = new GameManager('Sábado', new Rules({ playersPerTeam: 2 }));
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      game.createTeams();
      game.limparJogadoresETimes();
      expect(game.players).toHaveLength(0);
      expect(game.next).toHaveLength(0);
      expect(game.playersWithoutTeam).toBe(0);
      expect(game.advantageToNext).toBeUndefined();
      expect(game.name).toBe('Sábado');
      expect(game.rules.playersPerTeam).toBe(2);
    });

    it('preserva o histórico de partidas', () => {
      const game = new GameManager('Pelada', new Rules({ playersPerTeam: 2 }));
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      game.createTeams();
      game.setPlayingGame();
      game.setResult();
      // Move playing para matches manualmente para simular fim de partida.
      game.matches.push(game.playing!);
      game.playing = undefined;
      game.limparJogadoresETimes();
      expect(game.matches).toHaveLength(1);
    });

    it('bloqueia limpeza com partida em andamento', () => {
      const game = new GameManager('Pelada', new Rules({ playersPerTeam: 2 }));
      game.setPlayers(['Ana', 'Bia', 'Caio', 'Davi']);
      game.createTeams();
      game.setPlayingGame();
      expect(() => game.limparJogadoresETimes()).toThrowError(
        /partida em andamento/,
      );
    });
  });
});
