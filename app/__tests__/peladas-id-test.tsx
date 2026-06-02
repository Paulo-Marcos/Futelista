import { Alert } from "react-native";

import { PeladaStatus } from "@/src/domain/GameManager";
import { Pelada } from "@/src/domain/Pelada";
import { ResumoExecucao } from "@/src/domain/ports/RepositorioPelada";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test/renderWithProviders";

import PeladaDetalheScreen from "../peladas/[id]";

const expoRouter = require("expo-router") as any;
const router = expoRouter.__router as {
  push: jest.Mock;
  back: jest.Mock;
  replace: jest.Mock;
  dismissAll: jest.Mock;
};

beforeEach(() => {
  router.push.mockClear();
  router.back.mockClear();
  router.replace.mockClear();
  router.dismissAll.mockClear();
  // Cada teste seta a id que precisar.
  expoRouter.__setSearchParams({ id: "p1" });
});

afterEach(() => {
  expoRouter.__setSearchParams({});
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakePelada(): Pelada {
  return new Pelada({
    id: "p1",
    nome: "Fute CEF",
    regras: {
      playersPerTeam: 4,
      timeMatch: "00:10:00",
      numberTimes: 1,
      goalLimit: 2,
    },
  });
}

function fakeResumoExec(
  overrides: Partial<ResumoExecucao> = {},
): ResumoExecucao {
  return {
    id: "e1",
    name: "Execução 1",
    status: PeladaStatus.FINALIZADA,
    createdAt: 1700000000000,
    startedAt: 1700000000000,
    endedAt: 1700001000000,
    totalJogadores: 12,
    totalPartidas: 8,
    peladaId: "p1",
    ...overrides,
  };
}

function mockAlert(pick: (b: { text?: string; style?: string }) => boolean) {
  return jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
    const escolhido = buttons?.find(pick);
    escolhido?.onPress?.();
  });
}

// ===========================================================================
// LOADING / CABEÇALHO
// ===========================================================================

describe("PeladaDetalhe — loading e cabeçalho", () => {
  it("renderiza spinner enquanto carrega", () => {
    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn(() => new Promise(() => {})),
        listarExecucoesDe: jest.fn(() => new Promise(() => {})),
      },
    });

    expect(screen.getByText("Pelada")).toBeTruthy(); // fallback do header
  });

  it("renderiza nome da pelada após carregar", async () => {
    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
        listarExecucoesDe: jest.fn().mockResolvedValue([]),
      },
    });

    expect(await screen.findByText("Fute CEF")).toBeTruthy();
  });

  it("botão Voltar do header chama router.back", async () => {
    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
        listarExecucoesDe: jest.fn().mockResolvedValue([]),
      },
    });

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// LISTA DE EXECUÇÕES
// ===========================================================================

describe("PeladaDetalhe — lista de execuções", () => {
  it("mostra EmptyState quando não há execuções", async () => {
    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
        listarExecucoesDe: jest.fn().mockResolvedValue([]),
      },
    });

    expect(await screen.findByText("Nenhuma execução ainda")).toBeTruthy();
  });

  it("renderiza cards das execuções com status", async () => {
    const execucoes = [
      fakeResumoExec({ id: "e1", status: PeladaStatus.FINALIZADA }),
      fakeResumoExec({ id: "e2", status: PeladaStatus.ATIVA }),
    ];
    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
        listarExecucoesDe: jest.fn().mockResolvedValue(execucoes),
      },
    });

    await waitFor(() => expect(screen.getByText("FINALIZADA")).toBeTruthy());
    expect(screen.getByText("ATIVA")).toBeTruthy();
  });

  it("toque numa execução não-ativa chama selecionarExecucao e dismissAll", async () => {
    const execucoes = [fakeResumoExec({ id: "e9" })];
    const selecionarExecucao = jest.fn().mockResolvedValue(undefined);

    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
        listarExecucoesDe: jest.fn().mockResolvedValue(execucoes),
        selecionarExecucao,
      },
    });

    const card = await screen.findByLabelText(/Abrir execução de /);
    fireEvent.press(card);

    await waitFor(() => expect(selecionarExecucao).toHaveBeenCalledWith("e9"));
    await waitFor(() => expect(router.dismissAll).toHaveBeenCalledTimes(1));
  });
});

// ===========================================================================
// INICIAR NOVA EXECUÇÃO
// ===========================================================================

describe("PeladaDetalhe — iniciar nova execução", () => {
  it("sem execuções anteriores: não pede confirmação", async () => {
    const iniciarExecucao = jest.fn().mockResolvedValue(undefined);
    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
        listarExecucoesDe: jest.fn().mockResolvedValue([]),
        iniciarExecucao,
      },
    });

    const alertSpy = mockAlert(() => true);

    fireEvent.press(
      await screen.findByRole("button", { name: "Iniciar nova execução" }),
    );

    await waitFor(() =>
      expect(iniciarExecucao).toHaveBeenCalledWith("p1", {
        herdarJogadores: false,
      }),
    );
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("com execuções: pede e respeita 'Herdar'", async () => {
    const iniciarExecucao = jest.fn().mockResolvedValue(undefined);
    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
        listarExecucoesDe: jest.fn().mockResolvedValue([fakeResumoExec()]),
        iniciarExecucao,
      },
    });

    const alertSpy = mockAlert((b) => b.text === "Herdar");

    fireEvent.press(
      await screen.findByRole("button", { name: "Iniciar nova execução" }),
    );

    await waitFor(() =>
      expect(iniciarExecucao).toHaveBeenCalledWith("p1", {
        herdarJogadores: true,
      }),
    );
    expect(router.dismissAll).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("'Cancelar' no prompt não chama iniciarExecucao", async () => {
    const iniciarExecucao = jest.fn().mockResolvedValue(undefined);
    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
        listarExecucoesDe: jest.fn().mockResolvedValue([fakeResumoExec()]),
        iniciarExecucao,
      },
    });

    const alertSpy = mockAlert((b) => b.style === "cancel");

    fireEvent.press(
      await screen.findByRole("button", { name: "Iniciar nova execução" }),
    );

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(iniciarExecucao).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("erro em iniciarExecucao aparece no banner e não dismissAll", async () => {
    const iniciarExecucao = jest
      .fn()
      .mockRejectedValue(new Error("Falha boom"));
    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
        listarExecucoesDe: jest.fn().mockResolvedValue([]),
        iniciarExecucao,
      },
    });

    fireEvent.press(
      await screen.findByRole("button", { name: "Iniciar nova execução" }),
    );

    expect(await screen.findByText("Falha boom")).toBeTruthy();
    expect(router.dismissAll).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// REGRAS DEFAULT
// ===========================================================================

describe("PeladaDetalhe — regras default", () => {
  it("renderiza resumo das regras", async () => {
    renderWithProviders(<PeladaDetalheScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
        listarExecucoesDe: jest.fn().mockResolvedValue([]),
      },
    });

    await screen.findByText("Regras default");
    expect(screen.getByText(/4×4 · 10min · 1 tempo · 2 gols/)).toBeTruthy();
  });
});
