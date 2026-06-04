import { GestorJogo } from '../GestorJogo';
import { Match, ResultMatch } from '../Match';
import { Player } from '../Player';
import { ChoosingTeams, Rules } from '../Rules';
import { Team } from '../Team';
import { BaseFinalResultHandler, HandleInput } from './FinalResult.handler';
import { WithDrawAndExternalAdvantageAndNotTwoTeams } from './WithDrawAndExternalAdvantageAndNotTwoTeams';

describe('WithDrawAndExternalAdvantageAndNotTwoTeams', () => {
  let withDraw: WithDrawAndExternalAdvantageAndNotTwoTeams;
  let jogo: GestorJogo;
  let players: Player[];
  let teams: Team[];
  let rules: Rules;
  beforeEach(() => {
    withDraw = new WithDrawAndExternalAdvantageAndNotTwoTeams();
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
    ]);
    teams = jogo.createTeams();
    jogo.setPlayingGame();
  });

  it('deve realocar a equipe perdedora considerando uma vantagem externa e iniciar um novo jogo ao lidar com uma vitória', () => {
    jogo.advantageToNext = undefined;
    jogo.playing!.result = ResultMatch.DRAW;
    const teamA = jogo.playing!.teamA;
    const teamB = jogo.playing!.teamB;
    const nextTeam = jogo.getNthNext(1);
    const input: HandleInput = { jogo, externalAdvantage: teamA };
    jest.spyOn(jogo, 'relocateTeam');
    withDraw.handle(input);
    expect(jogo.relocateTeam).toHaveBeenCalledWith(teamB);
    expect(jogo.playing).toEqual(expect.any(Match));
    expect(jogo.playing!.teamA).toEqual(teamA);
    expect(jogo.playing!.teamB).toEqual(nextTeam);
    expect(jogo.advantageToNext).toBeUndefined();
  });

  it('deve chamar super.handle quando o resultado do jogo não é um empate', () => {
    jogo.playing!.result = ResultMatch.VICTORY;
    const input: HandleInput = { jogo };
    const baseFinalResultHandlerSpy = jest.spyOn(BaseFinalResultHandler.prototype, 'handle');
    withDraw.handle(input);
    expect(baseFinalResultHandlerSpy).toHaveBeenCalledWith(input);
  });
});
