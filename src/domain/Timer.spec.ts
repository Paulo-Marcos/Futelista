import { Timer } from './Timer';

describe('Teste do timer', () => {
  it('Deverá inicializar corretamente', () => {
    const timer = new Timer(2, 600);
    expect(timer.numberTimes).toBe(2);
    expect(timer.timeMatch).toBe(600);
    expect(timer.currentNumberTime).toBe(1);
    expect(timer.restTime).toBe(600);
  });
  it('Deverá gerar um screen time do tempo atual', () => {
    const timer = new Timer(2, 600);
    const screen = timer.getTime();
    expect(screen.stroke).toBe(1);
    expect(screen.timeStroke).toBe(0);
  });
  it('Deverá iniciar um temporizador', () => {
    const timer = new Timer(2, 2);
    expect(() => timer.start()).not.toThrow();
  });
  it('Deverá gerar erro se a quantidade de tempos restantes for zero', (done) => {
    const timer = new Timer(1, 1);
    expect(() => timer.start()).not.toThrow();
    setTimeout(() => {
      expect(() => timer.start()).toThrowError('Não há mais etapas');
      done();
    }, 3000);
  });
  it('Deverá não iniciar o timer se estiver pausado', (done) => {
    const timer = new Timer(2, 1);
    timer.pause();
    expect(() => timer.start()).not.toThrow();
    setTimeout(() => {
      const screen = timer.getTime();
      expect(screen.stroke).toBe(1);
      expect(screen.timeStroke).toBe(0);
      done();
    }, 2000);
  });
  it('Deverá continuar um jogo pausado', (done) => {
    const timer = new Timer(2, 1);
    timer.pause();
    timer.continue();
    setTimeout(() => {
      const screen = timer.getTime();
      expect(screen.stroke).toBe(2);
      expect(screen.timeStroke).toBe(0);
      done();
    }, 2000);
  });
});
