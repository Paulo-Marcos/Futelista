import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { STORAGE_KEYS } from "@/src/infrastructure/storage/storageKeys";

/**
 * Preferências globais do app — persistidas em AsyncStorage, mesmo
 * padrão do `themeContext`. Diferente do tema, as prefs daqui afetam
 * **comportamento** (avisos, vibração, etc.), não aparência.
 *
 * Hoje só temos `apitoHaptico`. Itens novos entram aqui com default
 * declarado — campos ausentes no payload persistido caem no default.
 */
export type Prefs = {
  /** Dispara vibração háptica quando o cronômetro da partida chega a 0. */
  apitoHaptico: boolean;
};

const DEFAULT_PREFS: Prefs = {
  apitoHaptico: true,
};

type PrefsContextValue = {
  prefs: Prefs;
  /** Atualiza um subconjunto das preferências (merge raso). */
  setPrefs: (patch: Partial<Prefs>) => void;
  /** `true` enquanto a preferência ainda não foi lida do storage. */
  hydrating: boolean;
};

/**
 * Mesmo marcador-sentinela usado pelo themeContext: quando o componente
 * é renderizado sem o `PrefsProvider` (testes de unidade), `usePrefs()`
 * retorna o default sem disparar erro.
 */
const NO_PROVIDER = Symbol("prefsContext.noProvider");

const PrefsContext = createContext<PrefsContextValue | typeof NO_PROVIDER>(
  NO_PROVIDER,
);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [hydrating, setHydrating] = useState(true);

  // Lê uma vez no mount. Erros caem no default — o app não pode ficar
  // travado por causa de preferência corrompida.
  useEffect(() => {
    let ativo = true;
    AsyncStorage.getItem(STORAGE_KEYS.PREFS)
      .then((raw) => {
        if (!ativo) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<Prefs>;
            setPrefsState({ ...DEFAULT_PREFS, ...parsed });
          } catch {
            setPrefsState(DEFAULT_PREFS);
          }
        }
        setHydrating(false);
      })
      .catch(() => {
        if (!ativo) return;
        setHydrating(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(next)).catch(
        () => {
          // Falha de escrita não bloqueia a UI; o estado em memória
          // continua refletindo a escolha do usuário até o próximo boot.
        },
      );
      return next;
    });
  }, []);

  const value = useMemo<PrefsContextValue>(
    () => ({ prefs, setPrefs, hydrating }),
    [prefs, setPrefs, hydrating],
  );

  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
}

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext);
  if (ctx === NO_PROVIDER) {
    return {
      prefs: DEFAULT_PREFS,
      setPrefs: () => {},
      hydrating: false,
    };
  }
  return ctx;
}
