import { GameManager } from '../GameManager';
import { Match, ResultMatch } from '../Match';
import { Player } from '../Player';
import { ChoosingTeams, Rules } from '../Rules';
import { Team } from '../Team';
import { BaseUpdateDrawHandler, HandleInput } from './FinalResult.handler';
import { WithDrawAndExternalAdvantageAndTwoTeams } from './WithDrawAndExternalAdvantageAndTwoTeams';

describe('WithDrawAndExternalAdvantageAndTwoTeams', () => {
  let withDraw: WithDrawAndExternalAdvantageAndTwoTeams;
  let game: GameManager;
  let players: Player[];
  let teams: Team[];
  let rules: Rules;
  beforeEach(() => {
    withDraw = new WithDrawAndExternalAdvantageAndTwoTeams();
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
      'otavio',
      'mesquita',
    ]);
    teams = game.createTeams();
    game.setPlayingGame();
  });

  it('deve realocar a equipe perdedora considerando uma vantagem externa e iniciar um novo jogo ao lidar com uma vitória', () => {
    game.advantageToNext = undefined;
    game.playing!.result = ResultMatch.DRAW;
    const teamA = game.playing!.teamA;
    const teamB = game.playing!.teamB;
    const nextTeam = game.getNthNext(1);
    const nextTeam2 = game.getNthNext(2);
    const input: HandleInput = { game, externalAdvantage: teamA };
    jest.spyOn(game, 'relocateTeam');
    withDraw.handle(input);
    expect(game.relocateTeam).toHaveBeenCalledWith(teamA);
    expect(game.relocateTeam).toHaveBeenCalledWith(teamB);
    expect(game.playing).toEqual(expect.any(Match));
    expect(game.playing!.teamA).toEqual(nextTeam);
    expect(game.playing!.teamB).toEqual(nextTeam2);
    expect(game.advantageToNext).toBeUndefined();
  });

  it('deve chamar super.handle quando o resultado do jogo não é um empate', () => {
    game.playing!.result = ResultMatch.VICTORY;
    const input: HandleInput = { game };
    const baseUpdateDrawHandlerSpy = jest.spyOn(BaseUpdateDrawHandler.prototype, 'handle');
    withDraw.handle(input);
    expect(baseUpdateDrawHandlerSpy).toHaveBeenCalledWith(input);
  });
});
