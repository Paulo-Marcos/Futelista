import { ScreenTime } from "./ScreenTime";
import type { Match } from "./Match";
import type { Player } from "./Player";
import type { Team } from "./Team";

/**
 * Gol — value object imutável que liga partida, autor, time beneficiado
 * e instante em que aconteceu. `ownGoal` indica gol-contra: o autor (Player)
 * pertence ao time adversário, mas o gol soma para o `team` aqui registrado.
 */
export class Goal {
  constructor(
    readonly match: Match,
    readonly player: Player,
    readonly team: Team,
    readonly time: ScreenTime,
    readonly ownGoal: boolean = false,
  ) {}
}
