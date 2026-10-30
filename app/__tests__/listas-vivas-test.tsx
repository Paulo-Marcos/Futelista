import { GestorJogo } from "@/src/domain/GestorJogo";
import { Rules } from "@/src/domain/Rules";
import { Team } from "@/src/domain/Team";
import { Timer, TimerStatus } from "@/src/domain/Timer";
import {
  act,
  fireEvent,
  renderWithProviders,
  screen,
} from "@/src/test/renderWithProviders";

import JogadoresScreen from "../(pelada)/jogadores";
import PartidaScreen from "../(pelada)/partida";
import TimesScreen from "../(pelada)/times";

// D-049: o GestorJogo muta os próprios arrays (`splice`/`push`), então a
// referência lida pela tela nunca muda. Estes testes mudam o agregado DEPOIS
// do render e exigem que a tela mostre o estado novo — um `useMemo([array])`
// ou `React.memo` sobre o array vivo congelaria a versão antiga.

function buildManager(jogadores: number): GestorJogo {
  const m = new GestorJogo("Pelada teste", new Rules({ playersPerTeam: 4 }));
  m.adicionarJogadores(
    Array.from(
      { length: jogadores },
      (_, i) => `J${String(i + 1).padStart(2, "0")}`,
    ),
  );
  return m;
}

function nomesDoTime(team: Team): string {
  return team.players.map((p) => p.name).join(" · ");
}

/** Posição, na ordem de render, do card que lista os nomes do time. */
function posicaoNaTela(team: Team): number {
  const textos = screen
    .getAllByText(/ · /)
    .map((no) => String(no.props.children));
  return textos.indexOf(nomesDoTime(team));
}

describe("Times — fila acompanha o domínio", () => {
  it("'mover para o fim' reordena a fila já renderizada", () => {
    const m = buildManager(16);
    m.criarTimes();
    const [, , time3, time4] = m.next;
    renderWithProviders(<TimesScreen />, { soccer: { gestor: m } });
    expect(posicaoNaTela(time3)).toBeGreaterThanOrEqual(0);
    expect(posicaoNaTela(time3)).toBeLessThan(posicaoNaTela(time4));

    act(() => m.moverTimeParaFim(time3));

    expect(posicaoNaTela(time4)).toBeLessThan(posicaoNaTela(time3));
  });

  it("ao iniciar a partida, os times 3 e 4 não aparecem em dobro na fila", () => {
    const m = buildManager(16);
    m.criarTimes();
    renderWithProviders(<TimesScreen />, { soccer: { gestor: m } });
    expect(screen.getByText("Fila (2)")).toBeTruthy();

    act(() => m.setPlayingGame());

    expect(screen.queryByText(/^Fila \(/)).toBeNull();
  });
});

describe("Jogadores — busca acompanha o domínio", () => {
  // A busca só aparece a partir de 5 jogadores.
  it("jogador adicionado depois do render aparece na busca", () => {
    const m = buildManager(6);
    renderWithProviders(<JogadoresScreen />, { soccer: { gestor: m } });
    fireEvent.changeText(
      screen.getByLabelText("Buscar jogador por nome"),
      "Zé",
    );
    expect(screen.queryByText("Zé Novo")).toBeNull();

    act(() => m.adicionarJogador("Zé Novo"));

    expect(screen.getByText("Zé Novo")).toBeTruthy();
  });

  it("jogador removido depois do render some da busca", () => {
    const m = buildManager(6);
    renderWithProviders(<JogadoresScreen />, { soccer: { gestor: m } });
    fireEvent.changeText(
      screen.getByLabelText("Buscar jogador por nome"),
      "J0",
    );
    expect(screen.getByText("J01")).toBeTruthy();

    act(() => m.removerJogador(m.players[0]));

    expect(screen.queryByText("J01")).toBeNull();
  });
});

describe("Partida — banco e linha do tempo acompanham o domínio", () => {
  function buildPartida(): GestorJogo {
    const m = buildManager(12);
    m.criarTimes();
    m.setPlayingGame();
    m.timer = new Timer(
      m.rules.numberTimes,
      m.rules.getDurationMatch(),
      () => {},
    );
    m.timer.status = TimerStatus.STARTED;
    return m;
  }

  it("o banco deixa de mostrar o reserva que entrou em campo", () => {
    const m = buildPartida();
    renderWithProviders(<PartidaScreen />, { soccer: { gestor: m } });
    expect(screen.getByLabelText(/Banco com 4 reservas/)).toBeTruthy();

    act(() =>
      m.trocarJogadorPelaEsquerda(
        m.next[0].players[0],
        m.playing!.teamA.players[0],
      ),
    );

    expect(screen.getByLabelText(/Banco com 3 reservas/)).toBeTruthy();
  });

  it("gol marcado depois do render entra na linha do tempo", () => {
    const m = buildPartida();
    const teamA = m.playing!.teamA;
    m.marcarGol(teamA, teamA.players[0]);
    renderWithProviders(<PartidaScreen />, { soccer: { gestor: m } });
    const antes = screen.queryAllByLabelText(/Ações do gol de/).length;

    act(() => m.marcarGol(teamA, teamA.players[1]));

    expect(screen.queryAllByLabelText(/Ações do gol de/).length).toBe(
      antes + 1,
    );
  });
});
