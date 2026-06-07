/**
 * Setup global do Jest para o FuteLista.
 *
 * Mocks de bibliotecas nativas que rodam só no device (expo-router,
 * SafeArea, Reanimated). O preset jest-expo já cobre a maior parte;
 * aqui completamos o que falta para testar telas/componentes.
 */

import "react-native-gesture-handler/jestSetup";

// ---------------------------------------------------------------------------
// expo-router
// ---------------------------------------------------------------------------
// Cada teste pode importar { setRouterMock } daqui (via @/src/test/router)
// pra inspecionar chamadas a push/back/replace. O default abaixo só evita
// que os componentes quebrem quando o teste não se importa.
jest.mock("expo-router", () => {
  const React = require("react");
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    navigate: jest.fn(),
    setParams: jest.fn(),
    dismiss: jest.fn(),
    dismissAll: jest.fn(),
  };
  let searchParams: Record<string, string> = {};
  return {
    __router: router,
    /** Setter para testes que precisam injetar params (ex.: /peladas/[id]). */
    __setSearchParams: (p: Record<string, string>) => {
      searchParams = p;
    },
    useRouter: () => router,
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === "function" ? cleanup : undefined;
      }, [cb]);
    },
    useLocalSearchParams: () => searchParams,
    useGlobalSearchParams: () => searchParams,
    usePathname: () => "/",
    useSegments: () => [],
    Link: ({ children }: { children: React.ReactNode }) => children,
    Redirect: () => null,
    Stack: Object.assign(
      ({ children }: { children: React.ReactNode }) => children,
      { Screen: () => null },
    ),
    Tabs: Object.assign(
      ({ children }: { children: React.ReactNode }) => children,
      { Screen: () => null },
    ),
  };
});

// ---------------------------------------------------------------------------
// SafeArea — insets zero por padrão. Componentes só leem o número.
// ---------------------------------------------------------------------------
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const inset = { top: 0, bottom: 0, left: 0, right: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
    SafeAreaInsetsContext: { Consumer: ({ children }: any) => children(inset) },
  };
});

// ---------------------------------------------------------------------------
// Reanimated — usa o mock oficial.
// ---------------------------------------------------------------------------
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

// ---------------------------------------------------------------------------
// @expo/vector-icons — carrega fontes async e dispara warning de act() que
// polui a saída. Substituímos por um View nomeado, mantendo o testID/role.
// ---------------------------------------------------------------------------
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Icon = ({ name, testID, ...rest }: any) =>
    React.createElement(View, {
      testID: testID ?? `icon-${name}`,
      accessibilityLabel: rest.accessibilityLabel,
    });
  return new Proxy(
    { __esModule: true },
    {
      get: (target: any, key) => (key in target ? target[key] : Icon),
    },
  );
});

// ---------------------------------------------------------------------------
// AsyncStorage — módulo nativo, precisa de mock global. Specs específicos
// (ex.: AsyncStoragePeladaRepository.spec) podem re-mockar com store interno.
// ---------------------------------------------------------------------------
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
      getAllKeys: jest.fn(async () => [...store.keys()]),
      multiGet: jest.fn(async (keys: string[]) =>
        keys.map((k) => [k, store.get(k) ?? null] as [string, string | null]),
      ),
      clear: jest.fn(async () => {
        store.clear();
      }),
    },
  };
});

// ---------------------------------------------------------------------------
// Silenciar warnings ruidosos do RN em ambiente de teste.
// ---------------------------------------------------------------------------
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");
