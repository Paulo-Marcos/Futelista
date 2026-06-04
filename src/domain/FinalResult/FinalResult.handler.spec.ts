import { GestorJogo } from '../GestorJogo';
import { Rules } from '../Rules';
import {
  BaseFinalResultHandler,
  FinalResultHandler,
  HandleInput,
} from './FinalResult.handler';

class ConcreteFinalResultHandler extends BaseFinalResultHandler {}

describe('BaseFinalResultHandler', () => {
  let baseHandler: BaseFinalResultHandler;
  let nextHandler: FinalResultHandler;
  let input: HandleInput;

  beforeEach(() => {
    baseHandler = new ConcreteFinalResultHandler();
    nextHandler = { handle: jest.fn() } as unknown as FinalResultHandler;
    input = {
      game: new GestorJogo('teste', new Rules()),
    };
  });

  it('deve passar a solicitação para o próximo manipulador quando configurado', () => {
    baseHandler.setNextHandler(nextHandler);
    baseHandler.handle(input);
    expect(nextHandler.handle).toHaveBeenCalledWith(input);
  });

  it('não deve chamar o próximo manipulador se não estiver configurado', () => {
    const nextHandlerSpy = { handle: jest.fn() } as unknown as FinalResultHandler;
    baseHandler.handle(input);
    expect(nextHandlerSpy.handle).not.toHaveBeenCalled();
  });
});
