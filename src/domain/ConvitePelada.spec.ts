import { gerarConvitePelada } from "./ConvitePelada";
import { Pelada } from "./Pelada";

describe("gerarConvitePelada (F-20)", () => {
  it("inclui o nome em emoji ⚽ no cabeçalho", () => {
    const p = new Pelada({ nome: "Fute CEF" });
    expect(gerarConvitePelada(p)).toContain("⚽ Fute CEF");
  });

  it("inclui dia + hora quando ambos estão preenchidos", () => {
    const p = new Pelada({
      nome: "X",
      dia: "Quartas",
      hora: "21:00",
    });
    const texto = gerarConvitePelada(p);
    expect(texto).toContain("📅 Quartas · 🕒 21:00");
  });

  it("omite linhas vazias quando campos opcionais ausentes", () => {
    const p = new Pelada({ nome: "X" });
    const texto = gerarConvitePelada(p);
    expect(texto).not.toContain("📅");
    expect(texto).not.toContain("🕒");
    expect(texto).not.toContain("📍");
  });

  it("inclui local quando preenchido", () => {
    const p = new Pelada({ nome: "X", local: "Quadra do CEF" });
    expect(gerarConvitePelada(p)).toContain("📍 Quadra do CEF");
  });

  it("formata regras como 'NxN · Mmin · até G gols'", () => {
    const p = new Pelada({
      nome: "X",
      regras: {
        playersPerTeam: 5,
        timeMatch: "00:08:00",
        numberTimes: 1,
        goalLimit: 3,
      },
    });
    expect(gerarConvitePelada(p)).toContain("5×5 · 8min · até 3 gols");
  });

  it("singulariza 'gol' quando goalLimit = 1", () => {
    const p = new Pelada({
      nome: "X",
      regras: {
        playersPerTeam: 4,
        timeMatch: "00:10:00",
        numberTimes: 1,
        goalLimit: 1,
      },
    });
    expect(gerarConvitePelada(p)).toContain("até 1 gol");
  });

  it("inclui observações quando preenchidas", () => {
    const p = new Pelada({ nome: "X", observacoes: "Levar coletes verdes" });
    expect(gerarConvitePelada(p)).toContain("Levar coletes verdes");
  });

  it("termina com a assinatura — FuteLista", () => {
    const p = new Pelada({ nome: "X" });
    expect(gerarConvitePelada(p).trim().endsWith("— FuteLista")).toBe(true);
  });
});
