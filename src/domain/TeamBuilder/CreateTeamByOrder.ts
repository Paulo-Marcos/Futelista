import { Player } from "../Player";
import { Team } from "../Team";
import { CreateTeam } from "./CreateTeam.abstract";

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
