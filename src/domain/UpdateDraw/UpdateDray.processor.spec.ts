import { GameManager } from '../GameManager';
import { Rules } from '../Rules';
import {
  UpdateDrawHandler,
  HandleInput,
  BaseUpdateDrawHandler,
} from './UpdateDraw.handler';
import { FinalResultProcessor } from './UpdateDray.processor';

class MockHandler extends BaseUpdateDrawHandler implements UpdateDrawHandler {
  override handle(input: HandleInput): void {
    super.handle(input);
  }
}

describe('FinalResultProcessor', () => {
  let finalResultProcessor: FinalResultProcessor;
  let input: HandleInput;

  beforeEach(() => {
    finalResultProcessor = new FinalResultProcessor();
    input = {
      game: new GameManager('teste', new Rules()),
    };
  });

  it('deve processar a solicitação usando a cadeia de manipuladores configurada', () => {
    const mockHandler1 = new MockHandler();
    const mockHandler2 = new MockHandler();
    const mockHandler3 = new MockHandler();
    const mockHandler4 = new MockHandler();

    jest.spyOn(mockHandler1, 'handle');
    jest.spyOn(mockHandler2, 'handle');
    jest.spyOn(mockHandler3, 'handle');
    jest.spyOn(mockHandler4, 'handle');

    finalResultProcessor['handlerChain'] = mockHandler1;
    mockHandler1
      .setNextHandler(mockHandler2)
      .setNextHandler(mockHandler3)
      .setNextHandler(mockHandler4);

    finalResultProcessor.process(input);
    expect(mockHandler1.handle).toHaveBeenCalledWith(input);
    expect(mockHandler2.handle).toHaveBeenCalledWith(input);
    expect(mockHandler3.handle).toHaveBeenCalledWith(input);
    expect(mockHandler4.handle).toHaveBeenCalledWith(input);
  });
});
