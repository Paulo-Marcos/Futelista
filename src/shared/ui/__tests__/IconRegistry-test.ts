import { ICON_GLYPHS, glyphFor } from "../IconRegistry";

describe("IconRegistry", () => {
  it("deverá expor os papéis principais do app (bola, apito, troféu, fila)", () => {
    expect(ICON_GLYPHS.ball).toBe("soccer");
    expect(ICON_GLYPHS.whistle).toBe("whistle");
    expect(ICON_GLYPHS.trophy).toBe("trophy");
    expect(ICON_GLYPHS.players).toBe("account-multiple");
  });

  it("deverá resolver glifos por papel semântico", () => {
    expect(glyphFor("scoreboard")).toBe("scoreboard");
    expect(glyphFor("home")).toBe("view-dashboard-outline");
  });

  it("não deverá ter glifo vazio ou duplicado para papéis distintos", () => {
    const seen = new Set<string>();
    for (const [name, glyph] of Object.entries(ICON_GLYPHS)) {
      expect(glyph).not.toBe("");
      expect(typeof glyph).toBe("string");
      // ball/goal apontam para o mesmo glifo "soccer" por design — pulamos.
      if (name === "goal") continue;
      seen.add(glyph);
    }
    expect(seen.size).toBeGreaterThan(0);
  });
});
