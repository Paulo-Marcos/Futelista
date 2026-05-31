import { GameManager } from '../GameManager';
import { Rules } from '../Rules';
import {
  BaseUpdateDrawHandler,
  UpdateDrawHandler,
  HandleInput,
} from './UpdateDraw.handler';

class ConcreteUpdateDrawHandler extends BaseUpdateDrawHandler {}

describe('BaseUpdateDrawHandler', () => {
  let baseHandler: BaseUpdateDrawHandler;
  let nextHandler: UpdateDrawHandler;
  let input: HandleInput;

  beforeEach(() => {
    baseHandler = new ConcreteUpdateDrawHandler();
    nextHandler = { handle: jest.fn() } as unknown as UpdateDrawHandler;
    input = {
      game: new GameManager('teste', new Rules()),
    };
  });

  it('deve passar a solicitação para o próximo manipulador quando configurado', () => {
    baseHandler.setNextHandler(nextHandler);
    baseHandler.handle(input);
    expect(nextHandler.handle).toHaveBeenCalledWith(input);
  });

  it('não deve chamar o próximo manipulador se não estiver configurado', () => {
    const nextHandlerSpy = { handle: jest.fn() } as unknown as UpdateDrawHandler;
    baseHandler.handle(input);
    expect(nextHandlerSpy.handle).not.toHaveBeenCalled();
  });
});
