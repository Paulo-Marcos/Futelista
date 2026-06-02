/**
 * Carimbo de tempo de um evento (tipicamente um gol) dentro da partida.
 *
 *  - `stroke`:     número do tempo (1, 2, ...) — útil em partidas com mais de 1 tempo.
 *  - `timeStroke`: segundos transcorridos dentro daquele tempo.
 *
 * Imutável. Construtor valida `timeStroke` (inteiro >= 0) — `stroke` não é
 * validado pois o caller (Timer) controla esse incremento.
 */
export class ScreenTime {
  constructor(
    readonly stroke: number,
    readonly timeStroke: number,
  ) {
    this.checkTimeStroke(timeStroke);
  }

  checkTimeStroke(timeStroke: number): void {
    if (!Number.isInteger(timeStroke) || timeStroke < 0) {
      throw Error("Tempo inválido");
    }
  }
}
