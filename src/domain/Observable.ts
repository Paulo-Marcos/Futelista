/**
 * Observable — mecanismo puro de "external store" do React.
 *
 * Encapsula a reatividade (subscribe + version snapshot) usada com
 * useSyncExternalStore, separada das regras de negócio que a consomem.
 *
 * Semântica:
 *  - `version` é um número monotônico que começa em 0 e cresce a cada
 *    `notify()`; serve como snapshot estável para useSyncExternalStore.
 *  - `subscribe(listener)` registra um listener e devolve o unsubscribe.
 *  - `notify()` incrementa a versão e dispara todos os listeners.
 */
export class Observable {
  private _version = 0;
  private listeners = new Set<() => void>();

  /** Número monotônico incrementado a cada notify(); usado como snapshot. */
  get version(): number {
    return this._version;
  }

  /** Registra um listener; retorna função de unsubscribe. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Incrementa a versão e dispara todos os listeners registrados. */
  notify(): void {
    this._version++;
    this.listeners.forEach((listener) => listener());
  }
}
