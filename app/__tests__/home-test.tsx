import { Alert } from "react-native";

import { GestorJogo, PeladaStatus } from "@/src/domain/GestorJogo";
import { Rules } from "@/src/domain/Rules";
import { ResumoPeladaTipo } from "@/src/domain/ports/RepositorioPelada";
import {
  act,
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test/renderWithProviders";

import HomeScreen from "../(pelada)/index";

const router = (require("expo-router") as any).__router as {
  push: jest.Mock;
  back: jest.Mock;
  replace: jest.Mock;
};

beforeEach(() => {
  router.push.mockClear();
  router.back.mockClear();
  router.replace.mockClear();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeResumo(
  overrides: Partial<ResumoPeladaTipo> = {},
): ResumoPeladaTipo {
  return {
    id: "p1",
    nome: "Fute CEF",
    regras: {
      id: "r1",
      name: "Padrão",
      playersPerTeam: 4,
      timeMatch: "00:10:00",
      numberTimes: 1,
      goalLimit: 2,
      choosingTeams: 0,
    },
    totalExecucoes: 0,
    ultimaExecucao: undefined,
    ...overrides,
  } as ResumoPeladaTipo;
}

function buildManager(opts?: {
  name?: string;
  peladaId?: string;
  status?: PeladaStatus;
}): GestorJogo {
  const rules = new Rules({
    playersPerTeam: 4,
    timeMatch: "00:10:00",
    numberTimes: 1,
    goalLimit: 2,
  });
  return new GestorJogo(opts?.name ?? "Execução", rules, {
    peladaId: opts?.peladaId,
    status: opts?.status,
  });
}

/**
 * Substitui Alert.alert para chamar automaticamente um botão escolhido
 * pelo predicate. Retorna o spy pra inspeção posterior.
 */
function mockAlert(
  pick: (b: { text?: string; style?: string }) => boolean,
): jest.SpyInstance {
  return jest
    .spyOn(Alert, "alert")
    .mockImplementation((_t, _m, buttons) => {
      const escolhido = buttons?.find(pick);
      escolhido?.onPress?.();
    });
}

// ===========================================================================
// MODO GESTÃO (manager = null)
// ===========================================================================

describe("Home — modo gestão (sem execução)", () => {
  it("renderiza o título FuteLista e o subtítulo", async () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText("FuteLista")).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByText(/Nenhuma pelada cadastrada/)).toBeTruthy(),
    );
  });

  it("mostra EmptyState quando não há peladas", async () => {
    renderWithProviders(<HomeScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue([]) },
    });

    expect(
      await screen.findByText("Nenhuma pelada cadastrada"),
    ).toBeTruthy();
  });

  it("renderiza a lista de peladas cadastradas", async () => {
    const peladas = [
      fakeResumo({ id: "p1", nome: "Fute CEF", totalExecucoes: 3 }),
      fakeResumo({ id: "p2", nome: "Fute Domingo", totalExecucoes: 0 }),
    ];
    renderWithProviders(<HomeScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue(peladas) },
    });

    expect(await screen.findByText("Fute CEF")).toBeTruthy();
    expect(screen.getByText("Fute Domingo")).toBeTruthy();
    expect(screen.getByText(/3 execuções/)).toBeTruthy();
  });

  it("botão 'Iniciar pelada avulsa' chama iniciarExecucaoAvulsa", async () => {
    const { soccer } = renderWithProviders(<HomeScreen />);

    await act(async () => {});

    fireEvent.press(
      screen.getByRole("button", { name: "Iniciar pelada avulsa" }),
    );

    await waitFor(() =>
      expect(soccer.iniciarExecucaoAvulsa).toHaveBeenCalledTimes(1),
    );
  });

  it("botão 'Cadastrar nova pelada' navega para /pelada-nova", async () => {
    renderWithProviders(<HomeScreen />);
    await act(async () => {});

    fireEvent.press(
      screen.getByRole("button", { name: "Cadastrar nova pelada" }),
    );

    expect(router.push).toHaveBeenCalledWith("/pelada-nova");
  });

  it("botão dev navega para /dev", async () => {
    renderWithProviders(<HomeScreen />);
    await act(async () => {});

    fireEvent.press(screen.getByRole("button", { name: "Abrir dev tools" }));

    expect(router.push).toHaveBeenCalledWith("/dev");
  });

  it("abrir pelada navega para /peladas/[id]", async () => {
    const peladas = [fakeResumo({ id: "p1", nome: "Fute CEF" })];
    renderWithProviders(<HomeScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue(peladas) },
    });

    fireEvent.press(await screen.findByLabelText("Abrir pelada Fute CEF"));

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/peladas/[id]",
      params: { id: "p1" },
    });
  });

  it("'Iniciar nova execução' sem execuções anteriores não pergunta nada", async () => {
    const peladas = [fakeResumo({ id: "p1", totalExecucoes: 0 })];
    const { soccer } = renderWithProviders(<HomeScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue(peladas) },
    });

    const alertSpy = mockAlert(() => true);

    fireEvent.press(
      await screen.findByRole("button", { name: "Iniciar nova execução" }),
    );

    await waitFor(() =>
      expect(soccer.iniciarExecucao).toHaveBeenCalledWith("p1", {
        herdarJogadores: false,
      }),
    );
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("'Iniciar nova execução' com execuções anteriores → Herdar → herdarJogadores: true", async () => {
    const peladas = [fakeResumo({ id: "p1", totalExecucoes: 5 })];
    const { soccer } = renderWithProviders(<HomeScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue(peladas) },
    });

    const alertSpy = mockAlert((b) => b.text === "Herdar");

    fireEvent.press(
      await screen.findByRole("button", { name: "Iniciar nova execução" }),
    );

    await waitFor(() =>
      expect(soccer.iniciarExecucao).toHaveBeenCalledWith("p1", {
        herdarJogadores: true,
      }),
    );
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("'Iniciar nova execução' → Cancelar não dispara iniciarExecucao", async () => {
    const peladas = [fakeResumo({ id: "p1", totalExecucoes: 5 })];
    const { soccer } = renderWithProviders(<HomeScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue(peladas) },
    });

    const alertSpy = mockAlert((b) => b.style === "cancel");

    fireEvent.press(
      await screen.findByRole("button", { name: "Iniciar nova execução" }),
    );

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(soccer.iniciarExecucao).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("erro em listarPeladas vira ErrorBanner", async () => {
    renderWithProviders(<HomeScreen />, {
      soccer: {
        listarPeladas: jest.fn().mockRejectedValue(new Error("Falhou aqui")),
      },
    });

    expect(await screen.findByText("Falhou aqui")).toBeTruthy();
  });
});

// ===========================================================================
// MODO EXECUÇÃO (manager = GestorJogo real)
// ===========================================================================

describe("Home — modo execução (com manager)", () => {
  it("renderiza o nome da execução e CTA de adicionar jogadores", async () => {
    const manager = buildManager({ name: "Treino quarta" });
    renderWithProviders(<HomeScreen />, { soccer: { manager } });

    expect(await screen.findByText("Treino quarta")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Adicionar jogadores" }),
    ).toBeTruthy();
  });

  it("mostra badge AVULSA quando peladaId não está definido", () => {
    const manager = buildManager({ peladaId: undefined });
    renderWithProviders(<HomeScreen />, { soccer: { manager } });

    expect(screen.getByText("AVULSA")).toBeTruthy();
  });

  it("não mostra badge AVULSA quando vinculada a uma Pelada", () => {
    const manager = buildManager({ peladaId: "p1" });
    renderWithProviders(<HomeScreen />, { soccer: { manager } });

    expect(screen.queryByText("AVULSA")).toBeNull();
  });

  it("CTA 'Adicionar jogadores' navega para /jogadores", () => {
    const manager = buildManager();
    renderWithProviders(<HomeScreen />, { soccer: { manager } });

    fireEvent.press(
      screen.getByRole("button", { name: "Adicionar jogadores" }),
    );

    expect(router.push).toHaveBeenCalledWith("/jogadores");
  });

  it("StatCard de jogadores navega para /jogadores", () => {
    const manager = buildManager();
    renderWithProviders(<HomeScreen />, { soccer: { manager } });

    fireEvent.press(
      screen.getByLabelText(/0 jogadores. Toque para abrir lista\./),
    );

    expect(router.push).toHaveBeenCalledWith("/jogadores");
  });

  it("StatCard de times navega para /times", () => {
    const manager = buildManager();
    renderWithProviders(<HomeScreen />, { soccer: { manager } });

    fireEvent.press(
      screen.getByLabelText(/0 times no total. Toque para abrir lista\./),
    );

    expect(router.push).toHaveBeenCalledWith("/times");
  });

  it("botão regras (ícone) navega para /regras", () => {
    const manager = buildManager();
    renderWithProviders(<HomeScreen />, { soccer: { manager } });

    fireEvent.press(
      screen.getByRole("button", { name: "Editar regras da execução" }),
    );

    expect(router.push).toHaveBeenCalledWith("/regras");
  });

  it("'Voltar para minhas peladas' chama voltarParaGestao", async () => {
    const manager = buildManager();
    const { soccer } = renderWithProviders(<HomeScreen />, {
      soccer: { manager },
    });

    fireEvent.press(
      screen.getByRole("button", { name: "Voltar para minhas peladas" }),
    );

    await waitFor(() =>
      expect(soccer.voltarParaGestao).toHaveBeenCalledTimes(1),
    );
  });

  it("'Finalizar esta execução' confirma e chama finalizarExecucao", async () => {
    const manager = buildManager();
    const { soccer } = renderWithProviders(<HomeScreen />, {
      soccer: { manager },
    });
    const alertSpy = mockAlert((b) => b.text === "Finalizar");

    fireEvent.press(
      screen.getByRole("button", { name: "Finalizar esta execução" }),
    );

    await waitFor(() =>
      expect(soccer.finalizarExecucao).toHaveBeenCalledTimes(1),
    );
    alertSpy.mockRestore();
  });

  it("'Finalizar' cancelado não chama finalizarExecucao", async () => {
    const manager = buildManager();
    const { soccer } = renderWithProviders(<HomeScreen />, {
      soccer: { manager },
    });
    const alertSpy = mockAlert((b) => b.style === "cancel");

    fireEvent.press(
      screen.getByRole("button", { name: "Finalizar esta execução" }),
    );

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(soccer.finalizarExecucao).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("'Limpar jogadores e times' confirma e chama limparJogadoresETimes", async () => {
    const manager = buildManager();
    const { soccer } = renderWithProviders(<HomeScreen />, {
      soccer: { manager },
    });
    const alertSpy = mockAlert((b) => b.text === "Limpar");

    fireEvent.press(
      screen.getByRole("button", { name: "Limpar jogadores e times" }),
    );

    await waitFor(() =>
      expect(soccer.limparJogadoresETimes).toHaveBeenCalledTimes(1),
    );
    alertSpy.mockRestore();
  });

  it("'Salvar como pelada cadastrada' aparece e navega quando avulsa", () => {
    const manager = buildManager({ peladaId: undefined });
    renderWithProviders(<HomeScreen />, { soccer: { manager } });

    fireEvent.press(
      screen.getByRole("button", { name: "Salvar como pelada cadastrada" }),
    );

    expect(router.push).toHaveBeenCalledWith("/salvar-como-pelada");
  });

  it("'Salvar como pelada cadastrada' NÃO aparece quando vinculada a uma Pelada", () => {
    const manager = buildManager({ peladaId: "p1" });
    renderWithProviders(<HomeScreen />, { soccer: { manager } });

    expect(
      screen.queryByRole("button", {
        name: "Salvar como pelada cadastrada",
      }),
    ).toBeNull();
  });

  it("execução finalizada: Finalizar e Limpar desaparecem", () => {
    const manager = buildManager({ status: PeladaStatus.FINALIZADA });
    renderWithProviders(<HomeScreen />, { soccer: { manager } });

    expect(
      screen.queryByRole("button", { name: "Finalizar esta execução" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Limpar jogadores e times" }),
    ).toBeNull();
  });
});
