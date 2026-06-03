import { GameManager } from '../GameManager';
import { Match, ResultMatch } from '../Match';
import { Player } from '../Player';
import { ChoosingTeams, Rules } from '../Rules';
import { Team } from '../Team';
import { BaseUpdateDrawHandler, HandleInput } from './FinalResult.handler';
import { WithVictory } from './WithVictory';

describe('WithVictory', () => {
  let withVictory: WithVictory;
  let game: GameManager;
  let players: Player[];
  let teams: Team[];
  let rules: Rules;
  beforeEach(() => {
    withVictory = new WithVictory();
    rules = new Rules({
      playersPerTeam: 2,
      choosingTeams: ChoosingTeams.BY_ORDER,
    });
    game = new GameManager('Futebol de quarta', rules);
    players = game.addPlayerList([
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

  it('deve realocar a equipe perdedora e iniciar um novo jogo ao lidar com uma vitória', () => {
    const teamA = game.playing!.teamA;
    const teamB = game.playing!.teamB;
    const nextTeam = game.getNthNext(1);
    game.playing!.result = ResultMatch.VICTORY;
    game.playing!.loser = teamA;
    game.playing!.winner = teamB;
    jest.spyOn(game, 'relocateTeam');
    const input: HandleInput = { game };
    withVictory.handle(input);
    expect(game.relocateTeam).toHaveBeenCalledWith(teamA);
    expect(game.playing).toEqual(expect.any(Match));
    expect(game.playing!.teamA).toEqual(teamB);
    expect(game.playing!.teamB).toEqual(nextTeam);
    expect(game.advantageToNext).toBe(teamB);
  });

  it('deve chamar super.handle quando o resultado do jogo não é uma vitória', () => {
    game.playing!.result = ResultMatch.DRAW;
    const input: HandleInput = { game };
    const baseUpdateDrawHandlerSpy = jest.spyOn(BaseUpdateDrawHandler.prototype, 'handle');
    withVictory.handle(input);
    expect(baseUpdateDrawHandlerSpy).toHaveBeenCalledWith(input);
  });
});
