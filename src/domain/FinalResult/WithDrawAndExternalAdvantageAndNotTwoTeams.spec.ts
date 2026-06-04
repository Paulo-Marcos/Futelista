import { GestorJogo } from '../GestorJogo';
import { Match, ResultMatch } from '../Match';
import { Player } from '../Player';
import { ChoosingTeams, Rules } from '../Rules';
import { Team } from '../Team';
import { BaseFinalResultHandler, HandleInput } from './FinalResult.handler';
import { WithDrawAndExternalAdvantageAndNotTwoTeams } from './WithDrawAndExternalAdvantageAndNotTwoTeams';

describe('WithDrawAndExternalAdvantageAndNotTwoTeams', () => {
  let withDraw: WithDrawAndExternalAdvantageAndNotTwoTeams;
  let game: GestorJogo;
  let players: Player[];
  let teams: Team[];
  let rules: Rules;
  beforeEach(() => {
    withDraw = new WithDrawAndExternalAdvantageAndNotTwoTeams();
    rules = new Rules({
      playersPerTeam: 2,
      choosingTeams: ChoosingTeams.BY_ORDER,
    });
    game = new GestorJogo('Futebol de quarta', rules);
    players = game.setPlayers([
      'Paulo',
      'Marcos',
      'Rodrigues',
      'Oliveira',
      'Matos',
      'Peres',
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
    const input: HandleInput = { game, externalAdvantage: teamA };
    jest.spyOn(game, 'relocateTeam');
    withDraw.handle(input);
    expect(game.relocateTeam).toHaveBeenCalledWith(teamB);
    expect(game.playing).toEqual(expect.any(Match));
    expect(game.playing!.teamA).toEqual(teamA);
    expect(game.playing!.teamB).toEqual(nextTeam);
    expect(game.advantageToNext).toBeUndefined();
  });

  it('deve chamar super.handle quando o resultado do jogo não é um empate', () => {
    game.playing!.result = ResultMatch.VICTORY;
    const input: HandleInput = { game };
    const baseFinalResultHandlerSpy = jest.spyOn(BaseFinalResultHandler.prototype, 'handle');
    withDraw.handle(input);
    expect(baseFinalResultHandlerSpy).toHaveBeenCalledWith(input);
  });
});
