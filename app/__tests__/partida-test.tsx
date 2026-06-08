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
  restTime?: number;
}): GestorJogo {
  const m = new GestorJogo("Pelada teste", new Rules({ playersPerTeam: 4 }));
  const total = opts?.semProximo ? 8 : 12;
  m.addPlayers(
    Array.from({ length: total }, (_, i) => `J${String(i + 1).padStart(2, "0")}`),
  );
  m.createTeams();
  m.setPlayingGame();

  if (opts?.status !== undefined || opts?.restTime !== undefined) {
    m.timer = new Timer(
      m.rules.numberTimes,
      m.rules.getDurationMatch(),
      () => {},
    );
    if (opts?.status !== undefined) m.timer.status = opts.status;
    if (opts?.restTime !== undefined) m.timer.restTime = opts.restTime;
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

  it("ao atingir o gol-limite a partida encerra e navega para /resultado [F-12]", () => {
    const m = buildPartidaManager({ status: TimerStatus.STARTED });
    // Rules default: goalLimit=2 — marcar 1 gol antes deixa o time em 1.
    m.addGoal(m.playing!.teamA, m.playing!.teamA.players[0]);
    renderPartida(m);

    // Próximo gol do mesmo time dispara `encerrarSeAtingiuLimite`.
    fireEvent.press(screen.getByLabelText("Gol de J02"));

    expect(m.playing!.result).toBeDefined();
    expect(m.timer!.status).toBe(TimerStatus.ENDED);
    expect(router.replace).toHaveBeenCalledWith("/resultado");
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

  it("modo multi: aplica 2 trocas em sequência ao tocar 'Aplicar'", () => {
    const m = buildPartidaManager();
    const switchSpy = jest.spyOn(m, "switchPlayerLeft");
    renderPartida(m);

    fireEvent.press(screen.getByRole("button", { name: "Trocas" }));
    fireEvent.press(
      screen.getByRole("button", {
        name: "Selecionar vários jogadores",
      }),
    );

    // Par 1: J01 (em campo, Time 1) sai → J09 (banco) entra.
    fireEvent.press(screen.getByLabelText("Selecionar J01 para sair"));
    fireEvent.press(screen.getByLabelText("Trocar J09 para entrar"));
    // Par 2: J02 (em campo, Time 1) sai → J10 (banco) entra.
    fireEvent.press(screen.getByLabelText("Selecionar J02 para sair"));
    fireEvent.press(screen.getByLabelText("Trocar J10 para entrar"));

    fireEvent.press(
      screen.getByRole("button", { name: "Aplicar 2 trocas" }),
    );

    expect(switchSpy).toHaveBeenCalledTimes(2);
    expect(switchSpy.mock.calls[0][0].name).toBe("J09");
    expect(switchSpy.mock.calls[0][1].name).toBe("J01");
    expect(switchSpy.mock.calls[1][0].name).toBe("J10");
    expect(switchSpy.mock.calls[1][1].name).toBe("J02");
  });

  it("modo multi: 'Aplicar' está desabilitado sem pares", () => {
    const m = buildPartidaManager();
    renderPartida(m);

    fireEvent.press(screen.getByRole("button", { name: "Trocas" }));
    fireEvent.press(
      screen.getByRole("button", {
        name: "Selecionar vários jogadores",
      }),
    );

    const aplicar = screen.getByRole("button", {
      name: "Aplicar trocas",
    });
    expect(aplicar.props.accessibilityState?.disabled).toBe(true);
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

// ===========================================================================
// APITO HÁPTICO (F-07)
// ===========================================================================

describe("Partida — apito háptico ao fim do tempo", () => {
  const Haptics = require("expo-haptics");

  beforeEach(() => {
    (Haptics.notificationAsync as jest.Mock).mockClear();
  });

  it("dispara notificationAsync ao montar com status ENDED", () => {
    const m = buildPartidaManager({ status: TimerStatus.ENDED });
    renderPartida(m);

    expect(Haptics.notificationAsync).toHaveBeenCalled();
  });

  it("não dispara quando status não é ENDED", () => {
    const m = buildPartidaManager({ status: TimerStatus.STARTED });
    renderPartida(m);

    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// CHECKPOINTS DE CRONÔMETRO (F-08)
// ===========================================================================

describe("Partida — checkpoints do cronômetro", () => {
  const Haptics = require("expo-haptics");

  beforeEach(() => {
    (Haptics.impactAsync as jest.Mock).mockClear();
  });

  it("mostra 'Faltam 2 minutos' quando restTime cruza 120s rodando", () => {
    const m = buildPartidaManager({
      status: TimerStatus.STARTED,
      restTime: 120,
    });
    renderPartida(m);

    expect(screen.getByText("Faltam 2 minutos")).toBeTruthy();
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it("mostra 'Faltam 30 segundos' quando restTime cruza 30s rodando", () => {
    const m = buildPartidaManager({
      status: TimerStatus.STARTED,
      restTime: 30,
    });
    renderPartida(m);

    // 30 também é ≤ 120 — ambos checkpoints disparam, mas o toast visível
    // mostra o ÚLTIMO (mais urgente) porque setCheckpointToast é serial.
    expect(screen.getByText("Faltam 30 segundos")).toBeTruthy();
  });

  it("não dispara nada em PAUSED, mesmo com tempo baixo", () => {
    const m = buildPartidaManager({
      status: TimerStatus.PAUSED,
      restTime: 25,
    });
    renderPartida(m);

    expect(screen.queryByText(/Faltam/)).toBeNull();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// EDITAR / REMOVER GOL VIA LONG-PRESS NA TIMELINE (F-11)
// ===========================================================================

describe("Partida — long-press na timeline (F-11)", () => {
  /**
   * Constrói partida com 2 gols. O long-press só é plugado nos chips
   * antigos (o mais recente mantém o botão de undo) — então pra exercitar
   * o caminho do F-11 precisamos de ≥2 gols na timeline.
   */
  function buildComDoisGols(): GestorJogo {
    const m = buildPartidaManager({ status: TimerStatus.STARTED });
    m.addGoal(m.playing!.teamA, m.playing!.teamA.players[0]); // gol antigo (J01)
    m.addGoal(m.playing!.teamA, m.playing!.teamA.players[1]); // gol recente (J02)
    return m;
  }

  it("long-press num chip antigo abre o sheet de ações do gol", () => {
    const m = buildComDoisGols();
    renderPartida(m);

    const chip = screen.getByLabelText(/Ações do gol de J01/);
    fireEvent(chip, "longPress");

    expect(screen.getByText("Corrigir registro")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Corrigir autor do gol" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Remover este gol" }),
    ).toBeTruthy();
  });

  it("'Corrigir autor' do gol antigo + escolher J03 chama corrigirAutorDoGol", () => {
    const m = buildComDoisGols();
    // Guardamos a referência ANTES — após `corrigirAutorDoGol`, o gol
    // antigo é substituído por um novo objeto no array da partida.
    const golDeJ01 = m.playing!.goals[0];
    const spy = jest.spyOn(m, "corrigirAutorDoGol");
    renderPartida(m);

    fireEvent(screen.getByLabelText(/Ações do gol de J01/), "longPress");
    fireEvent.press(
      screen.getByRole("button", { name: "Corrigir autor do gol" }),
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Trocar autor para J03" }),
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe(golDeJ01);
    expect(spy.mock.calls[0][1].name).toBe("J03");
  });

  it("chip mais recente não vira Pressable interativo (evita nested button no web)", () => {
    const m = buildComDoisGols();
    renderPartida(m);

    // O mais recente foi marcado por J02 — não deve ter label de ação.
    expect(screen.queryByLabelText(/Ações do gol de J02/)).toBeNull();
    // Ele mantém o botão dedicado de undo.
    expect(
      screen.getByRole("button", { name: "Desfazer gol mais recente" }),
    ).toBeTruthy();
  });
});
