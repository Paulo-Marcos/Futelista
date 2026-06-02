import { Player } from '../Player';
import { Team } from '../Team';

/**
 * Contrato (Strategy) para montagem de times a partir da lista de jogadores.
 *
 * Cada estratégia decide a ordem antes de distribuir os jogadores em N times
 * com `playersPerTeam` lugares cada. A factory `CreateTeamFactory.fabricate`
 * resolve a estratégia a partir do enum `ChoosingTeams`.
 */
export abstract class CreateTeam {
  abstract create(players: Player[], playersPerTeam: number): Team[];
}
