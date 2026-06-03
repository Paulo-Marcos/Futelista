import AsyncStorage from "@react-native-async-storage/async-storage";

import { NOME_AVULSA_DEFAULT } from "@/src/app-shell/constants";
import { GameManager } from "@/src/domain/GameManager";
import { Pelada } from "@/src/domain/Pelada";
import { RepositorioPelada } from "@/src/domain/ports/RepositorioPelada";
import { ChoosingTeams, RULES_DEFAULTS, Rules } from "@/src/domain/Rules";
import {
  STORAGE_KEYS,
  STORAGE_NAMESPACE,
} from "@/src/infrastructure/storage/storageKeys";

/**
 * Helpers de "dev seed" — geram cenários de teste no repositório real
 * pra facilitar verificar a UI sem precisar montar tudo na mão.
 *
 * Tudo aqui é destrutivo (limpa storage antes de popular). Mantenha
 * atrás de `__DEV__` quando expor para a UI.
 */

const TIME_DEFAULT = RULES_DEFAULTS.timeMatch;

export async function devLimparStorage(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const peladaKeys = keys.filter((k) => k.startsWith(STORAGE_NAMESPACE));
  if (peladaKeys.length > 0) {
    await AsyncStorage.multiRemove(peladaKeys);
  }
}

export type CenarioId =
  | "vazio"
  | "uma-pelada-vazia"
  | "uma-pelada-com-execucoes"
  | "tres-peladas-mix"
  | "avulsa-em-andamento";

export type CenarioDescricao = {
  id: CenarioId;
  titulo: string;
  descricao: string;
};

export const CENARIOS: CenarioDescricao[] = [
  {
    id: "vazio",
    titulo: "Vazio (estado inicial)",
    descricao: "Storage zerado. Home mostra a tela de gestão sem nada.",
  },
  {
    id: "uma-pelada-vazia",
    titulo: "1 pelada cadastrada (sem execuções)",
    descricao:
      "Fute CEF 4×4 cadastrada, sem execuções ainda. Sem execução ativa.",
  },
  {
    id: "uma-pelada-com-execucoes",
    titulo: "1 pelada com 3 execuções (1 ativa)",
    descricao:
      "Fute CEF com 3 execuções, a mais recente em andamento como ativa.",
  },
  {
    id: "tres-peladas-mix",
    titulo: "3 peladas com execuções variadas",
    descricao:
      "Fute CEF, Fute BB e Fute Sexta cadastradas, com execuções espalhadas e nenhuma ativa.",
  },
  {
    id: "avulsa-em-andamento",
    titulo: "Execução avulsa em andamento",
    descricao:
      "Sem peladas cadastradas, mas uma execução avulsa ativa com 6 jogadores.",
  },
];

export async function devAplicarCenario(
  repo: RepositorioPelada,
  cenario: CenarioId,
): Promise<void> {
  await devLimparStorage();
  switch (cenario) {
    case "vazio":
      return;
    case "uma-pelada-vazia":
      await criarPeladaCef(repo);
      return;
    case "uma-pelada-com-execucoes":
      await cenarioCefComTresExecucoes(repo);
      return;
    case "tres-peladas-mix":
      await cenarioTresPeladasMix(repo);
      return;
    case "avulsa-em-andamento":
      await cenarioAvulsaEmAndamento(repo);
      return;
  }
}

async function criarPeladaCef(repo: RepositorioPelada): Promise<Pelada> {
  const pelada = new Pelada({
    nome: "Fute CEF",
    regras: {
      playersPerTeam: 4,
      timeMatch: TIME_DEFAULT,
      numberTimes: 1,
      goalLimit: 2,
      choosingTeams: ChoosingTeams.BY_ORDER,
    },
  });
  await repo.salvarPelada(pelada);
  return pelada;
}

async function cenarioCefComTresExecucoes(
  repo: RepositorioPelada,
): Promise<void> {
  const pelada = await criarPeladaCef(repo);
  const agora = Date.now();
  const dia = 24 * 60 * 60 * 1000;

  // Duas execuções antigas finalizadas.
  for (let i = 2; i >= 1; i--) {
    const exec = execucaoBase(pelada, agora - i * 7 * dia);
    exec.setPlayers(NOMES_CEF);
    exec.iniciar();
    exec.finalizar();
    await repo.salvar(exec);
  }

  // Execução ativa: 8 jogadores, sem partida ainda.
  const ativa = execucaoBase(pelada, agora);
  ativa.setPlayers(NOMES_CEF);
  ativa.iniciar();
  await repo.salvar(ativa);
  await definirAtiva(ativa.id);
}

async function cenarioTresPeladasMix(repo: RepositorioPelada): Promise<void> {
  const agora = Date.now();
  const dia = 24 * 60 * 60 * 1000;

  const cef = new Pelada({
    nome: "Fute CEF",
    regras: { playersPerTeam: 4, timeMatch: TIME_DEFAULT, goalLimit: 2 },
  });
  const bb = new Pelada({
    nome: "Fute BB",
    regras: { playersPerTeam: 5, timeMatch: "00:15:00", goalLimit: 3 },
  });
  const sexta = new Pelada({
    nome: "Fute Sexta",
    regras: { playersPerTeam: 3, timeMatch: "00:08:00", goalLimit: 2 },
  });
  for (const p of [cef, bb, sexta]) await repo.salvarPelada(p);

  // CEF: 2 execuções finalizadas
  for (let i = 2; i >= 1; i--) {
    const exec = execucaoBase(cef, agora - i * 7 * dia);
    exec.setPlayers(NOMES_CEF);
    exec.iniciar();
    exec.finalizar();
    await repo.salvar(exec);
  }
  // BB: 1 finalizada
  const execBB = execucaoBase(bb, agora - 14 * dia);
  execBB.setPlayers(NOMES_BB);
  execBB.iniciar();
  execBB.finalizar();
  await repo.salvar(execBB);
  // Sexta: nenhuma execução
}

async function cenarioAvulsaEmAndamento(
  repo: RepositorioPelada,
): Promise<void> {
  const exec = new GameManager(
    NOME_AVULSA_DEFAULT,
    new Rules({ playersPerTeam: 3, timeMatch: TIME_DEFAULT, goalLimit: 2 }),
  );
  exec.setPlayers(["Ana", "Bia", "Caio", "Davi", "Eva", "Fê"]);
  exec.iniciar();
  await repo.salvar(exec);
  await definirAtiva(exec.id);
}

function execucaoBase(pelada: Pelada, createdAt: number): GameManager {
  return new GameManager(
    pelada.nome,
    new Rules(pelada.regras.toData()),
    { peladaId: pelada.id, createdAt },
  );
}

async function definirAtiva(id: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ATIVA_ID, id);
}

const NOMES_CEF = [
  "Paulo",
  "Marcos",
  "Rodrigo",
  "Oliveira",
  "Matos",
  "Peres",
  "Ramos",
  "Otávio",
];

const NOMES_BB = [
  "Ana",
  "Bia",
  "Caio",
  "Davi",
  "Eva",
  "Fê",
  "Gabi",
  "Hugo",
  "Ian",
  "Júlia",
];
