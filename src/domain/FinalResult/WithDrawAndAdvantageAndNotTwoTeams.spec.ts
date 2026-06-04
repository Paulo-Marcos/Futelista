import { GestorJogo } from '../GestorJogo';
import { Match, ResultMatch } from '../Match';
import { Player } from '../Player';
import { ChoosingTeams, Rules } from '../Rules';
import { Team } from '../Team';
import { BaseFinalResultHandler, HandleInput } from './FinalResult.handler';
import { WithDrawAndAdvantageAndNotTwoTeams } from './WithDrawAndAdvantageAndNotTwoTeams';

describe('WithDrawAndAdvantageAndNotTwoTeams', () => {
  let withDraw: WithDrawAndAdvantageAndNotTwoTeams;
  let jogo: GestorJogo;
  let players: Player[];
  let teams: Team[];
  let rules: Rules;
  beforeEach(() => {
    withDraw = new WithDrawAndAdvantageAndNotTwoTeams();
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
      'otavio',
    ]);
    teams = jogo.createTeams();
    jogo.setPlayingGame();
  });

  it('deve realocar os dois times, considerando a vantagem', () => {
    jogo.playing!.result = ResultMatch.DRAW;
    const teamA = jogo.playing!.teamA;
    const teamB = jogo.playing!.teamB;
    jogo.advantageToNext = teamB;
    const nextTeam = jogo.getNthNext(1);
    const input: HandleInput = { jogo };
    jest.spyOn(jogo, 'relocateTeam');
    withDraw.handle(input);
    expect(jogo.relocateTeam).toHaveBeenCalledWith(teamA);
    expect(jogo.playing).toEqual(expect.any(Match));
    expect(jogo.playing!.teamA).toEqual(teamB);
    expect(jogo.playing!.teamB).toEqual(nextTeam);
    expect(jogo.advantageToNext).toBe(teamB);
  });

  it('deve chamar super.handle quando o resultado do jogo não é um empate', () => {
    jogo.playing!.result = ResultMatch.VICTORY;
    const input: HandleInput = { jogo };
    const baseFinalResultHandlerSpy = jest.spyOn(BaseFinalResultHandler.prototype, 'handle');
    withDraw.handle(input);
    expect(baseFinalResultHandlerSpy).toHaveBeenCalledWith(input);
  });
});
