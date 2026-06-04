import { GestorJogo } from '../GestorJogo';
import { Match, ResultMatch } from '../Match';
import { Player } from '../Player';
import { ChoosingTeams, Rules } from '../Rules';
import { Team } from '../Team';
import { BaseFinalResultHandler, HandleInput } from './FinalResult.handler';
import { WithVictory } from './WithVictory';

describe('WithVictory', () => {
  let withVictory: WithVictory;
  let jogo: GestorJogo;
  let players: Player[];
  let teams: Team[];
  let rules: Rules;
  beforeEach(() => {
    withVictory = new WithVictory();
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

  it('deve realocar a equipe perdedora e iniciar um novo jogo ao lidar com uma vitória', () => {
    const teamA = jogo.playing!.teamA;
    const teamB = jogo.playing!.teamB;
    const nextTeam = jogo.getNthNext(1);
    jogo.playing!.result = ResultMatch.VICTORY;
    jogo.playing!.loser = teamA;
    jogo.playing!.winner = teamB;
    jest.spyOn(jogo, 'relocateTeam');
    const input: HandleInput = { jogo };
    withVictory.handle(input);
    expect(jogo.relocateTeam).toHaveBeenCalledWith(teamA);
    expect(jogo.playing).toEqual(expect.any(Match));
    expect(jogo.playing!.teamA).toEqual(teamB);
    expect(jogo.playing!.teamB).toEqual(nextTeam);
    expect(jogo.advantageToNext).toBe(teamB);
  });

  it('deve chamar super.handle quando o resultado do jogo não é uma vitória', () => {
    jogo.playing!.result = ResultMatch.DRAW;
    const input: HandleInput = { jogo };
    const baseFinalResultHandlerSpy = jest.spyOn(BaseFinalResultHandler.prototype, 'handle');
    withVictory.handle(input);
    expect(baseFinalResultHandlerSpy).toHaveBeenCalledWith(input);
  });
});
