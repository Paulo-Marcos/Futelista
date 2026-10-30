import { renderWithProviders, screen } from "@/src/test/renderWithProviders";

import DevRoute from "../dev";

const globalDev = global as unknown as { __DEV__: boolean };

describe("Dev — guarda de produção (D-052)", () => {
  const devOriginal = globalDev.__DEV__;

  afterEach(() => {
    globalDev.__DEV__ = devOriginal;
  });

  it("fora de __DEV__ não renderiza o painel (deep link /dev cai fora)", () => {
    globalDev.__DEV__ = false;
    renderWithProviders(<DevRoute />);
    expect(screen.queryByText("🛠 Dev tools")).toBeNull();
    expect(screen.queryByText("Limpar storage (zerar tudo)")).toBeNull();
  });

  it("em __DEV__ renderiza o painel", () => {
    globalDev.__DEV__ = true;
    renderWithProviders(<DevRoute />);
    expect(screen.getByText("🛠 Dev tools")).toBeTruthy();
  });
});
