import { Player } from "../Player";
import { Team } from "../Team";
import { CreateTeam } from "./CreateTeam.abstract";

/**
 * Estratégia BY_ORDER — monta times respeitando a ordem de cadastro dos
 * jogadores. Os 4 primeiros viram o time 1, os 4 seguintes o time 2, etc.
 * Útil quando a ordem de chegada deve refletir os times (ex.: "quem chega
 * primeiro joga primeiro").
 */
export class CreateTeamByOrder extends CreateTeam {
  create(players: Player[], playersPerTeam: number): Team[] {
    if (players.length < 2 * playersPerTeam)
      throw Error(
        "Quantidade de jogadores insuficiente para determinar os times.",
      );
    const teams: Team[] = [];
    players.forEach((player, index) => {
      if (index % playersPerTeam === 0) teams.push(new Team(playersPerTeam));
      const indexTeam = Math.floor(index / playersPerTeam);
      teams[indexTeam].addPlayer(player);
    });
    return teams;
  }
}
