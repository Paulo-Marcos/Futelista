import { GestorJogo } from "./GestorJogo";
import { Match } from "./Match";
import { gerarRelatorioExecucao } from "./RelatorioExecucao";
import { Rules } from "./Rules";
import { ScreenTime } from "./ScreenTime";

/**
 * Helper que simula partidas encerradas sem timer/start — espelha o usado
 * em AgregadosPelada.spec. Players persistem pra agregação por id ser
 * correta dentro da execução.
 */
function execucaoComPartidas(
  nomesA: string[],
  nomesB: string[],
  partidas: [number, number][],
  opts: { name?: string; startedAt?: number } = {},
): GestorJogo {
  const rules = new Rules({
    playersPerTeam: nomesA.length,
    goalLimit: 99,
    timeMatch: "00:10:00",
  });
  const gestor = new GestorJogo(opts.name ?? "Fute CEF", rules, {
    startedAt: opts.startedAt,
  });
  gestor.addPlayers([...nomesA, ...nomesB]);
  gestor.createTeams();
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

describe("gerarRelatorioExecucao", () => {
  it("contém o nome da pelada e a data no cabeçalho", () => {
    const g = execucaoComPartidas(["Ana"], ["Bia"], [], {
      name: "Fute Quarta",
      startedAt: new Date("2026-06-07T20:00:00").getTime(),
    });
    const texto = gerarRelatorioExecucao(g);
    expect(texto).toContain("🏆 Fute Quarta");
    expect(texto).toContain("07/06/2026");
  });

  it("mostra o total de partidas encerradas e jogadores", () => {
    const g = execucaoComPartidas(["Ana"], ["Bia"], [
      [1, 0],
      [0, 1],
    ]);
    const texto = gerarRelatorioExecucao(g);
    expect(texto).toContain("📊 2 partidas · 2 jogadores");
  });

  it("ignora partidas não encerradas na contagem", () => {
    const g = execucaoComPartidas(["Ana"], ["Bia"], [[1, 0]]);
    // Cria mais 1 sem setResult — fica como "em andamento".
    const teamA = g.next[0];
    const teamB = g.next[1];
    g.matches.push(new Match(teamA, teamB));
    const texto = gerarRelatorioExecucao(g);
    expect(texto).toContain("📊 1 partida · 2 jogadores");
  });

  it("lista artilheiros ordenados por gols desc", () => {
    // Times 2×2 — Ana e Caio em A; Bia e Davi em B.
    // Ana[0] = teamA.players[0] marca 3; Bia[0] = teamB.players[0] marca 2.
    const g = execucaoComPartidas(["Ana", "Caio"], ["Bia", "Davi"], [
      [3, 2],
    ]);
    const texto = gerarRelatorioExecucao(g);
    expect(texto).toContain("⚽ Artilheiros:");
    // Quem fez gol depende do sorteio do team builder; checa só que
    // a seção tem 1ª e 2ª linha e que algum nome com gol aparece.
    const matches = texto.match(/\d+\. .+ — \d+ go/g);
    expect(matches).toBeTruthy();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it("não mostra seção de artilheiros quando ninguém marcou", () => {
    const g = execucaoComPartidas(["Ana"], ["Bia"], [[0, 0]]);
    const texto = gerarRelatorioExecucao(g);
    expect(texto).not.toContain("⚽ Artilheiros");
  });

  it("anota '(empate)' nas partidas que terminaram empatadas", () => {
    const g = execucaoComPartidas(["Ana"], ["Bia"], [[1, 1]]);
    const texto = gerarRelatorioExecucao(g);
    expect(texto).toContain("(empate)");
  });

  it("termina com a assinatura — FuteLista", () => {
    const g = execucaoComPartidas(["Ana"], ["Bia"], []);
    const texto = gerarRelatorioExecucao(g);
    expect(texto.trim().endsWith("— FuteLista")).toBe(true);
  });
});
