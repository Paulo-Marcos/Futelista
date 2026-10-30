import "react-native-get-random-values";
import * as uuid from "uuid";
import { Goal } from "./Goal";
import { Match } from "./Match";
import { Player, PlayerSituation } from "./Player";
import { DataRules, Rules } from "./Rules";
import { Team, TeamSituation } from "./Team";
import { CreateTeamFactory } from "./TeamBuilder/CreateTeam.factory";
import { Timer, TimerStatus } from "./Timer";
import { FinalResultProcessor } from "./FinalResult/FinalResult.processor";
import { Observable } from "./Observable";

/**
 * GestorJogo — agregado raiz da pelada.
 *
 * Reatividade: implementa o contrato de "external store" do React
 * (subscribe + version snapshot) para uso com useSyncExternalStore.
 * Cada metodo publico que muda estado chama `notify()` no final.
 * O Timer recebe um callback de tick para que decrementos do cronometro
 * tambem disparem notificacao.
 *
 * Ciclo de vida (status):
 *  - CREATED:    pelada acabou de ser criada, ainda nao foi "iniciada".
 *  - ATIVA:      pelada em curso (jogadores chegando, partidas rodando).
 *  - FINALIZADA: pelada encerrada — arquivada como histórico.
 */
export class GestorJogo {
  id: string = uuid.v4();
  players: Player[] = [];
  next: Team[] = [];
  playing?: Match;
  matches: Match[] = [];
  advantageToNext?: Team = undefined;
  timer?: Timer;
  playersWithoutTeam: number = 0;
  name: string;
  rules: Rules;
  status: PeladaStatus;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  /**
   * Id da Pelada (tipo cadastrado) à qual essa execução pertence.
   * Pode ser undefined para execuções "avulsas" — peladas criadas antes
   * do conceito de tipo, ou criadas direto sem associar a um tipo.
   */
  peladaId?: string;
  private updateResult = new FinalResultProcessor();

  private store = new Observable();

  constructor(name: string, rules: Rules, opcionais?: DadosExecucao) {
    this.name = name;
    this.rules = rules;
    if (opcionais?.id) this.id = opcionais.id;
    this.status = opcionais?.status ?? PeladaStatus.CREATED;
    this.createdAt = opcionais?.createdAt ?? Date.now();
    this.startedAt = opcionais?.startedAt;
    this.endedAt = opcionais?.endedAt;
    this.peladaId = opcionais?.peladaId;
  }

  // ----- Reatividade ------------------------------------------------------

  /** Numero monotonico incrementado a cada notify(); usado como snapshot. */
  get version(): number {
    return this.store.version;
  }

  /** Registra um listener; retorna funcao de unsubscribe. */
  subscribe(listener: () => void): () => void {
    return this.store.subscribe(listener);
  }

  private notify(): void {
    this.store.notify();
  }

  // ----- Times e jogadores ------------------------------------------------

  getTeams(): Team[] {
    return this.next;
  }

  /**
   * Total de partidas encerradas — uma partida conta quando tem resultado
   * definido (`result !== undefined`). É a base do cálculo de % de presença
   * individual dos jogadores. Regra de negócio antes derivada na tela
   * (jogadores.tsx), trazida ao domínio para fonte única da verdade.
   */
  totalPartidasEncerradas(): number {
    return this.matches.filter((m) => m.result !== undefined).length;
  }

  /**
   * Substitui a lista de jogadores pela informada — comportamento
   * destrutivo. Para acrescentar mantendo os existentes use `adicionarJogadores`.
   *
   * Útil em boot (hidratar pelada a partir de nomes salvos) e em devSeed.
   */
  setPlayers(names: string[]): Player[] {
    this.players = [];
    this.playersWithoutTeam = 0;
    // Mesma política de `adicionarJogadores`: ignora nomes vazios e duplicados
    // (trim + case-insensitive). Sem isto, nomes repetidos vindos de uma
    // lista herdada criavam jogadores fantasma — que `criarTimes` depois
    // distribuía como se fossem pessoas distintas, duplicando jogadores
    // entre os times.
    names.forEach((name) => {
      const limpo = name.trim();
      if (limpo.length === 0) return;
      if (this.encontrarPorNome(limpo)) return;
      const newPlayer = new Player({ name: limpo });
      this.players.push(newPlayer);
      this.playersWithoutTeam++;
    });
    this.notify();
    return this.players;
  }

  adicionarJogador(name: string): Player {
    const limpo = name.trim();
    if (limpo.length === 0) throw Error("Nome do jogador não pode ser vazio.");
    if (this.encontrarPorNome(limpo))
      throw Error(`Já existe jogador chamado "${limpo}" na pelada.`);
    const newPlayer = new Player({ name: limpo });
    this.players.push(newPlayer);
    this.playersWithoutTeam++;
    this.notify();
    return newPlayer;
  }

  /**
   * Acrescenta vários jogadores de uma vez sem resetar a lista.
   * Nomes vazios são ignorados; duplicatas (entre os já existentes ou dentro
   * do próprio lote) também — sem lançar erro. Retorna apenas os criados.
   */
  adicionarJogadores(names: string[]): Player[] {
    const criados: Player[] = [];
    names.forEach((name) => {
      const limpo = name.trim();
      if (limpo.length === 0) return;
      if (this.encontrarPorNome(limpo)) return;
      const novo = new Player({ name: limpo });
      this.players.push(novo);
      this.playersWithoutTeam++;
      criados.push(novo);
    });
    if (criados.length > 0) this.notify();
    return criados;
  }

  /** Busca jogador pelo nome normalizado (trim + case-insensitive). */
  private encontrarPorNome(nome: string): Player | undefined {
    const alvo = nome.trim().toLowerCase();
    return this.players.find((p) => p.name.toLowerCase() === alvo);
  }

  criarTimes(): Team[] {
    if (this.next.length > 0) throw Error("Times já foram criados");
    const createTeam = CreateTeamFactory.fabricate(this.rules.choosingTeams);
    this.next = createTeam.create(this.players, this.rules.playersPerTeam);
    this.recomputePlayersWithoutTeam();
    this.notify();
    return this.next;
  }

  /**
   * Recalcula o contador a partir da fonte de verdade (player.currentTeam).
   * Usar sempre que uma operação puder ter mexido na composição dos times.
   */
  private recomputePlayersWithoutTeam(): void {
    this.playersWithoutTeam = this.players.filter((p) =>
      this.estaSemTime(p),
    ).length;
  }

  /**
   * Quem foi tirado do jogo (STOPPED) também fica sem `currentTeam`, mas
   * saiu por escolha — não entra na contagem "sem time" nem é realocado
   * automaticamente.
   */
  private estaSemTime(player: Player): boolean {
    return !player.currentTeam && player.situation !== PlayerSituation.STOPPED;
  }

  /**
   * Sanea invariantes de composição que saves antigos podem violar
   * (gerados por versões com bugs históricos de troca/remoção/realocação):
   *
   *  1. `next` não pode ter a mesma referência de time duas vezes.
   *  2. Um time que está em `playing` não pode estar também em `next`.
   *  3. Um jogador não pode aparecer no roster de mais de um time ativo
   *     (fila + partida), nem repetido dentro do mesmo time.
   *  4. `currentTeam` aponta para o time ativo que de fato o contém
   *     (ou `undefined` se ele não está em nenhum).
   *
   * Conflitos de posse são resolvidos a favor do time apontado por
   * `currentTeam`; na ausência dele, a favor do primeiro time que o lista.
   * Idempotente: rodar sobre um estado já íntegro é no-op.
   *
   * Notifica no fim (como todo mutador público) para que a UI re-renderize
   * e o autosave persista o estado saneado. Na reidratação isso roda antes
   * de qualquer listener existir, então é inofensivo.
   */
  repararIntegridadeDosTimes(): void {
    const idsTime = new Set<string>();
    this.next = this.next.filter((t) => {
      if (idsTime.has(t.id)) return false;
      idsTime.add(t.id);
      return true;
    });

    if (this.playing) {
      const idsEmJogo = new Set([this.playing.teamA.id, this.playing.teamB.id]);
      this.next = this.next.filter((t) => !idsEmJogo.has(t.id));
    }

    const ativos: Team[] = [...this.next];
    if (this.playing) ativos.push(this.playing.teamA, this.playing.teamB);

    // Time "canônico" de cada jogador: prioriza o apontado por currentTeam.
    const canonico = new Map<string, Team>();
    for (const team of ativos) {
      for (const player of team.players) {
        const atual = canonico.get(player.id);
        if (!atual || player.currentTeam === team) {
          canonico.set(player.id, team);
        }
      }
    }

    // Mantém cada jogador só no time canônico, sem repetição interna.
    for (const team of ativos) {
      const mantidos: Player[] = [];
      const vistos = new Set<string>();
      for (const player of team.players) {
        if (vistos.has(player.id)) continue;
        if (canonico.get(player.id) !== team) continue;
        vistos.add(player.id);
        mantidos.push(player);
      }
      team.players = mantidos;
      team.updateSizeTeam();
    }

    for (const player of this.players) {
      const dono = canonico.get(player.id);
      if (player.currentTeam !== dono) player.currentTeam = dono;
    }

    this.recomputePlayersWithoutTeam();
    this.notify();
  }

  setPlayingGame(): void {
    if (this.playing !== undefined)
      throw Error("Já existe uma partida acontecendo.");
    // Precisa de 2 times na fila. Sem o guard, o segundo `tirarDaFila()`
    // devolveria undefined e o construtor de Match estouraria em
    // `teamB.addMatch` — erro opaco em vez de mensagem de domínio.
    if (this.next.length < 2)
      throw Error(
        "É preciso ter ao menos 2 times na fila para iniciar uma partida.",
      );
    this.playing = new Match(this.tirarDaFila(), this.tirarDaFila());
    this.notify();
  }

  tirarDaFila(): Team {
    return this.next.shift()!;
  }

  getNthNext(nextNumber: number): Team {
    return this.next[nextNumber - 1];
  }

  /**
   * Último time da fila — `undefined` quando a fila está vazia (caso típico
   * durante uma partida, com os dois únicos times em campo). O tipo reflete
   * essa realidade pra obrigar quem chama a tratar a ausência.
   */
  getLastTeam(): Team | undefined {
    return this.next[this.next.length - 1];
  }

  adicionarAoNovoTime(player: Player): void {
    const newTeam = new Team({ limit: this.rules.playersPerTeam });
    newTeam.addPlayer(player);
    this.next.push(newTeam);
    this.notify();
  }

  adicionarAoUltimoTime(player: Player): void {
    const lastTeam = this.getLastTeam();
    // Fila vazia ou último time cheio → abre um novo time no fim da fila.
    // O guard de `!lastTeam` é o que permite alocar jogadores recém-chegados
    // com uma partida em andamento (quando os dois times estão em campo e
    // `next` ficou vazio): sem ele, `lastTeam.fullTeam` estourava com
    // TypeError. Nunca toca em `playing` — só cresce a fila.
    if (!lastTeam || lastTeam.fullTeam) {
      this.adicionarAoNovoTime(player);
    } else {
      lastTeam.addPlayer(player);
    }
    this.notify();
  }

  /**
   * Aloca todos os jogadores "sem time" na fila — completando o último time
   * incompleto e/ou criando novos. Funciona com a fila vazia E com partida
   * em andamento (forma os próximos times sem encostar nos que jogam).
   */
  realocarJogadoresSemTime(): void {
    if (this.playersWithoutTeam === 0) return;
    this.players.forEach((player) => {
      if (this.estaSemTime(player)) {
        this.adicionarAoUltimoTime(player);
      }
    });
    // Os realocados agora têm `currentTeam`; ressincroniza o contador com a
    // fonte de verdade pra o banner "sem time" sumir após a alocação.
    this.recomputePlayersWithoutTeam();
    this.notify();
  }

  /**
   * Aplica personalização (nome custom e/ou cor) a um time da pelada
   * (F-18). Passar `nome: ""` ou `cor: ""` no patch remove o custom
   * correspondente; campos ausentes ficam intocados. Notifica
   * listeners pra UI re-renderizar com o novo rótulo/cor.
   */
  editarTime(time: Team, patch: { nome?: string; cor?: string }): void {
    if (patch.nome !== undefined) time.renomear(patch.nome);
    if (patch.cor !== undefined) time.mudarCor(patch.cor);
    this.notify();
  }

  trocarJogadorPelaEsquerda(playerIn: Player, playerOut: Player): void {
    const teamToOut = playerIn.currentTeam;
    const teamToIn = playerOut.currentTeam;
    // Ambos precisam estar num time: o reserva (playerIn) no banco e o que
    // sai (playerOut) em campo. Sem o guard, um `currentTeam` indefinido
    // (jogador parado/removido) estouraria em `.removePlayer`/`.switchPlayer`.
    if (!teamToOut || !teamToIn)
      throw Error("Só dá pra trocar jogadores que estão em um time.");
    teamToOut.removePlayer(playerIn);
    // Usa Team.switchPlayer para que a substituição banco→campo fique
    // registrada em teamToIn.switches (estatística histórica). Esse caminho
    // já chama playerIn.addTeam(teamToIn), devolvendo playerIn ao estado
    // ACTIVE no novo time. Como switchPlayer não mexe na situação do
    // playerLeaves, marcamos playerOut como STOPPED manualmente — ele saiu
    // do jogo, não trocou de time.
    teamToIn.switchPlayer(playerIn, playerOut);
    playerOut.setSituation(PlayerSituation.STOPPED);
    playerOut.currentTeam = undefined;
    this.atualizarTimes(teamToOut);
    this.recomputePlayersWithoutTeam();
    this.notify();
  }

  redimensionarTimes(beginTeam?: Team): void {
    const begin = beginTeam ? this.next.indexOf(beginTeam) : 0;
    // `beginTeam` fora da fila (indexOf === -1) significa que o time já saiu
    // de `next` — não há o que redimensionar. Sem este guard, o loop leria
    // `this.next[-1].fullTeam` e estouraria.
    if (begin < 0) return;
    for (let i = begin; i <= this.next.length - 2; i++) {
      if (this.next[i].fullTeam) continue;
      this.realocarJogadores(this.next[i + 1], this.next[i]);
    }
    // O último time pode ter doado todos os jogadores; vazio, não é time.
    this.next = this.next.filter((team) => team.players.length > 0);
  }

  realocarJogadores(teamFrom: Team, teamTo: Team): void {
    while (!teamTo.fullTeam && teamFrom.players.length !== 0) {
      teamTo.addPlayer(teamFrom.removeNewestPlayer());
    }
  }

  redimensionarPartida(team: Team): void {
    // Reposição vem do primeiro time da fila. Se a fila está vazia (ou o
    // time da frente já está sem jogadores), não há reserva pra puxar — o
    // time em campo segue desfalcado. Tentar puxar "ninguém" colocaria um
    // undefined no roster e corromperia o agregado (quebra ao salvar).
    const proximoNaFila = this.next[0];
    if (!proximoNaFila || proximoNaFila.players.length === 0) return;
    const playerEnters = proximoNaFila.removeNewestPlayer();
    team.addPlayer(playerEnters);
    this.redimensionarTimes();
  }

  // remover jogador da pelada sem incluir outro no lugar
  atualizarTimes(beginTeam: Team): void {
    // A partida em andamento é a fonte de verdade de quem joga — não a
    // `situation` do time, que pode ficar defasada (ex.: reidratação).
    if (this.playing?.teams.has(beginTeam)) {
      this.redimensionarPartida(beginTeam);
    } else {
      this.redimensionarTimes(beginTeam);
    }
  }

  tirarDoJogo(removedPlayer: Player): void {
    const team = removedPlayer.currentTeam;
    if (!team) throw Error("Só dá pra tirar do jogo quem está em um time.");
    team.removePlayer(removedPlayer);
    removedPlayer.setSituation(PlayerSituation.STOPPED);
    // Sem zerar, o jogador seguia "apontando" para um time que não o tem
    // mais — e um segundo removePlayer nesse time levava outro jogador.
    removedPlayer.currentTeam = undefined;
    this.atualizarTimes(team);
    this.recomputePlayersWithoutTeam();
    this.notify();
  }

  // Trocar jogador entre Times
  trocarJogadorDoTime(player1: Player, player2: Player): void {
    const team1 = player1.currentTeam;
    const team2 = player2.currentTeam;
    // Ambos precisam estar em um time. Sem o guard, um `currentTeam`
    // indefinido estouraria em `team.switchPlayer`.
    if (!team1 || !team2)
      throw Error("Só dá pra trocar jogadores que estão em um time.");
    team1.switchPlayer(player2, player1);
    team2.switchPlayer(player1, player2);
    this.notify();
  }

  // ----- Gestão de jogadores e times --------------------------------------

  /**
   * Remove um jogador definitivamente da pelada. Se ele estiver em um time,
   * tira do time primeiro (usando o caminho já testado de tirarDoJogo).
   *
   * Bloqueia se o jogador está em time que está em partida em andamento —
   * mexer na composição de um time jogando deixaria o placar inconsistente.
   */
  removerJogador(player: Player): void {
    const index = this.players.indexOf(player);
    if (index === -1) throw Error("Jogador não está na pelada.");
    if (this.estaEmPartidaAtiva(player))
      throw Error(
        "Não é possível remover jogador que está em partida em andamento.",
      );
    if (player.currentTeam) this.tirarDoJogo(player);
    this.players.splice(index, 1);
    this.recomputePlayersWithoutTeam();
    this.notify();
  }

  private estaEmPartidaAtiva(player: Player): boolean {
    if (!this.playing || !player.currentTeam) return false;
    return this.playing.teams.has(player.currentTeam);
  }

  /**
   * Renomeia um jogador da pelada. Delega a validação de nome para Player.rename
   * e adiciona checagem de duplicata com outros jogadores.
   */
  renomearJogador(player: Player, novoNome: string): void {
    if (!this.players.includes(player))
      throw Error("Jogador não está na pelada.");
    const limpo = novoNome.trim();
    const outro = this.encontrarPorNome(limpo);
    if (outro && outro !== player)
      throw Error(`Já existe jogador chamado "${limpo}" na pelada.`);
    player.rename(novoNome);
    this.notify();
  }

  /**
   * Reordena a lista de jogadores (M-07). Só faz sentido em modos
   * baseados em ordem (`BY_ORDER` / `BY_ORDER_MIXING_TOP_TWO_TEAMS`),
   * mas o domínio aceita em qualquer modo — a UI é quem decide quando
   * oferecer a ação.
   *
   * Bloqueios:
   *  - times já formados (`next.length > 0`) → a ordem nova não teria
   *    efeito sem refazer times.
   *  - partida em andamento → composição congelada.
   *
   * Recebe a nova ordem como `string[]` de ids. O conjunto deve ser
   * idêntico ao atual (mesma cardinalidade, mesmos ids) — uma omissão
   * silenciosa seria um remove implícito.
   */
  reordenarJogadores(novaOrdem: string[]): void {
    if (this.playing)
      throw Error(
        "Não é possível reordenar jogadores com partida em andamento.",
      );
    if (this.next.length > 0)
      throw Error("Resete os times antes de reordenar jogadores.");
    if (novaOrdem.length !== this.players.length)
      throw Error(
        `Reordenação precisa conter exatamente ${this.players.length} jogadores.`,
      );
    const porId = new Map(this.players.map((p) => [p.id, p]));
    const nova: Player[] = [];
    for (const id of novaOrdem) {
      const p = porId.get(id);
      if (!p) throw Error(`Jogador "${id}" não está na pelada.`);
      if (nova.includes(p))
        throw Error(`Jogador "${p.name}" aparece duplicado na nova ordem.`);
      nova.push(p);
    }
    this.players = nova;
    this.notify();
  }

  /**
   * Move um time da fila para o fim (operação manual de reordenação).
   * Diferente de `realocarTime` — esse método não redistribui jogadores;
   * apenas reposiciona. Bloqueia se o time está em partida em andamento.
   */
  moverTimeParaFim(team: Team): void {
    // Checa partida ANTES de indexOf: um time em partida saiu de `next` ao
    // entrar em `playing`, então `indexOf` seria -1 e a mensagem ficaria errada.
    if (this.playing?.teams.has(team))
      throw Error(
        "Não é possível mover time que está em partida em andamento.",
      );
    const index = this.next.indexOf(team);
    if (index === -1) throw Error("Time não está na fila.");
    if (index === this.next.length - 1) return;
    this.next.splice(index, 1);
    this.next.push(team);
    this.notify();
  }

  /**
   * Esvazia o time: todos os jogadores voltam para a situação "sem time"
   * (currentTeam zerado, situação NO_TEAM) e o time é removido da fila.
   * Bloqueia se o time está em partida em andamento.
   */
  esvaziarTime(team: Team): void {
    // Mesma ordem que moverTimeParaFim: partida primeiro, fila depois.
    if (this.playing?.teams.has(team))
      throw Error(
        "Não é possível esvaziar time que está em partida em andamento.",
      );
    const index = this.next.indexOf(team);
    if (index === -1) throw Error("Time não está na fila.");
    [...team.players].forEach((player) => {
      team.removePlayer(player);
      player.currentTeam = undefined;
      player.setSituation(PlayerSituation.NO_TEAM);
      this.playersWithoutTeam++;
    });
    this.next.splice(index, 1);
    if (this.advantageToNext === team) this.advantageToNext = undefined;
    this.notify();
  }

  /**
   * Limpa a fila de times e o estado de vantagem, devolvendo todos os jogadores
   * para a situação "sem time". Permite re-sortear depois com criarTimes().
   *
   * Bloqueado quando há partida em andamento — mudar times no meio do jogo
   * deixaria refs inconsistentes em playing.
   */
  resetTimes(): void {
    if (this.playing)
      throw Error("Não é possível resetar times com partida em andamento.");
    this.next = [];
    this.advantageToNext = undefined;
    this.players.forEach((p) => {
      p.currentTeam = undefined;
      p.situation = PlayerSituation.NO_TEAM;
    });
    this.playersWithoutTeam = this.players.length;
    this.notify();
  }

  /**
   * Atualiza um subconjunto de campos das regras. Campos não informados
   * preservam o valor atual.
   *
   * Guards (independentes da validação de Rules):
   *  - playersPerTeam: não pode mudar com times já criados ou partida em andamento.
   *  - numberTimes: não pode mudar com cronômetro ativo (running/paused/interval).
   *  - choosingTeams: não pode mudar com times já formados (resetar antes).
   *
   * As validações de domínio de cada campo (faixa de valores etc) ficam no
   * próprio construtor de Rules.
   */
  atualizarRegras(parcial: DataRules): Rules {
    this.validarMudancaPlayersPerTeam(parcial.playersPerTeam);
    this.validarMudancaNumberTimes(parcial.numberTimes);
    this.validarMudancaChoosingTeams(parcial.choosingTeams);

    this.rules = this.rules.merge(parcial);
    this.notify();
    return this.rules;
  }

  private validarMudancaPlayersPerTeam(novo?: number): void {
    if (novo === undefined || novo === this.rules.playersPerTeam) return;
    if (this.playing || this.next.length > 0)
      throw Error(
        "Não é possível mudar jogadores por time com times montados ou partida em andamento.",
      );
  }

  private validarMudancaNumberTimes(novo?: number): void {
    if (novo === undefined || novo === this.rules.numberTimes) return;
    if (!this.timer) return;
    const status = this.timer.status;
    if (status !== TimerStatus.CREATED && status !== TimerStatus.ENDED)
      throw Error(
        "Não é possível mudar o número de tempos com cronômetro ativo.",
      );
  }

  private validarMudancaChoosingTeams(novo?: number): void {
    if (novo === undefined || novo === this.rules.choosingTeams) return;
    if (this.next.length > 0)
      throw Error(
        "Não é possível mudar o modo de sorteio com times já formados. Resete os times antes.",
      );
  }

  // ----- Partida atual ----------------------------------------------------

  start(): void {
    if (this.playing?.result !== undefined)
      throw Error(
        "A partida já foi encerrada. Defina a próxima partida antes de apitar.",
      );
    // O Timer só é trocado em `definirProximaPartida`; ENDED aqui é o fim
    // natural da partida atual, que se encerra — não ganha cronômetro novo.
    if (this.timer?.status === TimerStatus.ENDED)
      throw Error("O tempo da partida acabou. Encerre a partida.");
    if (!this.timer)
      this.timer = new Timer(
        this.rules.numberTimes,
        this.rules.getDurationMatch(),
        () => this.notify(),
      );
    this.timer.start();
    this.notify();
  }

  pause(): void {
    this.timer?.pause();
    this.notify();
  }

  continue(): void {
    this.timer?.continue();
    this.notify();
  }

  /**
   * Retorna `true` se o gol foi registrado — a UI só comemora nesse caso.
   */
  marcarGol(team: Team, playerGoal: Player): boolean {
    // Sem partida ou sem cronômetro iniciado não há instante (ScreenTime) pra
    // carimbar o gol — vira no-op. O `this.timer!` original estourava quando
    // havia partida aberta mas o tempo ainda não tinha sido iniciado. Partida
    // com resultado também recusa: o gol deixaria o `result` desatualizado.
    if (!this.playing || !this.timer) return false;
    if (this.playing.result !== undefined) return false;
    this.playing.addGoal(team, playerGoal, this.timer.getTime());
    this.encerrarSeAtingiuLimite();
    this.notify();
    return true;
  }

  /**
   * Encerramento automático por gol-limite (F-12).
   *
   * Só age quando o cronômetro está STARTED — se a partida já encerrou
   * (ENDED) ou está pausada/em intervalo, não interfere. Quando dispara,
   * marca o Timer como ENDED (sem reagendar próximo tempo: o limite
   * encerra a partida inteira, não só o tempo atual) e chama
   * `setResult` para decidir vencedor/empate.
   */
  private encerrarSeAtingiuLimite(): void {
    const partida = this.playing;
    if (!partida || !this.timer) return;
    if (this.timer.status !== TimerStatus.STARTED) return;
    const placar = partida.countGoals();
    if (
      placar.teamA >= this.rules.goalLimit ||
      placar.teamB >= this.rules.goalLimit
    ) {
      this.timer.encerrar();
      partida.setResult();
    }
  }

  /**
   * Desfaz o gol mais recente da partida em andamento (UNDO_GOAL do
   * protótipo). Atualiza estatísticas do time e do jogador autor.
   *
   * Retorna `true` se algo foi desfeito; `false` se não havia gols ou
   * partida em curso.
   */
  desfazerUltimoGol(): boolean {
    const partida = this.playing;
    if (!partida || partida.goals.length === 0) return false;
    const lastGoal = partida.goals.pop()!;
    this.limparEstatisticasDoGol(lastGoal);
    this.notify();
    return true;
  }

  /**
   * Remove um gol arbitrário da partida em andamento — versão do
   * `desfazerUltimoGol` que aceita corrigir um gol antigo sem precisar
   * desfazer tudo dali em diante.
   *
   * Retorna `true` se o gol foi encontrado e removido; `false` se a
   * partida não está em curso ou o gol não pertence a ela.
   */
  removerGol(goal: Goal): boolean {
    const partida = this.playing;
    if (!partida) return false;
    const idx = partida.goals.indexOf(goal);
    if (idx < 0) return false;
    partida.goals.splice(idx, 1);
    this.limparEstatisticasDoGol(goal);
    this.notify();
    return true;
  }

  /**
   * Substitui o autor de um gol já registrado. Mantém o `team`, o `time`
   * (instante) e a posição na cronologia — só troca quem foi creditado.
   *
   * Decide ownGoal pelo time atual do novo autor: se ele **não** está no
   * time do gol, vira gol-contra. Caso comum: jogador da defesa fez
   * gol-contra, foi marcado pelo atacante adversário por engano —
   * corrigir para o defensor leva o `ownGoal` para `true`.
   *
   * No-op se o novo autor é o mesmo do gol. `false` quando não há
   * partida ou o gol não pertence a ela.
   */
  corrigirAutorDoGol(goal: Goal, novoAutor: Player): boolean {
    const partida = this.playing;
    if (!partida) return false;
    if (goal.player.id === novoAutor.id) return false;
    const idx = partida.goals.indexOf(goal);
    if (idx < 0) return false;
    // Limpa estatísticas do autor antigo antes de reescrever.
    this.limparEstatisticasDoGol(goal);
    const novoOwnGoal = !goal.team.hasPlayer(novoAutor);
    const novoGol = new Goal(
      goal.match,
      novoAutor,
      goal.team,
      goal.time,
      novoOwnGoal,
    );
    partida.goals[idx] = novoGol;
    goal.team.goals.push(novoGol);
    if (!novoOwnGoal) novoAutor.goals.push(novoGol);
    this.notify();
    return true;
  }

  /**
   * Remove o gol das listas de team e player. Mantém a partida intocada
   * — quem chama é responsável por tirar o gol de `partida.goals`.
   * Compartilhado por desfazerUltimoGol, removerGol e corrigirAutorDoGol.
   */
  private limparEstatisticasDoGol(goal: Goal): void {
    const teamIdx = goal.team.goals.indexOf(goal);
    if (teamIdx >= 0) goal.team.goals.splice(teamIdx, 1);
    if (!goal.ownGoal) {
      const playerIdx = goal.player.goals.indexOf(goal);
      if (playerIdx >= 0) goal.player.goals.splice(playerIdx, 1);
    }
  }

  setResult(): void {
    this.playing?.setResult();
    // Encerramento manual ("Encerrar"): para o cronômetro de vez (limpa o
    // setInterval e marca ENDED). Sem isto ele seguia decrementando em
    // segundo plano na tela de resultado e era reaproveitado pela metade
    // na próxima partida.
    this.timer?.encerrar();
    this.notify();
  }

  /**
   * Reabre a partida recém-encerrada para análise (botão "Voltar à partida"
   * da tela de resultado). Limpa o resultado/vencedor — sem isso a UI pularia
   * de volta pro resultado — e deixa o cronômetro PAUSADO, pra o usuário
   * revisar o jogo e então continuar ou encerrar de novo. Após o fim natural
   * (tempo zerado) o cronômetro segue ENDED: só resta encerrar de novo.
   *
   * No-op quando não há partida ou ela ainda não tinha resultado definido.
   */
  reabrirPartida(): void {
    const partida = this.playing;
    if (!partida || partida.result === undefined) return;
    partida.result = undefined;
    partida.winner = undefined;
    partida.loser = undefined;
    this.timer?.reabrir();
    this.notify();
  }

  // Atualiza os novos times, considerando o resultado do jogo.
  definirProximaPartida(teamWithExternalAdvantage?: Team): void {
    // Sem resultado a partida segue em campo: nada a girar, e descartar o
    // cronômetro aqui zeraria o tempo da partida ainda em andamento.
    if (this.playing?.result === undefined) return;
    this.arquivarPartidaEncerrada();
    this.updateResult.process({
      jogo: this,
      externalAdvantage: teamWithExternalAdvantage,
    });
    // Cada partida tem o seu cronômetro. Ao trocar de jogo, descarta o
    // anterior para que a próxima comece com o tempo cheio — sem isto o
    // `start()` reaproveitava o Timer com o `restTime` que sobrou.
    this.descartarTimer();
    this.notify();
  }

  /**
   * Encerra e descarta o cronômetro da partida arquivada. A próxima
   * partida cria um Timer novo (tempo cheio) no `start()`.
   */
  private descartarTimer(): void {
    this.timer?.encerrar();
    this.timer = undefined;
  }

  /**
   * Move a partida encerrada (com resultado definido) para o histórico
   * ANTES de a chain de FinalResult substituir `playing` pela próxima.
   * Sem este passo, `matches` nunca era populado em runtime e tudo que
   * lê o histórico (Últimos jogos, tela de Histórico, RelatorioExecucao)
   * ficava permanentemente vazio.
   */
  private arquivarPartidaEncerrada(): void {
    const partida = this.playing;
    if (!partida || partida.result === undefined) return;
    if (this.matches.some((m) => m.id === partida.id)) return;
    this.matches.push(partida);
  }

  realocarTime(team: Team): void {
    team.setSituation(TeamSituation.ON_NEXT);
    const lastTeam = this.next.pop();
    // Fila vazia (caso comum com só 2 times): não há time no fim pra absorver
    // jogadores incompletos — apenas recoloca `team`. Antes, `realocarJogadores`
    // recebia `lastTeam` undefined e estourava em `teamTo.fullTeam`.
    if (lastTeam && !lastTeam.fullTeam) this.realocarJogadores(team, lastTeam);
    if (lastTeam) this.next.push(lastTeam);
    this.next.push(team);
  }

  // Pegar o outro time que esta jogando
  getOtherPlayingTeam(team: Team): Team {
    return this.playing!.getOtherTeam(team);
  }

  // ----- Ciclo de vida da pelada -----------------------------------------

  /**
   * Marca a pelada como iniciada — registra `startedAt` e troca o status
   * para ATIVA. Só vale uma vez (a partir de CREATED).
   */
  iniciar(): void {
    if (this.status !== PeladaStatus.CREATED)
      throw Error("Pelada já foi iniciada.");
    this.status = PeladaStatus.ATIVA;
    this.startedAt = Date.now();
    this.notify();
  }

  /**
   * Encerra a pelada — registra `endedAt`, transição para FINALIZADA.
   * Bloqueia se houver partida em andamento (encerre a partida antes).
   */
  finalizar(): void {
    if (this.status === PeladaStatus.FINALIZADA)
      throw Error("Pelada já foi finalizada.");
    if (this.playing)
      throw Error(
        "Não é possível finalizar a pelada com partida em andamento.",
      );
    this.status = PeladaStatus.FINALIZADA;
    this.endedAt = Date.now();
    this.notify();
  }

  /**
   * Remove todos os jogadores e times da pelada atual, preservando regras,
   * nome, status e histórico de partidas. Útil quando o usuário quer começar
   * a montagem do zero sem trocar de pelada.
   *
   * Bloqueia se houver partida em andamento ou cronômetro ativo — limpar
   * nesse estado deixaria refs penduradas em playing/matches.
   */
  limparJogadoresETimes(): void {
    if (this.playing)
      throw Error(
        "Não é possível limpar jogadores e times com partida em andamento.",
      );
    const timerAtivo =
      this.timer &&
      this.timer.status !== TimerStatus.CREATED &&
      this.timer.status !== TimerStatus.ENDED;
    if (timerAtivo)
      throw Error(
        "Não é possível limpar jogadores e times com cronômetro ativo.",
      );
    this.players = [];
    this.next = [];
    this.advantageToNext = undefined;
    this.playersWithoutTeam = 0;
    this.notify();
  }
}

export enum PeladaStatus {
  CREATED = "CREATED",
  ATIVA = "ATIVA",
  FINALIZADA = "FINALIZADA",
}

export type DadosExecucao = {
  id?: string;
  status?: PeladaStatus;
  createdAt?: number;
  startedAt?: number;
  endedAt?: number;
  peladaId?: string;
};
