import { GestorJogo } from "./GestorJogo";
import { PlayerSituation } from "./PlayerSituation";
import { ChoosingTeams, Rules } from "./Rules";
import { TeamSituation } from "./TeamSituation";

/**
 * Regressão (D-047): rotação da fila e integridade dos times, exercitadas
 * pelo fluxo real (`setResult` + `definirProximaPartida`), sem spyOn nem
 * `result` atribuído à mão — foi assim que os bugs passaram pelas specs
 * dos handlers.
 */
describe("GestorJogo — rotação da fila e integridade dos times", () => {
  function jogoCom(nomes: string[]): GestorJogo {
    const rules = new Rules({
      playersPerTeam: 2,
      choosingTeams: ChoosingTeams.BY_ORDER,
    });
    const jogo = new GestorJogo("Pelada", rules);
    jogo.setPlayers(nomes);
    jogo.criarTimes();
    jogo.setPlayingGame();
    return jogo;
  }

  const QUATRO_TIMES = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2"];
  const TRES_TIMES = ["A1", "A2", "B1", "B2", "C1", "C2"];

  describe("empate sem vantagem", () => {
    it("com dois times cheios na fila, gira a fila e os próximos entram", () => {
      const jogo = jogoCom(QUATRO_TIMES);
      const { teamA, teamB } = jogo.playing!;
      const [timeC, timeD] = jogo.next;

      jogo.setResult();
      jogo.definirProximaPartida();

      expect(jogo.playing!.teamA).toBe(timeC);
      expect(jogo.playing!.teamB).toBe(timeD);
      expect(jogo.next).toEqual([teamA, teamB]);
      expect(jogo.advantageToNext).toBeUndefined();
    });

    it("com fila parcial e sem vantagem externa, lança erro de domínio", () => {
      const jogo = jogoCom(TRES_TIMES);
      const partida = jogo.playing!;
      jogo.setResult();

      expect(() => jogo.definirProximaPartida()).toThrow(
        "Empate sem vantagem: escolha o time que segue jogando.",
      );
      expect(jogo.playing).toBe(partida);
    });
  });

  describe("situação do time", () => {
    it("time que sai da partida volta para ON_NEXT", () => {
      const jogo = jogoCom(TRES_TIMES);
      const { teamA, teamB } = jogo.playing!;
      jogo.marcarGol(teamA, teamA.players[0]);
      jogo.setResult();

      jogo.definirProximaPartida();

      expect(teamB.situation).toBe(TeamSituation.ON_NEXT);
      expect(teamA.situation).toBe(TeamSituation.PLAYING);
    });

    it("tirar do jogo alguém de um time que já jogou redimensiona a fila, não a partida", () => {
      const jogo = jogoCom(QUATRO_TIMES);
      const { teamA, teamB } = jogo.playing!;
      const timeD = jogo.next[1];
      const jogadoresDeD = [...timeD.players];
      jogo.marcarGol(teamA, teamA.players[0]);
      jogo.setResult();
      jogo.definirProximaPartida();
      const [b1, b2] = teamB.players;

      jogo.tirarDoJogo(b1);

      expect(jogo.next).toEqual([timeD, teamB]);
      expect(timeD.players).toEqual(jogadoresDeD);
      expect(teamB.players).toEqual([b2]);
    });
  });

  describe("tirar do jogo", () => {
    it("zera o currentTeam do jogador retirado", () => {
      const jogo = jogoCom(TRES_TIMES);
      const [c1] = jogo.next[0].players;

      jogo.tirarDoJogo(c1);

      expect(c1.currentTeam).toBeUndefined();
      expect(c1.situation).toBe(PlayerSituation.STOPPED);
    });

    it("remover depois de tirar do jogo não leva outro jogador junto", () => {
      const jogo = jogoCom(QUATRO_TIMES);
      const timeD = jogo.next[1];
      const [d1, d2] = timeD.players;

      jogo.tirarDoJogo(d1);
      jogo.removerJogador(d1);

      expect(timeD.players).toEqual([d2]);
      expect(jogo.players).toContain(d2);
      expect(jogo.playersWithoutTeam).toBe(0);
    });

    it("jogador tirado do jogo não conta como sem time nem é realocado", () => {
      const jogo = jogoCom(TRES_TIMES);
      const [c1] = jogo.next[0].players;

      jogo.tirarDoJogo(c1);
      jogo.realocarJogadoresSemTime();

      expect(jogo.playersWithoutTeam).toBe(0);
      expect(c1.currentTeam).toBeUndefined();
    });

    it("tirar do jogo um jogador sem time lança erro de domínio", () => {
      const jogo = jogoCom(TRES_TIMES);
      const [c1] = jogo.next[0].players;
      jogo.tirarDoJogo(c1);

      expect(() => jogo.tirarDoJogo(c1)).toThrow(
        "Só dá pra tirar do jogo quem está em um time.",
      );
    });
  });

  describe("troca pela esquerda", () => {
    it("zera o currentTeam de quem sai de campo", () => {
      const jogo = jogoCom(TRES_TIMES);
      const { teamA } = jogo.playing!;
      const [a1] = teamA.players;
      const [c1] = jogo.next[0].players;

      jogo.trocarJogadorPelaEsquerda(c1, a1);

      expect(a1.currentTeam).toBeUndefined();
      expect(c1.currentTeam).toBe(teamA);
    });
  });

  describe("redimensionar times", () => {
    it("time esvaziado pelo redimensionamento sai da fila", () => {
      const jogo = jogoCom(["A1", "A2", "B1", "B2", "C1", "C2", "D1"]);
      const [timeC, timeD] = jogo.next;
      const [c1] = timeC.players;

      jogo.tirarDoJogo(c1);

      expect(timeC.players).toHaveLength(2);
      expect(timeD.players).toHaveLength(0);
      expect(jogo.next).toEqual([timeC]);
    });
  });
});
