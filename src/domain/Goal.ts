import { Match } from './Match';
import { ScreenTime } from './ScreenTime';
import { Team } from './Team';
import { Player } from './Player';

export class Goal {
  constructor(
    readonly match: Match,
    readonly player: Player,
    readonly team: Team,
    readonly time: ScreenTime,
    readonly ownGoal: boolean = false,
  ) {}
}
