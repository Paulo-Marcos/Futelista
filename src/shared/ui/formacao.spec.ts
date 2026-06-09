import { gerarFormacao } from "./formacao";

describe("gerarFormacao", () => {
  it("devolve array vazio para qtd 0 ou negativa", () => {
    expect(gerarFormacao(0)).toEqual([]);
    expect(gerarFormacao(-1)).toEqual([]);
  });

  it("para qtd=1 devolve uma posição central no meio-campo", () => {
    const result = gerarFormacao(1);
    expect(result).toEqual([{ x: 0.5, y: 0.5 }]);
  });

  it("preserva o tamanho do array igual à quantidade pedida", () => {
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach((qtd) => {
      expect(gerarFormacao(qtd).length).toBe(qtd);
    });
  });

  it("primeira posição é sempre o goleiro (x=0.5, y=0.15)", () => {
    [2, 5, 8, 11].forEach((qtd) => {
      const f = gerarFormacao(qtd);
      expect(f[0]).toEqual({ x: 0.5, y: 0.15 });
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

  it("para qtd=5 mantém o formato 1-2-2 do FORMATION fixo anterior", () => {
    const f = gerarFormacao(5);
    // 1 goleiro + 2 linhas de 2 jogadores
    expect(f.length).toBe(5);
    // Linhas têm jogadores em y ≠ do goleiro
    const ysSemGoleiro = f.slice(1).map((p) => p.y);
    const ysUnicos = [...new Set(ysSemGoleiro)].sort((a, b) => a - b);
    expect(ysUnicos.length).toBe(2);
  });

  it("para qtd=7 distribui em 3 linhas (1 + 2 + 2 + 2)", () => {
    const f = gerarFormacao(7);
    const ysSemGoleiro = f.slice(1).map((p) => p.y);
    const ysUnicos = [...new Set(ysSemGoleiro)];
    expect(ysUnicos.length).toBe(3);
  });

  it("Y das linhas é crescente (defesa em cima, ataque embaixo)", () => {
    const f = gerarFormacao(7);
    const ys = f.map((p) => p.y);
    // Goleiro tem o menor Y; depois a ordem das linhas é crescente
    expect(ys[0]).toBe(0.15);
    for (let i = 2; i < ys.length; i++) {
      expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1]);
    }
  });
});
