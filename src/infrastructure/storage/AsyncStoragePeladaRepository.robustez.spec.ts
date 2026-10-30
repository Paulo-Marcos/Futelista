import AsyncStorage from "@react-native-async-storage/async-storage";

import { GestorJogo } from "@/src/domain/GestorJogo";
import { Rules } from "@/src/domain/Rules";

import { AsyncStoragePeladaRepository } from "./AsyncStoragePeladaRepository";
import { STORAGE_KEYS, execucaoKey } from "./storageKeys";

async function limparStorage() {
  const keys = await AsyncStorage.getAllKeys();
  await Promise.all(keys.map((k) => AsyncStorage.removeItem(k)));
}

describe("AsyncStoragePeladaRepository — robustez de leitura (D-052)", () => {
  let repo: AsyncStoragePeladaRepository;

  beforeEach(async () => {
    repo = new AsyncStoragePeladaRepository();
    await limparStorage();
  });

  it("carregarExecucoesDe pula a execução corrompida e devolve as demais", async () => {
    const boa = new GestorJogo("Quarta", new Rules(), { peladaId: "p1" });
    await repo.salvar(boa);
    // Resumo legível (tem id e peladaId), mas payload incompleto para
    // reconstruir o GestorJogo — o caso real de um save corrompido.
    await AsyncStorage.setItem(
      execucaoKey("quebrada"),
      JSON.stringify({ pelada: { id: "quebrada", peladaId: "p1" } }),
    );

    const carregadas = await repo.carregarExecucoesDe("p1");

    expect(carregadas.map((g) => g.id)).toEqual([boa.id]);
  });

  it("listar ignora o slot da pelada ativa, que mora no prefixo legado", async () => {
    const exec = new GestorJogo("Quinta", new Rules());
    await repo.salvar(exec);
    await AsyncStorage.setItem(STORAGE_KEYS.ATIVA_ID, exec.id);
    const multiGet = AsyncStorage.multiGet as jest.Mock;
    multiGet.mockClear();

    const resumos = await repo.listar();

    expect(resumos.map((r) => r.id)).toEqual([exec.id]);
    expect(multiGet.mock.calls[0][0]).not.toContain(STORAGE_KEYS.ATIVA_ID);
  });
});
