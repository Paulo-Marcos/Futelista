import { GameManager } from "@/src/domain/GameManager";
import { Goal } from "@/src/domain/Goal";
import { Match, ResultMatch } from "@/src/domain/Match";
import { Player, PlayerSituation } from "@/src/domain/Player";
import { ChoosingTeams, Rules } from "@/src/domain/Rules";
import { ScreenTime } from "@/src/domain/ScreenTime";
import { Switch } from "@/src/domain/Switch";
import { Team, TeamSituation } from "@/src/domain/Team";
import { Timer, TimerStatus } from "@/src/domain/Timer";

/**
 * Serializador <-> reidratador do agregado GameManager.
 *
 * O grafo de domínio é cíclico (Player <-> Team <-> Match), então
 * persistimos por id e religamos as referências na reidratação,
 * em dois passes:
 *
 *  1. Constrói instâncias vazias indexadas por id em Maps.
 *  2. Religa as referências usando os Maps como tabela de lookup.
 *
 * Para classes cujos construtores têm efeitos colaterais que
 * atrapalham a reidratação (Match e Timer), usamos Object.create
 * para criar instâncias "cruas" e populamos os campos diretamente.
 *
 * Timer ativo (status STARTED) volta como PAUSED no load — não há
 * intervalo vivo após o reload, então o estado correto semanticamente
 * é "estava rodando, foi pausado".
 */

const PAYLOAD_VERSION = 1;

type GoalDTO = {
  playerId: string;
  teamId: string;
  time: { stroke: number; timeStroke: number };
  ownGoal: boolean;
};

type SwitchDTO = {
  playerEntersId: string;
  playerLeavesId: string;
};

type PlayerDTO = {
  id: string;
  name: string;
  situation: PlayerSituation;
  currentTeamId: string | null;
  teamHistoryIds: string[];
  matchHistoryIds: string[];
};

type TeamDTO = {
  id: string;
  limit: number;
  playerIds: string[];
  matchHistoryIds: string[];
  victories: number;
  draws: number;
  loses: number;
  advantage: boolean;
  fullTeam: boolean;
  situation: TeamSituation;
  switches: SwitchDTO[];
};

type MatchDTO = {
  id: string;
  teamAId: string;
  teamBId: string;
  winnerId: string | null;
  loserId: string | null;
  result: ResultMatch | null;
  goals: GoalDTO[];
};

type RulesDTO = {
  id: string;
  name: string;
  playersPerTeam: number;
  timeMatch: string;
  numberTimes: number;
  goalLimit: number;
  choosingTeams: ChoosingTeams;
};

type TimerDTO = {
  numberTimes: number;
  timeMatch: number;
  restTime: number;
  currentNumberTime: number;
  status: TimerStatus;
};

export type Payload = {
  version: number;
  pelada: {
    id: string;
    name: string;
    playersWithoutTeam: number;
    advantageToNextTeamId: string | null;
    playingMatchId: string | null;
  };
  rules: RulesDTO;
  players: PlayerDTO[];
  teams: TeamDTO[];
  matches: MatchDTO[];
  nextTeamIds: string[];
  matchHistoryIds: string[];
  timer: TimerDTO | null;
};

export function serializeGameManager(game: GameManager): string {
  return JSON.stringify(buildPayload(game));
}

export function deserializeGameManager(raw: string): GameManager {
  const payload = JSON.parse(raw) as Payload;
  if (payload.version !== PAYLOAD_VERSION) {
    throw Error(
      `Versão de payload incompatível: esperava ${PAYLOAD_VERSION}, recebi ${payload.version}.`,
    );
  }
  return buildGameManager(payload);
}

// ---------- Serialização ------------------------------------------------------

function buildPayload(game: GameManager): Payload {
  // Inclui a partida em andamento na lista de matches do payload para que
  // o id em playingMatchId resolva no Map de reidratação. matchHistoryIds
  // continua apontando só para o histórico (game.matches).
  const allMatches: Match[] = [...game.matches];
  if (game.playing && !allMatches.some((m) => m.id === game.playing!.id)) {
    allMatches.push(game.playing);
  }
  return {
    version: PAYLOAD_VERSION,
    pelada: {
      id: game.id,
      name: game.name,
      playersWithoutTeam: game.playersWithoutTeam,
      advantageToNextTeamId: game.advantageToNext?.id ?? null,
      playingMatchId: game.playing?.id ?? null,
    },
    rules: buildRulesDTO(game.rules),
    players: game.players.map(buildPlayerDTO),
    teams: collectAllTeams(game).map(buildTeamDTO),
    matches: allMatches.map(buildMatchDTO),
    nextTeamIds: game.next.map((t) => t.id),
    matchHistoryIds: game.matches.map((m) => m.id),
    timer: game.timer ? buildTimerDTO(game.timer) : null,
  };
}

/**
 * Times referenciados em qualquer lugar do agregado:
 * - next (fila)
 * - matches (histórico)
 * - players.teams (histórico individual)
 * - playing.teams
 *
 * Junta tudo num Set por id pra não duplicar.
 */
function collectAllTeams(game: GameManager): Team[] {
  const map = new Map<string, Team>();
  const add = (team?: Team) => {
    if (team) map.set(team.id, team);
  };
  game.next.forEach(add);
  game.matches.forEach((m) => {
    add(m.teamA);
    add(m.teamB);
  });
  game.players.forEach((p) => p.teams.forEach(add));
  if (game.playing) {
    add(game.playing.teamA);
    add(game.playing.teamB);
  }
  add(game.advantageToNext);
  return [...map.values()];
}

function buildRulesDTO(rules: Rules): RulesDTO {
  return {
    id: rules.id,
    name: rules.name,
    playersPerTeam: rules.playersPerTeam,
    timeMatch: rules.timeMatch,
    numberTimes: rules.numberTimes,
    goalLimit: rules.goalLimit,
    choosingTeams: rules.choosingTeams,
  };
}

function buildPlayerDTO(player: Player): PlayerDTO {
  return {
    id: player.id,
    name: player.name,
    situation: player.situation,
    currentTeamId: player.currentTeam?.id ?? null,
    teamHistoryIds: player.teams.map((t) => t.id),
    matchHistoryIds: player.matches.map((m) => m.id),
  };
}

function buildTeamDTO(team: Team): TeamDTO {
  return {
    id: team.id,
    limit: team.limit,
    playerIds: team.players.map((p) => p.id),
    matchHistoryIds: team.matches.map((m) => m.id),
    victories: team.victories,
    draws: team.draws,
    loses: team.loses,
    advantage: team.advantage,
    fullTeam: team.fullTeam,
    situation: team.situation,
    switches: team.Switches.map((s) => ({
      playerEntersId: s.playerEnters.id,
      playerLeavesId: s.playerLeaves.id,
    })),
  };
}

function buildMatchDTO(match: Match): MatchDTO {
  return {
    id: match.id,
    teamAId: match.teamA.id,
    teamBId: match.teamB.id,
    winnerId: match.winner?.id ?? null,
    loserId: match.loser?.id ?? null,
    result: match.result ?? null,
    goals: match.goals.map((g) => ({
      playerId: g.player.id,
      teamId: g.team.id,
      time: { stroke: g.time.stroke, timeStroke: g.time.timeStroke },
      ownGoal: g.ownGoal,
    })),
  };
}

function buildTimerDTO(timer: Timer): TimerDTO {
  return {
    numberTimes: timer.numberTimes,
    timeMatch: timer.timeMatch,
    restTime: timer.restTime,
    currentNumberTime: timer.currentNumberTime,
    status: timer.status,
  };
}

// ---------- Reidratação -------------------------------------------------------

function buildGameManager(payload: Payload): GameManager {
  const rules = new Rules(payload.rules);
  const game = new GameManager(payload.pelada.name, rules);
  // Sobrescreve o id gerado pelo construtor para preservar o id da pelada.
  (game as { id: string }).id = payload.pelada.id;
  game.playersWithoutTeam = payload.pelada.playersWithoutTeam;

  const playersById = rehydratePlayers(payload.players);
  const teamsById = rehydrateTeams(payload.teams, playersById);
  const matchesById = rehydrateMatches(payload.matches, teamsById, playersById);

  relinkPlayerHistories(payload.players, playersById, teamsById, matchesById);
  relinkTeamHistories(payload.teams, teamsById, matchesById);

  game.players = payload.players.map((p) => playersById.get(p.id)!);
  game.next = payload.nextTeamIds.map((id) => teamsById.get(id)!);
  game.matches = payload.matchHistoryIds.map((id) => matchesById.get(id)!);
  game.playing = payload.pelada.playingMatchId
    ? matchesById.get(payload.pelada.playingMatchId)
    : undefined;
  game.advantageToNext = payload.pelada.advantageToNextTeamId
    ? teamsById.get(payload.pelada.advantageToNextTeamId)
    : undefined;

  if (payload.timer) {
    game.timer = rehydrateTimer(payload.timer, () => game["notify"]?.());
  }

  return game;
}

function rehydratePlayers(dtos: PlayerDTO[]): Map<string, Player> {
  const map = new Map<string, Player>();
  dtos.forEach((dto) => {
    const player = new Player(dto.name);
    (player as { id: string }).id = dto.id;
    player.situation = dto.situation;
    map.set(dto.id, player);
  });
  return map;
}

function rehydrateTeams(
  dtos: TeamDTO[],
  playersById: Map<string, Player>,
): Map<string, Team> {
  const map = new Map<string, Team>();
  dtos.forEach((dto) => {
    const team = new Team(dto.limit);
    (team as { id: string }).id = dto.id;
    team.victories = dto.victories;
    team.draws = dto.draws;
    team.loses = dto.loses;
    team.advantage = dto.advantage;
    team.fullTeam = dto.fullTeam;
    team.situation = dto.situation;
    team.players = dto.playerIds.map((pid) => playersById.get(pid)!);
    team.Switches = dto.switches.map(
      (s) =>
        new Switch(
          playersById.get(s.playerEntersId)!,
          playersById.get(s.playerLeavesId)!,
          team,
        ),
    );
    map.set(dto.id, team);
  });
  return map;
}

function rehydrateMatches(
  dtos: MatchDTO[],
  teamsById: Map<string, Team>,
  playersById: Map<string, Player>,
): Map<string, Match> {
  const map = new Map<string, Match>();
  dtos.forEach((dto) => {
    const teamA = teamsById.get(dto.teamAId)!;
    const teamB = teamsById.get(dto.teamBId)!;
    // Object.create evita o efeito colateral do construtor de Match,
    // que faria addMatch+setSituation nos times — efeitos que já foram
    // capturados no estado persistido.
    const match = Object.create(Match.prototype) as Match;
    Object.assign(match, {
      id: dto.id,
      teamA,
      teamB,
      teams: new Set([teamA, teamB]),
      winner: dto.winnerId ? teamsById.get(dto.winnerId) : undefined,
      loser: dto.loserId ? teamsById.get(dto.loserId) : undefined,
      result: dto.result ?? undefined,
      goals: [] as Goal[],
    });
    dto.goals.forEach((g) => {
      const player = playersById.get(g.playerId)!;
      const team = teamsById.get(g.teamId)!;
      const goal = new Goal(
        match,
        player,
        team,
        new ScreenTime(g.time.stroke, g.time.timeStroke),
        g.ownGoal,
      );
      match.goals.push(goal);
      team.goals.push(goal);
      if (!g.ownGoal) player.goals.push(goal);
    });
    map.set(dto.id, match);
  });
  return map;
}

function relinkPlayerHistories(
  dtos: PlayerDTO[],
  playersById: Map<string, Player>,
  teamsById: Map<string, Team>,
  matchesById: Map<string, Match>,
): void {
  dtos.forEach((dto) => {
    const player = playersById.get(dto.id)!;
    player.teams = dto.teamHistoryIds.map((tid) => teamsById.get(tid)!);
    player.matches = dto.matchHistoryIds.map((mid) => matchesById.get(mid)!);
    player.currentTeam = dto.currentTeamId
      ? teamsById.get(dto.currentTeamId)
      : undefined;
  });
}

function relinkTeamHistories(
  dtos: TeamDTO[],
  teamsById: Map<string, Team>,
  matchesById: Map<string, Match>,
): void {
  dtos.forEach((dto) => {
    const team = teamsById.get(dto.id)!;
    team.matches = dto.matchHistoryIds.map((mid) => matchesById.get(mid)!);
  });
}

function rehydrateTimer(dto: TimerDTO, onChange: () => void): Timer {
  const timer = new Timer(dto.numberTimes, dto.timeMatch, onChange);
  timer.restTime = dto.restTime;
  timer.currentNumberTime = dto.currentNumberTime;
  // Se o timer estava rodando, volta como pausado — sem callback de interval vivo.
  timer.status =
    dto.status === TimerStatus.STARTED ? TimerStatus.PAUSED : dto.status;
  return timer;
}
