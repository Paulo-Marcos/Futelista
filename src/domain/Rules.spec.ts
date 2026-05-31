import { ChoosingTeams, Rules } from './Rules';

describe('Teste da classe Rules', () => {
  it('deverá criar as regras default', () => {
    const rules = new Rules();
    expect(rules.goalLimit).toBe(2);
    expect(rules.numberTimes).toBe(1);
    expect(rules.playersPerTeam).toBe(4);
    expect(rules.choosingTeams).toBe(ChoosingTeams.BY_ORDER);
    expect(rules.timeMatch).toBe('00:10:00');
  });
  it('deverá definir a quantidade de jogadores por time', () => {
    const rules = new Rules({
      playersPerTeam: 5,
    });
    expect(rules.playersPerTeam).toBe(5);
  });
  it('deverá gerar erro se a quantidade de jogadores for menor que um', () => {
    expect(() => new Rules({ playersPerTeam: 0 })).toThrowError(
      'Limite mínimo de jogadores por time é 1.',
    );
  });
  it('deverá definir o tempo da partida', () => {
    const rules = new Rules({ timeMatch: '00:05:00' });
    expect(rules.timeMatch).toBe('00:05:00');
  });
  it('deverá gerar erro se o tempo for menor que 30 segundos', () => {
    expect(() => new Rules({ timeMatch: '00:00:29' })).toThrowError(
      'Limite mínimo de tempo é 30 segundos.',
    );
  });
  it('deverá definir a quantidade de tempo por partida', () => {
    const rules = new Rules({ numberTimes: 2 });
    expect(rules.numberTimes).toBe(2);
  });
  it('deverá gerar erro se a quantidade de tempos for menor que 1', () => {
    expect(() => new Rules({ numberTimes: 0 })).toThrowError(
      'Limite mínimo de tempos é 1.',
    );
  });
  it('deverá definir o limite de gols', () => {
    const rules = new Rules({ goalLimit: 2 });
    expect(rules.goalLimit).toBe(2);
  });
  it('deverá gerar erro se o limite de gols for menor que 1', () => {
    expect(() => new Rules({ goalLimit: 0 })).toThrowError('Limite mínimo de gols é 1.');
  });
  it('deverá definir com será escolhido os primeiros times', () => {
    const rules = new Rules({
      choosingTeams: ChoosingTeams.BY_ORDER_MIXING_TOP_TWO_TEAMS,
    });
    expect(rules.choosingTeams).toBe(ChoosingTeams.BY_ORDER_MIXING_TOP_TWO_TEAMS);
  });
});
