import { GestorJogo } from "./GestorJogo";
import { ResultMatch } from "./Match";

/**
 * Agregações cross-execução para uma pelada-tipo.
 *
 * Toma como entrada várias `GestorJogo` (execuções concluídas ou em curso)
 * e devolve agregados úteis para a tela de detalhe da pelada — artilheiros
 * e maiores sequências de vitória ao longo da história.
 *
 * **Identificação do jogador entre execuções** — cada execução tem seus
 * próprios objetos `Player` com `id` novo (uuid). Para consolidar, usamos
 * o **nome normalizado** (trim + lower-case) como chave estável entre
 * execuções. Limitações conhecidas:
 *
 * - Renomear o jogador entre execuções "quebra" o agregado: passa a
 *   contar como dois jogadores diferentes.
 * - Homônimos (dois jogadores com o mesmo nome em execuções distintas)
 *   colapsam em um agregado só.
 *
 * Aceitamos esses trade-offs para evitar inventar uma identidade
 * cross-execução agora — o usuário pode ajustar nomes para consolidar
 * estatísticas quando importar.
 */

export type Artilheiro = {
  /** Nome canônico do jogador (primeira grafia encontrada). */
  nome: string;
  /** Total de gols somados em todas as execuções. */
  gols: number;
  /** Em quantas execuções distintas o jogador apareceu. */
  execucoes: number;
};

export type SequenciaVencedor = {
  /** Nome canônico do jogador (primeira grafia encontrada). */
  nome: string;
  /** Maior número de vitórias consecutivas observadas. */
  maiorSequencia: number;
};

/**
 * Consolida artilharia (total de gols) por jogador entre execuções.
 *
 * Resultado vem ordenado por gols desc, com desempate por nome asc
 * (determinístico — facilita teste e impressão consistente).
 *
 * Jogadores sem gols ficam fora do resultado: não fazem sentido na
 * "lista de artilheiros". Use `length` da entrada para saber quantos
 * jogadores totais a pelada tem.
 */
export function consolidarArtilheiros(execucoes: GestorJogo[]): Artilheiro[] {
  type Acc = { nome: string; gols: number; execucoes: Set<string> };
  const porChave = new Map<string, Acc>();
  for (const execucao of execucoes) {
    for (const player of execucao.players) {
      const chave = chaveJogador(player.name);
      if (!chave) continue;
      const atual = porChave.get(chave) ?? {
        nome: player.name.trim(),
        gols: 0,
        execucoes: new Set<string>(),
      };
      atual.gols += player.goals.length;
      atual.execucoes.add(execucao.id);
      porChave.set(chave, atual);
    }
  }
  const lista: Artilheiro[] = [];
  for (const acc of porChave.values()) {
    if (acc.gols === 0) continue;
    lista.push({
      nome: acc.nome,
      gols: acc.gols,
      execucoes: acc.execucoes.size,
    });
  }
  return lista.sort(porGolsDescNomeAsc);
}

/**
 * Consolida a maior sequência de vitórias consecutivas por jogador.
 *
 * **Regra de sequência**: percorre partidas em ordem cronológica (por
 * `createdAt` da execução, depois ordem natural em `gestor.matches`).
 * Para cada partida com `result` definido:
 *
 * - VICTORY: cada jogador do `winner.players` ganha +1 no `atual`.
 *   Cada jogador do `loser.players` zera `atual`.
 * - DRAW: jogadores de ambos os times zeram `atual`.
 *
 * O `maiorSequencia` retornado é o maior `atual` já visto. Empates e
 * derrotas quebram a sequência — interpretação estrita de "vitórias
 * consecutivas".
 *
 * **Limitação**: usamos `winner.players` no estado atual do Team
 * (mesmo modelo do `Player.stats()`). Substituições pós-partida podem
 * classificar incorretamente em peladas com muito rodízio.
 *
 * Jogadores sem nenhuma vitória ficam fora do resultado.
 */
export function consolidarSequenciasVitoria(
  execucoes: GestorJogo[],
): SequenciaVencedor[] {
  type Streak = { nome: string; atual: number; maior: number };
  const porChave = new Map<string, Streak>();

  const ordenadas = [...execucoes].sort((a, b) => a.createdAt - b.createdAt);

  for (const execucao of ordenadas) {
    for (const match of execucao.matches) {
      if (match.result === undefined) continue;
      const teamA = match.teamA;
      const teamB = match.teamB;
      if (match.result === ResultMatch.DRAW) {
        zerarStreaksDeTimes(porChave, [teamA, teamB]);
        continue;
      }
      const vencedor = match.winner;
      const perdedor = match.loser;
      if (!vencedor || !perdedor) continue;
      incrementarStreaksDoTime(porChave, vencedor);
      zerarStreaksDeTimes(porChave, [perdedor]);
    }
  }

  const lista: SequenciaVencedor[] = [];
  for (const streak of porChave.values()) {
    if (streak.maior === 0) continue;
    lista.push({ nome: streak.nome, maiorSequencia: streak.maior });
  }
  return lista.sort(porSequenciaDescNomeAsc);
}

// ----- helpers internos -----

function chaveJogador(nome: string): string {
  return nome.trim().toLowerCase();
}

function incrementarStreaksDoTime(
  acc: Map<string, { nome: string; atual: number; maior: number }>,
  time: { players: { name: string }[] },
): void {
  for (const player of time.players) {
    const chave = chaveJogador(player.name);
    if (!chave) continue;
    const atual = acc.get(chave) ?? {
      nome: player.name.trim(),
      atual: 0,
      maior: 0,
    };
    atual.atual += 1;
    if (atual.atual > atual.maior) atual.maior = atual.atual;
    acc.set(chave, atual);
  }
}

function zerarStreaksDeTimes(
  acc: Map<string, { nome: string; atual: number; maior: number }>,
  times: { players: { name: string }[] }[],
): void {
  for (const time of times) {
    for (const player of time.players) {
      const chave = chaveJogador(player.name);
      if (!chave) continue;
      const atual = acc.get(chave);
      if (atual) atual.atual = 0;
    }
  }
}

function porGolsDescNomeAsc(a: Artilheiro, b: Artilheiro): number {
  if (b.gols !== a.gols) return b.gols - a.gols;
  return a.nome.localeCompare(b.nome, "pt-BR");
}

function porSequenciaDescNomeAsc(
  a: SequenciaVencedor,
  b: SequenciaVencedor,
): number {
  if (b.maiorSequencia !== a.maiorSequencia)
    return b.maiorSequencia - a.maiorSequencia;
  return a.nome.localeCompare(b.nome, "pt-BR");
}
