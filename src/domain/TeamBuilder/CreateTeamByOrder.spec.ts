import { Player } from "../Player";
import { CreateTeamByOrder } from "./CreateTeamByOrder";

describe("Teste da classe CreateTeamByOrder", () => {
  it("deverá criar times pela ordem da lista", () => {
    const creator = new CreateTeamByOrder();
    const players = [
      new Player("a"),
      new Player("b"),
      new Player("c"),
      new Player("d"),
      new Player("e"),
    ];
    const teams = creator.create(players, 2);
    for (let i = 0; i < 3; i++) {
      teams[i].players.forEach((player, index) => {
        expect(player).toEqual(players.shift()!);
      });
    }
  });
  it("deverá lançar erro se a quantidade de jogadores for menor que 2 vezes numero de jogadores por time", () => {
    const creator = new CreateTeamByOrder();
    const players = [new Player("a"), new Player("b"), new Player("c")];
    expect(() => creator.create(players, 2)).toThrowError(
      "Quantidade de jogadores insuficiente para determinar os times.",
    );
  });
});
