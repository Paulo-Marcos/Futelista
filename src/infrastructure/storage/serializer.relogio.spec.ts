import { GestorJogo } from "@/src/domain/GestorJogo";
import { ChoosingTeams, Rules } from "@/src/domain/Rules";
import { TimerStatus } from "@/src/domain/Timer";

import { deserializeGestorJogo, serializeGestorJogo } from "./serializer";

/**
 * D-051: o cronômetro persiste a âncora no relógio real, então reabrir o
 * app depois de matá-lo considera o tempo que passou. Saves antigos (só
 * `restTime`) continuam legíveis.
 */
describe("serializer — cronômetro ancorado no relógio (D-051)", () => {
  const DURACAO = 120; // "00:02:00"

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

  /** Reescreve o timer salvo como gravado antes da D-051 (sem a âncora). */
  function noFormatoAntigo(
    raw: string,
    timer: { restTime: number; status: TimerStatus },
  ): string {
    const payload = JSON.parse(raw);
    const { decorridoMs: _d, iniciadoEm: _i, ...antigo } = payload.timer;
    payload.timer = { ...antigo, ...timer };
    return JSON.stringify(payload);
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-30T20:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  it("reabrir após matar o app conta o tempo que passou fechado", () => {
    const original = jogoEmPartida();
    original.start();
    jest.advanceTimersByTime(30_000);
    const salvo = serializeGestorJogo(original);
    original.liberarCronometro(); // processo morto

    jest.setSystemTime(Date.now() + 50_000); // 50s com o app fechado
    const reaberto = deserializeGestorJogo(salvo);

    expect(reaberto.timer!.status).toBe(TimerStatus.PAUSED);
    expect(reaberto.timer!.restTime).toBe(DURACAO - 80);
  });

  it("formato antigo: timer rodando volta pausado com o restTime salvo", () => {
    const original = jogoEmPartida();
    original.start();
    const antigo = noFormatoAntigo(serializeGestorJogo(original), {
      restTime: 70,
      status: TimerStatus.STARTED,
    });
    original.liberarCronometro();

    const reaberto = deserializeGestorJogo(antigo);

    expect(reaberto.timer!.status).toBe(TimerStatus.PAUSED);
    expect(reaberto.timer!.restTime).toBe(70);
  });

  it("formato antigo: fim natural salvo com tempo cheio não reabre com tempo extra", () => {
    const original = jogoEmPartida();
    original.start();
    const antigo = noFormatoAntigo(serializeGestorJogo(original), {
      restTime: DURACAO,
      status: TimerStatus.ENDED,
    });
    original.liberarCronometro();

    const reaberto = deserializeGestorJogo(antigo);
    reaberto.timer!.reabrir();

    expect(reaberto.timer!.status).toBe(TimerStatus.ENDED);
    expect(reaberto.timer!.restTime).toBe(0);
  });
});
