import AsyncStorage from "@react-native-async-storage/async-storage";

import { GameManager } from "@/src/domain/GameManager";
import { Rules } from "@/src/domain/Rules";

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
    const original = new GameManager("Pelada Quarta", new Rules());
    original.addPlayer("Zé");

    await repo.salvar(original);
    const recarregada = await repo.carregar(original.id);

    expect(recarregada).not.toBeNull();
    expect(recarregada!.name).toBe("Pelada Quarta");
    expect(recarregada!.players[0].name).toBe("Zé");
  });

  it("limpar remove a pelada do storage", async () => {
    const game = new GameManager("Para deletar", new Rules());
    await repo.salvar(game);

    await repo.limpar(game.id);

    expect(await repo.carregar(game.id)).toBeNull();
  });

  it("usa chave prefixada para evitar colisão com outros dados", async () => {
    const game = new GameManager("Sábado", new Rules());
    await repo.salvar(game);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      `futelista:pelada:${game.id}`,
      expect.any(String),
    );
  });
});
