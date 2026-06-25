/**
 * Estado momentâneo do jogador na pelada.
 *
 *  - NO_TEAM: cadastrado mas ainda sem time atribuído.
 *  - ACTIVE:  está em um time (`currentTeam` definido).
 *  - STOPPED: foi removido do time e não joga até voltar.
 *
 * Em arquivo próprio (separado de `Player`) para quebrar o require cycle
 * Match ⇄ Team ⇄ Player: `Team` lê `PlayerSituation` sem importar `Player`
 * em runtime.
 */
export enum PlayerSituation {
  STOPPED,
  ACTIVE,
  NO_TEAM,
}
