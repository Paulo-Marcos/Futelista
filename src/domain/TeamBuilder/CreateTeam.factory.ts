import { ChoosingTeams } from "../Rules";
import { CreateTeam } from "./CreateTeam.abstract";
import { CreateTeamByOrder } from "./CreateTeamByOrder";
import { CreateTeamMixed } from "./CreateTeamMixed";
import { CreateTeamMixingTopTwoTeams } from "./CreateTeamMixingTopTwoTeams";

/**
 * Factory que mapeia o enum `ChoosingTeams` para a estratégia concreta de
 * montagem de times. Mantém o consumidor (`GestorJogo.createTeams`) cego ao
 * conjunto de estratégias disponíveis e ao critério de escolha de cada uma.
 */
export class CreateTeamFactory {
  static fabricate(choosingTeams: ChoosingTeams): CreateTeam {
    switch (choosingTeams) {
      case ChoosingTeams.BY_ORDER:
        return new CreateTeamByOrder();
      case ChoosingTeams.BY_ORDER_MIXING_TOP_TWO_TEAMS:
        return new CreateTeamMixingTopTwoTeams();
      case ChoosingTeams.BY_MIXING_TEAMS:
        return new CreateTeamMixed();
      default:
        throw Error("Tipo de escolha de time não definida.");
    }
  }
}
