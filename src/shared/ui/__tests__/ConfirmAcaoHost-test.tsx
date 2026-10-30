import { ConfirmAcaoHost } from "../ConfirmAcaoHost";
import { confirmAcao, escolherOpcao, type Escolha } from "../confirmAcao";
import {
  act,
  fireEvent,
  renderWithProviders,
  screen,
} from "@/src/test/renderWithProviders";

type AcaoGestao =
  | "regras"
  | "voltar"
  | "salvar-como"
  | "limpar"
  | "finalizar"
  | "cancelar";

/** Espelha o menu "Gerenciar pelada": 6 opções, mais que o Alert do Android mostra. */
const MENU_GESTAO: Escolha<AcaoGestao>[] = [
  { label: "Regras desta pelada", valor: "regras" },
  { label: "Voltar para gestão", valor: "voltar" },
  { label: "Salvar como pelada", valor: "salvar-como" },
  { label: "Limpar jogadores e times", valor: "limpar", estilo: "destructive" },
  { label: "Finalizar execução", valor: "finalizar", estilo: "destructive" },
  { label: "Cancelar", valor: "cancelar", estilo: "cancel" },
];

function abrirMenuGestao() {
  let escolha!: Promise<AcaoGestao | null>;
  act(() => {
    escolha = escolherOpcao<AcaoGestao>({
      titulo: "Gerenciar pelada",
      mensagem: "O que você quer fazer?",
      opcoes: MENU_GESTAO,
    });
  });
  return escolha;
}

describe("ConfirmAcaoHost — escolherOpcao", () => {
  it("mostra todas as 6 opções do menu de gestão", () => {
    renderWithProviders(<ConfirmAcaoHost />);
    abrirMenuGestao();

    for (const o of MENU_GESTAO) {
      expect(screen.getByRole("button", { name: o.label })).toBeTruthy();
    }
  });

  it("resolve com o valor de uma opção além da 3ª", async () => {
    renderWithProviders(<ConfirmAcaoHost />);
    const escolha = abrirMenuGestao();

    fireEvent.press(screen.getByRole("button", { name: "Finalizar execução" }));

    await expect(escolha).resolves.toBe("finalizar");
    expect(screen.queryByText("Gerenciar pelada")).toBeNull();
  });

  it("Cancelar resolve null em vez de escolher outra opção", async () => {
    renderWithProviders(<ConfirmAcaoHost />);
    const escolha = abrirMenuGestao();

    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    await expect(escolha).resolves.toBeNull();
  });

  it("opção de cancelamento com valor real (Nova execução) também resolve null", async () => {
    renderWithProviders(<ConfirmAcaoHost />);
    let escolha!: Promise<"herdar" | "vazia" | null>;
    act(() => {
      escolha = escolherOpcao<"herdar" | "vazia">({
        titulo: "Nova execução",
        mensagem: "Iniciar com os mesmos jogadores da última execução?",
        opcoes: [
          { label: "Cancelar", valor: "vazia", estilo: "cancel" },
          { label: "Vazia", valor: "vazia" },
          { label: "Herdar", valor: "herdar" },
        ],
      });
    });

    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    await expect(escolha).resolves.toBeNull();
  });
});

describe("ConfirmAcaoHost — confirmAcao", () => {
  it("continua resolvendo true ao confirmar", async () => {
    renderWithProviders(<ConfirmAcaoHost />);
    let confirmou!: Promise<boolean>;
    act(() => {
      confirmou = confirmAcao({
        titulo: "Arquivar pelada",
        mensagem: "Continuar?",
        textoConfirmar: "Arquivar",
      });
    });

    fireEvent.press(screen.getByRole("button", { name: "Arquivar" }));

    await expect(confirmou).resolves.toBe(true);
  });
});
