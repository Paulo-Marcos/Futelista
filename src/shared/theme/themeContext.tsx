import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

import { STORAGE_KEYS } from "@/src/infrastructure/storage/storageKeys";

import {
  DEFAULT_THEME_ID,
  getPalette,
  isThemeId,
  THEME_REGISTRY,
  type Palette,
  type ThemeDescriptor,
  type ThemeId,
  type ThemeMode,
} from "./themes";

/**
 * `mode` armazena a preferência do usuário, não o modo resolvido:
 *
 * - `"system"` — segue o `useColorScheme()` do RN (default).
 * - `"light" | "dark"` — override manual feito pelo usuário.
 *
 * O `effectiveMode` é o que vale para resolver a paleta.
 */
export type ThemeModePreference = ThemeMode | "system";

type Persisted = { themeId: ThemeId; mode: ThemeModePreference };

type ThemeContextValue = {
  themeId: ThemeId;
  mode: ThemeModePreference;
  effectiveMode: ThemeMode;
  palette: Palette;
  descriptor: ThemeDescriptor;
  themes: readonly ThemeDescriptor[];
  setThemeId: (id: ThemeId) => void;
  setMode: (mode: ThemeModePreference) => void;
  /** `true` enquanto a preferência ainda não foi lida do storage. */
  hydrating: boolean;
};

/**
 * Marcador interno: quando o componente é renderizado **sem** o
 * `ThemeProvider` (caso típico de testes de unidade), `useTheme()` resolve
 * o modo seguindo `useColorScheme()` em vez de hardcodear um valor.
 */
const NO_PROVIDER = Symbol("themeContext.noProvider");

const ThemeContext = createContext<ThemeContextValue | typeof NO_PROVIDER>(
  NO_PROVIDER,
);

function isModePreference(value: unknown): value is ThemeModePreference {
  return value === "light" || value === "dark" || value === "system";
}

async function readPersisted(): Promise<Partial<Persisted>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: Partial<Persisted> = {};
    const obj = parsed as Record<string, unknown>;
    if (isThemeId(obj.themeId)) out.themeId = obj.themeId;
    if (isModePreference(obj.mode)) out.mode = obj.mode;
    return out;
  } catch {
    return {};
  }
}

async function writePersisted(state: Persisted): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(state));
  } catch {
    // Persistência best-effort; tema reverte ao default no próximo boot.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [mode, setModeState] = useState<ThemeModePreference>("system");
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    readPersisted().then((p) => {
      if (cancelled) return;
      if (p.themeId) setThemeIdState(p.themeId);
      if (p.mode) setModeState(p.mode);
      setHydrating(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setThemeId = useCallback(
    (id: ThemeId) => {
      setThemeIdState(id);
      writePersisted({ themeId: id, mode });
    },
    [mode],
  );

  const setMode = useCallback(
    (next: ThemeModePreference) => {
      setModeState(next);
      writePersisted({ themeId, mode: next });
    },
    [themeId],
  );

  const effectiveMode: ThemeMode = useMemo(() => {
    if (mode === "system") {
      return systemScheme === "light" ? "light" : "dark";
    }
    return mode;
  }, [mode, systemScheme]);

  const value = useMemo<ThemeContextValue>(() => {
    const descriptor = THEME_REGISTRY[themeId];
    return {
      themeId,
      mode,
      effectiveMode,
      palette: getPalette(themeId, effectiveMode),
      descriptor,
      themes: Object.values(THEME_REGISTRY),
      setThemeId,
      setMode,
      hydrating,
    };
  }, [themeId, mode, effectiveMode, setThemeId, setMode, hydrating]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Lê o tema corrente: paleta resolvida + setters.
 *
 * Funciona **sem provider** (cai no rubro-negro com modo seguindo
 * `useColorScheme()` do sistema) para componentes em testes que não
 * envolvem o `ThemeProvider`.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  const systemScheme = useColorScheme();
  if (ctx !== NO_PROVIDER) return ctx;

  const effectiveMode: ThemeMode = systemScheme === "dark" ? "dark" : "light";
  const descriptor = THEME_REGISTRY[DEFAULT_THEME_ID];
  return {
    themeId: DEFAULT_THEME_ID,
    mode: "system",
    effectiveMode,
    palette: descriptor[effectiveMode],
    descriptor,
    themes: Object.values(THEME_REGISTRY),
    setThemeId: () => undefined,
    setMode: () => undefined,
    hydrating: false,
  };
}
