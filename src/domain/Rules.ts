import "react-native-get-random-values";
import * as uuid from "uuid";

export class Rules {
  playersPerTeam: number;
  timeMatch: string;
  numberTimes: number;
  goalLimit: number;
  choosingTeams: ChoosingTeams;
  name: string;
  readonly id: string;

  constructor(input?: DataRules) {
    this.id = input?.id ?? uuid.v4();
    this.name = input?.name ?? "Padrão";
    this.playersPerTeam = input?.playersPerTeam ?? 4;
    this.timeMatch = input?.timeMatch ?? "00:10:00";
    this.numberTimes = input?.numberTimes ?? 1;
    this.goalLimit = input?.goalLimit ?? 2;
    this.choosingTeams = input?.choosingTeams ?? ChoosingTeams.BY_ORDER;

    this.checkPlayersPerTeam(this.playersPerTeam);
    this.checkTimeMatch(this.timeMatch);
    this.checkNumberTimes(this.numberTimes);
    this.checkGoalLimit(this.goalLimit);
    this.checkChoosingTeams(this.choosingTeams);
  }

  checkPlayersPerTeam(playersPerTeam: number): void {
    if (playersPerTeam < 1)
      throw Error("Limite mínimo de jogadores por time é 1.");
  }
  checkTimeMatch(timeMatch: string): void {
    if (Rules.toSeconds(timeMatch) < 30)
      throw Error("Limite mínimo de tempo é 30 segundos.");
  }
  checkNumberTimes(numberTimes: number): void {
    if (numberTimes < 1) throw Error("Limite mínimo de tempos é 1.");
  }
  checkGoalLimit(goalLimit: number): void {
    if (goalLimit < 1) throw Error("Limite mínimo de gols é 1.");
  }
  checkChoosingTeams(choosingTeams: any): void {
    if (!Object.values(ChoosingTeams).includes(choosingTeams))
      throw Error("Tipo de escolha inválida");
  }
  getDurationMatch(): number {
    return Rules.toSeconds(this.timeMatch);
  }

  static toSeconds(timeString: string): number {
    if (timeString === "") timeString = "00:00:00";
    const parts = timeString.split(":");
    const hoursInSeconds = parseInt(parts[0]) * 3600;
    const minutesInSeconds = parseInt(parts[1]) * 60;
    const seconds = parseInt(parts[2]);
    return hoursInSeconds + minutesInSeconds + seconds;
  }
}

export enum ChoosingTeams {
  BY_ORDER,
  BY_ORDER_MIXING_TOP_TWO_TEAMS,
  BY_MIXING_TEAMS,
}

export type DataRules = {
  playersPerTeam?: number;
  timeMatch?: string;
  numberTimes?: number;
  goalLimit?: number;
  choosingTeams?: ChoosingTeams;
  id?: string;
  name?: string;
};
