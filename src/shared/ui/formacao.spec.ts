import { gerarFormacao } from "./formacao";

describe("gerarFormacao", () => {
  it("devolve array vazio para qtd 0 ou negativa", () => {
    expect(gerarFormacao(0)).toEqual([]);
    expect(gerarFormacao(-1)).toEqual([]);
  });

  it("para qtd=1 devolve uma posição central no meio-campo", () => {
    const result = gerarFormacao(1);
    expect(result).toEqual([{ x: 0.5, y: 0.55 }]);
  });

  it("preserva o tamanho do array igual à quantidade pedida", () => {
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach((qtd) => {
      expect(gerarFormacao(qtd).length).toBe(qtd);
    });
  });

  it("não reserva goleiro: nenhum jogador isolado na linha de fundo", () => {
    // Antes, f[0] era sempre {x:0.5, y:0.15} (goleiro). Agora ninguém deve
    // ficar nessa posição — todos jogam de linha.
    [2, 5, 8, 11].forEach((qtd) => {
      const f = gerarFormacao(qtd);
      expect(f.every((p) => p.y >= 0.22)).toBe(true);
    });
  });

  it("para qtd<=3 distribui todos numa única linha (mesmo y)", () => {
    [2, 3].forEach((qtd) => {
      const f = gerarFormacao(qtd);
      const ysUnicos = [...new Set(f.map((p) => p.y))];
      expect(ysUnicos.length).toBe(1);
      // x's distintos — jogadores lado a lado, não empilhados
      const xsUnicos = [...new Set(f.map((p) => p.x))];
      expect(xsUnicos.length).toBe(qtd);
    });
  });

  it("posições têm coordenadas dentro de [0, 1]", () => {
    [2, 5, 7, 11].forEach((qtd) => {
      const f = gerarFormacao(qtd);
      f.forEach(({ x, y }) => {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(1);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(1);
      });
    });
  });

  it("não sobrepõe jogadores quando o time tem 11 (todas posições únicas)", () => {
    const f = gerarFormacao(11);
    const chaves = f.map((p) => `${p.x.toFixed(3)}|${p.y.toFixed(3)}`);
    const unicas = new Set(chaves);
    expect(unicas.size).toBe(f.length);
  });

  it("para qtd entre 4 e 6 usa 2 linhas", () => {
    [4, 5, 6].forEach((qtd) => {
      const f = gerarFormacao(qtd);
      const ysUnicos = [...new Set(f.map((p) => p.y))];
      expect(ysUnicos.length).toBe(2);
    });
  });

  it("Y das linhas é crescente (defesa em cima, ataque embaixo)", () => {
    const f = gerarFormacao(7);
    const ys = f.map((p) => p.y);
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1]);
    }
  });
});
