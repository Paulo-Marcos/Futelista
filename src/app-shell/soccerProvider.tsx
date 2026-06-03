import { useCallback, useEffect, useRef, useState } from "react";

import {
  AUTOSAVE_DEBOUNCE_MS,
  NOME_AVULSA_DEFAULT,
} from "@/src/app-shell/constants";
import {
  definirPeladaAtivaId,
  lerPeladaAtivaId,
  limparPeladaAtivaId,
} from "@/src/app-shell/peladaAtiva";
import { SoccerContext } from "@/src/app-shell/soccerContext";
import { GameManager } from "@/src/domain/GameManager";
import { Pelada } from "@/src/domain/Pelada";
import {
  RepositorioPelada,
  ResumoExecucao,
  ResumoPeladaTipo,
} from "@/src/domain/ports/RepositorioPelada";
import { DataRules, Rules } from "@/src/domain/Rules";
import { AsyncStoragePeladaRepository } from "@/src/infrastructure/storage/AsyncStoragePeladaRepository";

/**
 * Provider raiz que orquestra Pelada (tipo) e Execução (sessão).
 *
 * Boot:
 *  1. Lê o id da execução ativa em AsyncStorage.
 *  2. Carrega via repositório; se não houver execução ativa, mantém
 *     `manager` como null — a UI assume estado de "gestão".
 *
 * Diferente da versão anterior, **não cria** execução default no boot:
 *  isso forçava o usuário a ver uma pelada vazia que ele nunca pediu.
 *
 * Durante a vida do app:
 *  - Subscribe no GameManager (quando ativo) dispara salvamento debounced.
 *  - `saving` reflete em tempo real escritas pendentes.
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
  const [bootConcluido, setBootConcluido] = useState(false);
  const [saving, setSaving] = useState(false);
  const escritasPendentesRef = useRef(0);

  const marcarSalvamento = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      escritasPendentesRef.current++;
      setSaving(true);
      try {
        return await fn();
      } finally {
        escritasPendentesRef.current--;
        if (escritasPendentesRef.current === 0) setSaving(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelado = false;
    async function carregar(): Promise<GameManager | null> {
      const id = await lerPeladaAtivaId();
      if (!id) return null;
      try {
        return await repoRef.current.carregar(id);
      } catch (erro) {
        console.warn("[SoccerProvider] Falha ao carregar execução:", erro);
        return null;
      }
    }
    carregar().then((carregada) => {
      if (cancelado) return;
      setManager(carregada);
      setBootConcluido(true);
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
        marcarSalvamento(() => repoRef.current.salvar(manager)).catch(
          (erro) => {
            console.warn("[SoccerProvider] Falha ao salvar execução:", erro);
          },
        );
      }, AUTOSAVE_DEBOUNCE_MS);
    };

    const desinscrever = manager.subscribe(salvarDebounced);
    return () => {
      desinscrever();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [manager, marcarSalvamento]);

  /**
   * Salva a execução anterior (se existir), persiste a próxima execução
   * e marca-a como ativa no storage.
   */
  const trocarManager = useCallback(
    async (proximo: GameManager): Promise<void> => {
      await marcarSalvamento(async () => {
        if (manager) {
          try {
            await repoRef.current.salvar(manager);
          } catch (erro) {
            console.warn(
              "[SoccerProvider] Falha ao salvar execução anterior:",
              erro,
            );
          }
        }
        await repoRef.current.salvar(proximo);
        await definirPeladaAtivaId(proximo.id);
      });
      setManager(proximo);
    },
    [manager, marcarSalvamento],
  );

  // ----- Pelada (tipo cadastrado) ------------------------------------

  const criarPelada = useCallback(
    async (nome: string, regras?: DataRules): Promise<Pelada> => {
      const pelada = new Pelada({ nome, regras });
      await marcarSalvamento(() => repoRef.current.salvarPelada(pelada));
      return pelada;
    },
    [marcarSalvamento],
  );

  const atualizarPelada = useCallback(
    async (
      id: string,
      patch: { nome?: string; regras?: DataRules },
    ): Promise<Pelada> => {
      const pelada = await repoRef.current.carregarPelada(id);
      if (!pelada) throw Error("Pelada não encontrada.");
      if (patch.nome !== undefined) pelada.renomear(patch.nome);
      if (patch.regras) pelada.atualizarRegras(patch.regras);
      await marcarSalvamento(() => repoRef.current.salvarPelada(pelada));
      return pelada;
    },
    [marcarSalvamento],
  );

  const excluirPelada = useCallback(
    async (id: string): Promise<void> => {
      await marcarSalvamento(() => repoRef.current.excluirPelada(id));
    },
    [marcarSalvamento],
  );

  const listarPeladas = useCallback(
    (): Promise<ResumoPeladaTipo[]> => repoRef.current.listarPeladas(),
    [],
  );

  const carregarPelada = useCallback(
    (id: string): Promise<Pelada | null> => repoRef.current.carregarPelada(id),
    [],
  );

  // ----- Execução ----------------------------------------------------

  const iniciarExecucao = useCallback(
    async (
      peladaId: string,
      opcoes?: { nomeExecucao?: string; herdarJogadores?: boolean },
    ): Promise<void> => {
      const pelada = await repoRef.current.carregarPelada(peladaId);
      if (!pelada) throw Error("Pelada não encontrada.");
      const nome = opcoes?.nomeExecucao?.trim() || pelada.nome;
      const nova = new GameManager(nome, new Rules(pelada.regras.toData()), {
        peladaId,
      });
      if (opcoes?.herdarJogadores) {
        const jogadores = await jogadoresDaUltimaExecucaoDe(
          repoRef.current,
          peladaId,
        );
        if (jogadores.length > 0) nova.addPlayerList(jogadores);
      }
      nova.iniciar();
      await trocarManager(nova);
    },
    [trocarManager],
  );

  const iniciarExecucaoAvulsa = useCallback(
    async (nome?: string, regras?: DataRules): Promise<void> => {
      const nomeFinal = nome?.trim() || NOME_AVULSA_DEFAULT;
      const nova = new GameManager(nomeFinal, new Rules(regras));
      nova.iniciar();
      await trocarManager(nova);
    },
    [trocarManager],
  );

  const finalizarExecucao = useCallback(async (): Promise<void> => {
    if (!manager) return;
    manager.finalizar();
    await marcarSalvamento(async () => {
      await repoRef.current.salvar(manager);
      await limparPeladaAtivaId();
    });
    setManager(null);
  }, [manager, marcarSalvamento]);

  const voltarParaGestao = useCallback(async (): Promise<void> => {
    if (!manager) return;
    await marcarSalvamento(async () => {
      await repoRef.current.salvar(manager);
      await limparPeladaAtivaId();
    });
    setManager(null);
  }, [manager, marcarSalvamento]);

  const salvarExecucaoAtualComoPelada = useCallback(
    async (nome: string, regras?: DataRules): Promise<Pelada> => {
      if (!manager)
        throw Error("Não há execução ativa para salvar como pelada.");
      const regrasFinais = regras ?? manager.rules.toData();
      const pelada = new Pelada({ nome, regras: regrasFinais });
      manager.peladaId = pelada.id;
      await marcarSalvamento(async () => {
        await repoRef.current.salvarPelada(pelada);
        await repoRef.current.salvar(manager);
      });
      return pelada;
    },
    [manager, marcarSalvamento],
  );

  const limparJogadoresETimes = useCallback(async (): Promise<void> => {
    if (!manager) return;
    manager.limparJogadoresETimes();
    await marcarSalvamento(() => repoRef.current.salvar(manager));
  }, [manager, marcarSalvamento]);

  const selecionarExecucao = useCallback(
    async (id: string): Promise<void> => {
      if (manager && manager.id === id) return;
      const carregada = await repoRef.current.carregar(id);
      if (!carregada) throw Error("Execução não encontrada.");
      await trocarManager(carregada);
    },
    [manager, trocarManager],
  );

  const listarExecucoesDe = useCallback(
    (peladaId: string): Promise<ResumoExecucao[]> =>
      repoRef.current.listarExecucoesDe(peladaId),
    [],
  );

  // Bloqueia render até terminar o boot (evita flicker estado-vazio).
  if (!bootConcluido) return null;

  return (
    <SoccerContext.Provider
      value={{
        manager,
        saving,
        criarPelada,
        atualizarPelada,
        excluirPelada,
        listarPeladas,
        carregarPelada,
        iniciarExecucao,
        iniciarExecucaoAvulsa,
        finalizarExecucao,
        voltarParaGestao,
        salvarExecucaoAtualComoPelada,
        limparJogadoresETimes,
        selecionarExecucao,
        listarExecucoesDe,
        repositorio: repoRef.current,
      }}
    >
      {children}
    </SoccerContext.Provider>
  );
};

/**
 * Busca a execução mais recente associada à pelada e devolve os nomes
 * dos jogadores dela. Array vazio se não houver execução anterior.
 *
 * `listarExecucoesDe` já vem ordenado pelo mais recente primeiro, então
 * basta carregar o primeiro item para hidratar os jogadores.
 */
async function jogadoresDaUltimaExecucaoDe(
  repo: RepositorioPelada,
  peladaId: string,
): Promise<string[]> {
  const resumos = await repo.listarExecucoesDe(peladaId);
  if (resumos.length === 0) return [];
  const ultima = await repo.carregar(resumos[0].id);
  if (!ultima) return [];
  return ultima.players.map((p) => p.name);
}
