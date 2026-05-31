import { ScreenTime } from './ScreenTime';

describe('Teste da classe ScreenTime', () => {
  it('Deverá criar uma ScreenTime', () => {
    const screenTime = new ScreenTime(1, 56);
    expect(screenTime).toBeDefined();
  });
  it('Deverá Lançar erro se timeStroke for inválido ', () => {
    expect(() => new ScreenTime(1, -56)).toThrowError('Tempo inválido');
  });
});
