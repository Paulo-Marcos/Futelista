import { GestorJogo } from "@/src/domain/GestorJogo";
import { Rules } from "@/src/domain/Rules";
import {
  act,
  renderWithProviders,
  screen,
} from "@/src/test/renderWithProviders";

import TimesScreen from "../(pelada)/times";

// D-049: durante a partida o card da fila (TeamQueue, memo) recebe o mesmo
// `Team` mutado e nenhuma outra prop muda. Alocar recém-chegados no time
// incompleto da fila tem que aparecer no card já renderizado.

describe("Times — card da fila acompanha a composição do time", () => {
  it("durante a partida, o card da fila mostra os recém-alocados", () => {
    const m = new GestorJogo("Pelada teste", new Rules({ playersPerTeam: 4 }));
    m.adicionarJogadores(
      Array.from(
        { length: 18 },
        (_, i) => `J${String(i + 1).padStart(2, "0")}`,
      ),
    );
    m.criarTimes();
    m.setPlayingGame();
    const incompleto = m.next[m.next.length - 1];
    renderWithProviders(<TimesScreen />, { soccer: { gestor: m } });

    act(() => {
      m.adicionarJogador("Novo1");
      m.adicionarJogador("Novo2");
      m.realocarJogadoresSemTime();
    });

    expect(incompleto.players.map((p) => p.name)).toEqual([
      "J17",
      "J18",
      "Novo1",
      "Novo2",
    ]);
    expect(screen.getByText("J17 · J18 · Novo1 · Novo2")).toBeTruthy();
  });
});
