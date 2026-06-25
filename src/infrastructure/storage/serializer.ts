import { GestorJogo, PeladaStatus } from "@/src/domain/GestorJogo";
import { Goal } from "@/src/domain/Goal";
import { Match, ResultMatch } from "@/src/domain/Match";
import { Player, PlayerSituation } from "@/src/domain/Player";
import { Rules, RulesData } from "@/src/domain/Rules";
import { ScreenTime } from "@/src/domain/ScreenTime";
import { Switch } from "@/src/domain/Switch";
import { Team, TeamSituation } from "@/src/domain/Team";
import { Timer, TimerStatus } from "@/src/domain/Timer";

/**
 * Serializador <-> reidratador do agregado GestorJogo.
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

const PAYLOAD_VERSION = 4;

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
  /** Foto custom do jogador (F-19) — URI absoluta. */
  fotoUri?: string;
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
  /** Personalização F-18 — opcionais, ausência cai no rótulo/cor default. */
  nomeCustom?: string;
  corCustom?: string;
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
    status: PeladaStatus;
    createdAt: number;
    startedAt: number | null;
    endedAt: number | null;
    peladaId: string | null;
  };
  rules: RulesData;
  /**
   * Grafo completo de jogadores alcançáveis (v4+): inclui removidos da
   * pelada que ainda aparecem em gols, trocas e escalações antigas.
   * Quem está NO elenco é decidido por `rosterPlayerIds`.
   */
  players: PlayerDTO[];
  /** Ids dos jogadores atualmente na pelada, na ordem da lista (v4+). */
  rosterPlayerIds: string[];
  teams: TeamDTO[];
  matches: MatchDTO[];
  nextTeamIds: string[];
  matchHistoryIds: string[];
  timer: TimerDTO | null;
};

export function serializeGestorJogo(jogo: GestorJogo): string {
  return JSON.stringify(buildPayload(jogo));
}

export function deserializeGestorJogo(raw: string): GestorJogo {
  const payload = JSON.parse(raw) as Payload;
  if (payload.version > PAYLOAD_VERSION) {
    throw Error(
      `Versão de payload incompatível: máxima suportada ${PAYLOAD_VERSION}, recebi ${payload.version}.`,
    );
  }
  return buildGestorJogo(migrarPayload(payload));
}

/**
 * Preenche campos novos com defaults conservadores quando lemos um
 * payload mais antigo. v1→v2: lifecycle de pelada (payloads salvos antes
 * do conceito de status são tratados como ATIVA). v3→v4: `players` virou
 * grafo completo com `rosterPlayerIds` separado — em saves antigos a
 * lista era exatamente o elenco.
 */
function migrarPayload(payload: Payload): Payload {
  if (payload.version === PAYLOAD_VERSION) return payload;
  return {
    ...payload,
    version: PAYLOAD_VERSION,
    rosterPlayerIds:
      payload.rosterPlayerIds ?? payload.players.map((p) => p.id),
    pelada: {
      ...payload.pelada,
      status: payload.pelada.status ?? PeladaStatus.ATIVA,
      createdAt: payload.pelada.createdAt ?? 0,
      startedAt: payload.pelada.startedAt ?? null,
      endedAt: payload.pelada.endedAt ?? null,
      peladaId: payload.pelada.peladaId ?? null,
    },
  };
}

// ---------- Serialização ------------------------------------------------------

function buildPayload(jogo: GestorJogo): Payload {
  const grafo = coletarGrafoAlcancavel(jogo);
  return {
    version: PAYLOAD_VERSION,
    pelada: {
      id: jogo.id,
      name: jogo.name,
      playersWithoutTeam: jogo.playersWithoutTeam,
      advantageToNextTeamId: jogo.advantageToNext?.id ?? null,
      playingMatchId: jogo.playing?.id ?? null,
      status: jogo.status,
      createdAt: jogo.createdAt,
      startedAt: jogo.startedAt ?? null,
      endedAt: jogo.endedAt ?? null,
      peladaId: jogo.peladaId ?? null,
    },
    rules: { id: jogo.rules.id, ...jogo.rules.toData() },
    players: grafo.players.map(buildPlayerDTO),
    rosterPlayerIds: jogo.players.map((p) => p.id),
    teams: grafo.teams.map(buildTeamDTO),
    matches: grafo.matches.map(buildMatchDTO),
    nextTeamIds: jogo.next.map((t) => t.id),
    matchHistoryIds: jogo.matches.map((m) => m.id),
    timer: jogo.timer ? buildTimerDTO(jogo.timer) : null,
  };
}

/**
 * Fecho transitivo de Players, Teams e Matches alcançáveis pelo agregado.
 *
 * Serializar só `jogo.players` e `jogo.matches`+`playing` deixava
 * referências penduradas: partida encerrada continua no histórico de
 * times/jogadores mesmo fora de `jogo.matches`, e jogador removido da
 * pelada continua em gols, trocas e escalações de partidas antigas. Na
 * reidratação essas referências viravam `undefined` e o save SEGUINTE
 * estourava em `.id`. O fecho garante que todo id persistido resolva;
 * quem está no elenco é decidido por `rosterPlayerIds`.
 */
function coletarGrafoAlcancavel(jogo: GestorJogo): {
  players: Player[];
  teams: Team[];
  matches: Match[];
} {
  const players = new Map<string, Player>();
  const teams = new Map<string, Team>();
  const matches = new Map<string, Match>();
  const addPlayer = (p?: Player) => {
    if (p) players.set(p.id, p);
  };
  const addTeam = (t?: Team) => {
    if (t) teams.set(t.id, t);
  };
  const addMatch = (m?: Match) => {
    if (m) matches.set(m.id, m);
  };

  jogo.players.forEach(addPlayer);
  jogo.next.forEach(addTeam);
  jogo.matches.forEach(addMatch);
  addMatch(jogo.playing);
  addTeam(jogo.advantageToNext);

  // Player ↔ Team ↔ Match se referenciam mutuamente — expande até estabilizar.
  let total = -1;
  while (total !== players.size + teams.size + matches.size) {
    total = players.size + teams.size + matches.size;
    for (const match of [...matches.values()]) {
      addTeam(match.teamA);
      addTeam(match.teamB);
      match.goals.forEach((g) => {
        addPlayer(g.player);
        addTeam(g.team);
      });
    }
    for (const team of [...teams.values()]) {
      team.players.forEach(addPlayer);
      team.matches.forEach(addMatch);
      team.goals.forEach((g) => addPlayer(g.player));
      team.switches.forEach((s) => {
        addPlayer(s.playerEnters);
        addPlayer(s.playerLeaves);
      });
    }
    for (const player of [...players.values()]) {
      player.teams.forEach(addTeam);
      player.matches.forEach(addMatch);
    }
  }

  return {
    players: [...players.values()],
    teams: [...teams.values()],
    matches: [...matches.values()],
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
    fotoUri: player.fotoUri,
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
    switches: team.switches.map((s) => ({
      playerEntersId: s.playerEnters.id,
      playerLeavesId: s.playerLeaves.id,
    })),
    nomeCustom: team.nomeCustom,
    corCustom: team.corCustom,
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

function buildGestorJogo(payload: Payload): GestorJogo {
  const rules = new Rules(payload.rules);
  const jogo = new GestorJogo(payload.pelada.name, rules, {
    id: payload.pelada.id,
    status: payload.pelada.status,
    createdAt: payload.pelada.createdAt,
    startedAt: payload.pelada.startedAt ?? undefined,
    endedAt: payload.pelada.endedAt ?? undefined,
    peladaId: payload.pelada.peladaId ?? undefined,
  });
  jogo.playersWithoutTeam = payload.pelada.playersWithoutTeam;

  const playersById = rehydratePlayers(payload.players);
  criarPlaceholdersParaIdsPendurados(payload, playersById);
  const teamsById = rehydrateTeams(payload.teams, playersById);
  const matchesById = rehydrateMatches(payload.matches, teamsById, playersById);

  relinkPlayerHistories(payload.players, playersById, teamsById, matchesById);
  relinkTeamHistories(payload.teams, teamsById, matchesById);

  jogo.players = payload.rosterPlayerIds.map((id) => playersById.get(id)!);
  jogo.next = payload.nextTeamIds.map((id) => teamsById.get(id)!);
  // Mesmo racional dos filtros em relink*Histories: id de partida sem
  // entrada em `matches` (payload antigo/corrompido) é histórico perdido.
  jogo.matches = payload.matchHistoryIds
    .map((id) => matchesById.get(id))
    .filter((m): m is Match => m !== undefined);
  jogo.playing = payload.pelada.playingMatchId
    ? matchesById.get(payload.pelada.playingMatchId)
    : undefined;
  jogo.advantageToNext = payload.pelada.advantageToNextTeamId
    ? teamsById.get(payload.pelada.advantageToNextTeamId)
    : undefined;

  if (payload.timer) {
    jogo.timer = rehydrateTimer(payload.timer, () => jogo["notify"]?.());
  }

  // Saves gerados por versões antigas (com bugs históricos de troca/remoção)
  // podiam gravar um jogador no roster de dois times ou referências de time
  // repetidas em `next`. O relink acima reproduz fielmente a corrupção, então
  // saneamos antes de devolver o agregado — sem isto, a tela de Times mostra
  // jogadores duplicados mesmo com a lista de jogadores intacta.
  jogo.repararIntegridadeDosTimes();

  return jogo;
}

/**
 * Saves v3 e anteriores podiam conter ids de jogadores sem entrada em
 * `players` (jogador removido da pelada, mas presente em gols, trocas e
 * escalações de partidas antigas). Cria um placeholder por id pendurado —
 * preserva placar e histórico; o nome real se perdeu no save antigo.
 */
function criarPlaceholdersParaIdsPendurados(
  payload: Payload,
  playersById: Map<string, Player>,
): void {
  const garantir = (id: string) => {
    if (playersById.has(id)) return;
    const placeholder = new Player({ name: "(jogador removido)", id });
    placeholder.situation = PlayerSituation.STOPPED;
    playersById.set(id, placeholder);
  };
  payload.teams.forEach((t) => {
    t.playerIds.forEach(garantir);
    t.switches.forEach((s) => {
      garantir(s.playerEntersId);
      garantir(s.playerLeavesId);
    });
  });
  payload.matches.forEach((m) => m.goals.forEach((g) => garantir(g.playerId)));
}

function rehydratePlayers(dtos: PlayerDTO[]): Map<string, Player> {
  const map = new Map<string, Player>();
  dtos.forEach((dto) => {
    const player = new Player({ name: dto.name, id: dto.id });
    player.situation = dto.situation;
    if (dto.fotoUri) player.fotoUri = dto.fotoUri;
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
    const team = new Team({ limit: dto.limit, id: dto.id });
    team.victories = dto.victories;
    team.draws = dto.draws;
    team.loses = dto.loses;
    team.advantage = dto.advantage;
    team.fullTeam = dto.fullTeam;
    team.situation = dto.situation;
    team.players = dto.playerIds.map((pid) => playersById.get(pid)!);
    team.switches = dto.switches.map(
      (s) =>
        new Switch(
          playersById.get(s.playerEntersId)!,
          playersById.get(s.playerLeavesId)!,
          team,
        ),
    );
    team.nomeCustom = dto.nomeCustom;
    team.corCustom = dto.corCustom;
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
    // Os filtros cobrem saves v3 e anteriores, em que partidas encerradas
    // (e os times só alcançáveis por elas) podiam ficar fora do payload.
    // Essas entradas de histórico se perderam — descartar é melhor do que
    // reidratar um buraco que quebra o próximo save.
    player.teams = dto.teamHistoryIds
      .map((tid) => teamsById.get(tid))
      .filter((t): t is Team => t !== undefined);
    player.matches = dto.matchHistoryIds
      .map((mid) => matchesById.get(mid))
      .filter((m): m is Match => m !== undefined);
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
    // Mesmo racional do filtro em relinkPlayerHistories: id de partida
    // que não veio no payload (saves v3-) é histórico perdido.
    team.matches = dto.matchHistoryIds
      .map((mid) => matchesById.get(mid))
      .filter((m): m is Match => m !== undefined);
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
