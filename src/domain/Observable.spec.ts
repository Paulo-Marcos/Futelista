import { Observable } from "./Observable";

describe("Observable — external store reativo", () => {
  it("version inicia em 0", () => {
    const store = new Observable();
    expect(store.version).toBe(0);
  });

  it("notify incrementa a version monotonicamente", () => {
    const store = new Observable();
    store.notify();
    expect(store.version).toBe(1);
    store.notify();
    expect(store.version).toBe(2);
  });

  it("subscribe registra um listener que é chamado em cada notify", () => {
    const store = new Observable();
    const listener = jest.fn();
    store.subscribe(listener);
    store.notify();
    store.notify();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("notify dispara todos os listeners registrados", () => {
    const store = new Observable();
    const listenerA = jest.fn();
    const listenerB = jest.fn();
    store.subscribe(listenerA);
    store.subscribe(listenerB);
    store.notify();
    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);
  });

  it("o unsubscribe devolvido remove o listener", () => {
    const store = new Observable();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.notify();
    expect(listener).not.toHaveBeenCalled();
  });

  it("unsubscribe de um listener não afeta os demais", () => {
    const store = new Observable();
    const mantido = jest.fn();
    const removido = jest.fn();
    store.subscribe(mantido);
    const unsubscribe = store.subscribe(removido);
    unsubscribe();
    store.notify();
    expect(mantido).toHaveBeenCalledTimes(1);
    expect(removido).not.toHaveBeenCalled();
  });
});
