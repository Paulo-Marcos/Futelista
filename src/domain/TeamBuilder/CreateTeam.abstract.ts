import { Player } from '../Player';
import { Team } from '../Team';

/**
 * Contrato (Strategy + Template Method) para montagem de times a partir da
 * lista de jogadores.
 *
 * `create` é o template fixo: valida → prepara a lista → distribui. Cada
 * estratégia concreta só implementa `prepararLista` — "como ordenar". A
 * validação e a distribuição em times de tamanho fixo são uma única
 * implementação no base. A factory `CreateTeamFactory.fabricate` resolve
 * a estratégia a partir do enum `ChoosingTeams`.
 */
export abstract class CreateTeam {
  create(players: Player[], playersPerTeam: number): Team[] {
    this.validar(players, playersPerTeam);
    const ordenados = this.prepararLista(players, playersPerTeam);
    return this.distribuir(ordenados, playersPerTeam);
  }

  /**
   * Reordena a lista de jogadores antes da distribuição. Cada estratégia
   * decide se mantém a ordem original, embaralha tudo ou só os primeiros N.
   */
  protected abstract prepararLista(
    players: Player[],
    playersPerTeam: number,
  ): Player[];

  /**
   * Rejeita listas insuficientes para formar pelo menos 2 times completos.
   * Mantém a mensagem original ("Quantidade de jogadores insuficiente…")
   * por compatibilidade com specs e UI.
   */
  protected validar(players: Player[], playersPerTeam: number): void {
    if (players.length < 2 * playersPerTeam) {
      throw Error(
        'Quantidade de jogadores insuficiente para determinar os times.',
      );
    }
  }

  /**
   * Distribui sequencialmente os jogadores já ordenados em times de
   * `playersPerTeam` jogadores cada.
   */
  protected distribuir(players: Player[], playersPerTeam: number): Team[] {
    const teams: Team[] = [];
    players.forEach((player, index) => {
      if (index % playersPerTeam === 0) teams.push(new Team(playersPerTeam));
      const indexTeam = Math.floor(index / playersPerTeam);
      teams[indexTeam].addPlayer(player);
    });
    return teams;
  }

  /**
   * Fisher-Yates in-place. Mutações afetam o array recebido; quem precisa
   * preservar a lista original deve passar uma cópia.
   */
  protected shuffle(list: Player[]): Player[] {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
}
