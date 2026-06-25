/**
 * Estado momentâneo de um time na pelada.
 *
 *  - CREATED:  recém-formado, ainda não entrou na fila de próximos.
 *  - ON_NEXT:  aguardando na fila para entrar em partida.
 *  - PLAYING:  jogando partida atual.
 *  - STOPPED:  saiu da rodada (perdeu, foi removido manualmente etc.).
 *
 * Em arquivo próprio (separado de `Team`) para quebrar o require cycle
 * Match ⇄ Team ⇄ Player: `Match` lê `TeamSituation` sem importar `Team`
 * em runtime.
 */
export enum TeamSituation {
  PLAYING,
  STOPPED,
  ON_NEXT,
  CREATED,
}
