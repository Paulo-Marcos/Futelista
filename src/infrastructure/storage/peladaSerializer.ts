import { Pelada } from "@/src/domain/Pelada";
import { ChoosingTeams, Rules } from "@/src/domain/Rules";

/**
 * Serializador da Pelada (tipo) — bem mais simples que o de GameManager
 * porque Pelada é só nome + regras + timestamps, sem grafo cíclico.
 */
const VERSION = 1;

type PeladaPayload = {
  version: number;
  id: string;
  nome: string;
  createdAt: number;
  regras: {
    id: string;
    name: string;
    playersPerTeam: number;
    timeMatch: string;
    numberTimes: number;
    goalLimit: number;
    choosingTeams: ChoosingTeams;
  };
};

export function serializePelada(pelada: Pelada): string {
  const payload: PeladaPayload = {
    version: VERSION,
    id: pelada.id,
    nome: pelada.nome,
    createdAt: pelada.createdAt,
    regras: {
      id: pelada.regras.id,
      name: pelada.regras.name,
      playersPerTeam: pelada.regras.playersPerTeam,
      timeMatch: pelada.regras.timeMatch,
      numberTimes: pelada.regras.numberTimes,
      goalLimit: pelada.regras.goalLimit,
      choosingTeams: pelada.regras.choosingTeams,
    },
  };
  return JSON.stringify(payload);
}

export function deserializePelada(raw: string): Pelada {
  const payload = JSON.parse(raw) as PeladaPayload;
  if (payload.version > VERSION) {
    throw Error(
      `Versão de payload de Pelada incompatível: máxima ${VERSION}, recebi ${payload.version}.`,
    );
  }
  return new Pelada({
    id: payload.id,
    nome: payload.nome,
    createdAt: payload.createdAt,
    regras: new Rules(payload.regras),
  });
}

/**
 * Resumo leve sem reidratar — útil para `listar()` rápido.
 */
export function parseResumoPelada(raw: string): {
  id: string;
  nome: string;
  createdAt: number;
  regras: PeladaPayload["regras"];
} | null {
  try {
    const p = JSON.parse(raw) as PeladaPayload;
    return {
      id: p.id,
      nome: p.nome,
      createdAt: p.createdAt ?? 0,
      regras: p.regras,
    };
  } catch {
    return null;
  }
}
