import { Share } from "react-native";

import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test/renderWithProviders";

import ConfiguracoesScreen from "../configuracoes";

const router = (require("expo-router") as any).__router as {
  back: jest.Mock;
  push: jest.Mock;
};

beforeEach(() => {
  router.back.mockClear();
  router.push.mockClear();
});

describe("ConfiguracoesScreen — layout", () => {
  it("renderiza sections principais (Aparência, Avisos, Backup, Sobre)", () => {
    renderWithProviders(<ConfiguracoesScreen />);

    expect(screen.getByText("Aparência")).toBeTruthy();
    expect(screen.getByText("Avisos")).toBeTruthy();
    expect(screen.getByText("Backup")).toBeTruthy();
    expect(screen.getByText("Sobre")).toBeTruthy();
  });

  it("Voltar chama router.back", () => {
    renderWithProviders(<ConfiguracoesScreen />);
    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});

describe("ConfiguracoesScreen — Aparência", () => {
  it("lista as 7 paletas como chips", () => {
    renderWithProviders(<ConfiguracoesScreen />);

    expect(
      screen.getByRole("button", { name: "Aplicar paleta Rubro-negro" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Aplicar paleta Verde & branco" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Aplicar paleta Preto & branco" }),
    ).toBeTruthy();
  });

  it("paleta selecionada (default rubro) expõe accessibilityState.selected = true", () => {
    renderWithProviders(<ConfiguracoesScreen />);

    const rubro = screen.getByRole("button", {
      name: "Aplicar paleta Rubro-negro",
    });
    expect(rubro.props.accessibilityState?.selected).toBe(true);

    const verde = screen.getByRole("button", {
      name: "Aplicar paleta Verde & branco",
    });
    expect(verde.props.accessibilityState?.selected).toBe(false);
  });
});

describe("ConfiguracoesScreen — Backup", () => {
  it("'Exportar backup' chama exportarBackup + Share.share", async () => {
    const exportarBackup = jest
      .fn()
      .mockResolvedValue(
        '{"version":1,"app":"FuteLista","exportadoEm":0,"items":[]}',
      );
    const shareSpy = jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: "sharedAction" } as any);

    renderWithProviders(<ConfiguracoesScreen />, {
      soccer: { exportarBackup },
    });

    fireEvent.press(
      screen.getByRole("button", { name: "Exportar backup" }),
    );

    await waitFor(() => expect(exportarBackup).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1));
    shareSpy.mockRestore();
  });
});
