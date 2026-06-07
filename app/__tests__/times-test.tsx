import { Alert, Pressable } from "react-native";

import { GestorJogo } from "@/src/domain/GestorJogo";
import { Rules } from "@/src/domain/Rules";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test/renderWithProviders";

import TimesScreen from "../(pelada)/times";

const router = (require("expo-router") as any).__router as {
  push: jest.Mock;
  back: jest.Mock;
};

beforeEach(() => {
  router.push.mockClear();
  router.back.mockClear();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildManager(opts?: {
  jogadores?: number;
  comTimes?: boolean;
  comPartida?: boolean;
  /** Jogadores adicionados DEPOIS de createTeams — ficam sem time. */
  semTime?: number;
}) {
  const m = new GestorJogo("Pelada teste", new Rules({ playersPerTeam: 4 }));
  if (opts?.jogadores) {
    m.addPlayers(
      Array.from({ length: opts.jogadores }, (_, i) => `J${String(i + 1).padStart(2, "0")}`),
    );
  }
  if (opts?.comTimes || opts?.comPartida) {
    m.createTeams();
    if (opts?.comPartida) m.setPlayingGame();
  }
  if (opts?.semTime) {
    const base = opts?.jogadores ?? 0;
    for (let i = 0; i < opts.semTime; i++) {
      m.addPlayer(`S${String(base + i + 1).padStart(2, "0")}`);
    }
  }
  return m;
}

function renderTimes(gestor: GestorJogo | null) {
  return renderWithProviders(<TimesScreen />, { soccer: { gestor } });
}

function mockAlert(pick: (b: { text?: string; style?: string }) => boolean) {
  return jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
    const escolhido = buttons?.find(pick);
    escolhido?.onPress?.();
  });
}

function getPressableByLabel(label: string) {
  return screen.UNSAFE_getAllByType(Pressable).find(
    (p) => p.props.accessibilityLabel === label,
  );
}

// ===========================================================================
// GUARDS / EMPTY STATE
// ===========================================================================

describe("Times — guards e EmptyState", () => {
  it("sem gestor: Redirect (não renderiza Times)", () => {
    renderTimes(null);
    expect(screen.queryByText("Times")).toBeNull();
  });

  it("sem times montados e jogadores insuficientes: EmptyState com botão disabled", () => {
    renderTimes(buildManager({ jogadores: 3 }));

    expect(
      screen.getByText("Times ainda não foram montados"),
    ).toBeTruthy();
    expect(
      screen.getByText("Adicione pelo menos 8 jogadores para montar 2 times."),
    ).toBeTruthy();
    const btn = getPressableByLabel("Montar times");
    expect(btn?.props.disabled).toBe(true);
  });

  it("com jogadores suficientes: clicar 'Montar times' chama createTeams", () => {
    const m = buildManager({ jogadores: 8 });
    const spy = jest.spyOn(m, "createTeams");
    renderTimes(m);

    fireEvent.press(screen.getByText("Montar times"));

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// LISTA DE TIMES
// ===========================================================================

describe("Times — lista", () => {
  it("renderiza Time 1 e Time 2", () => {
    renderTimes(buildManager({ jogadores: 8, comTimes: true }));

    expect(screen.getByText("Time 1")).toBeTruthy();
    expect(screen.getByText("Time 2")).toBeTruthy();
  });

  it("12 jogadores → 3 times: a fila tem 1 time (3º)", () => {
    renderTimes(buildManager({ jogadores: 12, comTimes: true }));

    // TeamQueue mostra a posição (3º) em vez de "Time 3" — design v2.
    expect(screen.getByText("3º")).toBeTruthy();
    expect(screen.getByText("Fila (1)")).toBeTruthy();
  });
});

// ===========================================================================
// INICIAR PARTIDA
// ===========================================================================

describe("Times — iniciar partida", () => {
  it("sem jogadores sem time: chama setPlayingGame e navega para /partida", async () => {
    const m = buildManager({ jogadores: 8, comTimes: true });
    const spy = jest.spyOn(m, "setPlayingGame").mockImplementation(() => {});
    renderTimes(m);

    fireEvent.press(
      screen.getByRole("button", {
        name: "Iniciar a próxima partida",
      }),
    );

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(router.push).toHaveBeenCalledWith("/partida");
  });

  it("com jogadores sem time: pede confirmação; OK chama setPlayingGame", async () => {
    // 8 jogadores em times + 1 adicionado depois (sem time).
    const m = buildManager({ jogadores: 8, comTimes: true, semTime: 1 });
    const spy = jest.spyOn(m, "setPlayingGame").mockImplementation(() => {});
    renderTimes(m);
    const alertSpy = mockAlert((b) => b.text === "Iniciar");

    fireEvent.press(
      screen.getByRole("button", {
        name: "Iniciar a próxima partida",
      }),
    );

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(router.push).toHaveBeenCalledWith("/partida");
    alertSpy.mockRestore();
  });

  it("com jogadores sem time + Cancelar: não chama setPlayingGame", async () => {
    const m = buildManager({ jogadores: 8, comTimes: true, semTime: 1 });
    const spy = jest.spyOn(m, "setPlayingGame").mockImplementation(() => {});
    renderTimes(m);
    const alertSpy = mockAlert((b) => b.style === "cancel");

    fireEvent.press(
      screen.getByRole("button", {
        name: "Iniciar a próxima partida",
      }),
    );

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(spy).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});

// ===========================================================================
// PARTIDA EM ANDAMENTO
// ===========================================================================

describe("Times — durante partida em andamento", () => {
  it("mostra 'Voltar à partida' e esconde FAB de sortear", () => {
    renderTimes(buildManager({ jogadores: 12, comPartida: true }));

    expect(
      screen.getByRole("button", {
        name: "Voltar para a partida em andamento",
      }),
    ).toBeTruthy();
    expect(
      screen.queryByLabelText("Sortear times novamente"),
    ).toBeNull();
  });

  it("'Voltar à partida' navega para /partida", () => {
    renderTimes(buildManager({ jogadores: 12, comPartida: true }));

    fireEvent.press(
      screen.getByRole("button", {
        name: "Voltar para a partida em andamento",
      }),
    );

    expect(router.push).toHaveBeenCalledWith("/partida");
  });
});

// ===========================================================================
// SORTEAR NOVAMENTE (FAB)
// ===========================================================================

describe("Times — sortear novamente", () => {
  it("FAB confirmado: chama resetTimes e createTeams", async () => {
    const m = buildManager({ jogadores: 8, comTimes: true });
    const resetSpy = jest.spyOn(m, "resetTimes").mockImplementation(() => {});
    const createSpy = jest
      .spyOn(m, "createTeams")
      .mockImplementation(() => []);
    renderTimes(m);
    const alertSpy = mockAlert((b) => b.text === "Sortear");

    fireEvent.press(screen.getByLabelText("Sortear times novamente"));

    await waitFor(() => expect(resetSpy).toHaveBeenCalledTimes(1));
    expect(createSpy).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
  });

  it("FAB cancelado: não chama nada", async () => {
    const m = buildManager({ jogadores: 8, comTimes: true });
    const resetSpy = jest.spyOn(m, "resetTimes");
    renderTimes(m);
    const alertSpy = mockAlert((b) => b.style === "cancel");

    fireEvent.press(screen.getByLabelText("Sortear times novamente"));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(resetSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});

// ===========================================================================
// BANNER SEM TIME + ALOCAR
// ===========================================================================

describe("Times — banner 'sem time'", () => {
  it("mostra banner quando há jogadores sem time", () => {
    renderTimes(buildManager({ jogadores: 8, comTimes: true, semTime: 1 }));

    expect(screen.getByText("1 jogador sem time")).toBeTruthy();
  });

  it("'Alocar agora' chama relocatePlayersWithoutTeam", () => {
    const m = buildManager({ jogadores: 8, comTimes: true, semTime: 1 });
    const spy = jest
      .spyOn(m, "relocatePlayersWithoutTeam")
      .mockImplementation(() => {});
    renderTimes(m);

    fireEvent.press(
      screen.getByRole("button", { name: "Alocar jogadores sem time" }),
    );

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// SELEÇÃO E TROCA DE JOGADOR
// ===========================================================================

describe("Times — seleção e troca de jogadores", () => {
  it("tocar em jogador entra em modo seleção e mostra banner", () => {
    renderTimes(buildManager({ jogadores: 8, comTimes: true }));

    fireEvent.press(screen.getByText("J01"));

    expect(screen.getByText(/Trocar "J01"/)).toBeTruthy();
  });

  it("tocar em outro jogador do mesmo time apenas reseleciona (sem erro)", () => {
    renderTimes(buildManager({ jogadores: 8, comTimes: true }));

    fireEvent.press(screen.getByText("J01"));
    fireEvent.press(screen.getByText("J02"));

    expect(screen.getByText(/Trocar "J02"/)).toBeTruthy();
    expect(screen.queryByText(/Selecione um jogador de outro time/)).toBeNull();
  });

  it("tocar em jogador de outro time: chama switchPlayerFromTeam e mostra sucesso", () => {
    const m = buildManager({ jogadores: 8, comTimes: true });
    const spy = jest
      .spyOn(m, "switchPlayerFromTeam")
      .mockImplementation(() => {});
    renderTimes(m);

    fireEvent.press(screen.getByText("J01")); // Time 1
    fireEvent.press(screen.getByText("J05")); // Time 2

    expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/J01 ↔ J05 trocados\./)).toBeTruthy();
  });

  it("Cancelar troca fecha o banner de seleção", () => {
    renderTimes(buildManager({ jogadores: 8, comTimes: true }));

    fireEvent.press(screen.getByText("J01"));
    fireEvent.press(
      screen.getByRole("button", { name: "Cancelar troca" }),
    );

    expect(screen.queryByText(/Trocar "J01"/)).toBeNull();
  });
});

// ===========================================================================
// AÇÕES DO TIME (3-pontinhos)
// ===========================================================================

describe("Times — menu de ações do time", () => {
  it("'Mover para o fim' chama moverTimeParaFim", async () => {
    const m = buildManager({ jogadores: 12, comTimes: true });
    const spy = jest
      .spyOn(m, "moverTimeParaFim")
      .mockImplementation(() => {});
    renderTimes(m);
    const alertSpy = mockAlert((b) => b.text === "Mover para o fim");

    fireEvent.press(
      screen.getByRole("button", { name: "Ações do Time 1" }),
    );

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy.mock.calls[0][0]).toBe(m.next[0]);
    alertSpy.mockRestore();
  });

  it("'Esvaziar time' confirmado chama esvaziarTime", async () => {
    const m = buildManager({ jogadores: 12, comTimes: true });
    const spy = jest.spyOn(m, "esvaziarTime").mockImplementation(() => {});
    renderTimes(m);
    // O primeiro Alert é o menu (escolhe Esvaziar), o segundo confirma.
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_t, _m, buttons) => {
        const escolha = buttons?.find((b) => b.text === "Esvaziar time")
          ?? buttons?.find((b) => b.text === "Esvaziar");
        escolha?.onPress?.();
      });

    fireEvent.press(
      screen.getByRole("button", { name: "Ações do Time 1" }),
    );

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    alertSpy.mockRestore();
  });

  it("cancelar no menu não chama nada", async () => {
    const m = buildManager({ jogadores: 12, comTimes: true });
    const moverSpy = jest.spyOn(m, "moverTimeParaFim");
    const esvaziarSpy = jest.spyOn(m, "esvaziarTime");
    renderTimes(m);
    const alertSpy = mockAlert((b) => b.style === "cancel");

    fireEvent.press(
      screen.getByRole("button", { name: "Ações do Time 1" }),
    );

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(moverSpy).not.toHaveBeenCalled();
    expect(esvaziarSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("durante partida: botão de ações some (read-only)", () => {
    renderTimes(buildManager({ jogadores: 12, comPartida: true }));

    expect(
      screen.queryByRole("button", { name: "Ações do Time 1" }),
    ).toBeNull();
  });
});
