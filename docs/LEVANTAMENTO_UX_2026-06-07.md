# Levantamento de UX / Design — FuteLista

Data: 2026-06-07 · Estado: rascunho para discussão antes de virar tarefas/commits.

Este documento tem três partes:

1. **O que já existe** no layout/design hoje.
2. **Funcionalidades** que ainda faltam ou parecem incompletas.
3. **Melhorias de layout, disposição e usabilidade**.

Cada item da seção 2 e 3 vem pré-empacotado como uma **TAREFA** com `id`, escopo de arquivos, descrição curta e proposta de mensagem de commit. Assim, quando você quiser pedir "commita a tarefa T-12", o escopo já está fechado.

---

## 1. O que já existe no design

### 1.1 Design tokens (`src/shared/theme/Colors.ts`)

- Paleta **Premium sério / Rubro-negro** com tokens M3 estendidos: `primary`, `primaryDim`, `surface`, `surfaceContainerLow/High`, `goal`, `glow`, `tertiary`, `outline`, `error`, etc.
- Suporte **light/dark** completo, com tokens de campo (`fieldA`, `fieldB`, `fieldLine`) tunados para cada modo.
- Escalas: `Spacing` (4/8/12/16/24/32), `Radius` (sm/md/lg/xl/pill), `Typography` (display/headline/title/body/label/number com `tabular-nums`), `Elevation` (card/pop).
- `AvatarPalette` determinística (8 cores) para colorir jogadores por id.

### 1.2 Biblioteca de componentes (`src/shared/ui/`)

Já implementados: `ButtonIcon`, `Card`, `Collapsible`, `EmptyState`, `Fab`, `Field`, `LivePulseDot`, `MatchHistoryCard`, `MatchTimeline`, `MiniStepper`, `ParallaxScrollView`, `PeladaHeader`, `PitchLines`, `PlayerAvatar`, `PlayerRow`, `PrimaryButton`, `RuleCard`, `RuleChip`, `ScoreBoard`, `SecondaryButton`, `SegmentedControl`, `Splash`, `Stepper`, `TabHeader`, `TeamCard`, `TeamCrest`, `TeamMini`, `TeamQueue`, `ThemedText`, `ThemedView`, `TimerDisplay`, `Wordmark`, `confirmAcao`.

Destaques:

- **Glow vermelho cross-platform** com receita específica: iOS via `shadowColor`, Android via `View` halo, Web via `boxShadow` CSS. Aplicado em CTA principal, AvulsaCard, AddButton.
- **TeamCrest** determinístico por seed (id do time/pelada).
- **PlayerAvatar** colorido por id.
- **LivePulseDot** com animação de pulso (usado no scoreboard e no badge da aba Partida).
- **Splash JS** customizado que entra após a splash nativa.
- `confirmAcao` / `escolherOpcao` como APIs cross-platform para diálogos.

### 1.3 Telas implementadas (`app/`)

| Rota | Arquivo | Linhas | O que tem |
|---|---|---|---|
| `/` (sem execução) | `(pelada)/index.tsx` (GestaoHome) | parte | "Minhas peladas" — header com Wordmark + botão dev, CTA "Pelada avulsa" com glow, CTA tracejado "Criar nova pelada", lista de peladas cadastradas com `PeladaTipoCard`, badge "RECENTE", contador no footer. |
| `/` (com execução) | `(pelada)/index.tsx` (ExecucaoHome) | 2.176 | Header persistente (back + nome/local + cog), Hero dual (PRÓXIMA PARTIDA com matchup + CTA, ou PELADA ATIVA com placar AO VIVO), 3 StatCards, strip "Próximos a entrar", "Últimos jogos" (3) + link ver tudo. |
| `/jogadores` | `(pelada)/jogadores.tsx` | 916 | TabHeader, input de adicionar, botão de lote, busca (a partir de 5), banner de erro warning, lista com edição inline, swipe pra remover, edge cases. |
| `/times` | `(pelada)/times.tsx` | 883 | Headline + sortear (dice), "Próxima partida" com TeamMini, fila numerada, banner de jogadores sem time, banner de seleção (modo trocar), CTA "Iniciar partida" / "Voltar à partida", actions por time (mover fim/esvaziar). |
| `/partida` | `(pelada)/partida.tsx` | 2.128 | Scoreboard broadcast, campo SVG com formação 1-2-2, BenchRail nas laterais, CenterDisc (START → cronômetro), PlayerDot tap-to-score, modal de scorer, sheet de substituições, toast de troca, celebração animada, MatchTimeline com undo. |
| `/historico` | `(pelada)/historico.tsx` | 115 | Lista reversa de partidas com `MatchHistoryCard`. |
| `/regras` | `regras.tsx` | 367 | FormSheet com escudo da pelada, sections Partida/Times, RuleCard + Stepper, SegmentedControl pro modo de sorteio, locks por estado (durante partida não muda playersPerTeam etc.). |
| `/pelada-nova` | `pelada-nova.tsx` | 532 | FormSheet com Identificação, Dia (chips Seg–Dom), Horário, regras rápidas (MiniStepper), Nota, Modo de sorteio, Observações, Preview, CTA glow. |
| `/peladas/[id]` | `peladas/[id].tsx` | ~370 | Detalhe de pelada-tipo: card de regras default, CTA "Iniciar nova execução", lista de execuções com status pills. |
| `/resultado` | `resultado.tsx` | 502 | Trophy, eyebrow FIM DE JOGO/EMPATE, placar tabular 60px, scorers agregados, winner pill / empate-pick, CTAs próxima/encerrar. |
| `/salvar-como-pelada` | `salvar-como-pelada.tsx` | 204 | FormSheet — converte avulsa em Pelada cadastrada. |
| `/dev` | `dev.tsx` | 204 | Painel dev (cenários seed + limpar storage). |
| `/splash-preview` | `splash-preview.tsx` | 23 | Preview da splash. |

### 1.4 Padrões aplicados consistentemente

- **Header persistente** dentro de "execução ativa" (back + título + cog/dev).
- **FormSheet** para fluxos "fora da pelada" (regras, nova pelada, salvar como, dev, resultado).
- **Banner de erro** em laranja `warning` (não vermelho `error`) — para distinguir aviso recuperável de ação destrutiva.
- **EmptyState** consistente em todas as listas (icone + título + descrição + ação opcional).
- **CTA principal** com glow vermelho em três receitas por plataforma.
- **Status pills** (RECENTE, AVULSA, AO VIVO, PAUSADO, INTERVALO, FIM).

---

## 2. Funcionalidades faltando ou incompletas

> Backlog **funcional**. Cada item descreve o que falta e onde encostar. Inclui mensagem de commit sugerida no fim.

### F-01 — Notas/observações da pelada não persistem

- **Onde:** `app/pelada-nova.tsx` linha ~58. O campo `obs` existe na UI mas é declarado como "decorativo (UI sem persistência hoje)".
- **O que fazer:** estender `Pelada` (e seu serializer) para guardar `observacoes?: string`; renderizar no `/peladas/[id]` como card recolhível.
- **Commit:** `feat(pelada): persistir observações da pelada e exibir no detalhe`

### F-02 — Editar pelada cadastrada

- **Onde:** `app/peladas/[id].tsx` só mostra regras default, não permite editar nome/local/dia/hora/regras-default da pelada-tipo.
- **O que fazer:** botão "Editar" no header da tela `[id]`; reaproveitar boa parte do form de `pelada-nova` num modo edição (`/pelada-editar/[id]`).
- **Commit:** `feat(pelada): permitir editar pelada cadastrada (nome, agenda, regras default)`

### F-03 — Excluir/arquivar pelada cadastrada

- **Onde:** `app/peladas/[id].tsx`.
- **O que fazer:** menu de ações (kebab no header) → "Arquivar" e "Excluir definitivamente" com `confirmAcao` destrutivo.
- **Commit:** `feat(pelada): arquivar e excluir pelada cadastrada`

### F-04 — Estatísticas de jogador (artilharia, presença, vitórias)

- **Onde:** não existe. O domínio já tem `Player.goals`, `matches`, `teams` — dá pra agregar fora.
- **O que fazer:** nova tela `/jogadores/[id]` ou bottom sheet ao tocar no `PlayerRow`: total de gols na execução, partidas jogadas, vitórias/empates/derrotas, % presença na fila.
- **Commit:** `feat(jogadores): bottom sheet com estatísticas individuais`

### F-05 — Histórico cross-execução (na pelada-tipo)

- **Onde:** `app/peladas/[id].tsx` lista execuções mas não consolida placar por jogador entre elas.
- **O que fazer:** card "Artilheiros da pelada" e "Maior sequência de vitórias" como agregado.
- **Commit:** `feat(pelada): consolidar artilharia e sequências entre execuções`

### F-06 — Exportar/compartilhar resumo da execução

- **Onde:** após `/resultado` ou ao finalizar uma execução.
- **O que fazer:** botão "Compartilhar" usa `expo-sharing` para exportar texto plano (placares, artilheiros, escalações) ou imagem renderizada com `react-native-view-shot`.
- **Commit:** `feat(historico): compartilhar resumo da execução como texto/imagem`

### F-07 — Cronômetro com som/vibração no fim do tempo

- **Onde:** `app/(pelada)/partida.tsx` — quando `restTime` chega a 0, hoje só muda `TimerStatus.ENDED`.
- **O que fazer:** `expo-haptics` no apito, `expo-av` para som curto. Preferência on/off em regras.
- **Commit:** `feat(partida): apito sonoro e háptico ao fim do tempo`

### F-08 — Lembrete: faltam X minutos / próximo tempo

- **Onde:** mesma tela. Aviso aos 2min e 30s do fim seria útil.
- **O que fazer:** subscriber no Timer dispara um toast/haptic leve nesses checkpoints.
- **Commit:** `feat(partida): toast e háptico em checkpoints do cronômetro`

### F-09 — Substituições programadas / rodízio automático

- **Onde:** `BenchRail` em `partida.tsx`. Hoje só permite substituição manual (1 entra/1 sai).
- **O que fazer:** modo "rodízio" onde a cada X minutos sugere troca; ou permitir trocar **vários** de uma vez. Cuidar de coordenar com o domínio (`Switch`).
- **Commit:** `feat(partida): rodízio programado e troca múltipla no banco`

### F-10 — Goleiro fixo / posições por jogador

- **Onde:** atualmente todos jogadores são equivalentes; formação 1-2-2 é estética.
- **O que fazer:** opcional, marcar 1 jogador como goleiro por time (badge no `PlayerDot`); persistir na entidade.
- **Commit:** `feat(jogadores): marcar goleiro do time com badge no campo`

### F-11 — Reabrir/editar último gol além de undo

- **Onde:** `MatchTimeline` em `partida.tsx` já tem undo do último.
- **O que fazer:** long-press em qualquer gol da timeline → bottom sheet "Corrigir autor" ou "Remover".
- **Commit:** `feat(partida): editar autor ou remover gol arbitrário pela timeline`

### F-12 — Modo "fim por gol-limite" vs "fim por tempo"

- **Onde:** `Rules` já tem `goalLimit` e `timeMatch`. A UI da partida não comunica claramente qual está vigente.
- **O que fazer:** badge no scoreboard ("até 2 gols", "10 min"), encerrar automaticamente quando atingir o limite.
- **Commit:** `feat(partida): encerrar automaticamente ao atingir o gol-limite e badge no scoreboard`

### F-13 — Empate manual: escolher quem fica via swipe/tap

- **Onde:** `resultado.tsx` já mostra cenário `draw_manual` mas a UX de escolha pode ficar mais óbvia.
- **O que fazer:** apresentar dois cards grandes (Time 1 / Time 2) com tap-to-select e PrimaryCTA ativando ao escolher.
- **Commit:** `refactor(resultado): cards grandes para escolha do empate manual`

### F-14 — Persistência: backup / exportar JSON

- **Onde:** `AsyncStoragePeladaRepository`. Não há export do estado.
- **O que fazer:** em `/dev` ou em "Configurações" (a criar): botão "Exportar todas as peladas" via `expo-file-system` + `expo-sharing`.
- **Commit:** `feat(infra): exportar e importar backup JSON das peladas`

### F-15 — Configurações globais (tema, som, hápticos, idioma)

- **Onde:** não existe. Hoje só há `/regras` por pelada e `/dev`.
- **O que fazer:** rota `/configuracoes` (formSheet) acessível pelo Wordmark/header da Gestão: dark mode manual (override do sistema), som on/off, hápticos on/off, sobre/versão.
- **Commit:** `feat(config): tela de configurações globais (tema, som, hápticos, sobre)`

### F-16 — Onboarding / primeira execução

- **Onde:** primeira abertura cai direto na "Minhas peladas" vazia.
- **O que fazer:** 3 slides curtos (Pelada → Jogadores → Partida) ou um EmptyState mais convidativo com vídeo/gif do fluxo.
- **Commit:** `feat(onboarding): tour de 3 slides na primeira abertura`

### F-17 — Salvar resultado parcial / continuar depois

- **Onde:** se o app for fechado no meio de uma partida, o domínio precisa sobreviver. Verificar serializer.
- **O que fazer:** garantir que `Match` em andamento (timer + gols) é serializado. Adicionar teste de regressão.
- **Commit:** `fix(infra): serializar partida em andamento (timer + gols) para sobreviver a reload`

### F-18 — Renomear time / customizar cor

- **Onde:** hoje time é "Time 1" e "Time 2" fixos. `TeamCrest` é determinístico por id.
- **O que fazer:** tap longo no `TeamMini` → bottom sheet com nome custom + 6 cores. Persistir em `Team`.
- **Commit:** `feat(times): renomear time e escolher cor pelo TeamMini`

### F-19 — Foto/inicial do jogador

- **Onde:** `PlayerAvatar` hoje só renderiza cor + iniciais.
- **O que fazer:** opcionalmente anexar foto via `expo-image-picker`; cache local com `expo-file-system`.
- **Commit:** `feat(jogadores): foto opcional do jogador`

### F-20 — Compartilhar convite da pelada (deep link)

- **Onde:** pelada-tipo. Hoje é local-only.
- **O que fazer:** primeiro passo: gerar texto "Sex 21h · Quadra X" via `Share`. Deep link real fica para a fase com backend.
- **Commit:** `feat(pelada): compartilhar agenda da pelada como texto`

### F-21 — Acessibilidade: revisão completa

- **Onde:** muitos `accessibilityLabel` existem, mas falta varredura sistemática (contraste, tamanho de toque, leitura de placar pelo TalkBack).
- **O que fazer:** auditoria com a skill `design:accessibility-review`, gerar checklist.
- **Commit:** `chore(a11y): revisão WCAG AA — contraste, alvos de toque, labels`

---

## 3. Melhorias de layout, disposição e usabilidade

### M-01 — Tab "Partida" só aparece quando faz sentido

- **Estado hoje:** `app/(pelada)/_layout.tsx` esconde Jogadores/Times/Partida via `href: null` quando não tem gestor.
- **Problema:** quando tem gestor mas ainda não tem 2 times, a aba "Partida" aparece "morta" — toca e cai num EmptyState.
- **Sugestão:** esconder "Partida" enquanto `next.length < 2 && !playing`. Promover ela visualmente (dot vermelho permanente, label "Partida ao vivo") quando `playing`.
- **Commit:** `refactor(nav): ocultar aba Partida sem matchup pronto e destacar quando ao vivo`

### M-02 — StatCards da Home: ação dupla

- **Estado hoje:** 3 StatCards (jogadores / times / na fila) levam todos para `/jogadores` ou `/times`.
- **Problema:** o card "na fila" leva pra `/times` mas é menos óbvio que ele rola a lista até a fila.
- **Sugestão:** `/times?scrollTo=fila` (anchor) ou abrir já com a section "Fila" em foco.
- **Commit:** `refactor(home): StatCard "na fila" rola para a section Fila em /times`

### M-03 — Hero da execução: separar "Próxima partida" de "Pelada ativa"

- **Estado hoje:** mesmo container muda label dependendo do estado.
- **Problema:** quando muda de "PELADA ATIVA" → "AO VIVO", o hero cresce e empurra o resto da tela. Causa jump.
- **Sugestão:** altura mínima fixa (ex.: 220) no hero independente do conteúdo; reservar slot do CTA mesmo quando ausente.
- **Commit:** `refactor(home): altura mínima estável do Hero para evitar layout-jump`

### M-04 — Bottom Sheet com gestos consistentes

- **Estado hoje:** alguns sheets são `Modal` da RN, outros usam Stack `presentation: "formSheet"`.
- **Problema:** comportamento de swipe-to-dismiss varia.
- **Sugestão:** padronizar com `@gorhom/bottom-sheet` (ou um wrapper interno) para `scorerSide`, `subOpen`, `loteAberto`, `escolherOpcao`.
- **Commit:** `refactor(ui): padronizar bottom sheets com @gorhom/bottom-sheet`

### M-05 — Partida: zoom/scroll para times grandes (>5)

- **Estado hoje:** formação fixa em 5 posições.
- **Problema:** com `playersPerTeam > 5` há `FORMATION[FORMATION.length - 1]` sobreposto.
- **Sugestão:** formação adaptativa (gerar grid baseado em `playersPerTeam`); ou scroll horizontal no campo.
- **Commit:** `refactor(partida): formação adaptativa para times com mais de 5 jogadores`

### M-06 — Substituição: animação de entrada/saída

- **Estado hoje:** `subToast` aparece como caixa fixa após troca.
- **Sugestão:** animar o dot saindo do campo para o bench e o entrando subindo (`Reanimated.SharedTransition`).
- **Commit:** `feat(partida): animação shared-transition entre campo e banco`

### M-07 — `/jogadores`: arrastar para reordenar

- **Estado hoje:** ordem é a de inscrição; afeta `BY_ORDER`.
- **Sugestão:** habilitar drag-handle (`react-native-draggable-flatlist`) só quando `choosingTeams === BY_ORDER`.
- **Commit:** `feat(jogadores): reordenar manualmente quando modo de sorteio é "Ordem"`

### M-08 — `/times`: "Trocar jogadores" sai do modo seleção mais rápido

- **Estado hoje:** entrar no modo seleção exige tocar num jogador; sair exige tocar no banner ou no mesmo jogador.
- **Sugestão:** botão flutuante "Cancelar" persistente quando `jogadorSelecionado != null`; back físico também cancela.
- **Commit:** `refactor(times): botão Cancelar persistente no modo trocar jogadores`

### M-09 — Header da execução: nome muito longo trunca cog

- **Estado hoje:** `pheadName` tem `numberOfLines={1}` mas a row inteira pode estourar com 3 ícones + tag AVULSA.
- **Sugestão:** marquee ou `ellipsizeMode="middle"` com `flex: 1`.
- **Commit:** `fix(home): truncar nome da pelada sem espremer os botões do header`

### M-10 — `Wordmark` clicável na Gestão

- **Estado hoje:** Wordmark é decorativo.
- **Sugestão:** virar entry point pra `/configuracoes` (F-15). Ou um menu "Sobre / Configurações / Dev (DEV)".
- **Commit:** `feat(home): menu de Configurações ao tocar no Wordmark`

### M-11 — Banner de erro: posição flutuante (toast)

- **Estado hoje:** banner empurra o conteúdo.
- **Sugestão:** `position: absolute` no rodapé com fade-in/out, auto-dismiss já existe (5s).
- **Commit:** `refactor(ui): erro como toast flutuante em vez de banner inline`

### M-12 — Confirmação destrutiva: peso visual do botão

- **Estado hoje:** `confirmAcao` cross-platform usa `Alert.alert` (iOS/Android nativo) ou um modal web.
- **Sugestão:** no web, o modal precisa de botão destrutivo em vermelho e cancelar como secundário (verificar `confirmAcao.ts`).
- **Commit:** `fix(ui): confirmAcao no web — botão destrutivo em vermelho`

### M-13 — `Times`: status de cada time mais legível

- **Estado hoje:** `TeamMini` mostra jogadores em pílulas.
- **Sugestão:** badge "VANTAGEM" quando o time é `advantageToNext` (já existe `advantageId` no scope mas não vejo o uso visual confirmado nas linhas lidas). Verificar e destacar.
- **Commit:** `feat(times): badge VANTAGEM no TeamMini para o time com advantage`

### M-14 — Partida: timeline rolável

- **Estado hoje:** `MatchTimeline` em `partida.tsx`.
- **Sugestão:** com muitos gols, garantir scroll horizontal com snap; mostrar minuto do gol.
- **Commit:** `refactor(partida): MatchTimeline horizontal com scroll snap e minuto do gol`

### M-15 — Padronizar tipografia "número grande" com `tabular-nums`

- **Estado hoje:** placar usa tabular em alguns lugares, em outros usa fonte default. `Typography.number` já existe.
- **Sugestão:** auditar usos de score/cronômetro e aplicar `Typography.number` consistentemente.
- **Commit:** `style(ui): aplicar Typography.number (tabular-nums) em todo placar e cronômetro`

### M-16 — Empty states com ilustração SVG

- **Estado hoje:** `EmptyState` usa só `MaterialCommunityIcons`.
- **Sugestão:** ilustração SVG simples (campo + bola + sombra) para o empty da gestão e do histórico — eleva o "premium sério".
- **Commit:** `feat(ui): ilustrações SVG nos EmptyState principais`

### M-17 — Dark mode override manual

- **Estado hoje:** `useColorScheme` segue o sistema.
- **Sugestão:** preference em `/configuracoes` (F-15) com `Auto / Claro / Escuro`, persistida.
- **Commit:** `feat(config): override manual claro/escuro/auto`

### M-18 — Splash mais curta / configurável

- **Estado hoje:** Splash JS roda além da nativa.
- **Sugestão:** medir tempo total; se passar de ~900ms, considerar pular a JS quando vier de hot reload (`__DEV__ && !firstBoot`).
- **Commit:** `perf(splash): pular splash JS após primeiro boot em DEV`

### M-19 — Feedback de "salvando…"

- **Estado hoje:** `saving` renderiza row com spinner pequeno no rodapé do Hero da execução.
- **Sugestão:** "snackbar" curto no topo seguro (`insets.top`) — mais visível.
- **Commit:** `refactor(home): mover indicador "salvando" para snackbar no topo`

### M-20 — Menu de "Gerenciar" voltar/finalizar/limpar/salvar-como

- **Estado hoje:** o bloco "Gerenciar" foi removido do Hero (comentário no `index.tsx` linha 888) para alinhar com o handoff. Os handlers seguem vivos esperando um menu novo.
- **Sugestão:** plugar no cog do header → `escolherOpcao` com Voltar para gestão / Salvar como pelada / Limpar jogadores e times / Finalizar execução (destrutivo). Já está 80% pronto.
- **Commit:** `feat(home): menu de gerenciamento no cog do header (voltar, salvar-como, limpar, finalizar)`

---

## 4. Como usar este documento para commits

Cada item desta lista tem:

- `id` (F-NN ou M-NN) → estável.
- `Onde` → arquivos prováveis.
- `Commit` → mensagem sugerida em Conventional Commits.

**Fluxo proposto:**

1. Você revisa e marca quais quer fazer (ex.: "vamos pelo F-01, F-15, M-03, M-20").
2. Pede: "commita o F-01" → eu abro `pelada-nova.tsx`, sigo o escopo descrito, rodo `npm test`, abro um commit com a mensagem sugerida.
3. Quando algum item depender de mudança no domínio (`F-17`, `F-18`, `F-10`), verifico antes se o arquivo está travado em `features/registry.yaml` e peço o `[unlock:<id>]` na hora.

**Prioridade sugerida** (alto valor com baixo risco primeiro):

1. **M-20** — religar o menu de gerenciamento (handlers já existem).
2. **F-17** — garantir que partida em andamento sobrevive a reload.
3. **M-09** — fix do header truncado.
4. **M-12** — fix do botão destrutivo no web.
5. **F-15** + **M-17** + **M-10** — configurações globais (vem em bloco).
6. **F-01**, **F-02**, **F-03** — completar gestão da pelada-tipo.
7. **F-07** + **F-08** — feedback sonoro/háptico na partida (alto impacto percebido).
8. Demais por ordem de interesse.
