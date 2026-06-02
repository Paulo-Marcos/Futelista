import { Pelada } from "./Pelada";
import { ChoosingTeams, Rules } from "./Rules";

describe("Pelada (tipo cadastrado)", () => {
  it("cria com nome, regras default e id gerado", () => {
    const pelada = new Pelada({ nome: "Fute CEF" });
    expect(pelada.nome).toBe("Fute CEF");
    expect(pelada.regras).toBeInstanceOf(Rules);
    expect(pelada.id).toBeDefined();
    expect(pelada.id.length).toBeGreaterThan(8);
    expect(pelada.createdAt).toBeLessThanOrEqual(Date.now());
  });

  it("preserva id e createdAt quando fornecidos (reidratação)", () => {
    const pelada = new Pelada({
      id: "abc",
      nome: "X",
      createdAt: 1234,
    });
    expect(pelada.id).toBe("abc");
    expect(pelada.createdAt).toBe(1234);
  });

  it("aceita DataRules e instancia Rules internamente", () => {
    const pelada = new Pelada({
      nome: "Quinta",
      regras: {
        playersPerTeam: 5,
        timeMatch: "00:08:00",
        goalLimit: 3,
        choosingTeams: ChoosingTeams.BY_MIXING_TEAMS,
      },
    });
    expect(pelada.regras.playersPerTeam).toBe(5);
    expect(pelada.regras.choosingTeams).toBe(ChoosingTeams.BY_MIXING_TEAMS);
  });

  it("aceita instância de Rules já pronta", () => {
    const regras = new Rules({ playersPerTeam: 6 });
    const pelada = new Pelada({ nome: "Sábado", regras });
    expect(pelada.regras).toBe(regras);
  });

  it("trim no nome ao criar", () => {
    const pelada = new Pelada({ nome: "  Fute  " });
    expect(pelada.nome).toBe("Fute");
  });

  it("rejeita nome vazio", () => {
    expect(() => new Pelada({ nome: "" })).toThrowError(
      "Nome da pelada é obrigatório.",
    );
    expect(() => new Pelada({ nome: "   " })).toThrowError(
      "Nome da pelada é obrigatório.",
    );
  });

  it("renomeia validando nome não vazio", () => {
    const pelada = new Pelada({ nome: "X" });
    pelada.renomear(" Novo ");
    expect(pelada.nome).toBe("Novo");
    expect(() => pelada.renomear("")).toThrowError(
      "Nome da pelada é obrigatório.",
    );
  });

  it("atualizarRegras preserva id das regras e aplica defaults parciais", () => {
    const pelada = new Pelada({
      nome: "X",
      regras: { playersPerTeam: 4, goalLimit: 2 },
    });
    const idRegras = pelada.regras.id;
    pelada.atualizarRegras({ goalLimit: 5 });
    expect(pelada.regras.id).toBe(idRegras);
    expect(pelada.regras.playersPerTeam).toBe(4);
    expect(pelada.regras.goalLimit).toBe(5);
  });
});
