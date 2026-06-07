import { Pelada } from "@/src/domain/Pelada";
import { ChoosingTeams } from "@/src/domain/Rules";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test/renderWithProviders";

import PeladaEditarScreen from "../pelada-editar/[id]";

const expoRouter = require("expo-router") as any;
const router = expoRouter.__router as {
  push: jest.Mock;
  back: jest.Mock;
  replace: jest.Mock;
};

beforeEach(() => {
  router.push.mockClear();
  router.back.mockClear();
  router.replace.mockClear();
  expoRouter.__setSearchParams({ id: "p1" });
});

afterEach(() => {
  expoRouter.__setSearchParams({});
});

function fakePelada(overrides: Partial<{
  nome: string;
  playersPerTeam: number;
  goalLimit: number;
  timeMatch: string;
  choosingTeams: ChoosingTeams;
  dia: string;
  hora: string;
  local: string;
  observacoes: string;
}> = {}): Pelada {
  return new Pelada({
    id: "p1",
    nome: overrides.nome ?? "Fute CEF",
    regras: {
      playersPerTeam: overrides.playersPerTeam ?? 4,
      timeMatch: overrides.timeMatch ?? "00:10:00",
      numberTimes: 1,
      goalLimit: overrides.goalLimit ?? 2,
      choosingTeams: overrides.choosingTeams ?? ChoosingTeams.BY_ORDER,
    },
    dia: overrides.dia,
    hora: overrides.hora,
    local: overrides.local,
    observacoes: overrides.observacoes,
  });
}

describe("PeladaEditarScreen", () => {
  it("mostra spinner enquanto carrega a pelada", () => {
    renderWithProviders(<PeladaEditarScreen />, {
      soccer: {
        carregarPelada: jest.fn(() => new Promise(() => {})),
      },
    });

    // Sem getByRole("progressbar") fácil no RN; checa que ainda não
    // renderizou o título da tela.
    expect(screen.queryByText("Editar pelada")).toBeNull();
  });

  it("pré-popula campos com os valores da pelada carregada", async () => {
    renderWithProviders(<PeladaEditarScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(
          fakePelada({
            nome: "Fute Quarta",
            local: "Quadra do CEF",
            hora: "20:30",
            observacoes: "Levar coletes",
          }),
        ),
      },
    });

    // useFocusEffect → setPelada → useEffect → setStates é uma chain
    // assíncrona; findByDisplayValue aguarda o ciclo terminar.
    expect(
      await screen.findByDisplayValue("Fute Quarta", undefined, {
        timeout: 5000,
      }),
    ).toBeTruthy();
    expect(screen.getByDisplayValue("Quadra do CEF")).toBeTruthy();
    expect(screen.getByDisplayValue("20:30")).toBeTruthy();
    expect(screen.getByDisplayValue("Levar coletes")).toBeTruthy();
  });

  it("EmptyState quando a pelada não existe", async () => {
    renderWithProviders(<PeladaEditarScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(null),
      },
    });

    expect(await screen.findByText("Pelada não encontrada")).toBeTruthy();
  });

  it("chama atualizarPelada com os campos editados e volta", async () => {
    const { soccer } = renderWithProviders(<PeladaEditarScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
      },
    });

    await screen.findByText("Editar pelada", undefined, { timeout: 5000 });

    fireEvent.changeText(
      screen.getByDisplayValue("Fute CEF"),
      "Fute CEF Atualizada",
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() =>
      expect(soccer.atualizarPelada).toHaveBeenCalledTimes(1),
    );
    expect(soccer.atualizarPelada).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        nome: "Fute CEF Atualizada",
        regras: expect.objectContaining({ playersPerTeam: 4, goalLimit: 2 }),
      }),
    );
    await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
  });

  it("exibe erro vindo de atualizarPelada e mantém a tela aberta", async () => {
    const { soccer } = renderWithProviders(<PeladaEditarScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
        atualizarPelada: jest
          .fn()
          .mockRejectedValue(new Error("Boom de teste")),
      },
    });

    // Aguarda a tela sair do loading antes de tentar o press.
    await screen.findByDisplayValue("Fute CEF", undefined, { timeout: 5000 });
    fireEvent.press(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(
      () => expect(soccer.atualizarPelada).toHaveBeenCalledTimes(1),
      { timeout: 5000 },
    );
    await waitFor(
      () => expect(screen.getByText("Boom de teste")).toBeTruthy(),
      { timeout: 5000 },
    );
    expect(router.back).not.toHaveBeenCalled();
  });

  it("Voltar chama router.back", async () => {
    renderWithProviders(<PeladaEditarScreen />, {
      soccer: {
        carregarPelada: jest.fn().mockResolvedValue(fakePelada()),
      },
    });

    await screen.findByText("Editar pelada", undefined, { timeout: 5000 });
    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
