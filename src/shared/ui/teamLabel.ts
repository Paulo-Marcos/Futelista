import { Team } from "@/src/domain/Team";

/**
 * Helper de rotulagem de time para UI (F-18).
 *
 * Retorna o `nomeCustom` se o usuário tiver renomeado o time, senão
 * cai num rótulo posicional ("Time 1", "Time 2"...). Centralizado pra
 * que toda tela mostre o mesmo nome — antes "Time 1/2" estava
 * hard-coded em uma dúzia de lugares.
 *
 * @param team time corrente.
 * @param idx posição na fila/partida (0-based). Vira "Time {idx+1}".
 */
export function nomeDoTime(team: Team, idx: number): string {
  if (team.nomeCustom && team.nomeCustom.trim().length > 0) {
    return team.nomeCustom;
  }
  return `Time ${idx + 1}`;
}
