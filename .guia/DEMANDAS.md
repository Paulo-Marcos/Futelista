# Demandas

---

## [D-045] 🧹 Atualizar exemplos de nomes em rules/domain.md apos rename PT

- **Status:** Aguardando validacao
- **Origem:** Derivada da D-022
- **Tipo:** Chore
- **Contexto:** A D-022 renomeou removeFromGame->tirarDoJogo, relocateTeam->realocarTime, addToNewTeam->adicionarAoNovoTime, mas rules/domain.md ainda cita os nomes antigos como exemplo de 'nomes em PT'. Atualizar para os nomes reais (agora de fato PT). Skills-base: clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.claude/rules/domain.md`

### O que foi feito

- Demanda criada via Guia Fluxo.
- Atualiza exemplos de nomes em domain.md para os nomes PT reais pos-D-022 (tirarDoJogo, realocarTime, adicionarAoNovoTime).

### Validacao feita

- nomes citados existem no GestorJogo atual

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-020] 🧹 Mover derivacao de regra das telas p/ seletores no dominio

- **Status:** Aguardando validacao
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** partida.tsx/index.tsx tem sort/filter/reduce que podem ser regra vazando da UI. Acao: auditar e mover calculo/ordenacao que e regra p/ seletor/metodo no dominio. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #3). Skills-base: clean-architecture-guardian, domain-driven-design.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/domain/GestorJogo.ts`
- `src/domain/GestorJogo.totalPartidasEncerradas.spec.ts`
- `app/(pelada)/jogadores.tsx`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Conservadora: move a unica regra clara (contar partidas com resultado) das telas para o dominio (GestorJogo.totalPartidasEncerradas + teste); jogadores.tsx passa a consumi-la. Demais filter/map nas telas sao apresentacao/UI-state (busca, estado de sheet, parsing) e ficam.

### Validacao feita

- jest 58 suites/588 testes; tsc 0; eslint 0

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-018] 🧹 Memoizar consumidores de selectors derivados

- **Status:** Aguardando validacao
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** goalEvents/goals/reservas recriados a cada tick alimentam consumidores nao-memoizados. Acao: memoizar consumidores e/ou retornar primitivos no selector. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (react-best-practices #4). Skills-base: react-best-practices.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `app/(pelada)/partida.tsx`
- `src/shared/ui/MatchTimeline.tsx`
- `src/shared/ui/partida/BenchRail.tsx`
- `src/shared/ui/partida/SubstitutionSheet.tsx`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Memoiza MatchTimeline/BenchRail/SubstitutionSheet e estabiliza os derivados que os alimentam (goals via primitivos+useMemo, goalEvents por chave, reservas/gols com const de modulo) + handlers em useCallback. Evita re-render desses consumidores a cada tick. Comportamento identico.

### Validacao feita

- tsc 0; eslint 0 nos 4 arquivos; jest 57 suites/585 testes

### Validacao pendente

- VALIDAR NO APP: timeline de gols, banco de reservas, sheet de substituicao

## [D-024] 🧹 Converter ternarios com efeito colateral em if/else

- **Status:** Aguardando validacao
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** Ternario por efeito colateral em GestorJogo updateTeams:378-380 e Match countGoals:46-50. Acao: trocar por if/else. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-code-review #5). Skills-base: clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/domain/Match.ts`
- `src/domain/GestorJogo.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Converte 2 ternarios usados por efeito colateral em if/else: Match.countGoals e GestorJogo.atualizarTimes. Comportamento identico; warning no-unused-expressions eliminado.

### Validacao feita

- npx jest src/domain (Match/GestorJogo/Game) 130 testes; eslint 0

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-010] 🧹 Registrar fechamento do ADR-0001 (router)

- **Status:** Aguardando validacao
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** [Confirmar] Se a tab-bar imperativa (createBottomTabNavigator) ja foi removida, registrar fechamento via novo ADR/nota (ADR e imutavel). Fonte: docs/diagnostico/diagnostico-2026-06-24.md (proposal-architect #5). Skills-base: proposal-architect.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `docs/adr/0005-conclusao-migracao-expo-router.md`
- `docs/adr/README.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Registra ADR-0005 fechando o estado transitorio do ADR-0001: tab-bar imperativa removida, navegacao 100% Expo Router file-based. Completa o indice do README (0003/0004/0005).

### Validacao feita

- tab-bar confirmada removida (grep sem createBottomTabNavigator)

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-044] 🧹 Remover componentes mortos TeamCard/MiniPlacar/UltimaPartidaCard

- **Status:** Aguardando validacao
- **Origem:** Derivada do diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** Derivada das D-012/D-016: TeamCard (src/shared/ui), MiniPlacar e UltimaPartidaCard (src/shared/ui/home) nao tem consumidor (codigo morto, extraidos sem uso). Remover apos confirmar zero referencia. Skills-base: clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/shared/ui/TeamCard.tsx`
- `src/shared/ui/home/MiniPlacar.tsx`
- `src/shared/ui/home/UltimaPartidaCard.tsx`
- `src/shared/ui/PlayerRow.tsx`

### O que foi feito

- Demanda criada via Guia Fluxo.
- Remove 3 componentes mortos sem consumidor (TeamCard, MiniPlacar, UltimaPartidaCard) extraidos sem uso nos refactors; ajusta comentario orfao em PlayerRow.

### Validacao feita

- tsc 0, eslint 0, jest 57 suites/585 testes

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-043] 🧹 Atualizar estrutura de pastas em rules/mobile.md

- **Status:** Aguardando validacao
- **Origem:** Derivada do diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** Derivada da D-002: rules/mobile.md ainda descreve UI em components/providers/contexts/hooks na raiz e app/(tabs)/, mas o real e src/app-shell, src/shared/ui e app/(pelada). Skills-base: proposal-architect.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.claude/rules/mobile.md`

### O que foi feito

- Demanda criada via Guia Fluxo.
- Atualiza estrutura de pastas em rules/mobile.md: src/app-shell (cola React), src/shared/ui (componentes, subpastas por tela), src/shared/theme (cores), app/(pelada) (rotas). Remove components/providers/contexts/hooks na raiz e app/(tabs). Reatividade (D-006) intacta.

### Validacao feita

- grep sem components|providers|contexts|(tabs)|constants/Colors; arvore real conferida

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-029] 🧹 Adotar gitmoji nos commits e decidir hook commit-msg

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** [Confirmar] Nenhum commit usa gitmoji antes do tipo (unico desvio sistematico). Acao: adotar daqui pra frente; decidir se o hook commit-msg passa a exigir/validar. Historico passado e imutavel. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (conventional-commit-gitmoji #1). Skills-base: conventional-commit-gitmoji.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.githooks/commit-msg`
- `bin/check-gitmoji.py`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- commit-msg passa a exigir gitmoji antes do tipo (via bin/check-gitmoji.py), rodando antes do check de lock. Excecoes: Merge/Revert/fixup. Commits auto do guia (sem --no-commit) sao rejeitados de proposito.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- teste manual do hook: aceita emoji+tipo, rejeita sem emoji, libera Merge

### Validacao pendente

- Nenhuma.

## [D-022] 🧹 Decidir convencao PT/EN e renomear no GestorJogo

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** [Confirmar] Mistura addPlayer/removeFromGame vs reordenarJogadores/esvaziarTime no mesmo agregado. Acao: decidir convencao (regra sugere PT p/ dominio) e renomear em bloco; API consumida pela UI. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-code-review #3). Skills-base: clean-code, uncle-bob-craft.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/domain/GestorJogo.ts`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Padroniza para PT os 19 metodos de acao do vocabulario de dominio do GestorJogo (addPlayer->adicionarJogador, removeFromGame->tirarDoJogo, setNextMatch->definirProximaPartida, addGoal->marcarGol, switchPlayer*/relocate*/resize*/update*...). Tecnicos/getters/lifecycle (subscribe/get*/start/pause/setPlayers/setResult) mantidos EN. Colisoes Team/Player/Match resolvidas por receptor. 31 arquivos.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx jest suite completa 57 suites/585 testes; tsc --noEmit 0; eslint 0 erros

### Validacao pendente

- Nenhuma.

## [D-031] 🧹 Documentar esquema M-/F- de origem no CLAUDE.md

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** [Opcional] Ha rastreabilidade via marcadores M-NN/F-NN no assunto, sem documentacao. Acao: documentar como esquema oficial de origem. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (conventional-commit-gitmoji #5). Skills-base: conventional-commit-gitmoji.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `CLAUDE.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Documenta rastreabilidade de origem dos commits no CLAUDE.md: vigente D-NNN (Guia Fluxo) no escopo + gitmoji; legado [M-NN] no fim do assunto (marco do roadmap, neutro), so historico.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- revisao manual: factual, distingue D-NNN de [M-NN]

### Validacao pendente

- Nenhuma.

## [D-034] 🧹 Estreitar overlap clean-code x uncle-bob-craft

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** [Opcional] Ambas disparam juntas em qualquer edicao. Acao: estreitar uncle-bob-craft p/ macro (SOLID/boundaries) e clean-code p/ micro (nomes/funcoes/smells). Fonte: docs/diagnostico/diagnostico-2026-06-24.md (skill-router #3,#4). Skills-base: skill-router, skill-creator.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.claude/skills/clean-code/SKILL.md`
- `.claude/skills/uncle-bob-craft/SKILL.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Estreita descricoes: clean-code=MICRO (nomes/funcao/smells/refactorings Fowler), uncle-bob-craft=MACRO (arquitetura/SOLID/boundaries/pattern). Complementaridade explicita, gatilhos nao colidem.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- frontmatter YAML valido nos 2; name/paths/corpo intactos

### Validacao pendente

- Nenhuma.

## [D-033] 🧹 Retunar description de react-best-practices (tirar vies Next.js)

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** [Opcional] Description fala React/Next.js/SSR/Vercel, mas projeto e Expo+RN sem Next. Acao: incluir RN/Expo/FlatList/re-render e remover vies Next.js/SSR. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (skill-router #2). Skills-base: skill-router, skill-creator.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.claude/skills/react-best-practices/SKILL.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Retuna description: foco RN/Expo Router, re-render, memo/useMemo/useCallback, useSyncExternalStore, FlatList/SectionList; remove vies Next.js/SSR/Vercel.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- frontmatter YAML valido; name/paths/corpo intactos

### Validacao pendente

- Nenhuma.

## [D-016] 🧹 Memoizar itens de lista em src/shared/ui

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** TeamMini/TeamQueue/PlayerRow/PlayerAvatar/TeamCard sem memo re-renderizam toda a arvore a cada notify(). Acao: memo nos componentes de item. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (react-best-practices #2). Skills-base: react-best-practices.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/shared/ui/PlayerRow.tsx`
- `src/shared/ui/PlayerAvatar.tsx`
- `src/shared/ui/TeamMini.tsx`
- `src/shared/ui/TeamQueue.tsx`
- `src/shared/ui/TeamCrest.tsx`
- `src/shared/ui/RuleChip.tsx`
- `src/shared/ui/MatchHistoryCard.tsx`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Envolve 7 folhas de item de lista (PlayerRow, PlayerAvatar, TeamMini, TeamQueue, TeamCrest, RuleChip, MatchHistoryCard) em React.memo. Aditivo, comportamento identico. TeamCard pulado: sem consumidores.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx tsc --noEmit (0); npx eslint src/shared/ui/*.tsx (0)

### Validacao pendente

- Nenhuma.

## [D-015] 🧹 Memoizar PlayerDot e estabilizar handler onScore

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** Cada tick re-renderiza todos os PlayerDot com closures novas; store compara so version. Acao: React.memo em PlayerDot + handler estavel (useCallback ou onScore(side,player)). Fonte: docs/diagnostico/diagnostico-2026-06-24.md (react-best-practices #1, alta). Skills-base: react-best-practices.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/shared/ui/partida/PlayerDot.tsx`
- `app/(pelada)/partida.tsx`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Memoiza PlayerDot (React.memo); onScore passa a receber (side, player); registrarGol estabilizado com useCallback; formacao espelhada do time B pre-computada com useMemo. Props estaveis nos dois times -> memo segura a cada tick. Comportamento identico.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx tsc --noEmit (0); npx eslint PlayerDot + partida.tsx (0, exhaustive-deps ok)

### Validacao pendente

- Nenhuma.

## [D-025] 🧹 Sanear Rules.toSeconds (param reatribuido, parseInt sem radix)

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** toSeconds reatribui parametro e usa parseInt sem radix/validacao. Acao: variavel local + parseInt(.,10) com guarda de formato. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-code-review #6). Skills-base: clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/domain/Rules.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Saneia toSeconds: nao reatribui param, parseInt com radix 10, partes ausentes/vazias viram 0 via helper local. Comportamento identico p/ entradas validas.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx jest src/domain/Rules 10/10; eslint 0; conferencia manual (''=0, 01:30:15=5415)

### Validacao pendente

- Nenhuma.

## [D-011] 🧹 Extrair subcomponentes e hooks de partida.tsx

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** partida.tsx ~2999 linhas com 15+ componentes num arquivo. Acao: mover subcomponentes+styles p/ src/shared/ui/partida/* e extrair hook usePartida; tela vira composicao. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #1, clean-code-review #1). Skills-base: react-best-practices, clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `app/(pelada)/partida.tsx`
- `src/shared/ui/partida/`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Extrai 17 subcomponentes + helpers da tela de Partida para src/shared/ui/partida/ (2998->628). Composicao e animacoes (Animated/loops/cleanup) preservadas; PlayerDot extraido como esta (pronto p/ D-015); StyleSheet particionado, orfas removidas. Estrutural, comportamento identico.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx tsc --noEmit (0); npx eslint partida + partida/**/* (0)

### Validacao pendente

- Nenhuma.

## [D-012] 🧹 Extrair subcomponentes e hooks de (pelada)/index.tsx

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** index.tsx ~2478 linhas mistura render+estado+orquestracao. Acao: extrair subcomponentes/hooks. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #1). Skills-base: react-best-practices, clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `app/(pelada)/index.tsx`
- `src/shared/ui/home/`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Extrai ~18 subcomponentes da Home para src/shared/ui/home/ (+ home/hero/), 2478->874 linhas. Arvore de composicao do Hero respeitada; StyleSheet particionado; orfas removidas. Estrutural, comportamento identico.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx tsc --noEmit (0); npx eslint index + home/**/* (0)

### Validacao pendente

- Nenhuma.

## [D-013] 🧹 Extrair subcomponentes e hooks de times.tsx

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** times.tsx ~1477 linhas. Acao: extrair subcomponentes e hook useMontagemDeTimes. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #1). Skills-base: react-best-practices, clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `app/(pelada)/times.tsx`
- `src/shared/ui/times/PrimaryCTA.tsx`
- `src/shared/ui/times/PartidaSemFila.tsx`
- `src/shared/ui/times/EditarTimeSheet.tsx`
- `src/shared/ui/times/BannerSemTime.tsx`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-26.
- Extrai PrimaryCTA, PartidaSemFila, EditarTimeSheet e BannerSemTime (leaf compartilhado) para src/shared/ui/times/ (1477->962). StyleSheet particionado; 2 chaves mortas removidas. Estrutural, comportamento identico.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx tsc --noEmit (0); npx eslint nos 5 arquivos (0)

### Validacao pendente

- Nenhuma.

## [D-014] 🧹 Extrair subcomponentes e hooks de jogadores.tsx

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** jogadores.tsx ~1393 linhas. Acao: extrair subcomponentes/hooks. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #1). Skills-base: react-best-practices, clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `app/(pelada)/jogadores.tsx`
- `src/shared/ui/jogadores/AddButton.tsx`
- `src/shared/ui/jogadores/LinhaJogador.tsx`
- `src/shared/ui/jogadores/LinhaEdicao.tsx`
- `src/shared/ui/jogadores/ModalAdicionarLote.tsx`
- `src/shared/ui/jogadores/EstatisticasJogadorSheet.tsx`
- `src/shared/ui/jogadores/StatTile.tsx`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Extrai 6 subcomponentes de jogadores.tsx para src/shared/ui/jogadores/ (1393->672 linhas); StyleSheet particionado por consumo. Estrutural, comportamento identico.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx tsc --noEmit (0); npx eslint nos 7 arquivos (0)

### Validacao pendente

- Nenhuma.

## [D-019] 🧹 Avaliar extrair reatividade/servicos de GestorJogo

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** GestorJogo ~892 ln/50 metodos acumula jogadores/times/timer/gols/regras + contrato de store. Acao: avaliar extrair Observable e servicos de dominio coesos. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #2). Skills-base: clean-architecture-guardian, domain-driven-design, uncle-bob-craft.

### Arquivos modificados/criados

- `src/domain/GestorJogo.ts`
- `src/domain/Observable.ts`
- `src/domain/Observable.spec.ts`
- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Extrai o external store para Observable (composicao); GestorJogo delega version/subscribe/notify. API publica e comportamento identicos. Agrupamento em servicos adiado (nota).
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx jest src/domain 29 suites/273 testes; tsc --noEmit; eslint 0 errors

### Validacao pendente

- Nenhuma.

## [D-017] 🧹 Envolver value do SoccerContext em useMemo

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** value={{...}} literal novo a cada render re-renderiza todos useSoccer(). Acao: useMemo no value. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (react-best-practices #3). Skills-base: react-best-practices.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/app-shell/soccerProvider.tsx`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Envolve o value do SoccerContext.Provider em useMemo (antes do early-return de boot), evitando re-render de todos os useSoccer a cada render
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx tsc --noEmit; npx eslint src/app-shell/soccerProvider.tsx (sem rules-of-hooks/exhaustive-deps)

### Validacao pendente

- Nenhuma.

## [D-021] 🧹 Remover any do dominio em Rules.ts:54

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** choosingTeams: any viola a regra 'sem any' do dominio. Acao: trocar por unknown/ChoosingTeams validado via includes. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-code-review #2, alta). Skills-base: clean-code, uncle-bob-craft.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/domain/Rules.ts`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Troca any por unknown em checkChoosingTeams (validacao de entrada); narrowing via as ChoosingTeams no includes
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx jest src/domain/Rules (10/10)

### Validacao pendente

- Nenhuma.

## [D-002] 🧹 Atualizar secao Arquitetura em CLAUDE.md e AGENTS.md

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** Docs apontam providers/contexts/hooks e app/(tabs)/ que nao existem; real e src/{domain,app-shell,infrastructure,shared} e app/(pelada)/. Acao: atualizar a secao Arquitetura/Conceitos. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #4, clean-code-review #7, proposal-architect #2). Skills-base: proposal-architect, clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `CLAUDE.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Alinha secao Arquitetura do CLAUDE.md a estrutura real (src/app-shell, src/infrastructure, src/shared; app/(pelada))
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- grep: sem mencoes a app/(tabs), MyProviders na raiz, providers/contexts/hooks na raiz

### Validacao pendente

- Nenhuma.

## [D-001] 🧹 Reescrever AGENTS.md a partir do CLAUDE.md

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** AGENTS.md descreve stack do gerador-cortes (FastAPI/SQLAlchemy/n8n, vocab Projeto/Corte/Short) e cita .agents/ inexistente. Acao: reescrever espelhando o CLAUDE.md atual; corrigir caminhos p/ .claude/. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #1, proposal-architect #3). Skills-base: open-source-readiness, proposal-architect.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `AGENTS.md`
- `PRIVACY.md`
- `docs/adr/0002-reatividade-external-store.md`
- `docs/desenvolvedor/arquitetura.md`
- `docs/desenvolvedor/ui.md`
- `src/domain/Team.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Reescrevi AGENTS.md para refletir o FuteLista real, espelhando o CLAUDE.md: removi a stack herdada do gerador-cortes (FastAPI/SQLAlchemy/n8n/Gemini/FFmpeg, vocabulario Projeto/Corte/Short, camadas routers->services, caminhos .agents/). Agora descreve Expo Router + RN + TS estrito; estrutura real src/{domain,app-shell,infrastructure,shared} + app/(pelada)/; vocabulario Pelada/Partida/Time/Jogador/Vantagem/Proximos; enums de contrato PlayerSituation/TeamSituation/TimerStatus/ResultMatch/ChoosingTeams; FinalResult com as 5 estrategias; protocolo de lock e caminhos .claude/skills e .claude/rules.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- revisao manual: AGENTS.md condiz com CLAUDE.md e com a arvore src/
- grep -nE 'FastAPI|SQLAlchemy|n8n|Gemini|FFmpeg|Projeto|Corte|Short|.agents|routers/|services/' AGENTS.md => nenhum termo proibido

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T21:18:49-03:00

## [D-008] ✨ Escrever ADR-0003 persistencia Ports&Adapters

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Feature
- **Contexto:** Camada de persistencia (porta RepositorioPelada + adapters AsyncStorage/EmMemoria + serializers + backup) adicionada sem ADR; decisao com trade-off real. Acao: criar docs/adr/0003. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (proposal-architect #1, alta). Skills-base: proposal-architect.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `docs/adr/0003-persistencia-ports-adapters.md`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- ADR-0003 retroativo: porta RepositorioPelada no dominio + adapters AsyncStorage/EmMemoria, serializers (grafo ciclico, PAYLOAD_VERSION), storageKeys e backup JSON; injecao via soccerProvider. Formato espelha ADR-0001/0002 (contexto, decisao, 4 alternativas, consequencias boas/ruins/neutras), status Aceito.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- conferência manual contra src/domain/ports e src/infrastructure/storage

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T22:42:25-03:00

## [D-004] 🧹 Corrigir PRIVACY.md (persistencia AsyncStorage ativa)

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** PRIVACY.md afirma que nao ha persistencia, mas AsyncStorage foi entregue na 1.0.0. Risco de compliance de loja. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #3). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `PRIVACY.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Corrigi a seção de dados/persistência: os dados da pelada são persistidos localmente no dispositivo via AsyncStorage (não mais descartados ao fechar), exclusivamente no aparelho, sem envio a servidor. Atualizei Portabilidade (export JSON local), Exclusão, o Expo SDK 51->54 e adicionei entrada no histórico (25/06/2026) + data de atualização.
- ATENCAO: por corrida entre chips concorrentes, o D-026 rodou um commit abrangente e capturou meu PRIVACY.md ja staged; a mudanca ficou integra dentro do commit f27b142 em vez de um commit dedicado 'docs(D-004)'. Conteudo correto e versionado; nao fiz reescrita de historico para nao corromper o trabalho paralelo.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- conferência manual contra src/infrastructure/storage e CHANGELOG

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T23:12:45-03:00

## [D-009] ✨ Escrever ADR modelagem Pelada x Execucao

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Feature
- **Contexto:** Novos agregados (Pelada tipo vs GestorJogo/Execucao sessao, AgregadosPelada, ConvitePelada) mudam a fronteira do agregado raiz, sem registro. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (proposal-architect #4). Skills-base: proposal-architect, domain-driven-design.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `docs/adr/0004-modelagem-pelada-execucao.md`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `PRIVACY.md`
- `src/domain/Team.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Escrevi ADR-0004 registrando a separação Pelada (tipo/cadastro) × GestorJogo (execução/sessão), ligados pelo id fraco peladaId, com Rules viajando por valor; documenta o lado certo de AgregadosPelada (cross-execução, identidade por nome), ConvitePelada (do tipo) e RelatorioExecucao (da sessão), com 3 alternativas e trade-offs. Formato idêntico aos ADRs 0001/0002, status aceito.
- ATENÇÃO: por uma race com chip paralelo, o arquivo staged foi absorvido pelo commit acd4169 (D-032), que NÃO contém a marca [unlock:adicoes-exigem-autorizacao]. O conteúdo está íntegro em HEAD; não reescrevi história compartilhada.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- conferência manual contra src/domain/Pelada.ts e correlatos

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T21:27:42-03:00

## [D-007] 🧹 Verificar links de docs/ (AI_NAVIGATION, guias)

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** [Confirmar] README/CHANGELOG citam AI_NAVIGATION.md e guias; conferir que os arquivos linkados existem. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #7). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `AI_NAVIGATION.md`
- `docs/desenvolvedor/ui.md`
- `docs/desenvolvedor/arquitetura.md`
- `docs/adr/0002-reatividade-external-store.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Varredura de links relativos em README/CHANGELOG/AI_NAVIGATION/docs (161 links). README e CHANGELOG: todos resolvem. Corrigi 14 links quebrados por refactor (raiz contexts/providers/hooks/components -> src/app-shell e src/shared; app/(tabs) -> app/(pelada)): 8 em ui.md, 1 em arquitetura.md, 2 em adr/0002, 11 em AI_NAVIGATION.md.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- varredura manual/script de links relativos em README/CHANGELOG/docs; re-scan confirma 0 quebrados com alvo existente

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T23:19:01-03:00

## [D-023] 🧹 Remover comentario-cicatriz em Team.ts:114

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** Comentario '//tava deletando mais de um.' descreve bug antigo. Acao: remover (nome+teste ja documentam). Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-code-review #4). Skills-base: clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/domain/Team.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Removido o comentario-cicatriz '//tava deletando mais de um.' em removePlayer (Team.ts:114). Logica intacta; nome do metodo + regressao em Team.spec.ts ja documentam o comportamento.
- ATENCAO: o working tree e compartilhado por varios chips guia concorrentes. O Team.ts staged foi varrido para o commit acd4169 (rotulado D-032) por outro processo; nao ha commit D-023 dedicado e nao reescrevi historico (seria destrutivo).
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx jest Team

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T22:40:52-03:00

## [D-032] 🧹 Adicionar paths: as 4 skills do projeto

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** [Opcional] Nenhuma skill do projeto declara paths:; vinculo escopo->skill vive so em prosa. Acao: paths: em domain-driven-design(src/domain/**), react-best-practices(app|components|providers|contexts|hooks), clean-code/uncle-bob-craft(ambos). Fonte: docs/diagnostico/diagnostico-2026-06-24.md (skill-router #1). Skills-base: skill-router, skill-creator.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.claude/skills/clean-code/SKILL.md`
- `.claude/skills/uncle-bob-craft/SKILL.md`
- `.claude/skills/domain-driven-design/SKILL.md`
- `.claude/skills/react-best-practices/SKILL.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Adicionei o campo paths: (lista YAML de globs) ao frontmatter das 4 skills: domain-driven-design -> src/domain/**; react-best-practices -> camada de UI (app/components/providers/contexts/hooks/src/app-shell/src/shared); clean-code e uncle-bob-craft -> ambos os conjuntos. name/description/corpo intactos.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- frontmatter YAML válido nas 4 skills (yaml.safe_load confirma paths em cada uma)

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T22:58:22-03:00

## [D-006] 🧹 Atualizar rules/mobile.md p/ apontar useGameSlice

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** rules/mobile.md diz reatividade 'a definir em refactor futuro', mas ADR-0002 ja decidiu external store via useGameSlice. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (proposal-architect #6). Skills-base: proposal-architect.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.claude/rules/mobile.md`
- `docs/adr/0002-reatividade-external-store.md`
- `docs/desenvolvedor/arquitetura.md`
- `docs/desenvolvedor/ui.md`
- `src/domain/Team.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Reescrevi a secao 'Estado e re-render' apontando o padrao reativo decidido: GestorJogo como external store (subscribe/version/notify) consumido via useGameSlice/useGameSliceRequired com useSyncExternalStore, e selector para subscrever o minimo. Removido o 'a definir em refactor futuro' e as opcoes observer/Zustand; adicionados links para ADR-0002 e useGameSlice.ts.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- conferência manual contra ADR-0002 e useGameSlice.ts

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T21:11:48-03:00

## [D-005] 🧹 Ajustar CHANGELOG (lint no CI ja feito)

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** CHANGELOG lista lint-no-CI como Planejado, mas ja esta ativo. Mover p/ 1.0.0/Adicionado. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #6). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `CHANGELOG.md`
- `.claude/skills/clean-code/SKILL.md`
- `.claude/skills/domain-driven-design/SKILL.md`
- `.claude/skills/react-best-practices/SKILL.md`
- `.claude/skills/uncle-bob-craft/SKILL.md`
- `.eslintrc.js`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/reports/D-027-ready-20260625-210702.md`
- `.guia/reports/D-027-start-20260625-012833.md`
- `.guia/tasks.json`
- `AGENTS.md`
- `PRIVACY.md`
- `src/domain/Team.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Movi a 'ativacao do passo de lint no CI' de [Nao lancado]/Planejado para [1.0.0]/Adicionado: a entrada de CI agora lista type-check + lint (eslint+prettier) + testes; o item planejado restou apenas a passada de formatacao prettier --write
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- conferencia manual contra ci.yml

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T21:08:42-03:00

## [D-003] 🧹 Corrigir versoes de stack no README

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** README diz Expo 51/RN 0.74/Router 3; package.json tem Expo 54/RN 0.81/Router 6. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #2). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `README.md`
- `.claude/skills/clean-code/SKILL.md`
- `.claude/skills/domain-driven-design/SKILL.md`
- `.claude/skills/react-best-practices/SKILL.md`
- `.eslintrc.js`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `src/domain/Team.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Tabela de stack do README alinhada ao package.json: Expo 51→54, React Native 0.74→0.81, Expo Router 3→6. Nenhuma outra menção de versão de stack no README.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- conferência manual README x package.json

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T21:06:49-03:00

## [D-028] 🧹 Adicionar .env* ao gitignore e criar .env.example

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** .gitignore nao lista .env; sem rede de protecao se um segredo EAS/deploy surgir. Acao: ignorar .env* e criar template .env.example. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #5). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.gitignore`
- `.env.example`
- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `AI_NAVIGATION.md`

### O que foi feito

- Adicionei .env/.env.local/.env*.local ao .gitignore e criei .env.example documentando chaves EXPO_PUBLIC_* e segredos EAS sem valor real. Inspecao do codigo: app so le Constants.expoConfig.version via expo-constants (app/configuracoes.tsx); nenhum process.env real, logo placeholders ficam comentados.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- git check-ignore .env

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T21:13:31-03:00

## [D-026] ✨ Regra ESLint no-restricted-imports na fronteira do dominio

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Feature
- **Contexto:** Pureza do dominio e so convencao; nada barra um import de react/react-native/expo em src/domain. Acao: ESLint no-restricted-imports (ou dependency-cruiser) com whitelist do polyfill react-native-get-random-values. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #5). Skills-base: clean-architecture-guardian, open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.eslintrc.js`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Adicionado overrides para src/domain/** no .eslintrc.js com no-restricted-imports barrando react, react-dom, react-native (e react-native/*), expo, expo-*, @expo/*, @react-native-async-storage/* e a camada de infra (@/providers|contexts|hooks|app-shell). Polyfill react-native-get-random-values preservado por barrar apenas o nome exato react-native, nunca react-native*. Pureza do dominio agora verificada por maquina.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npm run lint
- teste negativo: probe temporario com imports de react/react-native/expo-constants/expo-router gerou 4 erros no-restricted-imports; react-native-get-random-values e uuid passaram

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T23:16:55-03:00

## [D-027] ✨ Criar release.yml disparado em tags v*.*.*

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Feature
- **Contexto:** Ha ci.yml e lock-check.yml mas nenhum workflow de release. Acao: release.yml (build APK via EAS + release a partir do CHANGELOG). Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #4). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.github/workflows/release.yml`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Criei .github/workflows/release.yml disparado somente em tags v*.*.*; build do APK Android via EAS (perfil preview, unico que gera APK no eas.json) com expo/expo-github-action e EXPO_TOKEN, extracao das notas da secao correspondente do CHANGELOG.md via awk, e publicacao do GitHub Release com softprops/action-gh-release anexando o APK.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx js-yaml parseou sem erro; python yaml.safe_load confirmou que on.push.tags == ['v*.*.*'] (nao roda em push de branch nem PR).

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T23:02:26-03:00

## [D-030] 🧹 Padronizar trailer Co-Authored-By canonico

- **Status:** Cancelada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** Trailer alterna entre 'Claude Opus 4.8 (1M context)' e 'Claude Opus 4.8'. Acao: padronizar p/ forma canonica com email daqui pra frente. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (conventional-commit-gitmoji #2). Skills-base: conventional-commit-gitmoji.

### Arquivos modificados/criados

- Nenhuma.

### O que foi feito

- Cancelada em 2026-06-25: Nao e codigo: trailer Co-Authored-By e convencao daqui pra frente, nao demanda implementavel. Decisao do desenvolvedor (Guia 2026-06-25).

### Validacao feita

- Nenhuma.

### Validacao pendente

- Nenhuma.


## [D-041] ✨ Chip de regra de sorteio e ajustes visuais

- **Status:** Aguardando validacao
- **Origem:** Sessao 2026-06-24
- **Tipo:** Feature
- **Contexto:** Aba Times ganha chip 'Sorteio: <regra>' que leva as Regras; glow do CTA vira LinearGradient (times e peladas/[id]); formacao sem goleiro dedicado (ate 3 na linha); badge da splash redondo; linha do campo mais visivel no tema.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `app/(pelada)/times.tsx`
- `app/peladas/[id].tsx`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`

### O que foi feito

- Demanda criada via Guia Fluxo.
- RegraTimesChip + glow gradiente + formacao + Splash + themes

### Validacao feita

- npx jest formacao.spec themes.spec

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-040] ✨ Reabrir partida encerrada para analise no resultado

- **Status:** Aguardando validacao
- **Origem:** Sessao 2026-06-24
- **Tipo:** Feature
- **Contexto:** Na tela de resultado, 'Encerrar pelada' vira 'Voltar ao inicio' (home) e 'Voltar a partida' agora reabre a partida (reabrirPartida limpa resultado/vencedor e pausa o cronometro) e navega para /partida, em vez de router.back.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `app/__tests__/resultado-test.tsx`
- `app/peladas/[id].tsx`
- `app/resultado.tsx`
- `src/domain/GestorJogo.ts`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`

### O que foi feito

- Demanda criada via Guia Fluxo.
- reabrirPartida() no dominio + nova navegacao em resultado.tsx

### Validacao feita

- npx jest resultado-test

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-039] 🐛 Times duplicavam jogadores em saves antigos

- **Status:** Aguardando validacao
- **Origem:** Sessao 2026-06-24
- **Tipo:** Bug / regressao
- **Contexto:** Saves de versoes com bugs de troca/remocao gravavam jogador no roster de dois times ou time repetido em next; o relink reproduzia a corrupcao e a tela de Times mostrava jogadores duplicados. Novo repararIntegridadeDosTimes() sanea no rehydrate; setPlayers passa a deduplicar; botao DEV repara manualmente.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `app/(pelada)/times.tsx`
- `app/__tests__/resultado-test.tsx`
- `app/peladas/[id].tsx`
- `app/resultado.tsx`
- `src/domain/GestorJogo.ts`
- `src/infrastructure/storage/serializer.ts`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`

### O que foi feito

- Demanda criada via Guia Fluxo.
- repararIntegridadeDosTimes() idempotente no serializer + dedup em setPlayers + botao DEV

### Validacao feita

- npx jest GestorJogo.integridade.spec

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-038] 🐛 Cronometro nao encerrava ao fim da partida

- **Status:** Aguardando validacao
- **Origem:** Sessao 2026-06-24
- **Tipo:** Bug / regressao
- **Contexto:** Ao encerrar (manual ou gol-limite) o Timer seguia decrementando em segundo plano e era reaproveitado pela metade na proxima partida. Novo Timer.encerrar() limpa o setInterval e marca ENDED; setNextMatch descarta o timer.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `app/(pelada)/times.tsx`
- `app/__tests__/resultado-test.tsx`
- `app/peladas/[id].tsx`
- `app/resultado.tsx`
- `src/domain/GestorJogo.ts`
- `src/domain/Timer.ts`
- `src/infrastructure/storage/serializer.ts`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`

### O que foi feito

- Demanda criada via Guia Fluxo.
- Timer.encerrar() + descartarTimer; chamado em gol-limite, setResult e setNextMatch

### Validacao feita

- npx jest GestorJogo.timer.spec

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-037] 🧹 Extrai enums do dominio para quebrar require cycles

- **Status:** Aguardando validacao
- **Origem:** Sessao 2026-06-24
- **Tipo:** Chore
- **Contexto:** Move ResultMatch, PlayerSituation e TeamSituation para arquivos proprios, com re-export nos modulos originais e imports type-only. Quebra o ciclo Match<->Team<->Player sem mudar a API publica.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `app/(pelada)/times.tsx`
- `app/__tests__/resultado-test.tsx`
- `app/peladas/[id].tsx`
- `app/resultado.tsx`
- `src/domain/GestorJogo.ts`
- `src/domain/Goal.ts`
- `src/domain/Match.ts`
- `src/domain/Player.ts`
- `src/domain/Switch.ts`
- `src/domain/Team.ts`
- `src/domain/Timer.ts`
- `src/infrastructure/storage/serializer.ts`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`

### O que foi feito

- Demanda criada via Guia Fluxo.
- Enums em arquivos proprios + import type; API preservada via re-export

### Validacao feita

- npx tsc --noEmit

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-036] 🧹 Atualiza Expo SDK 51 para 54

- **Status:** Aguardando validacao
- **Origem:** Sessao 2026-06-24
- **Tipo:** Chore
- **Contexto:** Sobe Expo 51->54, React 18->19, RN 0.74->0.81, router 3->6, reanimated 3->4. Inclui metro.config.js (uuid sem package-exports), expo-file-system/legacy e ajustes de teste para RN 0.81 (Pressable memo) e React 19 (act).

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.eslintignore`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `app.json`
- `app/(pelada)/times.tsx`
- `app/__tests__/regras-test.tsx`
- `app/__tests__/resultado-test.tsx`
- `app/__tests__/times-test.tsx`
- `app/peladas/[id].tsx`
- `app/resultado.tsx`
- `package-lock.json`
- `package.json`
- `src/app-shell/fotoJogador.ts`
- `src/domain/GestorJogo.ts`
- `src/domain/Goal.ts`
- `src/domain/Match.ts`
- `src/domain/Player.ts`
- `src/domain/Switch.ts`
- `src/domain/Team.ts`
- `src/domain/Timer.ts`
- `src/infrastructure/storage/serializer.ts`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/__tests__/Stepper-test.tsx`
- `src/shared/ui/__tests__/ThemedText-test.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`
- `src/test/renderWithProviders.tsx`

### O que foi feito

- Demanda criada via Guia Fluxo.
- Upgrade SDK 51->54; testes ajustados; tsc e jest verdes

### Validacao feita

- npx tsc --noEmit
- npx jest --ci (579/579)

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-035] 🧹 Versiona estado do Guia Fluxo e diagnostico do projeto

- **Status:** Validada
- **Origem:** Sessao 2026-06-24
- **Tipo:** Chore
- **Contexto:** Passa a versionar .guia/ (estado do fluxo, backlog do diagnostico, locks) e docs/diagnostico/ no git, conforme decisao do desenvolvedor.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.eslintignore`
- `app.json`
- `app/(pelada)/times.tsx`
- `app/__tests__/regras-test.tsx`
- `app/__tests__/resultado-test.tsx`
- `app/__tests__/times-test.tsx`
- `app/peladas/[id].tsx`
- `app/resultado.tsx`
- `package-lock.json`
- `package.json`
- `src/app-shell/fotoJogador.ts`
- `src/domain/GestorJogo.ts`
- `src/domain/Goal.ts`
- `src/domain/Match.ts`
- `src/domain/Player.ts`
- `src/domain/Switch.ts`
- `src/domain/Team.ts`
- `src/domain/Timer.ts`
- `src/infrastructure/storage/serializer.ts`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/__tests__/Stepper-test.tsx`
- `src/shared/ui/__tests__/ThemedText-test.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`
- `src/test/renderWithProviders.tsx`

### O que foi feito

- Demanda criada via Guia Fluxo.
- Adiciona .guia/ e docs/diagnostico/ ao versionamento
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- git status: arquivos rastreados

### Validacao pendente

- Nenhuma.

o.

### Validacao feita

- git status: arquivos rastreados

### Validacao pendente

- Nenhuma.

