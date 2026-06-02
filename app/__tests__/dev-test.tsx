import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test/renderWithProviders";

// jest.mock é hoisted — usamos jest.fn() dentro da factory e acessamos via require.
jest.mock("@/src/app-shell/devSeed", () => ({
  CENARIOS: [
    { id: "vazio", titulo: "Vazio", descricao: "Sem nada." },
    {
      id: "uma-pelada-com-execucoes",
      titulo: "1 pelada com 3 execuções",
      descricao: "Fute CEF com 3 execuções.",
    },
  ],
  devLimparStorage: jest.fn(),
  devAplicarCenario: jest.fn(),
}));

import DevScreen from "../dev";

const devSeed = require("@/src/app-shell/devSeed");
const devLimparStorage = devSeed.devLimparStorage as jest.Mock;
const devAplicarCenario = devSeed.devAplicarCenario as jest.Mock;

const router = (require("expo-router") as any).__router as {
  replace: jest.Mock;
  back: jest.Mock;
};

beforeEach(() => {
  router.back.mockClear();
  router.replace.mockClear();
  devLimparStorage.mockReset();
  devAplicarCenario.mockReset();
});

// ===========================================================================
// LAYOUT BÁSICO
// ===========================================================================

describe("Dev — layout", () => {
  it("renderiza título e botão de fechar", () => {
    renderWithProviders(<DevScreen />);
    expect(screen.getByText("🛠 Dev tools")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeTruthy();
  });

  it("Fechar chama router.back", () => {
    renderWithProviders(<DevScreen />);
    fireEvent.press(screen.getByRole("button", { name: "Fechar" }));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("lista os cenários mockados", () => {
    renderWithProviders(<DevScreen />);
    expect(screen.getByText("Vazio")).toBeTruthy();
    expect(screen.getByText("1 pelada com 3 execuções")).toBeTruthy();
  });
});

// ===========================================================================
// LIMPAR STORAGE
// ===========================================================================

describe("Dev — limpar storage", () => {
  it("sucesso: chama devLimparStorage e replace('/')", async () => {
    devLimparStorage.mockResolvedValue(undefined);
    renderWithProviders(<DevScreen />);

    fireEvent.press(
      screen.getByRole("button", { name: "Limpar storage (zerar tudo)" }),
    );

    await waitFor(() => expect(devLimparStorage).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  });

  it("erro: mostra mensagem e não navega", async () => {
    devLimparStorage.mockRejectedValue(new Error("Disco cheio"));
    renderWithProviders(<DevScreen />);

    fireEvent.press(
      screen.getByRole("button", { name: "Limpar storage (zerar tudo)" }),
    );

    expect(await screen.findByText("Erro: Disco cheio")).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// APLICAR CENÁRIO
// ===========================================================================

describe("Dev — aplicar cenário", () => {
  it("sucesso: chama devAplicarCenario com o id certo e replace('/')", async () => {
    devAplicarCenario.mockResolvedValue(undefined);
    renderWithProviders(<DevScreen />);

    fireEvent.press(
      screen.getByRole("button", { name: "Aplicar cenário Vazio" }),
    );

    await waitFor(() =>
      expect(devAplicarCenario).toHaveBeenCalledWith(
        expect.anything(),
        "vazio",
      ),
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  });

  it("erro: mostra mensagem e não navega", async () => {
    devAplicarCenario.mockRejectedValue(new Error("Schema mismatch"));
    renderWithProviders(<DevScreen />);

    fireEvent.press(
      screen.getByRole("button", { name: "Aplicar cenário Vazio" }),
    );

    expect(await screen.findByText("Erro: Schema mismatch")).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// EXECUÇÃO CONCORRENTE
// ===========================================================================

describe("Dev — proteção contra execução concorrente", () => {
  it("enquanto executa, segundo press não reentra na chamada", async () => {
    // Promessa que nunca resolve enquanto o teste corre — segura o estado
    // 'executando' permanentemente.
    devLimparStorage.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<DevScreen />);

    const btn = screen.getByRole("button", {
      name: "Limpar storage (zerar tudo)",
    });

    fireEvent.press(btn);
    fireEvent.press(btn); // 2ª tentativa enquanto executando

    expect(devLimparStorage).toHaveBeenCalledTimes(1);
    // Indicador de execução visível.
    expect(screen.getByText(/Limpar storage…/)).toBeTruthy();
  });
});
