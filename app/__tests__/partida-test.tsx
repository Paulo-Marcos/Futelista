import { GestorJogo } from "@/src/domain/GestorJogo";
import { Rules } from "@/src/domain/Rules";
import { Timer, TimerStatus } from "@/src/domain/Timer";
import {
  fireEvent,
  renderWithProviders,
  screen,
} from "@/src/test/renderWithProviders";

import PartidaScreen from "../partida";

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

/**
 * Constrói um GestorJogo pronto para a tela de partida.
 *
 * - `withProximo`: cria 3 times (12 jogadores 4×4×4) — sobra 1 time em `next`
 *   após `setPlayingGame`, permitindo testar substituição.
 * - `withoutProximo`: cria só 2 times (8 jogadores) — `next` fica vazio,
 *   substituição deve gerar erro.
 */
function buildPartidaManager(opts?: {
  semProximo?: boolean;
  status?: TimerStatus;
}): GestorJogo {
  const m = new GestorJogo("Pelada teste", new Rules({ playersPerTeam: 4 }));
  const total = opts?.semProximo ? 8 : 12;
  m.addPlayers(
    Array.from({ length: total }, (_, i) => `J${String(i + 1).padStart(2, "0")}`),
  );
  m.createTeams();
  m.setPlayingGame();

  if (opts?.status !== undefined) {
    // Timer real sem disparar setInterval — força o status desejado.
    m.timer = new Timer(
      m.rules.numberTimes,
      m.rules.getDurationMatch(),
      () => {
        /* sem notify aqui — o GestorJogo não tem listener mockado */
      },
    );
    m.timer.status = opts.status;
  }
  return m;
}

function renderPartida(manager: GestorJogo | null) {
  return renderWithProviders(<PartidaScreen />, {
    soccer: { manager },
  });
}

// ===========================================================================
// GUARDS
// ===========================================================================

describe("Partida — guards", () => {
  it("sem manager: não renderiza (Redirect)", () => {
    renderPartida(null);
    expect(screen.queryByText("Partida")).toBeNull();
  });

  it("manager sem `playing`: mostra EmptyState 'Nenhuma partida em andamento'", () => {
    const m = new GestorJogo("Pelada", new Rules({ playersPerTeam: 4 }));
    renderPartida(m);

    expect(screen.getByText("Nenhuma partida em andamento")).toBeTruthy();
  });

  it("EmptyState: botão 'Voltar' chama router.back", () => {
    const m = new GestorJogo("Pelada", new Rules({ playersPerTeam: 4 }));
    renderPartida(m);

    fireEvent.press(screen.getByText("Voltar"));

    expect(router.back).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// CTA DINÂMICA (depende do status do timer)
// ===========================================================================

describe("Partida — CTA dinâmica", () => {
  it("sem timer ainda (status undefined): CTA 'Iniciar' e dispara manager.start", () => {
    const m = buildPartidaManager();
    const startSpy = jest.spyOn(m, "start").mockImplementation(() => {});
    renderPartida(m);

    fireEvent.press(screen.getByRole("button", { name: "Iniciar" }));

    expect(startSpy).toHaveBeenCalledTimes(1);
  });

  it("status STARTED: CTA 'Pausar' e dispara manager.pause", () => {
    const m = buildPartidaManager({ status: TimerStatus.STARTED });
    const pauseSpy = jest.spyOn(m, "pause").mockImplementation(() => {});
    renderPartida(m);

    fireEvent.press(screen.getByRole("button", { name: "Pausar" }));

    expect(pauseSpy).toHaveBeenCalledTimes(1);
  });

  it("status PAUSED: CTA 'Continuar' e dispara manager.continue", () => {
    const m = buildPartidaManager({ status: TimerStatus.PAUSED });
    const continueSpy = jest
      .spyOn(m, "continue")
      .mockImplementation(() => {});
    renderPartida(m);

    fireEvent.press(screen.getByRole("button", { name: "Continuar" }));

    expect(continueSpy).toHaveBeenCalledTimes(1);
  });

  it("status INTERVAL: CTA 'Próximo tempo' e dispara manager.start", () => {
    const m = buildPartidaManager({ status: TimerStatus.INTERVAL });
    const startSpy = jest.spyOn(m, "start").mockImplementation(() => {});
    renderPartida(m);

    fireEvent.press(screen.getByRole("button", { name: "Próximo tempo" }));

    expect(startSpy).toHaveBeenCalledTimes(1);
  });

  it("status ENDED: ainda mostra CTA 'Iniciar' (recomeçar)", () => {
    const m = buildPartidaManager({ status: TimerStatus.ENDED });
    renderPartida(m);

    expect(screen.getByRole("button", { name: "Iniciar" })).toBeTruthy();
  });
});

// ===========================================================================
// SCOREBOARD
// ===========================================================================

describe("Partida — scoreboard", () => {
  it("renderiza Time 1 e Time 2", () => {
    renderPartida(buildPartidaManager());
    expect(screen.getAllByText("Time 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Time 2").length).toBeGreaterThan(0);
  });

  it("placar começa 0×0 e cresce ao adicionar gol", () => {
    const m = buildPartidaManager({ status: TimerStatus.STARTED });
    renderPartida(m);

    // Há "0" na coluna dos dois times (ao menos 2 vezes).
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);

    // Toque no primeiro jogador do Time A (J01) → adiciona gol pro Time A.
    fireEvent.press(screen.getByText("J01"));

    // Placar Time A vira 1.
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });
});

// ===========================================================================
// AÇÕES POR JOGADOR
// ===========================================================================

describe("Partida — ações por jogador", () => {
  it("press no nome do jogador adiciona gol para o time dele", () => {
    const m = buildPartidaManager({ status: TimerStatus.STARTED });
    const addGoalSpy = jest.spyOn(m, "addGoal");
    renderPartida(m);

    fireEvent.press(screen.getByText("J01"));

    expect(addGoalSpy).toHaveBeenCalledTimes(1);
    // 1º argumento é o time A, 2º é o jogador
    expect(addGoalSpy.mock.calls[0][0]).toBe(m.playing!.teamA);
    expect(addGoalSpy.mock.calls[0][1].name).toBe("J01");
  });

  it("substituir COM próximo time disponível chama switchPlayerLeft", () => {
    const m = buildPartidaManager(); // 3 times — sobra 1 em next
    const switchSpy = jest
      .spyOn(m, "switchPlayerLeft")
      .mockImplementation(() => {});
    renderPartida(m);

    // Pega o botão de substituir do J01 — é o primeiro account-switch.
    const subs = screen.getAllByTestId("icon-account-switch");
    fireEvent.press(subs[0]);

    expect(switchSpy).toHaveBeenCalledTimes(1);
    // Entra o primeiro do próximo time, sai o J01
    expect(switchSpy.mock.calls[0][1].name).toBe("J01");
  });

  it("substituir SEM próximo time mostra erro no banner", () => {
    const m = buildPartidaManager({ semProximo: true }); // 8 jogadores → 2 times → next vazio
    renderPartida(m);

    const subs = screen.getAllByTestId("icon-account-switch");
    fireEvent.press(subs[0]);

    expect(
      screen.getByText("Não há jogador no próximo time para entrar."),
    ).toBeTruthy();
  });

  it("remover (account-minus) chama removeFromGame", () => {
    const m = buildPartidaManager();
    const removeSpy = jest
      .spyOn(m, "removeFromGame")
      .mockImplementation(() => {});
    renderPartida(m);

    const remover = screen.getAllByTestId("icon-account-minus");
    fireEvent.press(remover[0]);

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy.mock.calls[0][0].name).toBe("J01");
  });
});

// ===========================================================================
// PRÓXIMO A ENTRAR
// ===========================================================================

describe("Partida — preview do próximo a entrar", () => {
  it("mostra o nome do primeiro jogador do próximo time", () => {
    const m = buildPartidaManager(); // 12 jogadores → 3 times; J09 é o 1º do 3º time
    renderPartida(m);

    expect(screen.getByText("Próximo a entrar")).toBeTruthy();
    expect(screen.getByText("J09")).toBeTruthy();
  });

  it("não mostra 'Próximo a entrar' quando não há próximo time", () => {
    const m = buildPartidaManager({ semProximo: true });
    renderPartida(m);

    expect(screen.queryByText("Próximo a entrar")).toBeNull();
  });
});

// ===========================================================================
// ENCERRAR + NAVEGAÇÃO
// ===========================================================================

describe("Partida — encerrar e navegação", () => {
  it("'Encerrar partida' chama setResult e navega para /resultado", () => {
    const m = buildPartidaManager({ status: TimerStatus.STARTED });
    const setResultSpy = jest
      .spyOn(m, "setResult")
      .mockImplementation(() => {});
    renderPartida(m);

    fireEvent.press(screen.getByRole("button", { name: "Encerrar partida" }));

    expect(setResultSpy).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/resultado");
  });
});
