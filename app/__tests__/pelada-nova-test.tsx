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
  it("renderiza o título e o botão de fechar", () => {
    renderWithProviders(<PeladaNovaScreen />);

    expect(screen.getByText("Nova pelada")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeTruthy();
  });

  it("começa com Cadastrar desabilitado (nome vazio)", () => {
    renderWithProviders(<PeladaNovaScreen />);

    const cadastrar = screen.getByRole("button", { name: "Cadastrar" });
    expect(cadastrar.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("habilita Cadastrar depois de digitar um nome", () => {
    renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("Ex.: Fute CEF"),
      "Fute CEF",
    );

    const cadastrar = screen.getByRole("button", { name: "Cadastrar" });
    expect(cadastrar.props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it("ignora click em Cadastrar enquanto o nome estiver vazio", () => {
    const { soccer } = renderWithProviders(<PeladaNovaScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Cadastrar" }));

    expect(soccer.criarPelada).not.toHaveBeenCalled();
  });

  it("ignora click em Cadastrar quando nome é só espaços", () => {
    const { soccer } = renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Ex.: Fute CEF"), "   ");
    fireEvent.press(screen.getByRole("button", { name: "Cadastrar" }));

    expect(soccer.criarPelada).not.toHaveBeenCalled();
  });

  it("chama criarPelada com o nome (trim) e as regras default", async () => {
    const { soccer } = renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("Ex.: Fute CEF"),
      "  Fute CEF  ",
    );
    fireEvent.press(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(soccer.criarPelada).toHaveBeenCalledTimes(1));
    expect(soccer.criarPelada).toHaveBeenCalledWith("Fute CEF", {
      playersPerTeam: 4,
      timeMatch: "00:10:00",
      numberTimes: 1,
      goalLimit: 2,
      choosingTeams: ChoosingTeams.BY_ORDER,
    });
  });

  it("envia regras editadas via stepper para criarPelada", async () => {
    const { soccer } = renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("Ex.: Fute CEF"),
      "Treino",
    );

    // 4 jogadores -> 5
    fireEvent.press(screen.getAllByTestId("icon-plus")[0]);
    // 10 min -> 11
    fireEvent.press(screen.getAllByTestId("icon-plus")[1]);

    fireEvent.press(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(soccer.criarPelada).toHaveBeenCalledTimes(1));
    expect(soccer.criarPelada).toHaveBeenCalledWith(
      "Treino",
      expect.objectContaining({
        playersPerTeam: 5,
        timeMatch: "00:11:00",
      }),
    );
  });

  it("permite trocar o modo de sorteio e envia o valor escolhido", async () => {
    const { soccer } = renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Ex.: Fute CEF"), "X");
    fireEvent.press(screen.getByText("Embaralhar"));
    fireEvent.press(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(soccer.criarPelada).toHaveBeenCalledTimes(1));
    expect(soccer.criarPelada).toHaveBeenCalledWith(
      "X",
      expect.objectContaining({ choosingTeams: ChoosingTeams.BY_MIXING_TEAMS }),
    );
  });

  it("volta após salvar com sucesso", async () => {
    renderWithProviders(<PeladaNovaScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText("Ex.: Fute CEF"),
      "Fute",
    );
    fireEvent.press(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
  });

  it("mostra erro vindo do criarPelada e mantém a tela aberta", async () => {
    const criarPelada = jest
      .fn()
      .mockRejectedValue(new Error("Nome já cadastrado"));
    renderWithProviders(<PeladaNovaScreen />, { soccer: { criarPelada } });

    fireEvent.changeText(
      screen.getByPlaceholderText("Ex.: Fute CEF"),
      "Fute",
    );
    fireEvent.press(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(criarPelada).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Nome já cadastrado")).toBeTruthy();
    expect(router.back).not.toHaveBeenCalled();
  });

  it("Cancelar chama router.back", () => {
    renderWithProviders(<PeladaNovaScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("Fechar (X) chama router.back", () => {
    renderWithProviders(<PeladaNovaScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Fechar" }));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("atualiza o preview quando o usuário muda as regras", () => {
    renderWithProviders(<PeladaNovaScreen />);

    // Default: 4×4 · 10min · 1 tempo · limite 2 gols
    expect(
      screen.getByText(/4×4.*10min.*1 tempo.*limite 2 gols/),
    ).toBeTruthy();
  });
});
