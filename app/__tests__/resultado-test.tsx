import { GestorJogo } from "@/src/domain/GestorJogo";
import { ResultMatch } from "@/src/domain/Match";
import { Rules } from "@/src/domain/Rules";
import {
  fireEvent,
  renderWithProviders,
  screen,
} from "@/src/test/renderWithProviders";

import ResultadoScreen from "../resultado";

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
 * Constrói um gestor com partida em andamento e (opcionalmente) define
 * winner/loser/result diretamente — atalho de teste para evitar dependência
 * do Timer.
 */
function buildResultadoManager(opts: {
  /** Quantidade total de jogadores (cria N/playersPerTeam times). */
  totalJogadores?: number;
  result: ResultMatch;
  /** Define gestor.advantageToNext = teamA (para empate automático). */
  comAdvantage?: boolean;
  /** "A" → winner=teamA; "B" → winner=teamB. */
  vencedor?: "A" | "B";
}) {
  const m = new GestorJogo("Pelada", new Rules({ playersPerTeam: 4 }));
  const total = opts.totalJogadores ?? 12;
  m.addPlayers(
    Array.from({ length: total }, (_, i) => `J${String(i + 1).padStart(2, "0")}`),
  );
  m.createTeams();
  m.setPlayingGame();

  const playing = m.playing!;
  playing.result = opts.result;
  if (opts.result === ResultMatch.VICTORY) {
    playing.winner = opts.vencedor === "B" ? playing.teamB : playing.teamA;
    playing.loser = opts.vencedor === "B" ? playing.teamA : playing.teamB;
  }
  if (opts.comAdvantage) {
    m.advantageToNext = playing.teamA;
  }
  return m;
}

function renderResultado(gestor: GestorJogo | null) {
  return renderWithProviders(<ResultadoScreen />, { soccer: { gestor } });
}

// ===========================================================================
// GUARDS
// ===========================================================================

describe("Resultado — guards", () => {
  it("sem gestor: não renderiza (Redirect)", () => {
    renderResultado(null);
    expect(screen.queryByText(/×/)).toBeNull();
  });

  it("gestor sem playing/result: 'Nenhum resultado pendente'", () => {
    const m = new GestorJogo("Pelada", new Rules({ playersPerTeam: 4 }));
    renderResultado(m);

    expect(screen.getByText("Nenhum resultado pendente")).toBeTruthy();
  });

  it("'Voltar à partida' chama router.back", () => {
    const m = buildResultadoManager({ result: ResultMatch.VICTORY, vencedor: "A" });
    renderResultado(m);

    fireEvent.press(screen.getByRole("button", { name: "Voltar à partida" }));

    expect(router.back).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// VITÓRIA
// ===========================================================================

describe("Resultado — vitória", () => {
  it("mostra cartão 'Vitória' e CTA 'Próxima partida'", () => {
    renderResultado(
      buildResultadoManager({ result: ResultMatch.VICTORY, vencedor: "A" }),
    );

    expect(screen.getByText("Vitória")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Próxima partida" })).toBeTruthy();
  });

  it("'Próxima partida' chama setNextMatch e navega para /times", () => {
    const m = buildResultadoManager({
      result: ResultMatch.VICTORY,
      vencedor: "A",
    });
    const setNextSpy = jest
      .spyOn(m, "setNextMatch")
      .mockImplementation(() => {});
    renderResultado(m);

    fireEvent.press(screen.getByRole("button", { name: "Próxima partida" }));

    expect(setNextSpy).toHaveBeenCalledTimes(1);
    expect(setNextSpy).toHaveBeenCalledWith(undefined);
    expect(router.replace).toHaveBeenCalledWith("/times");
  });
});

// ===========================================================================
// EMPATE AUTOMÁTICO
// ===========================================================================

describe("Resultado — empate automático", () => {
  it("com vantagem prévia: texto 'Time com vantagem prévia segue jogando'", () => {
    const m = buildResultadoManager({
      result: ResultMatch.DRAW,
      comAdvantage: true,
    });
    renderResultado(m);

    expect(screen.getByText("Empate")).toBeTruthy();
    expect(
      screen.getByText("Time com vantagem prévia segue jogando."),
    ).toBeTruthy();
  });

  it("com 2 times cheios em next (mas sem advantage): 'decidido automaticamente pela fila'", () => {
    // 16 jogadores → 4 times. setPlayingGame consome 2; next fica com 2 cheios.
    const m = buildResultadoManager({
      result: ResultMatch.DRAW,
      totalJogadores: 16,
    });
    renderResultado(m);

    expect(
      screen.getByText("Empate decidido automaticamente pela fila."),
    ).toBeTruthy();
  });

  it("empate automático: 'Próxima partida' chama setNextMatch sem argumento", () => {
    const m = buildResultadoManager({
      result: ResultMatch.DRAW,
      comAdvantage: true,
    });
    const setNextSpy = jest
      .spyOn(m, "setNextMatch")
      .mockImplementation(() => {});
    renderResultado(m);

    fireEvent.press(screen.getByRole("button", { name: "Próxima partida" }));

    expect(setNextSpy).toHaveBeenCalledWith(undefined);
    expect(router.replace).toHaveBeenCalledWith("/times");
  });
});

// ===========================================================================
// EMPATE MANUAL
// ===========================================================================

describe("Resultado — empate manual (decisão do usuário)", () => {
  // 12 jogadores → 3 times. setPlayingGame consome 2; next fica com 1.
  // Sem advantage E sem 2 times cheios em next → cenário manual.
  function buildEmpateManual() {
    return buildResultadoManager({
      result: ResultMatch.DRAW,
      totalJogadores: 12,
    });
  }

  it("mostra 'Empate sem vantagem' e opções dos dois times", () => {
    renderResultado(buildEmpateManual());

    expect(screen.getByText("Empate sem vantagem")).toBeTruthy();
    expect(screen.getByText("Quem segue jogando?")).toBeTruthy();
  });

  it("'Próxima partida' começa desabilitado", () => {
    renderResultado(buildEmpateManual());
    const btn = screen.getByRole("button", { name: "Próxima partida" });
    expect(btn.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("escolher Time 1 e confirmar passa teamA para setNextMatch", () => {
    const m = buildEmpateManual();
    const setNextSpy = jest
      .spyOn(m, "setNextMatch")
      .mockImplementation(() => {});
    renderResultado(m);

    fireEvent.press(
      screen.getByRole("button", { name: "Escolher Time 1" }),
    );
    fireEvent.press(screen.getByRole("button", { name: "Próxima partida" }));

    expect(setNextSpy).toHaveBeenCalledTimes(1);
    expect(setNextSpy.mock.calls[0][0]).toBe(m.playing!.teamA);
    expect(router.replace).toHaveBeenCalledWith("/times");
  });

  it("escolher Time 2 e confirmar passa teamB para setNextMatch", () => {
    const m = buildEmpateManual();
    const setNextSpy = jest
      .spyOn(m, "setNextMatch")
      .mockImplementation(() => {});
    renderResultado(m);

    fireEvent.press(
      screen.getByRole("button", { name: "Escolher Time 2" }),
    );
    fireEvent.press(screen.getByRole("button", { name: "Próxima partida" }));

    expect(setNextSpy.mock.calls[0][0]).toBe(m.playing!.teamB);
  });

  it("card selecionado expõe accessibilityState.selected = true [F-13]", () => {
    renderResultado(buildEmpateManual());

    const cardTime1 = screen.getByRole("button", { name: "Escolher Time 1" });
    expect(cardTime1.props.accessibilityState?.selected).toBe(false);

    fireEvent.press(cardTime1);
    expect(
      screen.getByRole("button", { name: "Escolher Time 1" }).props
        .accessibilityState?.selected,
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Escolher Time 2" }).props
        .accessibilityState?.selected,
    ).toBe(false);
  });
});

// ===========================================================================
// ERRO
// ===========================================================================

describe("Resultado — erro do domínio", () => {
  it("erro em setNextMatch aparece como texto", () => {
    const m = buildResultadoManager({ result: ResultMatch.VICTORY, vencedor: "A" });
    jest.spyOn(m, "setNextMatch").mockImplementation(() => {
      throw new Error("Cenário pós-jogo inválido");
    });
    renderResultado(m);

    fireEvent.press(screen.getByRole("button", { name: "Próxima partida" }));

    expect(screen.getByText("Cenário pós-jogo inválido")).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// PLACAR
// ===========================================================================

describe("Resultado — placar", () => {
  it("mostra placar formatado 'Time 1 X × Y Time 2'", () => {
    renderResultado(
      buildResultadoManager({ result: ResultMatch.VICTORY, vencedor: "A" }),
    );

    expect(screen.getByText(/Time 1 0 × 0 Time 2/)).toBeTruthy();
  });
});
