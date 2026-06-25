/**
 * Resultado final de uma partida.
 *
 *  - DRAW:    empate (ambos os times com mesmo número de gols).
 *  - VICTORY: vitória de um dos times — `winner` e `loser` definidos.
 *
 * Mora em arquivo próprio (separado de `Match`) para que entidades como
 * `Player` possam ler o enum sem importar `Match` em runtime — o que
 * criava um require cycle Match ⇄ Team ⇄ Player.
 */
export enum ResultMatch {
  DRAW,
  VICTORY,
}
