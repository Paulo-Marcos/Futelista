import { renderHook } from "@testing-library/react-native";
import { AppState, Keyboard, Platform } from "react-native";

import { useImmersiveNavBar } from "./useImmersiveNavBar";

// Mock do módulo nativo: captura o listener de visibilidade e conta as
// chamadas a `setVisibilityAsync`. Variáveis prefixadas `mock` são as únicas
// que o jest.mock (hoisted) permite referenciar na factory.
const mockNav = {
  setVisibilityAsync: jest.fn(async (_v: string) => {}),
  visibilityRemove: jest.fn(),
  listener: null as null | ((e: { visibility: string }) => void),
};

jest.mock("expo-navigation-bar", () => ({
  setVisibilityAsync: (v: string) => mockNav.setVisibilityAsync(v),
  addVisibilityListener: (cb: (e: { visibility: string }) => void) => {
    mockNav.listener = cb;
    return { remove: mockNav.visibilityRemove };
  },
}));

describe("useImmersiveNavBar", () => {
  const originalOS = Platform.OS;

  let appStateHandler: ((state: string) => void) | null;
  let keyboardHandler: (() => void) | null;
  const appStateRemove = jest.fn();
  const keyboardRemove = jest.fn();

  beforeEach(() => {
    mockNav.setVisibilityAsync.mockClear();
    mockNav.visibilityRemove.mockClear();
    mockNav.listener = null;
    appStateHandler = null;
    keyboardHandler = null;
    appStateRemove.mockClear();
    keyboardRemove.mockClear();

    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, cb) => {
      appStateHandler = cb as (state: string) => void;
      return { remove: appStateRemove } as never;
    });
    jest.spyOn(Keyboard, "addListener").mockImplementation((_type, cb) => {
      keyboardHandler = cb as () => void;
      return { remove: keyboardRemove } as never;
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { value: originalOS });
    jest.restoreAllMocks();
  });

  function setOS(os: "android" | "ios") {
    Object.defineProperty(Platform, "OS", { value: os, configurable: true });
  }

  it("deverá esconder a barra ao montar no Android", () => {
    setOS("android");
    renderHook(() => useImmersiveNavBar());
    expect(mockNav.setVisibilityAsync).toHaveBeenCalledWith("hidden");
    expect(mockNav.setVisibilityAsync).toHaveBeenCalledTimes(1);
  });

  it("deverá reaplicar a ocultação ao app voltar para 'active'", () => {
    setOS("android");
    renderHook(() => useImmersiveNavBar());
    mockNav.setVisibilityAsync.mockClear();

    appStateHandler?.("background");
    expect(mockNav.setVisibilityAsync).not.toHaveBeenCalled();

    appStateHandler?.("active");
    expect(mockNav.setVisibilityAsync).toHaveBeenCalledWith("hidden");
  });

  it("deverá reaplicar a ocultação após o teclado fechar", () => {
    setOS("android");
    renderHook(() => useImmersiveNavBar());
    mockNav.setVisibilityAsync.mockClear();

    keyboardHandler?.();
    expect(mockNav.setVisibilityAsync).toHaveBeenCalledWith("hidden");
  });

  it("deverá reesconder a barra quando o SO a reexibe (visible)", () => {
    setOS("android");
    renderHook(() => useImmersiveNavBar());
    mockNav.setVisibilityAsync.mockClear();

    mockNav.listener?.({ visibility: "visible" });
    expect(mockNav.setVisibilityAsync).toHaveBeenCalledWith("hidden");
  });

  it("não deverá reagir quando a barra já está oculta (hidden)", () => {
    setOS("android");
    renderHook(() => useImmersiveNavBar());
    mockNav.setVisibilityAsync.mockClear();

    mockNav.listener?.({ visibility: "hidden" });
    expect(mockNav.setVisibilityAsync).not.toHaveBeenCalled();
  });

  it("não deverá tocar na barra fora do Android", () => {
    setOS("ios");
    renderHook(() => useImmersiveNavBar());
    expect(mockNav.setVisibilityAsync).not.toHaveBeenCalled();
    expect(mockNav.listener).toBeNull();
  });

  it("deverá remover todos os listeners no cleanup", () => {
    setOS("android");
    const { unmount } = renderHook(() => useImmersiveNavBar());
    unmount();
    expect(mockNav.visibilityRemove).toHaveBeenCalledTimes(1);
    expect(appStateRemove).toHaveBeenCalledTimes(1);
    expect(keyboardRemove).toHaveBeenCalledTimes(1);
  });
});
