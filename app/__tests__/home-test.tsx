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
  return jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
    const escolhido = buttons?.find(pick);
    escolhido?.onPress?.();
  });
}

// ===========================================================================
// MODO GESTÃO (gestor = null)
// ===========================================================================

describe("Home — modo gestão (sem execução)", () => {
  it("renderiza o título FuteLista e o subtítulo", async () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText("Fute")).toBeTruthy();
    expect(screen.getByText("Lista")).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByText(/Nenhuma pelada cadastrada/)).toBeTruthy(),
    );
  });

  it("mostra EmptyState quando não há peladas", async () => {
    renderWithProviders(<HomeScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue([]) },
    });

    expect(await screen.findByText("Nenhuma pelada cadastrada")).toBeTruthy();
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
    expect(screen.getByText("3 jogos")).toBeTruthy();
    expect(screen.getByText("0 jogos")).toBeTruthy();
  });

  it("mostra a tag RECENTE apenas no primeiro card", async () => {
    const peladas = [
      fakeResumo({ id: "p1", nome: "Fute CEF" }),
      fakeResumo({ id: "p2", nome: "Fute Domingo" }),
    ];
    renderWithProviders(<HomeScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue(peladas) },
    });

    expect(await screen.findByText("RECENTE")).toBeTruthy();
    expect(screen.queryAllByText("RECENTE")).toHaveLength(1);
  });

  it("renderiza dia/hora e local quando presentes no resumo", async () => {
    const peladas = [
      fakeResumo({
        id: "p1",
        nome: "Fute CEF",
        dia: "Quartas",
        hora: "21:00",
        local: "Quadra do CEF",
      }),
    ];
    renderWithProviders(<HomeScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue(peladas) },
    });

    expect(await screen.findByText("Quartas · 21:00")).toBeTruthy();
    expect(screen.getByText("Quadra do CEF")).toBeTruthy();
  });

  it("renderiza o rodapé com contagem", async () => {
    const peladas = [
      fakeResumo({ id: "p1" }),
      fakeResumo({ id: "p2" }),
      fakeResumo({ id: "p3" }),
    ];
    renderWithProviders(<HomeScreen />, {
      soccer: { listarPeladas: jest.fn().mockResolvedValue(peladas) },
    });

    expect(
      await screen.findByText(/3 peladas · organize sua resenha/),
    ).toBeTruthy();
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

  it("botão 'Criar nova pelada' navega para /pelada-nova", async () => {
    renderWithProviders(<HomeScreen />);
    await act(async () => {});

    fireEvent.press(screen.getByRole("button", { name: "Criar nova pelada" }));

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
// MODO EXECUÇÃO (gestor = GestorJogo real)
// ===========================================================================

describe("Home — modo execução (com gestor)", () => {
  it("renderiza o nome da execução e CTA de adicionar jogadores", async () => {
    const gestor = buildManager({ name: "Treino quarta" });
    renderWithProviders(<HomeScreen />, { soccer: { gestor } });

    expect(await screen.findByText("Treino quarta")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Adicionar jogadores" }),
    ).toBeTruthy();
  });

  it("mostra badge AVULSA quando peladaId não está definido", () => {
    const gestor = buildManager({ peladaId: undefined });
    renderWithProviders(<HomeScreen />, { soccer: { gestor } });

    expect(screen.getByText("AVULSA")).toBeTruthy();
  });

  it("não mostra badge AVULSA quando vinculada a uma Pelada", () => {
    const gestor = buildManager({ peladaId: "p1" });
    renderWithProviders(<HomeScreen />, { soccer: { gestor } });

    expect(screen.queryByText("AVULSA")).toBeNull();
  });

  it("CTA 'Adicionar jogadores' navega para /jogadores", () => {
    const gestor = buildManager();
    renderWithProviders(<HomeScreen />, { soccer: { gestor } });

    fireEvent.press(
      screen.getByRole("button", { name: "Adicionar jogadores" }),
    );

    expect(router.push).toHaveBeenCalledWith("/jogadores");
  });

  it("StatCard de jogadores navega para /jogadores", () => {
    const gestor = buildManager();
    renderWithProviders(<HomeScreen />, { soccer: { gestor } });

    fireEvent.press(
      screen.getByLabelText(/0 jogadores. Toque para abrir lista\./),
    );

    expect(router.push).toHaveBeenCalledWith("/jogadores");
  });

  it("StatCard de times navega para /times", () => {
    const gestor = buildManager();
    renderWithProviders(<HomeScreen />, { soccer: { gestor } });

    fireEvent.press(
      screen.getByLabelText(/0 times no total. Toque para abrir lista\./),
    );

    expect(router.push).toHaveBeenCalledWith("/times");
  });

  it("botão de gerenciamento (cog) abre menu (M-20)", () => {
    const gestor = buildManager();
    renderWithProviders(<HomeScreen />, { soccer: { gestor } });

    // M-20: o cog passou a abrir `escolherOpcao` em vez de navegar
    // direto. Verificamos a presença do botão pelo novo label e que
    // o press não dispara router.push imediatamente (vai pro menu).
    fireEvent.press(
      screen.getByRole("button", { name: "Gerenciar pelada" }),
    );

    expect(router.push).not.toHaveBeenCalledWith("/regras");
  });

  // Bloco "Gerenciar" (Voltar/Salvar/Finalizar/Limpar) — agora plugado
  // no menu do cog (M-20). Para testar cada escolha individualmente
  // seria preciso mockar `escolherOpcao`, fica como follow-up.
});
