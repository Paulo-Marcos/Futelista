import { GestorJogo } from "./GestorJogo";
import { ResultMatch } from "./Match";

/**
 * Relatório textual de uma execução — usado pelo botão "Compartilhar"
 * para mandar pelo WhatsApp/etc. via `Share.share({ message })`.
 *
 * Texto pensado pra ser lido em qualquer cliente de mensagem: emojis
 * leves de marcação, sem dependência de markdown. Quebra com `\n` (LF)
 * — o sistema do device costuma respeitar.
 *
 * Não inclui informação sensível (id, timestamps internos) — só o que
 * o usuário compartilharia naturalmente.
 */

export function gerarRelatorioExecucao(gestor: GestorJogo): string {
  const linhas: string[] = [];
  linhas.push(`🏆 ${gestor.name} · ${formatarData(gestor.startedAt ?? gestor.createdAt)}`);
  linhas.push("━".repeat(20));
  linhas.push("");

  const totalEncerradas = gestor.matches.filter(
    (m) => m.result !== undefined,
  ).length;
  linhas.push(
    `📊 ${totalEncerradas} ${totalEncerradas === 1 ? "partida" : "partidas"} · ${gestor.players.length} ${gestor.players.length === 1 ? "jogador" : "jogadores"}`,
  );
  linhas.push("");

  const artilheiros = topArtilheiros(gestor);
  if (artilheiros.length > 0) {
    linhas.push("⚽ Artilheiros:");
    for (let i = 0; i < artilheiros.length; i++) {
      const a = artilheiros[i];
      linhas.push(`${i + 1}. ${a.nome} — ${a.gols} ${a.gols === 1 ? "gol" : "gols"}`);
    }
    linhas.push("");
  }

  if (gestor.matches.length > 0) {
    linhas.push("🏟️ Partidas:");
    let n = 1;
    for (const match of gestor.matches) {
      if (match.result === undefined) continue;
      const placar = match.countGoals();
      linhas.push(
        `${n}. Time A  ${placar.teamA} × ${placar.teamB}  Time B${marcadorResultado(match.result)}`,
      );
      n += 1;
    }
    linhas.push("");
  }

  const vitorias = topVitorias(gestor);
  if (vitorias.length > 0) {
    linhas.push("🥇 Vitórias:");
    for (const v of vitorias) {
      linhas.push(`- ${v.nome}: ${v.vitorias}`);
    }
    linhas.push("");
  }

  linhas.push("— FuteLista");
  return linhas.join("\n").replace(/\n{3,}/g, "\n\n");
}

// ----- helpers -----

function marcadorResultado(result: ResultMatch): string {
  return result === ResultMatch.DRAW ? "  (empate)" : "";
}

/**
 * Top 5 artilheiros da execução. Como o relatório vive dentro de **uma**
 * execução, é seguro identificar por `Player.id` (sem precisar normalizar
 * por nome como em AgregadosPelada).
 */
function topArtilheiros(
  gestor: GestorJogo,
): { nome: string; gols: number }[] {
  return gestor.players
    .map((p) => ({ nome: p.name, gols: p.goals.length }))
    .filter((a) => a.gols > 0)
    .sort((a, b) => b.gols - a.gols || a.nome.localeCompare(b.nome, "pt-BR"))
    .slice(0, 5);
}

/**
 * Top 5 jogadores por vitórias na execução. Conta via `Player.stats()`
 * (mesma fonte de dados do bottom sheet do F-04).
 */
function topVitorias(
  gestor: GestorJogo,
): { nome: string; vitorias: number }[] {
  return gestor.players
    .map((p) => ({ nome: p.name, vitorias: p.stats().vitorias }))
    .filter((v) => v.vitorias > 0)
    .sort((a, b) => b.vitorias - a.vitorias || a.nome.localeCompare(b.nome, "pt-BR"))
    .slice(0, 5);
}

function formatarData(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return new Date(ts).toISOString().slice(0, 10);
  }
}
