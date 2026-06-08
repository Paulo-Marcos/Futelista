import { gerarBackup, gerarBackupJSON, StorageAPI } from "./backup";

function fakeStorage(items: Record<string, string>): StorageAPI {
  return {
    getAllKeys: async () => Object.keys(items),
    multiGet: async (keys) =>
      keys.map((k) => [k, items[k] ?? null] as [string, string | null]),
  };
}

describe("gerarBackup", () => {
  it("retorna payload vazio quando o storage está vazio", async () => {
    const payload = await gerarBackup(fakeStorage({}), 1700000000000);
    expect(payload).toEqual({
      version: 1,
      app: "FuteLista",
      exportadoEm: 1700000000000,
      items: [],
    });
  });

  it("inclui só itens com prefixo `futelista:`", async () => {
    const payload = await gerarBackup(
      fakeStorage({
        "futelista:peladaTipo:a": '{"nome":"X"}',
        "outraapp:foo": "bar",
        "futelista:execucao:b": "{}",
      }),
      1,
    );
    const keys = payload.items.map((i) => i.key);
    expect(keys).toContain("futelista:peladaTipo:a");
    expect(keys).toContain("futelista:execucao:b");
    expect(keys).not.toContain("outraapp:foo");
  });

  it("ordena chaves alfabeticamente (diffs estáveis entre backups)", async () => {
    const payload = await gerarBackup(
      fakeStorage({
        "futelista:b": "2",
        "futelista:a": "1",
        "futelista:c": "3",
      }),
      1,
    );
    expect(payload.items.map((i) => i.key)).toEqual([
      "futelista:a",
      "futelista:b",
      "futelista:c",
    ]);
  });

  it("preserva os valores como strings (sem re-serializar)", async () => {
    const raw = '{"nome":"Fute","arr":[1,2,3]}';
    const payload = await gerarBackup(
      fakeStorage({ "futelista:peladaTipo:x": raw }),
      1,
    );
    expect(payload.items[0].value).toBe(raw);
  });

  it("ignora chaves cujo valor é null", async () => {
    // Mocka direto pra simular um null vindo do multiGet — o fakeStorage
    // helper já filtra; aqui injetamos manualmente.
    const storage: StorageAPI = {
      getAllKeys: async () => ["futelista:a", "futelista:b"],
      multiGet: async () => [
        ["futelista:a", "valor"],
        ["futelista:b", null],
      ],
    };
    const payload = await gerarBackup(storage, 1);
    expect(payload.items.map((i) => i.key)).toEqual(["futelista:a"]);
  });
});

describe("gerarBackupJSON", () => {
  it("produz JSON parseável que roundtripa pro objeto original", async () => {
    const storage = fakeStorage({
      "futelista:peladaTipo:x": '{"nome":"Y"}',
    });
    const json = await gerarBackupJSON(storage, 1700000000000);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
    expect(parsed.app).toBe("FuteLista");
    expect(parsed.exportadoEm).toBe(1700000000000);
    expect(parsed.items[0].key).toBe("futelista:peladaTipo:x");
    expect(parsed.items[0].value).toBe('{"nome":"Y"}');
  });
});
