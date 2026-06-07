import { ChoosingTeams } from "@/src/domain/Rules";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test/renderWithProviders";

import PeladaNovaScreen from "../pelada-nova";

// Acesso ao mock do router instalado em jest.setup.ts.
const router = (require("expo-router") as any).__router as {
  push: jest.Mock;
  replace: jest.Mock;
  back: jest.Mock;
};

beforeEach(() => {
  router.push.mockClear();
  router.back.mockClear();
  router.replace.mockClear();
});

describe("PeladaNovaScreen", () => {
  it("renderiza o título e o botão de voltar", () => {
    renderWithProviders(<PeladaNovaScreen />);

    expect(screen.getByText("Nova pelada")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy();
  });

  it("começa com o CTA desabilitado (nome vazio)", () => {
    renderWithProviders(<PeladaNovaScreen />);

    const cadastrar = screen.getByRole("button", {
      name: "Criar e entrar na pelada",
    });
    expect(cadastrar.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("habilita o CTA depois de digitar um nome", () => {
    renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("Nome da pelada (ex.: Fute de Quarta)"),
      "Fute CEF",
    );

    const cadastrar = screen.getByRole("button", {
      name: "Criar e entrar na pelada",
    });
    expect(cadastrar.props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it("ignora click no CTA enquanto o nome estiver vazio", () => {
    const { soccer } = renderWithProviders(<PeladaNovaScreen />);

    fireEvent.press(
      screen.getByRole("button", { name: "Criar e entrar na pelada" }),
    );

    expect(soccer.criarPelada).not.toHaveBeenCalled();
  });

  it("ignora click no CTA quando nome é só espaços", () => {
    const { soccer } = renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("Nome da pelada (ex.: Fute de Quarta)"),
      "   ",
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Criar e entrar na pelada" }),
    );

    expect(soccer.criarPelada).not.toHaveBeenCalled();
  });

  it("chama criarPelada com o nome (trim) e as regras default", async () => {
    const { soccer } = renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("Nome da pelada (ex.: Fute de Quarta)"),
      "  Fute CEF  ",
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Criar e entrar na pelada" }),
    );

    await waitFor(() => expect(soccer.criarPelada).toHaveBeenCalledTimes(1));
    expect(soccer.criarPelada).toHaveBeenCalledWith(
      "Fute CEF",
      {
        playersPerTeam: 4,
        timeMatch: "00:10:00",
        numberTimes: 1,
        goalLimit: 2,
        choosingTeams: ChoosingTeams.BY_ORDER,
      },
      expect.objectContaining({ dia: "Quartas", hora: "21:00" }),
      undefined,
    );
  });

  it("envia regras editadas via stepper para criarPelada", async () => {
    const { soccer } = renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("Nome da pelada (ex.: Fute de Quarta)"),
      "Treino",
    );

    // 4 jogadores -> 5
    fireEvent.press(screen.getAllByTestId("icon-plus")[0]);
    // 10 min -> 11 — design v2: MiniSteppers em ordem [players, limite gols, minutos]
    fireEvent.press(screen.getAllByTestId("icon-plus")[2]);

    fireEvent.press(
      screen.getByRole("button", { name: "Criar e entrar na pelada" }),
    );

    await waitFor(() => expect(soccer.criarPelada).toHaveBeenCalledTimes(1));
    expect(soccer.criarPelada).toHaveBeenCalledWith(
      "Treino",
      expect.objectContaining({
        playersPerTeam: 5,
        timeMatch: "00:11:00",
      }),
      expect.objectContaining({ dia: "Quartas", hora: "21:00" }),
      undefined,
    );
  });

  it("permite trocar o modo de sorteio e envia o valor escolhido", async () => {
    const { soccer } = renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("Nome da pelada (ex.: Fute de Quarta)"),
      "X",
    );
    fireEvent.press(screen.getByText("Embaralhar"));
    fireEvent.press(
      screen.getByRole("button", { name: "Criar e entrar na pelada" }),
    );

    await waitFor(() => expect(soccer.criarPelada).toHaveBeenCalledTimes(1));
    expect(soccer.criarPelada).toHaveBeenCalledWith(
      "X",
      expect.objectContaining({ choosingTeams: ChoosingTeams.BY_MIXING_TEAMS }),
      expect.objectContaining({ dia: "Quartas", hora: "21:00" }),
      undefined,
    );
  });

  it("envia observações com trim para criarPelada quando preenchidas", async () => {
    const { soccer } = renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("Nome da pelada (ex.: Fute de Quarta)"),
      "Pelada Y",
    );
    fireEvent.changeText(
      screen.getByPlaceholderText("Ex.: levar coletes, PIX da quadra, etc."),
      "  Levar coletes verdes  ",
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Criar e entrar na pelada" }),
    );

    await waitFor(() => expect(soccer.criarPelada).toHaveBeenCalledTimes(1));
    expect(soccer.criarPelada).toHaveBeenCalledWith(
      "Pelada Y",
      expect.any(Object),
      expect.any(Object),
      "Levar coletes verdes",
    );
  });

  it("entra na nova pelada após salvar com sucesso", async () => {
    // soccerContextStub: criarPelada resolve com { id: "pelada-1", ... }
    renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("Nome da pelada (ex.: Fute de Quarta)"),
      "Fute",
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Criar e entrar na pelada" }),
    );

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith({
        pathname: "/peladas/[id]",
        params: { id: "pelada-1" },
      }),
    );
  });

  it("mostra erro vindo do criarPelada e mantém a tela aberta", async () => {
    const criarPelada = jest
      .fn()
      .mockRejectedValue(new Error("Nome já cadastrado"));
    renderWithProviders(<PeladaNovaScreen />, { soccer: { criarPelada } });

    fireEvent.changeText(
      screen.getByPlaceholderText("Nome da pelada (ex.: Fute de Quarta)"),
      "Fute",
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Criar e entrar na pelada" }),
    );

    await waitFor(() => expect(criarPelada).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Nome já cadastrado")).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("Voltar chama router.back", () => {
    renderWithProviders(<PeladaNovaScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("atualiza o preview quando o usuário muda as regras", () => {
    renderWithProviders(<PeladaNovaScreen />);

    // Default: 4×4 · 10min · 1 tempo · limite 2 gols
    expect(screen.getByText(/4×4.*10min.*1 tempo.*limite 2 gols/)).toBeTruthy();
  });
});
