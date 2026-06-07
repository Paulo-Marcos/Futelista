import { GestorJogo } from "@/src/domain/GestorJogo";
import { Rules } from "@/src/domain/Rules";
import { Timer, TimerStatus } from "@/src/domain/Timer";
import {
  fireEvent,
  renderWithProviders,
  screen,
} from "@/src/test/renderWithProviders";

import PartidaScreen from "../(pelada)/partida";

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

/**
 * Constrói GestorJogo pronto para a partida com avatares na linha de
 * campo. `semProximo` cria só 2 times — sem reservas no banco.
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
    m.timer = new Timer(
      m.rules.numberTimes,
      m.rules.getDurationMatch(),
      () => {},
    );
    m.timer.status = opts.status;
  }
  return m;
}

function renderPartida(gestor: GestorJogo | null) {
  return renderWithProviders(<PartidaScreen />, { soccer: { gestor } });
}

// ===========================================================================
// GUARDS
// ===========================================================================

describe("Partida — guards", () => {
  it("sem gestor: não renderiza (Redirect)", () => {
    renderPartida(null);
    expect(screen.queryByText("Partida")).toBeNull();
  });

  it("gestor sem `playing`: mostra EmptyState 'Nenhuma partida em andamento'", () => {
    const m = new GestorJogo("Pelada", new Rules({ playersPerTeam: 4 }));
    renderPartida(m);

    expect(screen.getByText("Nenhuma partida em andamento")).toBeTruthy();
  });

  it("EmptyState: botão 'Voltar' chama router.back", () => {
    const m = new GestorJogo("Pelada", new Rules({ playersPerTeam: 4 }));
    renderPartida(m);

    fireEvent.press(screen.getByText("Voltar"));

    expect(router.back).toHaveBeenCalled();
  });
});

// ===========================================================================
// CTA DINÂMICA (depende do status do timer)
// ===========================================================================

describe("Partida — CTA dinâmica", () => {
  it("sem timer ainda (status undefined): disco central INICIAR dispara gestor.start", () => {
    const m = buildPartidaManager();
    const startSpy = jest.spyOn(m, "start").mockImplementation(() => {});
    renderPartida(m);

    // No design, "INICIAR" é o disco central — não há CTA "Iniciar" na barra
    // de controles inferior. O label do disco identifica o botão.
    fireEvent.press(
      screen.getByLabelText("Apitar início (centro do campo)"),
    );

    expect(startSpy).toHaveBeenCalled();
  });

  it("status STARTED: CTA 'Pausar' e dispara gestor.pause", () => {
    const m = buildPartidaManager({ status: TimerStatus.STARTED });
    const pauseSpy = jest.spyOn(m, "pause").mockImplementation(() => {});
    renderPartida(m);

    fireEvent.press(screen.getByRole("button", { name: "Pausar" }));

    expect(pauseSpy).toHaveBeenCalledTimes(1);
  });

  it("status PAUSED: CTA 'Continuar' e dispara gestor.continue", () => {
    const m = buildPartidaManager({ status: TimerStatus.PAUSED });
    const continueSpy = jest
      .spyOn(m, "continue")
      .mockImplementation(() => {});
    renderPartida(m);

    fireEvent.press(screen.getByRole("button", { name: "Continuar" }));

    expect(continueSpy).toHaveBeenCalledTimes(1);
  });

  it("status INTERVAL: CTA 'Próximo tempo' e dispara gestor.start", () => {
    const m = buildPartidaManager({ status: TimerStatus.INTERVAL });
    const startSpy = jest.spyOn(m, "start").mockImplementation(() => {});
    renderPartida(m);

    fireEvent.press(screen.getByRole("button", { name: "Próximo tempo" }));

    expect(startSpy).toHaveBeenCalledTimes(1);
  });

  it("status ENDED: disco central volta ao estado INICIAR (recomeçar)", () => {
    const m = buildPartidaManager({ status: TimerStatus.ENDED });
    renderPartida(m);

    expect(
      screen.getByLabelText("Apitar início (centro do campo)"),
    ).toBeTruthy();
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

  it("placar começa 0×0 e cresce ao tocar no dot do jogador", () => {
    const m = buildPartidaManager({ status: TimerStatus.STARTED });
    renderPartida(m);

    // 0 aparece como número de placar em pelo menos os dois lados.
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);

    // Tap no dot do J01 (label do botão "Gol de J01") → adiciona gol pro Time A.
    fireEvent.press(screen.getByLabelText("Gol de J01"));

    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });
});

// ===========================================================================
// AÇÕES POR JOGADOR
// ===========================================================================

describe("Partida — ações por jogador", () => {
  it("tap no dot do jogador adiciona gol para o time dele", () => {
    const m = buildPartidaManager({ status: TimerStatus.STARTED });
    const addGoalSpy = jest.spyOn(m, "addGoal");
    renderPartida(m);

    fireEvent.press(screen.getByLabelText("Gol de J01"));

    expect(addGoalSpy).toHaveBeenCalledTimes(1);
    expect(addGoalSpy.mock.calls[0][0]).toBe(m.playing!.teamA);
    expect(addGoalSpy.mock.calls[0][1].name).toBe("J01");
  });

  it("substituir via sheet Trocas COM próximo time chama switchPlayerLeft", () => {
    const m = buildPartidaManager(); // 3 times — sobra 1 em next
    const switchSpy = jest
      .spyOn(m, "switchPlayerLeft")
      .mockImplementation(() => {});
    renderPartida(m);

    // Abre a sheet Trocas.
    fireEvent.press(screen.getByRole("button", { name: "Trocas" }));

    // Toca em quem sai (J01 do Time 1).
    fireEvent.press(screen.getByLabelText("Selecionar J01 para sair"));

    // Toca em quem entra (1º do próximo time = J09).
    fireEvent.press(screen.getByLabelText("Trocar J09 para entrar"));

    expect(switchSpy).toHaveBeenCalledTimes(1);
    // playerIn (J09), playerOut (J01)
    expect(switchSpy.mock.calls[0][0].name).toBe("J09");
    expect(switchSpy.mock.calls[0][1].name).toBe("J01");
  });

  it("substituir SEM próximo time: sheet mostra 'Sem reservas no banco agora.'", () => {
    const m = buildPartidaManager({ semProximo: true });
    renderPartida(m);

    fireEvent.press(screen.getByRole("button", { name: "Trocas" }));

    expect(screen.getByText("Sem reservas no banco agora.")).toBeTruthy();
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

    fireEvent.press(screen.getByRole("button", { name: "Encerrar" }));

    expect(setResultSpy).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/resultado");
  });
});
