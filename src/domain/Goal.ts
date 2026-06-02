import { Match } from './Match';
import { ScreenTime } from './ScreenTime';
import { Team } from './Team';
import { Player } from './Player';

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
