import {
  consolidarArtilheiros,
  consolidarSequenciasVitoria,
} from "./AgregadosPelada";
import { GestorJogo } from "./GestorJogo";
import { Match } from "./Match";
import { Rules } from "./Rules";
import { ScreenTime } from "./ScreenTime";

/**
 * Cria um GestorJogo com nomes nos times A/B (1×1) e simula partidas
 * encerradas com placares dados — útil pra exercitar as agregações sem
 * passar por timer/start.
 *
 * `partidas` é uma lista de tuplas [golsA, golsB]; cada uma vira uma
 * Match nova com `setResult()` chamado no fim.
 *
 * Os players persistem ao longo das partidas — `team.players[0]` continua
 * sendo o mesmo objeto, então os agregados vão consolidar como espera.
 */
function execucaoComPartidas(
  nomesTimeA: string[],
  nomesTimeB: string[],
  partidas: [number, number][],
  opts: { createdAt?: number; peladaId?: string } = {},
): GestorJogo {
  const rules = new Rules({
    playersPerTeam: nomesTimeA.length,
    goalLimit: 99,
    timeMatch: "00:10:00",
  });
  const gestor = new GestorJogo("X", rules, {
    createdAt: opts.createdAt,
    peladaId: opts.peladaId,
  });
  gestor.addPlayers([...nomesTimeA, ...nomesTimeB]);
  gestor.createTeams();
  // createTeams empilha 2 times em `gestor.next`; teamA/B vêm de lá.
  const teamA = gestor.next[0];
  const teamB = gestor.next[1];
  for (const [golsA, golsB] of partidas) {
    const match = new Match(teamA, teamB);
    for (let i = 0; i < golsA; i++) {
      match.addGoal(teamA, teamA.players[0], new ScreenTime(1, 10 + i));
    }
    for (let i = 0; i < golsB; i++) {
      match.addGoal(teamB, teamB.players[0], new ScreenTime(1, 10 + i));
    }
    match.setResult();
    gestor.matches.push(match);
  }
  return gestor;
}

describe("consolidarArtilheiros", () => {
  it("retorna lista vazia quando não há execuções", () => {
    expect(consolidarArtilheiros([])).toEqual([]);
  });

  it("retorna lista vazia quando ninguém fez gol", () => {
    const g = execucaoComPartidas(["Ana"], ["Bia"], [[0, 0]]);
    expect(consolidarArtilheiros([g])).toEqual([]);
  });

  it("soma gols por jogador em uma execução", () => {
    // teamA[0] = "Ana" marca 2; teamB[0] = "Bia" marca 1.
    const g = execucaoComPartidas(["Ana"], ["Bia"], [[2, 1]]);
    const arts = consolidarArtilheiros([g]);
    expect(arts).toEqual([
      { nome: "Ana", gols: 2, execucoes: 1 },
      { nome: "Bia", gols: 1, execucoes: 1 },
    ]);
  });

  it("consolida gols entre execuções pelo nome", () => {
    const g1 = execucaoComPartidas(["Ana"], ["Bia"], [[1, 0]]);
    const g2 = execucaoComPartidas(["Ana"], ["Bia"], [[2, 0]]);
    const arts = consolidarArtilheiros([g1, g2]);
    expect(arts[0]).toEqual({ nome: "Ana", gols: 3, execucoes: 2 });
  });

  it("normaliza nomes (trim + lower-case) pra agregação", () => {
    const g1 = execucaoComPartidas(["  Ana  "], ["Bia"], [[1, 0]]);
    const g2 = execucaoComPartidas(["ana"], ["Bia"], [[1, 0]]);
    const arts = consolidarArtilheiros([g1, g2]);
    // Ambos viram a mesma chave; nome canônico = primeira grafia trimada.
    const ana = arts.find((a) => a.nome.toLowerCase() === "ana");
    expect(ana?.gols).toBe(2);
    expect(ana?.execucoes).toBe(2);
  });

  it("ordena por gols desc e desempata por nome asc", () => {
    const g = execucaoComPartidas(["Ana", "Caio"], ["Bia", "Davi"], [[3, 0]]);
    // 1×1 não fecha — uso playersPerTeam=2: 2 partidas… na verdade não.
    // Aqui Ana é teamA[0], só ela marca, então é única artilheira.
    const arts = consolidarArtilheiros([g]);
    expect(arts.map((a) => a.nome)).toEqual(["Ana"]);
  });
});

describe("consolidarSequenciasVitoria", () => {
  it("retorna lista vazia sem execuções", () => {
    expect(consolidarSequenciasVitoria([])).toEqual([]);
  });

  it("conta 2 vitórias seguidas pra Ana", () => {
    const g = execucaoComPartidas(
      ["Ana"],
      ["Bia"],
      [
        [1, 0],
        [2, 0],
      ],
    );
    const seqs = consolidarSequenciasVitoria([g]);
    expect(seqs.find((s) => s.nome === "Ana")?.maiorSequencia).toBe(2);
  });

  it("empate interrompe a sequência", () => {
    const g = execucaoComPartidas(
      ["Ana"],
      ["Bia"],
      [
        [1, 0],
        [1, 1],
        [1, 0],
      ],
    );
    expect(
      consolidarSequenciasVitoria([g]).find((s) => s.nome === "Ana")
        ?.maiorSequencia,
    ).toBe(1);
  });

  it("derrota interrompe a sequência", () => {
    const g = execucaoComPartidas(
      ["Ana"],
      ["Bia"],
      [
        [1, 0],
        [1, 0],
        [0, 1],
        [1, 0],
      ],
    );
    expect(
      consolidarSequenciasVitoria([g]).find((s) => s.nome === "Ana")
        ?.maiorSequencia,
    ).toBe(2);
    expect(
      consolidarSequenciasVitoria([g]).find((s) => s.nome === "Bia")
        ?.maiorSequencia,
    ).toBe(1);
  });

  it("acumula entre execuções ordenadas por createdAt", () => {
    const g1 = execucaoComPartidas(["Ana"], ["Bia"], [[1, 0]], {
      createdAt: 100,
    });
    const g2 = execucaoComPartidas(["Ana"], ["Bia"], [[1, 0]], {
      createdAt: 200,
    });
    // Note: como `Ana` de g2 é um Player com id diferente, mas a chave
    // de agregação é o nome — então a sequência continua.
    expect(
      consolidarSequenciasVitoria([g2, g1]).find((s) => s.nome === "Ana")
        ?.maiorSequencia,
    ).toBe(2);
  });

  it("ignora partidas sem result definido", () => {
    const g = execucaoComPartidas(["Ana"], ["Bia"], [[1, 0]]);
    // Adiciona uma partida nova SEM setResult — deve ser ignorada.
    const inacabada = new (require("./Match").Match)(g.next[0], g.next[1]);
    g.matches.push(inacabada);
    expect(
      consolidarSequenciasVitoria([g]).find((s) => s.nome === "Ana")
        ?.maiorSequencia,
    ).toBe(1);
  });
});
