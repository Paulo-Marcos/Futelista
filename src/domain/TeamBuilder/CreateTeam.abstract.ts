import { Player } from '../Player';
import { Team } from '../Team';

export abstract class CreateTeam {
  abstract create(players: Player[], playersPerTeam: number): Team[];
}
