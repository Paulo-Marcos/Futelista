import { Goal } from "@/src/domain/Goal";

export function minutoDoGol(gol: Goal): number {
  // ScreenTime.timeStroke é decorrido em segundos no tempo atual.
  return Math.max(0, Math.floor(gol.time.timeStroke / 60));
}

export function formatSeconds(total: number): string {
  const safe = Math.max(0, Math.floor(total));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
