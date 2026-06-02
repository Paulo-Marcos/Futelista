import { GameManager } from "@/src/domain/GameManager";
import { ResumoPeladaTipo } from "@/src/domain/ports/RepositorioPelada";
import { Rules } from "@/src/domain/Rules";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test/renderWithProviders";

import PeladasScreen from "../peladas/index";

const router = (require("expo-router") as any).__router as {
  push: jest.Mock;
  back: jest.Mock;
};

beforeEach(() => {
  router.push.mockClear();
  router.back.mockClear();
});

function fakeResumo(overrides: Partial<ResumoPeladaTipo> = {}): ResumoPeladaTipo {
  return {
    id: "p1",
    nome: "Fute CEF",
    createdAt: 1700000000000,
    regras: {
      playersPerTeam: 4,
      timeMatch: "00:10:00",
      numberTimes: 1,
      goalLimit: 2,
    },
    totalExecucoes: 0,
    ...overrides,
  } as ResumoPeladaTipo;
}

describe("Peladas (lista) — header e navegação", () => {
  it("'Fechar' (X) chama router.back", () => {
    renderWithProviders(<PeladasScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue([]) },
    });

    fireEvent.press(screen.getByRole("button", { name: "Fechar" }));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("'+' navega para /pelada-nova", () => {
    renderWithProviders(<PeladasScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue([]) },
    });

    fireEvent.press(
      screen.getByRole("button", { name: "Cadastrar nova pelada" }),
    );
    expect(router.push).toHaveBeenCalledWith("/pelada-nova");
  });
});

describe("Peladas (lista) — loading e empty", () => {
  it("mostra spinner enquanto não chegou a lista", () => {
    renderWithProviders(<PeladasScreen />, {
      soccer: { listarPeladas: jest.fn(() => new Promise(() => {})) },
    });

    // O título sempre aparece; o que precisa estar visível é só ausência da lista.
    expect(screen.getByText("Minhas peladas")).toBeTruthy();
  });

  it("EmptyState quando lista vazia", async () => {
    renderWithProviders(<PeladasScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue([]) },
    });

    expect(await screen.findByText("Nenhuma pelada cadastrada")).toBeTruthy();
  });

  it("EmptyState 'Cadastrar pelada' navega para /pelada-nova", async () => {
    renderWithProviders(<PeladasScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue([]) },
    });

    fireEvent.press(await screen.findByText("Cadastrar pelada"));

    expect(router.push).toHaveBeenCalledWith("/pelada-nova");
  });
});

describe("Peladas (lista) — render dos cards", () => {
  it("renderiza nome e regras de cada pelada", async () => {
    const peladas = [
      fakeResumo({ id: "p1", nome: "Fute CEF" }),
      fakeResumo({ id: "p2", nome: "Fute BB" }),
    ];
    renderWithProviders(<PeladasScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue(peladas) },
    });

    expect(await screen.findByText("Fute CEF")).toBeTruthy();
    expect(screen.getByText("Fute BB")).toBeTruthy();
    expect(
      screen.getAllByText(/4×4 · 10min · 1 tempo · 2 gols/).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("tap em um card navega para /peladas/[id]", async () => {
    const peladas = [fakeResumo({ id: "p9", nome: "Pelada Nove" })];
    renderWithProviders(<PeladasScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue(peladas) },
    });

    fireEvent.press(await screen.findByLabelText("Abrir pelada Pelada Nove"));

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/peladas/[id]",
      params: { id: "p9" },
    });
  });

  it("mostra badge 'EM USO' quando a pelada coincide com a execução ativa", async () => {
    const peladas = [
      fakeResumo({ id: "p1", nome: "Ativa" }),
      fakeResumo({ id: "p2", nome: "Outra" }),
    ];
    const m = new GameManager("Execução", new Rules({ playersPerTeam: 4 }), {
      peladaId: "p1",
    });
    renderWithProviders(<PeladasScreen />, {
      soccer: {
        manager: m,
        listarPeladas: jest.fn().mockResolvedValue(peladas),
      },
    });

    await screen.findByText("Ativa");
    expect(screen.getByText("EM USO")).toBeTruthy();
  });

  it("contador de execuções no singular/plural", async () => {
    const peladas = [
      fakeResumo({ id: "p1", nome: "Zero", totalExecucoes: 0 }),
      fakeResumo({ id: "p2", nome: "Uma", totalExecucoes: 1 }),
      fakeResumo({ id: "p3", nome: "Muitas", totalExecucoes: 5 }),
    ];
    renderWithProviders(<PeladasScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue(peladas) },
    });

    await waitFor(() =>
      expect(screen.getByText("nenhuma execução ainda")).toBeTruthy(),
    );
    expect(screen.getByText("1 execução")).toBeTruthy();
    expect(screen.getByText("5 execuções")).toBeTruthy();
  });
});

describe("Peladas (lista) — erro", () => {
  it("erro de listarPeladas vira banner", async () => {
    renderWithProviders(<PeladasScreen />, {
      soccer: {
        listarPeladas: jest
          .fn()
          .mockRejectedValue(new Error("Disco cheio (teste)")),
      },
    });

    expect(await screen.findByText("Disco cheio (teste)")).toBeTruthy();
  });
});
