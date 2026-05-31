import { Player } from './Player';
import { Team } from './Team';

export class Switch {
  constructor(
    readonly playerEnters: Player,
    readonly playerLeaves: Player,
    readonly team: Team,
  ) {}
}
