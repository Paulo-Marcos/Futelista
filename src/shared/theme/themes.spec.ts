import {
  DEFAULT_THEME_ID,
  THEME_IDS,
  THEME_REGISTRY,
  getPalette,
  isThemeId,
  type Palette,
} from "./themes";

const REQUIRED_KEYS: readonly (keyof Palette)[] = [
  "primary",
  "primaryDim",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondary",
  "onSecondary",
  "tertiary",
  "background",
  "surface",
  "surfaceVariant",
  "surfaceContainerLow",
  "surfaceContainerHigh",
  "onSurface",
  "onSurfaceVariant",
  "outline",
  "outlineVariant",
  "error",
  "onError",
  "errorContainer",
  "success",
  "goal",
  "warning",
  "shadow",
  "glow",
  "fieldA",
  "fieldB",
  "fieldLine",
];

describe("THEME_REGISTRY", () => {
  it("deverá expor as 7 paletas previstas no handoff", () => {
    expect(THEME_IDS).toEqual([
      "rubro",
      "verde",
      "azulpb",
      "grena",
      "pb",
      "azul",
      "amareloverde",
    ]);
    expect(Object.keys(THEME_REGISTRY).sort()).toEqual([...THEME_IDS].sort());
  });

  it("deverá ter rubro-negro como tema padrão", () => {
    expect(DEFAULT_THEME_ID).toBe("rubro");
    expect(THEME_REGISTRY.rubro.label).toBe("Rubro-negro");
  });

  it.each(THEME_IDS)(
    "deverá conter todos os tokens em claro e escuro para %s",
    (id) => {
      const descriptor = THEME_REGISTRY[id];
      for (const mode of ["light", "dark"] as const) {
        const palette = descriptor[mode];
        for (const key of REQUIRED_KEYS) {
          expect(palette[key]).toBeDefined();
          expect(typeof palette[key]).toBe("string");
          expect(palette[key]).not.toBe("");
        }
      }
    },
  );

  it("deverá usar o gramado escuro premium no modo escuro", () => {
    const dark = THEME_REGISTRY.rubro.dark;
    expect(dark.fieldA).toBe("#163A24");
    expect(dark.fieldB).toBe("#13321F");
  });

  it("deverá usar o gramado claro com linhas brancas no modo claro", () => {
    const light = THEME_REGISTRY.rubro.light;
    expect(light.fieldA).toBe("#43A64F");
    expect(light.fieldB).toBe("#3A9446");
  });

  it("deverá manter a primária escura igual ao spec do protótipo", () => {
    expect(THEME_REGISTRY.rubro.dark.primary).toBe("#EE2737");
    expect(THEME_REGISTRY.verde.dark.primary).toBe("#15B25A");
    expect(THEME_REGISTRY.amareloverde.dark.primary).toBe("#F5C518");
  });
});

describe("isThemeId", () => {
  it("deverá aceitar apenas ids declarados", () => {
    expect(isThemeId("rubro")).toBe(true);
    expect(isThemeId("verde")).toBe(true);
    expect(isThemeId("naoexiste")).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
    expect(isThemeId(null)).toBe(false);
    expect(isThemeId(42)).toBe(false);
  });
});

describe("getPalette", () => {
  it("deverá retornar a mesma referência para o mesmo (id, modo)", () => {
    const a = getPalette("verde", "dark");
    const b = getPalette("verde", "dark");
    expect(a).toBe(b);
  });

  it("deverá retornar paletas distintas para modos diferentes", () => {
    const dark = getPalette("rubro", "dark");
    const light = getPalette("rubro", "light");
    expect(dark).not.toBe(light);
    expect(dark.background).not.toBe(light.background);
  });
});
