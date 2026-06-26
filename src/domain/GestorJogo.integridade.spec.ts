import { GestorJogo } from "./GestorJogo";
import { Rules, ChoosingTeams } from "./Rules";
import {
  serializeGestorJogo,
  deserializeGestorJogo,
} from "../infrastructure/storage/serializer";

function regras(playersPerTeam = 4) {
  return new Rules({
    playersPerTeam,
    numberTimes: 1,
    timeMatch: "00:10:00",
    goalLimit: 10,
    choosingTeams: ChoosingTeams.BY_ORDER,
  });
}

function jogadorEmDoisTimes(jogo: GestorJogo): string[] {
  const times = [...jogo.next];
  if (jogo.playing) times.push(jogo.playing.teamA, jogo.playing.teamB);
  const cont = new Map<string, number>();
  times.forEach((t) =>
    t.players.forEach((p) => cont.set(p.id, (cont.get(p.id) ?? 0) + 1)),
  );
  return [...cont.entries()].filter(([, n]) => n > 1).map(([id]) => id);
}

describe("setPlayers — deduplicação", () => {
  it("ignora nomes repetidos (trim + case-insensitive), como adicionarJogadores", () => {
    const jogo = new GestorJogo("P", regras());
    jogo.setPlayers(["Ana", "Bia", " ana ", "Caio", "BIA", ""]);
    expect(jogo.players.map((p) => p.name)).toEqual(["Ana", "Bia", "Caio"]);
  });

  it("nome repetido não duplica jogador entre times no criarTimes", () => {
    const jogo = new GestorJogo("P", regras(4));
    // 9 nomes com "Ana" repetido (8 distintos) — antes o repetido virava
    // jogador fantasma e era distribuído como se fosse outra pessoa.
    jogo.setPlayers([
      "Ana",
      "Bia",
      "Caio",
      "Davi",
      "Eva",
      "Fabio",
      "Gabi",
      "Hugo",
      "Ana",
    ]);
    expect(jogo.players.length).toBe(8);
    jogo.criarTimes();
    expect(jogadorEmDoisTimes(jogo)).toEqual([]);
  });
});

describe("repararIntegridadeDosTimes — cura saves corrompidos", () => {
  it("remove jogador duplicado entre dois times ao reabrir o save", () => {
    const jogo = new GestorJogo("P", regras(4));
    jogo.adicionarJogadores(["A", "B", "C", "D", "E", "F", "G", "H"]);
    jogo.criarTimes();

    // Simula um save gerado por versão antiga: jogador do time 0 também no time 1.
    const payload = JSON.parse(serializeGestorJogo(jogo));
    const idVitima = payload.teams[0].playerIds[0];
    payload.teams[1].playerIds.push(idVitima);

    const recarregado = deserializeGestorJogo(JSON.stringify(payload));

    expect(jogadorEmDoisTimes(recarregado)).toEqual([]);
    // a vítima continua em exatamente um time, coerente com currentTeam
    const vitima = recarregado.players.find((p) => p.id === idVitima)!;
    expect(vitima.currentTeam).toBeDefined();
    expect(
      vitima.currentTeam!.players.filter((p) => p.id === idVitima),
    ).toHaveLength(1);
  });

  it("remove referência de time duplicada em next", () => {
    const jogo = new GestorJogo("P", regras(4));
    jogo.adicionarJogadores(["A", "B", "C", "D", "E", "F", "G", "H"]);
    jogo.criarTimes();

    const payload = JSON.parse(serializeGestorJogo(jogo));
    payload.nextTeamIds.push(payload.nextTeamIds[0]); // mesma id 2x

    const recarregado = deserializeGestorJogo(JSON.stringify(payload));
    const ids = recarregado.next.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("é idempotente sobre um estado já íntegro", () => {
    const jogo = new GestorJogo("P", regras(4));
    jogo.adicionarJogadores(["A", "B", "C", "D", "E", "F", "G", "H"]);
    jogo.criarTimes();
    const antes = jogo.next.map((t) => t.players.map((p) => p.id));
    jogo.repararIntegridadeDosTimes();
    const depois = jogo.next.map((t) => t.players.map((p) => p.id));
    expect(depois).toEqual(antes);
    expect(jogadorEmDoisTimes(jogo)).toEqual([]);
  });
});
