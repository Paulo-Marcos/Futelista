import AsyncStorage from "@react-native-async-storage/async-storage";

import { GestorJogo, PeladaStatus } from "@/src/domain/GestorJogo";
import { Pelada } from "@/src/domain/Pelada";
import { ChoosingTeams, Rules } from "@/src/domain/Rules";

import { AsyncStoragePeladaRepository } from "./AsyncStoragePeladaRepository";

jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store.get(k) ?? null),
      setItem: jest.fn(async (k: string, v: string) => {
        store.set(k, v);
      }),
      removeItem: jest.fn(async (k: string) => {
        store.delete(k);
      }),
      getAllKeys: jest.fn(async () => [...store.keys()]),
      multiGet: jest.fn(async (keys: string[]) =>
        keys.map((k) => [k, store.get(k) ?? null] as [string, string | null]),
      ),
      __reset: () => store.clear(),
    },
  };
});

describe("AsyncStoragePeladaRepository", () => {
  let repo: AsyncStoragePeladaRepository;

  beforeEach(() => {
    repo = new AsyncStoragePeladaRepository();
    (AsyncStorage as unknown as { __reset: () => void }).__reset();
  });

  it("retorna null quando a pelada não foi salva ainda", async () => {
    const carregada = await repo.carregar("inexistente");
    expect(carregada).toBeNull();
  });

  it("salva e recarrega uma pelada preservando o nome", async () => {
    const original = new GestorJogo("Pelada Quarta", new Rules());
    original.addPlayer("Zé");

    await repo.salvar(original);
    const recarregada = await repo.carregar(original.id);

    expect(recarregada).not.toBeNull();
    expect(recarregada!.name).toBe("Pelada Quarta");
    expect(recarregada!.players[0].name).toBe("Zé");
  });

  it("limpar remove a pelada do storage", async () => {
    const jogo = new GestorJogo("Para deletar", new Rules());
    await repo.salvar(jogo);

    await repo.limpar(jogo.id);

    expect(await repo.carregar(jogo.id)).toBeNull();
  });

  it("usa chave prefixada para evitar colisão com outros dados", async () => {
    const jogo = new GestorJogo("Sábado", new Rules());
    await repo.salvar(jogo);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      `futelista:execucao:${jogo.id}`,
      expect.any(String),
    );
  });

  it("carrega execução salva na chave legada (futelista:pelada:<id>)", async () => {
    const legacyGame = new GestorJogo("Legada", new Rules());
    // Simula payload escrito pela versão anterior do app na chave legada.
    const raw = JSON.stringify({
      version: 2,
      pelada: {
        id: legacyGame.id,
        name: "Legada",
        playersWithoutTeam: 0,
        advantageToNextTeamId: null,
        playingMatchId: null,
        status: PeladaStatus.ATIVA,
        createdAt: 0,
        startedAt: null,
        endedAt: null,
      },
      rules: {
        id: legacyGame.rules.id,
        name: legacyGame.rules.name,
        playersPerTeam: 4,
        timeMatch: "00:10:00",
        numberTimes: 1,
        goalLimit: 2,
        choosingTeams: ChoosingTeams.BY_ORDER,
      },
      players: [],
      teams: [],
      matches: [],
      nextTeamIds: [],
      matchHistoryIds: [],
      timer: null,
    });
    await AsyncStorage.setItem(`futelista:pelada:${legacyGame.id}`, raw);

    const recarregada = await repo.carregar(legacyGame.id);
    expect(recarregada).not.toBeNull();
    expect(recarregada!.name).toBe("Legada");
  });

  describe("listar (execuções)", () => {
    it("retorna lista vazia quando não há execuções salvas", async () => {
      expect(await repo.listar()).toEqual([]);
    });

    it("inclui só chaves com o prefixo de execução", async () => {
      await AsyncStorage.setItem("outra:coisa", "ignorar");
      await AsyncStorage.setItem(
        "futelista:peladaTipo:abc",
        '{"version":1,"id":"abc","nome":"T","createdAt":0,"regras":{}}',
      );
      const jogo = new GestorJogo("Pelada", new Rules());
      await repo.salvar(jogo);

      const resumos = await repo.listar();
      expect(resumos).toHaveLength(1);
      expect(resumos[0].id).toBe(jogo.id);
    });

    it("traz status, nome e totais no resumo", async () => {
      const jogo = new GestorJogo("Quinta", new Rules());
      jogo.addPlayer("Ana");
      jogo.iniciar();
      await repo.salvar(jogo);

      const [resumo] = await repo.listar();
      expect(resumo.name).toBe("Quinta");
      expect(resumo.status).toBe(PeladaStatus.ATIVA);
      expect(resumo.totalJogadores).toBe(1);
      expect(resumo.totalPartidas).toBe(0);
      expect(resumo.startedAt).toBeDefined();
    });

    it("ordena mais recente primeiro", async () => {
      const antiga = new GestorJogo("Antiga", new Rules(), {
        createdAt: 100,
      });
      const recente = new GestorJogo("Recente", new Rules(), {
        createdAt: 200,
      });
      await repo.salvar(antiga);
      await repo.salvar(recente);

      const resumos = await repo.listar();
      expect(resumos.map((r) => r.name)).toEqual(["Recente", "Antiga"]);
    });

    it("descarta payloads corrompidos sem quebrar a listagem", async () => {
      await AsyncStorage.setItem(
        "futelista:execucao:lixo",
        "isso-nao-eh-json",
      );
      const jogo = new GestorJogo("Boa", new Rules());
      await repo.salvar(jogo);

      const resumos = await repo.listar();
      expect(resumos).toHaveLength(1);
      expect(resumos[0].name).toBe("Boa");
    });
  });

  describe("Pelada (tipo cadastrado)", () => {
    it("salva e recarrega uma Pelada preservando nome e regras", async () => {
      const pelada = new Pelada({
        nome: "Fute CEF",
        regras: { playersPerTeam: 5, goalLimit: 3 },
      });

      await repo.salvarPelada(pelada);
      const recarregada = await repo.carregarPelada(pelada.id);

      expect(recarregada).not.toBeNull();
      expect(recarregada!.nome).toBe("Fute CEF");
      expect(recarregada!.regras.playersPerTeam).toBe(5);
      expect(recarregada!.regras.goalLimit).toBe(3);
    });

    it("excluirPelada remove apenas o tipo", async () => {
      const pelada = new Pelada({ nome: "X" });
      await repo.salvarPelada(pelada);
      await repo.excluirPelada(pelada.id);
      expect(await repo.carregarPelada(pelada.id)).toBeNull();
    });

    it("listarPeladas devolve resumo com totalExecucoes", async () => {
      const pelada = new Pelada({ nome: "Fute BB" });
      await repo.salvarPelada(pelada);
      const g1 = new GestorJogo("BB 01/jun", new Rules(), {
        peladaId: pelada.id,
      });
      const g2 = new GestorJogo("BB 08/jun", new Rules(), {
        peladaId: pelada.id,
      });
      const orfa = new GestorJogo("Avulsa", new Rules());
      await repo.salvar(g1);
      await repo.salvar(g2);
      await repo.salvar(orfa);

      const tipos = await repo.listarPeladas();

      expect(tipos).toHaveLength(1);
      expect(tipos[0].nome).toBe("Fute BB");
      expect(tipos[0].totalExecucoes).toBe(2);
    });

    it("listarExecucoesDe filtra pelo peladaId", async () => {
      const a = new Pelada({ nome: "A" });
      const b = new Pelada({ nome: "B" });
      await repo.salvarPelada(a);
      await repo.salvarPelada(b);
      const exA = new GestorJogo("ex-a", new Rules(), { peladaId: a.id });
      const exB = new GestorJogo("ex-b", new Rules(), { peladaId: b.id });
      await repo.salvar(exA);
      await repo.salvar(exB);

      const exsDeA = await repo.listarExecucoesDe(a.id);
      expect(exsDeA).toHaveLength(1);
      expect(exsDeA[0].name).toBe("ex-a");
    });
  });
});
