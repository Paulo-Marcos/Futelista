/**
 * Helper puro para gerar posições de jogadores no campo da Partida
 * baseado na quantidade de jogadores por time.
 *
 * Antes (FORMATION fixo de 5 posições), times com >5 jogadores
 * empilhavam todos os extras na mesma coordenada — visualmente ilegível
 * e clinicamente errado pra peladas com `playersPerTeam ≥ 6`.
 *
 * Convenção das coordenadas: ambas frações `[0, 1]` dentro da metade do
 * time. `y=0` é a linha de fundo (goleiro), `y=1` é a linha do meio do
 * campo. `x=0..1` é da lateral esquerda à direita.
 */

export type PosicaoCampo = { readonly x: number; readonly y: number };

const Y_GOLEIRO = 0.15;
const Y_PRIMEIRA_LINHA = 0.45;
const Y_ULTIMA_LINHA = 0.85;
const X_MARGEM = 0.22; // espaço pras laterais respirarem

export function gerarFormacao(qtd: number): readonly PosicaoCampo[] {
  if (qtd <= 0) return [];
  if (qtd === 1) return [{ x: 0.5, y: 0.5 }];

  const positions: PosicaoCampo[] = [{ x: 0.5, y: Y_GOLEIRO }];
  const restantes = qtd - 1;
  const numLinhas = escolherNumeroLinhas(restantes);
  const porLinha = distribuirPorLinha(restantes, numLinhas);

  const dy =
    numLinhas > 1 ? (Y_ULTIMA_LINHA - Y_PRIMEIRA_LINHA) / (numLinhas - 1) : 0;

  porLinha.forEach((qtdLinha, idx) => {
    const y = Y_PRIMEIRA_LINHA + idx * dy;
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

function escolherNumeroLinhas(restantes: number): number {
  if (restantes <= 4) return 2;
  if (restantes <= 9) return 3;
  return 4;
}

function distribuirPorLinha(total: number, linhas: number): number[] {
  const base = Math.floor(total / linhas);
  const sobra = total % linhas;
  return Array.from({ length: linhas }, (_, i) =>
    base + (i >= linhas - sobra ? 1 : 0),
  );
}
