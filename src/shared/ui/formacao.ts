/**
 * Helper puro para gerar posições de jogadores no campo da Partida
 * baseado na quantidade de jogadores por time.
 *
 * Antes (FORMATION fixo de 5 posições), times com >5 jogadores
 * empilhavam todos os extras na mesma coordenada — visualmente ilegível
 * e clinicamente errado pra peladas com `playersPerTeam ≥ 6`.
 *
 * Não há goleiro dedicado: peladas costumam ser de linha (ex.: 3 na linha),
 * então todos os jogadores são distribuídos em linhas no campo. Se um dia
 * o domínio ganhar marcação de goleiro, este helper passa a recebê-la e
 * reserva a posição do gol só pra quem for goleiro.
 *
 * Convenção das coordenadas: ambas frações `[0, 1]` dentro da metade do
 * time. `y=0` é a linha de fundo (próprio gol), `y=1` é a linha do meio do
 * campo. `x=0..1` é da lateral esquerda à direita.
 */

export type PosicaoCampo = { readonly x: number; readonly y: number };

const Y_PRIMEIRA_LINHA = 0.22; // recuada (defesa), longe da linha de fundo
const Y_ULTIMA_LINHA = 0.85; // adiantada (ataque), perto do meio-campo
const Y_LINHA_UNICA = 0.55; // quando há uma só linha, fica no miolo da metade
const X_MARGEM = 0.22; // espaço pras laterais respirarem

export function gerarFormacao(qtd: number): readonly PosicaoCampo[] {
  if (qtd <= 0) return [];
  if (qtd === 1) return [{ x: 0.5, y: Y_LINHA_UNICA }];

  const numLinhas = escolherNumeroLinhas(qtd);
  const porLinha = distribuirPorLinha(qtd, numLinhas);
  const dy =
    numLinhas > 1 ? (Y_ULTIMA_LINHA - Y_PRIMEIRA_LINHA) / (numLinhas - 1) : 0;

  const positions: PosicaoCampo[] = [];
  porLinha.forEach((qtdLinha, idx) => {
    const y = numLinhas === 1 ? Y_LINHA_UNICA : Y_PRIMEIRA_LINHA + idx * dy;
    for (let i = 0; i < qtdLinha; i++) {
      const x =
        qtdLinha === 1
          ? 0.5
          : X_MARGEM + ((1 - 2 * X_MARGEM) * i) / (qtdLinha - 1);
      positions.push({ x, y });
    }
  });

  return positions;
}

function escolherNumeroLinhas(qtd: number): number {
  if (qtd <= 3) return 1; // até 3 jogadores: uma linha só ("3 na linha")
  if (qtd <= 6) return 2;
  if (qtd <= 9) return 3;
  return 4;
}

function distribuirPorLinha(total: number, linhas: number): number[] {
  const base = Math.floor(total / linhas);
  const sobra = total % linhas;
  return Array.from(
    { length: linhas },
    (_, i) => base + (i >= linhas - sobra ? 1 : 0),
  );
}
