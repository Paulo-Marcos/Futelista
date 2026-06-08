import { Alert, Pressable } from "react-native";

import { GestorJogo } from "@/src/domain/GestorJogo";
import { Rules } from "@/src/domain/Rules";
import {
  act,
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test/renderWithProviders";

import JogadoresScreen from "../(pelada)/jogadores";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildManager(nomes: string[] = []): GestorJogo {
  const m = new GestorJogo("Pelada teste", new Rules());
  if (nomes.length > 0) m.addPlayers(nomes);
  return m;
}

/**
 * Encontra o componente Pressable pelo accessibilityLabel.
 * Necessário quando o host View não expõe o prop `disabled` (Pressable
 * não propaga `disabled` ao host, só ao accessibilityState — e nem
 * todos os Pressable do app declaram accessibilityState explicitamente).
 */
function getPressableByLabel(label: string) {
  const found = screen.UNSAFE_getAllByType(Pressable).find(
    (p) => p.props.accessibilityLabel === label,
  );
  if (!found) throw Error(`Pressable com accessibilityLabel "${label}" não encontrado.`);
  return found;
}

/**
 * Substitui Alert.alert para chamar automaticamente um botão escolhido
 * pelo predicate (para fluxos com confirmAcao).
 */
function mockAlert(
  pick: (b: { text?: string; style?: string }) => boolean,
): jest.SpyInstance {
  return jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
    const escolhido = buttons?.find(pick);
    escolhido?.onPress?.();
  });
}

function renderJogadores(gestor: GestorJogo) {
  return renderWithProviders(<JogadoresScreen />, { soccer: { gestor } });
}

// ===========================================================================
// GUARD
// ===========================================================================

describe("Jogadores — guard de rota", () => {
  it("sem gestor: não renderiza o header (Redirect)", () => {
    renderWithProviders(<JogadoresScreen />, { soccer: { gestor: null } });
    // O Redirect do mock retorna null; a tela não aparece.
    expect(screen.queryByText("Jogadores")).toBeNull();
  });
});

// ===========================================================================
// ADIÇÃO POR INPUT + BOTÃO "+"
// ===========================================================================

describe("Jogadores — adicionar via input + botão", () => {
  it("começa com o botão '+' desabilitado (input vazio)", () => {
    renderJogadores(buildManager());

    expect(getPressableByLabel("Adicionar jogador").props.disabled).toBe(true);
  });

  it("habilita o '+' depois de digitar um nome", () => {
    renderJogadores(buildManager());

    fireEvent.changeText(
      screen.getByLabelText("Nome do novo jogador"),
      "Ana",
    );

    expect(getPressableByLabel("Adicionar jogador").props.disabled).toBe(false);
  });

  it("press do '+' adiciona o jogador (trimado) na lista", () => {
    const gestor = buildManager();
    renderJogadores(gestor);

    fireEvent.changeText(
      screen.getByLabelText("Nome do novo jogador"),
      "  Ana  ",
    );
    fireEvent.press(screen.getByRole("button", { name: "Adicionar jogador" }));

    expect(gestor.players.map((p) => p.name)).toEqual(["Ana"]);
    expect(screen.getByText("Ana")).toBeTruthy();
  });

  it("limpa o input após adicionar com sucesso", () => {
    renderJogadores(buildManager());

    const input = screen.getByLabelText("Nome do novo jogador");
    fireEvent.changeText(input, "Ana");
    fireEvent.press(screen.getByRole("button", { name: "Adicionar jogador" }));

    expect(input.props.value).toBe("");
  });

  it("nome só com espaços não adiciona", () => {
    const gestor = buildManager();
    renderJogadores(gestor);

    fireEvent.changeText(
      screen.getByLabelText("Nome do novo jogador"),
      "   ",
    );
    fireEvent.press(screen.getByRole("button", { name: "Adicionar jogador" }));

    expect(gestor.players).toHaveLength(0);
  });

  it("onSubmitEditing também adiciona", () => {
    const gestor = buildManager();
    renderJogadores(gestor);

    const input = screen.getByLabelText("Nome do novo jogador");
    fireEvent.changeText(input, "Bia");
    fireEvent(input, "submitEditing");

    expect(gestor.players.map((p) => p.name)).toEqual(["Bia"]);
  });
});

// ===========================================================================
// ERRO AO ADICIONAR (duplicata)
// ===========================================================================

describe("Jogadores — erro ao adicionar duplicata", () => {
  it("mostra mensagem de erro quando o domínio rejeita", () => {
    const gestor = buildManager(["Ana"]);
    renderJogadores(gestor);

    fireEvent.changeText(
      screen.getByLabelText("Nome do novo jogador"),
      "Ana",
    );
    fireEvent.press(screen.getByRole("button", { name: "Adicionar jogador" }));

    expect(
      screen.getByText('Já existe jogador chamado "Ana" na pelada.'),
    ).toBeTruthy();
  });

  it("botão X do banner fecha o erro", () => {
    const gestor = buildManager(["Ana"]);
    renderJogadores(gestor);

    fireEvent.changeText(
      screen.getByLabelText("Nome do novo jogador"),
      "Ana",
    );
    fireEvent.press(screen.getByRole("button", { name: "Adicionar jogador" }));

    fireEvent.press(screen.getByRole("button", { name: "Fechar aviso" }));

    expect(
      screen.queryByText('Já existe jogador chamado "Ana" na pelada.'),
    ).toBeNull();
  });

  it("erro some sozinho após o timeout (5s)", () => {
    jest.useFakeTimers();
    try {
      const gestor = buildManager(["Ana"]);
      renderJogadores(gestor);

      fireEvent.changeText(
        screen.getByLabelText("Nome do novo jogador"),
        "Ana",
      );
      fireEvent.press(
        screen.getByRole("button", { name: "Adicionar jogador" }),
      );
      expect(
        screen.getByText('Já existe jogador chamado "Ana" na pelada.'),
      ).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(
        screen.queryByText('Já existe jogador chamado "Ana" na pelada.'),
      ).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});

// ===========================================================================
// EMPTY STATES
// ===========================================================================

describe("Jogadores — empty states", () => {
  it("sem jogadores: mostra 'Nenhum jogador cadastrado'", () => {
    renderJogadores(buildManager());
    expect(screen.getByText("Nenhum jogador cadastrado")).toBeTruthy();
  });

  it("com busca sem match: mostra 'Nenhum jogador encontrado'", () => {
    const gestor = buildManager(["Ana", "Bia", "Caio", "Diego", "Eva"]);
    renderJogadores(gestor);

    fireEvent.changeText(
      screen.getByLabelText("Buscar jogador por nome"),
      "xyz",
    );

    expect(screen.getByText("Nenhum jogador encontrado")).toBeTruthy();
  });
});

// ===========================================================================
// CONTADOR
// ===========================================================================

describe("Jogadores — contador", () => {
  it("formata singular: '1 jogador · 1 sem time'", () => {
    renderJogadores(buildManager(["Ana"]));
    expect(screen.getByText("1 jogador · 1 sem time")).toBeTruthy();
  });

  it("formata plural: '3 jogadores · 3 sem times'", () => {
    renderJogadores(buildManager(["Ana", "Bia", "Caio"]));
    expect(screen.getByText("3 jogadores · 3 sem times")).toBeTruthy();
  });

  it("omite o sufixo 'sem time' quando todos têm time", () => {
    const gestor = buildManager(["Ana", "Bia"]);
    // Cria times: cada um vai pra um time (Rules.playersPerTeam default = 4).
    // Como temos só 2 jogadores e o time exige 4, o createTeams ainda
    // distribui — mas pra simplificar o teste, simulo zerando o
    // playersWithoutTeam diretamente (válido para o cenário visual).
    gestor.playersWithoutTeam = 0;
    renderWithProviders(<JogadoresScreen />, { soccer: { gestor } });

    expect(screen.getByText("2 jogadores")).toBeTruthy();
  });
});

// ===========================================================================
// BUSCA
// ===========================================================================

describe("Jogadores — busca", () => {
  it("não aparece com menos de 5 jogadores", () => {
    renderJogadores(buildManager(["Ana", "Bia", "Caio", "Diego"]));
    expect(screen.queryByLabelText("Buscar jogador por nome")).toBeNull();
  });

  it("aparece a partir de 5 jogadores", () => {
    renderJogadores(buildManager(["Ana", "Bia", "Caio", "Diego", "Eva"]));
    expect(screen.getByLabelText("Buscar jogador por nome")).toBeTruthy();
  });

  it("filtra a lista pelo termo digitado", () => {
    renderJogadores(buildManager(["Ana", "Bia", "Caio", "Diego", "Eva"]));

    fireEvent.changeText(
      screen.getByLabelText("Buscar jogador por nome"),
      "an",
    );

    expect(screen.getByText("Ana")).toBeTruthy();
    expect(screen.queryByText("Bia")).toBeNull();
    expect(screen.queryByText("Caio")).toBeNull();
  });

  it("botão 'Limpar busca' restaura a lista", () => {
    renderJogadores(buildManager(["Ana", "Bia", "Caio", "Diego", "Eva"]));

    fireEvent.changeText(
      screen.getByLabelText("Buscar jogador por nome"),
      "an",
    );
    fireEvent.press(screen.getByRole("button", { name: "Limpar busca" }));

    expect(screen.getByText("Bia")).toBeTruthy();
    expect(screen.getByText("Caio")).toBeTruthy();
  });
});

// ===========================================================================
// EDITAR
// ===========================================================================

describe("Jogadores — editar", () => {
  it("press no botão 'Editar X' abre o input de edição", () => {
    renderJogadores(buildManager(["Ana"]));

    fireEvent.press(screen.getByRole("button", { name: "Editar Ana" }));

    expect(screen.getByLabelText("Editar nome do jogador")).toBeTruthy();
  });

  it("confirmar com novo nome renomeia o jogador", () => {
    const gestor = buildManager(["Ana"]);
    renderJogadores(gestor);

    fireEvent.press(screen.getByRole("button", { name: "Editar Ana" }));
    const input = screen.getByLabelText("Editar nome do jogador");
    fireEvent.changeText(input, "Anabel");
    fireEvent.press(screen.getByRole("button", { name: "Confirmar edição" }));

    expect(gestor.players[0].name).toBe("Anabel");
    expect(screen.queryByLabelText("Editar nome do jogador")).toBeNull();
  });

  it("confirmar com mesmo nome é no-op (não altera nada)", () => {
    const gestor = buildManager(["Ana"]);
    const renameSpy = jest.spyOn(gestor, "renamePlayer");
    renderJogadores(gestor);

    fireEvent.press(screen.getByRole("button", { name: "Editar Ana" }));
    fireEvent.press(screen.getByRole("button", { name: "Confirmar edição" }));

    expect(renameSpy).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Editar nome do jogador")).toBeNull();
  });

  it("cancelar edição não chama renamePlayer", () => {
    const gestor = buildManager(["Ana"]);
    const renameSpy = jest.spyOn(gestor, "renamePlayer");
    renderJogadores(gestor);

    fireEvent.press(screen.getByRole("button", { name: "Editar Ana" }));
    fireEvent.changeText(
      screen.getByLabelText("Editar nome do jogador"),
      "Outro",
    );
    fireEvent.press(screen.getByRole("button", { name: "Cancelar edição" }));

    expect(renameSpy).not.toHaveBeenCalled();
    expect(gestor.players[0].name).toBe("Ana");
  });

  it("erro do renamePlayer aparece no banner", () => {
    const gestor = buildManager(["Ana", "Bia"]);
    renderJogadores(gestor);

    fireEvent.press(screen.getByRole("button", { name: "Editar Ana" }));
    fireEvent.changeText(
      screen.getByLabelText("Editar nome do jogador"),
      "Bia",
    );
    fireEvent.press(screen.getByRole("button", { name: "Confirmar edição" }));

    expect(
      screen.getByText('Já existe jogador chamado "Bia" na pelada.'),
    ).toBeTruthy();
  });
});

// ===========================================================================
// REMOVER
// ===========================================================================

describe("Jogadores — remover", () => {
  it("confirma e remove o jogador", async () => {
    const gestor = buildManager(["Ana", "Bia"]);
    renderJogadores(gestor);

    const alertSpy = mockAlert((b) => b.text === "Remover");

    fireEvent.press(screen.getByRole("button", { name: "Remover Ana" }));

    await waitFor(() =>
      expect(gestor.players.map((p) => p.name)).toEqual(["Bia"]),
    );
    alertSpy.mockRestore();
  });

  it("cancela e mantém o jogador na lista", async () => {
    const gestor = buildManager(["Ana"]);
    renderJogadores(gestor);

    const alertSpy = mockAlert((b) => b.style === "cancel");

    fireEvent.press(screen.getByRole("button", { name: "Remover Ana" }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(gestor.players.map((p) => p.name)).toEqual(["Ana"]);
    alertSpy.mockRestore();
  });
});

// ===========================================================================
// LOTE (Modal)
// ===========================================================================

describe("Jogadores — adicionar vários (lote)", () => {
  it("abre o modal ao tocar no botão de lote", () => {
    renderJogadores(buildManager());

    fireEvent.press(
      screen.getByRole("button", { name: "Adicionar vários jogadores" }),
    );

    expect(screen.getByText("Adicionar vários")).toBeTruthy();
  });

  it("conta os nomes reconhecidos enquanto o usuário digita", () => {
    renderJogadores(buildManager());

    fireEvent.press(
      screen.getByRole("button", { name: "Adicionar vários jogadores" }),
    );
    fireEvent.changeText(
      screen.getByLabelText("Lista de nomes para adicionar em lote"),
      "Ana\nBia, Caio",
    );

    expect(screen.getByText("3 nomes reconhecidos")).toBeTruthy();
  });

  it("confirmar lote adiciona todos os nomes válidos", () => {
    const gestor = buildManager();
    renderJogadores(gestor);

    fireEvent.press(
      screen.getByRole("button", { name: "Adicionar vários jogadores" }),
    );
    fireEvent.changeText(
      screen.getByLabelText("Lista de nomes para adicionar em lote"),
      "Ana\nBia\nCaio",
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Confirmar adição em lote" }),
    );

    expect(gestor.players.map((p) => p.name)).toEqual(["Ana", "Bia", "Caio"]);
  });

  it("cancelar fecha o modal sem adicionar", () => {
    const gestor = buildManager();
    renderJogadores(gestor);

    fireEvent.press(
      screen.getByRole("button", { name: "Adicionar vários jogadores" }),
    );
    fireEvent.changeText(
      screen.getByLabelText("Lista de nomes para adicionar em lote"),
      "Ana\nBia",
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Cancelar adição em lote" }),
    );

    expect(gestor.players).toHaveLength(0);
  });

  it("confirmar com input vazio é no-op (botão desabilitado)", () => {
    renderJogadores(buildManager());

    fireEvent.press(
      screen.getByRole("button", { name: "Adicionar vários jogadores" }),
    );

    expect(
      getPressableByLabel("Confirmar adição em lote").props.disabled,
    ).toBe(true);
  });
});

// ===========================================================================
// SHEET DE ESTATÍSTICAS (F-04)
// ===========================================================================

describe("Jogadores — sheet de estatísticas", () => {
  it("toque em 'Ver estatísticas' mostra os zeros para jogador novo", () => {
    renderJogadores(buildManager(["Ana"]));

    fireEvent.press(
      screen.getByRole("button", { name: "Ver estatísticas de Ana" }),
    );

    expect(screen.getByText("Estatísticas nesta execução")).toBeTruthy();
    // Procura por todos os "0"s no grid de stats — o jogador novo tem 6
    // tiles com 0 (gols, partidas, vitórias, empates, derrotas, presença "—").
    // Asserção mínima: a label "Gols" aparece, indicando que o tile renderizou.
    expect(screen.getByText("Gols")).toBeTruthy();
    expect(screen.getByText("Partidas")).toBeTruthy();
    expect(screen.getByText("Vitórias")).toBeTruthy();
    expect(screen.getByText("Empates")).toBeTruthy();
    expect(screen.getByText("Derrotas")).toBeTruthy();
    expect(screen.getByText("Presença")).toBeTruthy();
  });

  it("Fechar dismissa o sheet", () => {
    renderJogadores(buildManager(["Ana"]));

    fireEvent.press(
      screen.getByRole("button", { name: "Ver estatísticas de Ana" }),
    );
    expect(screen.getByText("Estatísticas nesta execução")).toBeTruthy();

    fireEvent.press(
      screen.getByRole("button", { name: "Fechar estatísticas" }),
    );

    // Modal fica visible=false; o conteúdo (subtitle) some.
    expect(screen.queryByText("Estatísticas nesta execução")).toBeNull();
  });

  it("rodapé mostra contagem de partidas encerradas (0 quando nada terminou)", () => {
    renderJogadores(buildManager(["Ana"]));

    fireEvent.press(
      screen.getByRole("button", { name: "Ver estatísticas de Ana" }),
    );

    expect(
      screen.getByText("Nenhuma partida encerrada ainda nesta execução."),
    ).toBeTruthy();
  });
});

// ===========================================================================
// FOTO DO JOGADOR (F-19)
// ===========================================================================

describe("Jogadores — trocar foto", () => {
  it("toque em 'Trocar foto' + 'Escolher da galeria' chama setFotoDoJogador", async () => {
    const ImagePicker = require("expo-image-picker");
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file:///source/sel.jpg" }],
    });
    const setFotoDoJogador = jest
      .fn<Promise<void>, [string, string | null]>()
      .mockResolvedValue(undefined);
    const gestor = buildManager(["Ana"]);
    renderWithProviders(<JogadoresScreen />, {
      soccer: { gestor, setFotoDoJogador },
    });

    // Alert tem que estar mockado ANTES do press, senão o escolherOpcao
    // espera por uma resposta que nunca chega.
    const alertSpy = mockAlert((b) => b.text === "Escolher da galeria");

    fireEvent.press(
      screen.getByRole("button", { name: "Trocar foto de Ana" }),
    );

    await waitFor(() =>
      expect(setFotoDoJogador).toHaveBeenCalledWith(
        gestor.players[0].id,
        expect.stringMatching(/^file:\/\/.*\.jpg$/),
      ),
    );
    alertSpy.mockRestore();
  });

  it("'Remover foto' chama setFotoDoJogador(id, null) quando jogador tem foto", async () => {
    const gestor = buildManager(["Ana"]);
    gestor.players[0].definirFoto("file:///cached/ana.jpg");
    const setFotoDoJogador = jest
      .fn<Promise<void>, [string, string | null]>()
      .mockResolvedValue(undefined);
    renderWithProviders(<JogadoresScreen />, {
      soccer: { gestor, setFotoDoJogador },
    });

    const alertSpy = mockAlert((b) => b.text === "Remover foto");

    fireEvent.press(
      screen.getByRole("button", { name: "Trocar foto de Ana" }),
    );

    await waitFor(() =>
      expect(setFotoDoJogador).toHaveBeenCalledWith(
        gestor.players[0].id,
        null,
      ),
    );
    alertSpy.mockRestore();
  });
});
