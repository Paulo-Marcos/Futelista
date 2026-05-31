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
