import { ChoosingTeams } from '../Rules';
import { CreateTeamFactory } from './CreateTeam.factory';
import { CreateTeamByOrder } from './CreateTeamByOrder';
import { CreateTeamMixed } from './CreateTeamMixed';
import { CreateTeamMixingTopTwoTeams } from './CreateTeamMixingTopTwoTeams';

describe('CreateTeamFactory', () => {
  it('deve criar instância correta para ChoosingTeams.BY_ORDER', () => {
    const createTeam = CreateTeamFactory.fabricate(ChoosingTeams.BY_ORDER);
    expect(createTeam instanceof CreateTeamByOrder).toBe(true);
  });

  it('deve criar instância correta para ChoosingTeams.BY_ORDER_MIXING_TOP_TWO_TEAMS', () => {
    const createTeam = CreateTeamFactory.fabricate(
      ChoosingTeams.BY_ORDER_MIXING_TOP_TWO_TEAMS,
    );
    expect(createTeam instanceof CreateTeamMixingTopTwoTeams).toBe(true);
  });

  it('deve criar instância correta para ChoosingTeams.BY_MIXING_TEAMS', () => {
    const createTeam = CreateTeamFactory.fabricate(ChoosingTeams.BY_MIXING_TEAMS);
    expect(createTeam instanceof CreateTeamMixed).toBe(true);
  });

  it('deve lançar um erro para ChoosingTeams não definida', () => {
    expect(() =>
      CreateTeamFactory.fabricate('TIPO_INVALIDO' as unknown as ChoosingTeams),
    ).toThrowError('Tipo de escolha de time não definida.');
  });
});
