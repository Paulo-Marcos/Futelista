import { renderHook } from "@testing-library/react-native";
import { AppState, AppStateStatus } from "react-native";

import { AUTOSAVE_DEBOUNCE_MS } from "@/src/app-shell/constants";
import { useAutosaveExecucao } from "@/src/app-shell/useAutosaveExecucao";
import { GestorJogo } from "@/src/domain/GestorJogo";
import { ChoosingTeams, Rules } from "@/src/domain/Rules";

/** D-051: autosave por mudança de estado, AppState e descarte do gestor. */
describe("useAutosaveExecucao (D-051)", () => {
  let aoMudarAppState: (estado: AppStateStatus) => void;

  function jogoEmPartida(): GestorJogo {
    const jogo = new GestorJogo(
      "Pelada",
      new Rules({
        playersPerTeam: 2,
        timeMatch: "00:02:00",
        numberTimes: 1,
        choosingTeams: ChoosingTeams.BY_ORDER,
      }),
    );
    jogo.setPlayers(["A1", "A2", "B1", "B2"]);
    jogo.criarTimes();
    jogo.setPlayingGame();
    return jogo;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_tipo, listener) => {
        aoMudarAppState = listener as (estado: AppStateStatus) => void;
        return { remove: jest.fn() };
      });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("ticks do cronômetro não disparam gravação; mudança de estado sim", () => {
    const jogo = jogoEmPartida();
    const salvar = jest.fn();
    renderHook(() => useAutosaveExecucao(jogo, salvar));

    jogo.start();
    jest.advanceTimersByTime(10_000);

    expect(salvar).toHaveBeenCalledTimes(1);
  });

  it("ir para segundo plano grava na hora o que estava pendente", () => {
    const jogo = jogoEmPartida();
    const salvar = jest.fn();
    renderHook(() => useAutosaveExecucao(jogo, salvar));
    jogo.start();

    aoMudarAppState("background");

    expect(salvar).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS);
    expect(salvar).toHaveBeenCalledTimes(1);
  });

  it("voltar ao primeiro plano recalcula o cronômetro pelo relógio real", () => {
    const jogo = jogoEmPartida();
    renderHook(() => useAutosaveExecucao(jogo, jest.fn()));
    jogo.start();
    jogo.liberarCronometro(); // SO congelou o tick

    jest.setSystemTime(Date.now() + 45_000);
    aoMudarAppState("active");

    expect(jogo.timer!.restTime).toBe(75);
  });

  it("trocar de execução solta o tick do gestor descartado", () => {
    const anterior = jogoEmPartida();
    anterior.start();
    const { rerender } = renderHook(
      ({ gestor }: { gestor: GestorJogo | null }) =>
        useAutosaveExecucao(gestor, jest.fn()),
      { initialProps: { gestor: anterior } },
    );

    rerender({ gestor: null });

    expect(jest.getTimerCount()).toBe(0);
  });
});
