import { useCallback, useEffect, useRef, useState } from "react";

import {
  definirPeladaAtivaId,
  lerPeladaAtivaId,
  limparPeladaAtivaId,
} from "@/src/app-shell/peladaAtiva";
import { SoccerContext } from "@/src/app-shell/soccerContext";
import { GameManager } from "@/src/domain/GameManager";
import { RepositorioPelada } from "@/src/domain/ports/RepositorioPelada";
import { DataRules, Rules } from "@/src/domain/Rules";
import { AsyncStoragePeladaRepository } from "@/src/infrastructure/storage/AsyncStoragePeladaRepository";

const AUTOSAVE_DEBOUNCE_MS = 500;
const NOME_PELADA_DEFAULT = "Pelada";

/**
 * Provider do GameManager com persistência automática.
 *
 * No mount:
 *  1. Lê o id da pelada ativa de AsyncStorage.
 *  2. Carrega a pelada via repositório; se não houver, cria uma nova.
 *  3. Disponibiliza o manager via SoccerContext.
 *
 * Durante a vida do app:
 *  - Subscribe no manager dispara salvamento debounced (500 ms).
 *  - Saídas de I/O são logadas mas não derrubam a UI — a próxima mudança
 *    tenta de novo.
 *
 * Também expõe `criarNovaPelada` e `limparDados` para a UI.
 */
export const SoccerProvider = ({
  children,
  repositorio,
}: {
  children: React.ReactNode;
  repositorio?: RepositorioPelada;
}) => {
  const repoRef = useRef<RepositorioPelada>(
    repositorio ?? new AsyncStoragePeladaRepository(),
  );
  const [manager, setManager] = useState<GameManager | null>(null);

  useEffect(() => {
    let cancelado = false;
    async function carregarOuCriar(): Promise<GameManager> {
      const id = await lerPeladaAtivaId();
      if (id) {
        try {
          const existente = await repoRef.current.carregar(id);
          if (existente) return existente;
        } catch (erro) {
          console.warn("[SoccerProvider] Falha ao carregar pelada:", erro);
        }
      }
      const nova = new GameManager(NOME_PELADA_DEFAULT, new Rules());
      await definirPeladaAtivaId(nova.id);
      return nova;
    }

    carregarOuCriar().then((carregada) => {
      if (!cancelado) setManager(carregada);
    });

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!manager) return;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const salvarDebounced = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        repoRef.current.salvar(manager).catch((erro) => {
          console.warn("[SoccerProvider] Falha ao salvar pelada:", erro);
        });
      }, AUTOSAVE_DEBOUNCE_MS);
    };

    const desinscrever = manager.subscribe(salvarDebounced);
    return () => {
      desinscrever();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [manager]);

  const criarNovaPelada = useCallback(
    async (nome?: string, regras?: DataRules): Promise<void> => {
      const nomeFinal = nome?.trim() || NOME_PELADA_DEFAULT;
      const nova = new GameManager(nomeFinal, new Rules(regras));
      // Salva a pelada antiga antes de trocar (caso autosave debounce
      // ainda não tenha escrito a última mudança).
      if (manager) {
        try {
          await repoRef.current.salvar(manager);
        } catch (erro) {
          console.warn(
            "[SoccerProvider] Falha ao salvar pelada anterior:",
            erro,
          );
        }
      }
      await repoRef.current.salvar(nova);
      await definirPeladaAtivaId(nova.id);
      setManager(nova);
    },
    [manager],
  );

  const limparDados = useCallback(async (): Promise<void> => {
    if (manager) {
      try {
        await repoRef.current.limpar(manager.id);
      } catch (erro) {
        console.warn("[SoccerProvider] Falha ao limpar pelada:", erro);
      }
    }
    await limparPeladaAtivaId();
    const nova = new GameManager(NOME_PELADA_DEFAULT, new Rules());
    await repoRef.current.salvar(nova);
    await definirPeladaAtivaId(nova.id);
    setManager(nova);
  }, [manager]);

  if (!manager) return null;

  return (
    <SoccerContext.Provider
      value={{ manager, criarNovaPelada, limparDados }}
    >
      {children}
    </SoccerContext.Provider>
  );
};
