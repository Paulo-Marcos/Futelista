import { Pressable } from "react-native";

import { GestorJogo } from "@/src/domain/GestorJogo";
import { ChoosingTeams, Rules } from "@/src/domain/Rules";
import { Timer, TimerStatus } from "@/src/domain/Timer";
import {
  fireEvent,
  renderWithProviders,
  screen,
} from "@/src/test/renderWithProviders";

import RegrasScreen from "../regras";

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
  rules?: Partial<ConstructorParameters<typeof Rules>[0]>;
  comTimes?: boolean;
  comPartida?: boolean;
  status?: TimerStatus;
}) {
  const m = new GestorJogo(
    "Pelada teste",
    new Rules({ playersPerTeam: 4, ...opts?.rules }),
  );
  if (opts?.comTimes || opts?.comPartida) {
    m.addPlayers(
      Array.from({ length: 8 }, (_, i) => `J${i + 1}`),
    );
    m.createTeams();
    if (opts?.comPartida) m.setPlayingGame();
  }
  if (opts?.status !== undefined) {
    m.timer = new Timer(m.rules.numberTimes, m.rules.getDurationMatch());
    m.timer.status = opts.status;
  }
  return m;
}

function renderRegras(gestor: GestorJogo | null) {
  return renderWithProviders(<RegrasScreen />, { soccer: { gestor } });
}

function getPressableByLabel(label: string) {
  return screen.UNSAFE_getAllByType(Pressable).find(
    (p) => p.props.accessibilityLabel === label,
  );
}

// ===========================================================================
// GUARDS / NAVEGAÇÃO
// ===========================================================================

describe("Regras — guards e navegação", () => {
  it("sem gestor: não renderiza (Redirect)", () => {
    renderRegras(null);
    expect(screen.queryByText("Regras")).toBeNull();
  });

  it("renderiza título e nome atual da pelada", () => {
    renderRegras(buildManager());
    expect(screen.getByText("Regras")).toBeTruthy();
    expect(screen.getByDisplayValue("Pelada teste")).toBeTruthy();
  });

  it("'Cancelar' chama router.back sem chamar atualizarRegras", () => {
    const m = buildManager();
    const spy = jest.spyOn(m, "atualizarRegras");
    renderRegras(m);

    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(spy).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// SALVAR
// ===========================================================================

describe("Regras — salvar", () => {
  it("'Salvar' chama atualizarRegras com os valores correntes e volta", () => {
    const m = buildManager({ rules: { goalLimit: 2 } });
    const spy = jest.spyOn(m, "atualizarRegras");
    renderRegras(m);

    fireEvent.press(screen.getByRole("button", { name: "Salvar" }));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        playersPerTeam: 4,
        goalLimit: 2,
        timeMatch: "00:10:00",
        numberTimes: 1,
      }),
    );
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("editar o nome e salvar atualiza gestor.name e envia name novo", () => {
    const m = buildManager();
    const spy = jest.spyOn(m, "atualizarRegras");
    renderRegras(m);

    fireEvent.changeText(screen.getByDisplayValue("Pelada teste"), "Fute CEF");
    fireEvent.press(screen.getByRole("button", { name: "Salvar" }));

    expect(m.name).toBe("Fute CEF");
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Fute CEF" }),
    );
  });

  it("erro do domínio aparece no banner", () => {
    const m = buildManager();
    jest.spyOn(m, "atualizarRegras").mockImplementation(() => {
      throw new Error("Regra inválida");
    });
    renderRegras(m);

    fireEvent.press(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("Regra inválida")).toBeTruthy();
    expect(router.back).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// BLOQUEIOS POR ESTADO
// ===========================================================================

describe("Regras — bloqueios por estado da pelada", () => {
  it("com times montados: jogadores por time fica desabilitado com hint", () => {
    renderRegras(buildManager({ comTimes: true }));

    expect(
      screen.getByText("Bloqueado: há times montados ou partida em andamento."),
    ).toBeTruthy();
    expect(
      screen.getByText("Para mudar, primeiro resete os times."),
    ).toBeTruthy();
  });

  it("com cronômetro ativo (STARTED): número de tempos fica bloqueado", () => {
    renderRegras(buildManager({ comPartida: true, status: TimerStatus.STARTED }));

    expect(screen.getByText("Bloqueado: cronômetro em uso.")).toBeTruthy();
  });

  it("modo de sorteio desabilitado quando há times — clique não muda", () => {
    const m = buildManager({ comTimes: true });
    const spy = jest.spyOn(m, "atualizarRegras");
    renderRegras(m);

    // Tenta mudar para "Embaralhar".
    const embaralhar = getPressableByLabel("Embaralhar");
    // Não tem accessibilityLabel — caímos no fallback de pegar pelo texto.
    fireEvent.press(screen.getByText("Embaralhar"));
    fireEvent.press(screen.getByRole("button", { name: "Salvar" }));

    // Mesmo que clicasse, o salvar mandaria choosingTeams atual.
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ choosingTeams: ChoosingTeams.BY_ORDER }),
    );
  });
});

// ===========================================================================
// PREVIEW
// ===========================================================================

describe("Regras — preview", () => {
  it("mostra '0 jogadores → 0 times completos' sem jogadores", () => {
    renderRegras(buildManager());
    expect(
      screen.getByText("0 jogadores → 0 times completos"),
    ).toBeTruthy();
  });

  it("mostra times completos e sobra quando aplicável", () => {
    // 9 jogadores, 4 por time → 2 times completos + 1 sobrando.
    const m = new GestorJogo(
      "Pelada teste",
      new Rules({ playersPerTeam: 4 }),
    );
    m.addPlayers(Array.from({ length: 9 }, (_, i) => `J${i + 1}`));
    renderRegras(m);

    expect(
      screen.getByText("9 jogadores → 2 times completos + 1 sobrando"),
    ).toBeTruthy();
  });
});
