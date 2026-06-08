import { Pelada } from "./Pelada";

/**
 * Convite textual de uma Pelada (F-20) — pronto pra mandar no
 * WhatsApp/Telegram via `Share.share({ message })`.
 *
 * Sem deep link real ainda (depende de backend / esquema URL).
 * O texto é puro e segue uma estrutura previsível:
 *
 *   ⚽ {nome}
 *   📅 {dia} · 🕒 {hora}        ← linhas só aparecem se preenchidas
 *   📍 {local}
 *
 *   {playersPerTeam}×{playersPerTeam} · {min}min · até {goalLimit} gols
 *
 *   {observacoes}
 *
 *   — FuteLista
 *
 * Linhas com campo opcional ausente somem para o texto não ficar
 * com "📍 undefined". Quebra com `\n` (LF) — cliente de mensagem
 * preserva.
 */
export function gerarConvitePelada(pelada: Pelada): string {
  const linhas: string[] = [];
  linhas.push(`⚽ ${pelada.nome}`);

  const agenda = formatarAgenda(pelada);
  if (agenda) linhas.push(agenda);
  if (pelada.local) linhas.push(`📍 ${pelada.local}`);

  linhas.push("");
  linhas.push(formatarRegras(pelada));

  if (pelada.observacoes) {
    linhas.push("");
    linhas.push(pelada.observacoes);
  }

  linhas.push("");
  linhas.push("— FuteLista");
  return linhas.join("\n").replace(/\n{3,}/g, "\n\n");
}

function formatarAgenda(pelada: Pelada): string | null {
  const partes: string[] = [];
  if (pelada.dia) partes.push(`📅 ${pelada.dia}`);
  if (pelada.hora) partes.push(`🕒 ${pelada.hora}`);
  return partes.length === 0 ? null : partes.join(" · ");
}

function formatarRegras(pelada: Pelada): string {
  const minutos = extrairMinutos(pelada.regras.timeMatch);
  const formatoTime = `${pelada.regras.playersPerTeam}×${pelada.regras.playersPerTeam}`;
  return `${formatoTime} · ${minutos}min · até ${pelada.regras.goalLimit} ${pelada.regras.goalLimit === 1 ? "gol" : "gols"}`;
}

function extrairMinutos(timeMatch: string): number {
  const partes = timeMatch.split(":").map((s) => parseInt(s, 10));
  const [h, m] = partes;
  if (Number.isNaN(h) || Number.isNaN(m)) return 10;
  return h * 60 + m;
}
