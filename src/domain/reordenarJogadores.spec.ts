import { GestorJogo } from "./GestorJogo";
import { Rules } from "./Rules";

describe("GestorJogo.reordenarJogadores (M-07)", () => {
  function jogoCom(jogadores: string[]): GestorJogo {
    const jogo = new GestorJogo("Pelada", new Rules({ playersPerTeam: 2 }));
    jogo.setPlayers(jogadores);
    return jogo;
  }

  it("reordena os jogadores conforme a lista de ids passada", () => {
    const jogo = jogoCom(["Ana", "Bia", "Caio", "Diego"]);
    const [ana, bia, caio, diego] = jogo.players;
    jogo.reordenarJogadores([diego.id, caio.id, bia.id, ana.id]);
    expect(jogo.players.map((p) => p.name)).toEqual([
      "Diego",
      "Caio",
      "Bia",
      "Ana",
    ]);
  });

  it("aceita a mesma ordem (no-op)", () => {
    const jogo = jogoCom(["Ana", "Bia"]);
    const idsAntes = jogo.players.map((p) => p.id);
    jogo.reordenarJogadores(idsAntes);
    expect(jogo.players.map((p) => p.id)).toEqual(idsAntes);
  });

  it("rejeita lista com tamanho diferente", () => {
    const jogo = jogoCom(["Ana", "Bia", "Caio"]);
    const ids = jogo.players.map((p) => p.id);
    expect(() => jogo.reordenarJogadores(ids.slice(0, 2))).toThrow(
      /exatamente 3 jogadores/,
    );
  });

  it("rejeita id que não é do jogo", () => {
    const jogo = jogoCom(["Ana", "Bia"]);
    expect(() =>
      jogo.reordenarJogadores([jogo.players[0].id, "fantasma"]),
    ).toThrow(/não está na pelada/);
  });

  it("rejeita id duplicado na nova ordem", () => {
    const jogo = jogoCom(["Ana", "Bia"]);
    const ids = jogo.players.map((p) => p.id);
    expect(() => jogo.reordenarJogadores([ids[0], ids[0]])).toThrow(
      /duplicado/,
    );
  });

  it("rejeita reordenação com times já formados", () => {
    const jogo = jogoCom(["Ana", "Bia", "Caio", "Diego"]);
    jogo.createTeams();
    const ids = jogo.players.map((p) => p.id);
    expect(() => jogo.reordenarJogadores(ids.reverse())).toThrow(
      /Resete os times/,
    );
  });

  it("rejeita reordenação com partida em andamento", () => {
    const jogo = jogoCom(["Ana", "Bia", "Caio", "Diego"]);
    jogo.createTeams();
    jogo.setPlayingGame();
    const ids = jogo.players.map((p) => p.id);
    expect(() => jogo.reordenarJogadores(ids.reverse())).toThrow(
      /partida em andamento/,
    );
  });
});
