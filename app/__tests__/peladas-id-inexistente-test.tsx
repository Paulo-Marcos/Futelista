import {
  fireEvent,
  renderWithProviders,
  screen,
} from "@/src/test/renderWithProviders";

import PeladaDetalheScreen from "../peladas/[id]";

const expoRouter = require("expo-router") as any;
const router = expoRouter.__router as { back: jest.Mock };

describe("PeladaDetalhe — pelada inexistente (D-052)", () => {
  beforeEach(() => {
    router.back.mockClear();
    expoRouter.__setSearchParams({ id: "nao-existe" });
  });

  afterEach(() => {
    expoRouter.__setSearchParams({});
  });

  it("id sem pelada mostra 'Pelada não encontrada' em vez de spinner eterno", async () => {
    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(null),
        listarExecucoesDe: jest.fn().mockResolvedValue([]),
      },
    });

    expect(await screen.findByText("Pelada não encontrada")).toBeTruthy();
  });

  it("'Voltar' do estado vazio chama router.back", async () => {
    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(null),
        listarExecucoesDe: jest.fn().mockResolvedValue([]),
      },
    });

    await screen.findByText("Pelada não encontrada");
    // O header também tem um "Voltar"; o do EmptyState é o último.
    const botoes = screen.getAllByRole("button", { name: "Voltar" });
    fireEvent.press(botoes[botoes.length - 1]);
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
