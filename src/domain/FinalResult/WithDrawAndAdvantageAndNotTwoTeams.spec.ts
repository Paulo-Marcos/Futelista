import { GestorJogo } from '../GestorJogo';
import { Match, ResultMatch } from '../Match';
import { Player } from '../Player';
import { ChoosingTeams, Rules } from '../Rules';
import { Team } from '../Team';
import { BaseFinalResultHandler, HandleInput } from './FinalResult.handler';
import { WithDrawAndAdvantageAndNotTwoTeams } from './WithDrawAndAdvantageAndNotTwoTeams';

describe('WithDrawAndAdvantageAndNotTwoTeams', () => {
  let withDraw: WithDrawAndAdvantageAndNotTwoTeams;
  let game: GestorJogo;
  let players: Player[];
  let teams: Team[];
  let rules: Rules;
  beforeEach(() => {
    withDraw = new WithDrawAndAdvantageAndNotTwoTeams();
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
      'otavio',
    ]);
    teams = game.createTeams();
    game.setPlayingGame();
  });

  it('deve realocar os dois times, considerando a vantagem', () => {
    game.playing!.result = ResultMatch.DRAW;
    const teamA = game.playing!.teamA;
    const teamB = game.playing!.teamB;
    game.advantageToNext = teamB;
    const nextTeam = game.getNthNext(1);
    const input: HandleInput = { game };
    jest.spyOn(game, 'relocateTeam');
    withDraw.handle(input);
    expect(game.relocateTeam).toHaveBeenCalledWith(teamA);
    expect(game.playing).toEqual(expect.any(Match));
    expect(game.playing!.teamA).toEqual(teamB);
    expect(game.playing!.teamB).toEqual(nextTeam);
    expect(game.advantageToNext).toBe(teamB);
  });

  it('deve chamar super.handle quando o resultado do jogo não é um empate', () => {
    game.playing!.result = ResultMatch.VICTORY;
    const input: HandleInput = { game };
    const baseFinalResultHandlerSpy = jest.spyOn(BaseFinalResultHandler.prototype, 'handle');
    withDraw.handle(input);
    expect(baseFinalResultHandlerSpy).toHaveBeenCalledWith(input);
  });
});
