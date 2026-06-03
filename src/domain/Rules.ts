import "react-native-get-random-values";
import * as uuid from "uuid";

/**
 * Política de uma pelada — número de jogadores por time, duração da partida,
 * número de tempos, limite de gols e modo de escolha dos times.
 *
 * Imutável por convenção: para "mudar" regras, sempre construa uma nova
 * instância (ex.: `GameManager.atualizarRegras` e `Pelada.atualizarRegras`).
 * Por valor — não há relação cíclica com outras entidades.
 *
 * Defaults em `RULES_DEFAULTS`. Validações por campo nos métodos `check*`.
 */
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
    this.name = input?.name ?? RULES_DEFAULTS.name;
    this.playersPerTeam = input?.playersPerTeam ?? RULES_DEFAULTS.playersPerTeam;
    this.timeMatch = input?.timeMatch ?? RULES_DEFAULTS.timeMatch;
    this.numberTimes = input?.numberTimes ?? RULES_DEFAULTS.numberTimes;
    this.goalLimit = input?.goalLimit ?? RULES_DEFAULTS.goalLimit;
    this.choosingTeams = input?.choosingTeams ?? RULES_DEFAULTS.choosingTeams;

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

  /**
   * Retorna o conteúdo da regra como objeto puro (sem id).
   *
   * "Por valor": o caller pode clonar/passar adiante sem arrastar a
   * identidade. Para persistir mantendo o id, combine com `rules.id`
   * no chamador (ver `serializer.ts`).
   */
  toData(): Omit<RulesData, "id"> {
    return {
      name: this.name,
      playersPerTeam: this.playersPerTeam,
      timeMatch: this.timeMatch,
      numberTimes: this.numberTimes,
      goalLimit: this.goalLimit,
      choosingTeams: this.choosingTeams,
    };
  }

  /**
   * Cria uma nova Rules mesclando os campos atuais com `parcial`. Campos
   * ausentes no parcial preservam o valor atual.
   *
   * O id da regra original é mantido — `merge` não cria nova identidade;
   * representa "uma evolução da mesma regra". Um eventual `parcial.id`
   * é ignorado por design.
   */
  merge(parcial: DataRules): Rules {
    return new Rules({
      id: this.id,
      name: parcial.name ?? this.name,
      playersPerTeam: parcial.playersPerTeam ?? this.playersPerTeam,
      timeMatch: parcial.timeMatch ?? this.timeMatch,
      numberTimes: parcial.numberTimes ?? this.numberTimes,
      goalLimit: parcial.goalLimit ?? this.goalLimit,
      choosingTeams: parcial.choosingTeams ?? this.choosingTeams,
    });
  }
}

/**
 * Snapshot completo de uma Rules — todos os campos preenchidos, incluindo
 * `id`. Útil como contrato de payload (ver `serializer.ts`).
 */
export type RulesData = Required<DataRules>;

/**
 * Estratégia de montagem dos times a partir da lista de jogadores.
 *
 *  - BY_ORDER:                          respeita a ordem de cadastro.
 *  - BY_ORDER_MIXING_TOP_TWO_TEAMS:     embaralha apenas os 2× primeiros (top 2 times).
 *  - BY_MIXING_TEAMS:                   embaralha todos os jogadores.
 *
 * Resolvida por `CreateTeamFactory.fabricate`.
 */
export enum ChoosingTeams {
  BY_ORDER,
  BY_ORDER_MIXING_TOP_TWO_TEAMS,
  BY_MIXING_TEAMS,
}

/**
 * Valores default de uma `Rules`. Fonte única para qualquer consumidor
 * (ex.: telas de cadastro, devSeed) que precise criar regras com a mesma
 * base do construtor sem repetir literais.
 */
export const RULES_DEFAULTS = {
  name: "Padrão",
  playersPerTeam: 4,
  timeMatch: "00:10:00",
  numberTimes: 1,
  goalLimit: 2,
  choosingTeams: ChoosingTeams.BY_ORDER,
} as const;

export type DataRules = {
  playersPerTeam?: number;
  timeMatch?: string;
  numberTimes?: number;
  goalLimit?: number;
  choosingTeams?: ChoosingTeams;
  id?: string;
  name?: string;
};
