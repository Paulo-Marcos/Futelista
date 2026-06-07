import { act, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { STORAGE_KEYS } from "@/src/infrastructure/storage/storageKeys";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { THEME_REGISTRY } from "./themes";
import { ThemeProvider, useTheme } from "./themeContext";

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
      __raw: () => store,
    },
  };
});

function flushPromises() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function ThemeProbe() {
  const t = useTheme();
  return (
    <Text testID="probe">{`${t.themeId}|${t.effectiveMode}|${t.palette.primary}|${t.hydrating ? "h" : "r"}`}</Text>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    (AsyncStorage as unknown as { __reset: () => void }).__reset();
  });

  it("deverá começar com rubro-negro como tema padrão", async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    await flushPromises();
    const [id, mode, primary, status] = (
      getByTestId("probe").props.children as string
    ).split("|");
    expect(id).toBe("rubro");
    expect(["light", "dark"]).toContain(mode);
    expect(primary).toBe(
      THEME_REGISTRY.rubro[mode as "light" | "dark"].primary,
    );
    expect(status).toBe("r");
  });

  it("deverá hidratar o tema persistido do storage", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.THEME,
      JSON.stringify({ themeId: "verde", mode: "dark" }),
    );

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    await flushPromises();
    expect(getByTestId("probe").props.children).toBe(
      `verde|dark|${THEME_REGISTRY.verde.dark.primary}|r`,
    );
  });

  it("deverá persistir a troca de tema no storage", async () => {
    function Switcher() {
      const { themeId, setThemeId } = useTheme();
      React.useEffect(() => {
        if (themeId === "rubro") setThemeId("azulpb");
      }, [themeId, setThemeId]);
      return <ThemeProbe />;
    }

    render(
      <ThemeProvider>
        <Switcher />
      </ThemeProvider>,
    );
    await flushPromises();
    await flushPromises();

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.THEME,
      JSON.stringify({ themeId: "azulpb", mode: "system" }),
    );
  });

  it("deverá ignorar persistência corrompida e cair no default", async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, "{nao_e_json");
    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    await flushPromises();
    const txt = getByTestId("probe").props.children as string;
    expect(txt.startsWith("rubro|")).toBe(true);
  });
});

describe("useTheme sem provider", () => {
  it("deverá funcionar com o tema padrão (sem provider)", () => {
    const { getByTestId } = render(<ThemeProbe />);
    const txt = getByTestId("probe").props.children as string;
    expect(txt.startsWith("rubro|")).toBe(true);
  });
});
