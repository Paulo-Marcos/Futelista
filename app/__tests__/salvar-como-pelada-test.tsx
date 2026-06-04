import { GestorJogo } from "@/src/domain/GestorJogo";
import { Rules } from "@/src/domain/Rules";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test/renderWithProviders";

import SalvarComoPeladaScreen from "../salvar-como-pelada";

const router = (require("expo-router") as any).__router as {
  back: jest.Mock;
};

beforeEach(() => {
  router.back.mockClear();
});

function buildAvulsa(nome = "Pelada avulsa") {
  return new GestorJogo(nome, new Rules({ playersPerTeam: 4 }));
}

function buildVinculada() {
  return new GestorJogo("Fute CEF", new Rules({ playersPerTeam: 4 }), {
    peladaId: "p1",
  });
}

// ===========================================================================
// GUARDS
// ===========================================================================

describe("SalvarComoPelada — guards", () => {
  it("sem manager: Redirect (não renderiza título)", () => {
    renderWithProviders(<SalvarComoPeladaScreen />, {
      soccer: { manager: null },
    });
    expect(screen.queryByText("Salvar como pelada")).toBeNull();
  });

  it("com manager vinculado a uma Pelada: Redirect", () => {
    renderWithProviders(<SalvarComoPeladaScreen />, {
      soccer: { manager: buildVinculada() },
    });
    expect(screen.queryByText("Salvar como pelada")).toBeNull();
  });

  it("avulsa: renderiza título e o campo Nome", () => {
    renderWithProviders(<SalvarComoPeladaScreen />, {
      soccer: { manager: buildAvulsa() },
    });
    expect(screen.getByText("Salvar como pelada")).toBeTruthy();
    expect(screen.getByPlaceholderText("Ex.: Fute CEF")).toBeTruthy();
  });
});

// ===========================================================================
// PRE-FILL DO NOME
// ===========================================================================

describe("SalvarComoPelada — prefill do nome", () => {
  it("nome 'Pelada avulsa' começa vazio (sem prefill)", () => {
    renderWithProviders(<SalvarComoPeladaScreen />, {
      soccer: { manager: buildAvulsa("Pelada avulsa") },
    });

    const input = screen.getByPlaceholderText("Ex.: Fute CEF");
    expect(input.props.value).toBe("");
  });

  it("nome diferente vem preenchido como sugestão", () => {
    renderWithProviders(<SalvarComoPeladaScreen />, {
      soccer: { manager: buildAvulsa("Treino quarta") },
    });

    expect(screen.getByDisplayValue("Treino quarta")).toBeTruthy();
  });
});

// ===========================================================================
// SALVAR
// ===========================================================================

describe("SalvarComoPelada — salvar", () => {
  it("nome vazio: botão Salvar fica desabilitado (PrimaryButton bloqueia o press)", () => {
    const salvar = jest.fn().mockResolvedValue({ id: "p1" });
    renderWithProviders(<SalvarComoPeladaScreen />, {
      soccer: {
        manager: buildAvulsa(),
        salvarExecucaoAtualComoPelada: salvar,
      },
    });

    // PrimaryButton seta accessibilityState.disabled — fireEvent.press
    // respeita e não dispara onSalvar.
    const btn = screen.getByRole("button", { name: "Salvar" });
    expect(btn.props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.press(btn);
    expect(salvar).not.toHaveBeenCalled();
  });

  it("salvar com nome válido chama salvarExecucaoAtualComoPelada e volta", async () => {
    const salvar = jest.fn().mockResolvedValue({ id: "p1" });
    renderWithProviders(<SalvarComoPeladaScreen />, {
      soccer: {
        manager: buildAvulsa(),
        salvarExecucaoAtualComoPelada: salvar,
      },
    });

    fireEvent.changeText(
      screen.getByPlaceholderText("Ex.: Fute CEF"),
      "  Fute CEF  ",
    );
    fireEvent.press(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(salvar).toHaveBeenCalledWith("Fute CEF"));
    await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
  });

  it("erro do domínio aparece no banner e não volta", async () => {
    const salvar = jest.fn().mockRejectedValue(new Error("Nome em uso"));
    renderWithProviders(<SalvarComoPeladaScreen />, {
      soccer: {
        manager: buildAvulsa(),
        salvarExecucaoAtualComoPelada: salvar,
      },
    });

    fireEvent.changeText(
      screen.getByPlaceholderText("Ex.: Fute CEF"),
      "Outro",
    );
    fireEvent.press(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Nome em uso")).toBeTruthy();
    expect(router.back).not.toHaveBeenCalled();
  });

  it("onSubmitEditing do TextInput também tenta salvar", async () => {
    const salvar = jest.fn().mockResolvedValue({ id: "p1" });
    renderWithProviders(<SalvarComoPeladaScreen />, {
      soccer: {
        manager: buildAvulsa(),
        salvarExecucaoAtualComoPelada: salvar,
      },
    });

    const input = screen.getByPlaceholderText("Ex.: Fute CEF");
    fireEvent.changeText(input, "X");
    fireEvent(input, "submitEditing");

    await waitFor(() => expect(salvar).toHaveBeenCalledWith("X"));
  });
});

// ===========================================================================
// CANCELAR / FECHAR
// ===========================================================================

describe("SalvarComoPelada — cancelar/fechar", () => {
  it("Cancelar chama router.back", () => {
    renderWithProviders(<SalvarComoPeladaScreen />, {
      soccer: { manager: buildAvulsa() },
    });
    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("Fechar (X) chama router.back", () => {
    renderWithProviders(<SalvarComoPeladaScreen />, {
      soccer: { manager: buildAvulsa() },
    });
    fireEvent.press(screen.getByRole("button", { name: "Fechar" }));
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// PREVIEW
// ===========================================================================

describe("SalvarComoPelada — preview das regras", () => {
  it("formata regras (4×4 · 10min · 1 tempo · limite 2 gols)", () => {
    renderWithProviders(<SalvarComoPeladaScreen />, {
      soccer: { manager: buildAvulsa() },
    });

    expect(
      screen.getByText("4×4 · 10min · 1 tempo · limite 2 gols"),
    ).toBeTruthy();
  });
});
