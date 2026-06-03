# Plano de Commits — FuteLista

Roadmap para chegar a uma **versão estável** do app de pelada.
Foco: app funcional ponta-a-ponta, persistente e visualmente apresentável.

**Legenda:** `[ ]` aguardando · `[X]` commitado · `[~]` em andamento

---

## ✅ Já commitado

- `[X]` `b8e7382` Initial commit (template Expo)
- `[X]` `8b3c2e3` feat: snapshot inicial do FuteLista (domínio testado, UI parcial)
- `[X]` `352a253` chore(governance): instala CLAUDE/AGENTS/skills/rules/locks/hooks/CI
- `[X]` `7a5c168` chore: remove código morto e arquivos do template
- `[X]` `bd76049` fix(domain): casing de import e bug em Team.switchPlayer
- `[X]` `9ae9ad0` chore(lock): trava features estáveis do domínio
- `[X]` _próximo_: chore(docs): adormece sistema de locks e reorganiza plano de estabilização
- `[X]` Etapa 7 — Refatoração de organização e centralização (9 commits):
  - `[X]` `94af3c4` refactor(config): centraliza constantes em pontos únicos
  - `[X]` `5b23f6b` docs: JSDoc no domínio e READMEs por subpasta de src/
  - `[X]` `c51be12` refactor(domain): Rules.toData() + Rules.merge() como fonte única
  - `[X]` `8440390` refactor(domain): DRY em handlers pós-partida e estratégias de time
  - `[X]` `e582006` refactor(domain): renomeia UpdateDraw → FinalResult
  - `[X]` `5e44359` refactor(domain): team.Switches → team.switches (camelCase)
  - `[X]` `a405473` refactor(domain): addPlayerList → setPlayers (semântica destrutiva)
  - `[X]` `5b1210b` refactor(domain): removeFirstNext → tirarDaFila
  - `[X]` `82977a5` refactor(domain): Player/Team aceitam input object; Timer.continue retorna void

---

## 🎯 Roadmap até a versão estável

### Etapa 1 — Bugs bloqueadores do fluxo de uso

Itens que impedem o app de ser usado de ponta a ponta.

#### COMMIT 1.1 — fix(ui): list.tsx usa nomes digitados; remove hardcode
**Status:** `[ ]`

**Problema:** [app/(tabs)/list.tsx:42-63](app/(tabs)/list.tsx) — o botão "Montar TImes" hardcoda 16 nomes (`joa`, `af`, …) ignorando o que o usuário cadastrou.

**Mudança:**
- `onPress` apenas chama `manager.createTeams()` (já existe).
- O cadastro real fica no modal/input já presente (`handleAddOnList`).
- Validação: avisar se há jogadores insuficientes (`< 2 × playersPerTeam`).

**Critério:** consigo cadastrar 8 jogadores manualmente e gerar 4 times com 2 jogadores.

---

#### COMMIT 1.2 — fix(ui): CurrentGame.tsx separa iniciar/pausar e adiciona gol
**Status:** `[ ]`

**Problema:** [app/(tabs)/CurrentGame.tsx:19-24](app/(tabs)/CurrentGame.tsx) — `onPressBegin` e `onPressPause` ambos chamam `setPlayingGame()`. Iniciar não inicia timer. Pausar não pausa. Não tem como adicionar gol.

**Mudança:**
- `onPressBegin` → `manager.start()`
- `onPressPause` → `manager.pause()`
- Adicionar botão "Continuar" → `manager.continue()`
- Adicionar botões "Gol Time A" / "Gol Time B" → seleção de jogador → `manager.addGoal(time, jogador)`
- Adicionar botão "Encerrar partida" → `manager.setResult()` + `manager.setNextMatch()` + navega para Próximos

**Critério:** consigo iniciar partida, pausar, continuar, registrar gols, encerrar e ver os novos times na fila.

---

#### COMMIT 1.3 — fix(domain): createTeams valida antes de mutar
**Status:** `[ ]`

**Problema:** [src/domain/GameManager.ts:60-68](src/domain/GameManager.ts) — `createTeams()` faz `this.next = []` ANTES de checar `length > 1`, então o throw "Times já foram criados" nunca dispara. Há `it.skip` em [Game.spec.ts](src/domain/Game.spec.ts) sinalizando isso.

**Mudança:**
- Trocar pela ordem correta: validar antes de mutar.
- Reativar o `it.skip` removendo o `.skip`.

**Critério:** spec passa sem skip; chamar `createTeams()` duas vezes lança erro.

---

### Etapa 2 — Estado reativo confiável

#### COMMIT 2.1 — refactor(state): observer tipado + useSyncExternalStore
**Status:** `[ ]`

**Problema:** [providers/soccerProvider.tsx](providers/soccerProvider.tsx) força re-render com `setState([])` quando o GameManager emite `"teams"`. Outros eventos (gol, troca, mudança de fila) não disparam re-render. UI fica dessincronizada.

**Mudança:**
- No `GameManager`: adicionar `subscribe(listener) → unsubscribe` tipado e tratar eventos específicos (`teams`, `playing`, `goal`, `next`).
- Hook `useGameSlice<T>(selector: (gm: GameManager) => T): T` baseado em `useSyncExternalStore`.
- Trocar `useSoccer()` por hooks específicos por tela (`usePlayers()`, `useNextTeams()`, `usePlayingMatch()`).

**Por que sem Zustand:** evita dependência nova; `useSyncExternalStore` é nativo do React 18 e foi feito exatamente para integrar com stores externos.

**Critério:** mexer em uma tela atualiza outras imediatamente; o `setState([])` sumiu.

---

### Etapa 3 — Fluxos completos ponta-a-ponta

#### COMMIT 3.1 — feat(ui): tela "Nova Pelada" com Rules customizadas
**Status:** `[ ]`

**Problema:** hoje a `Rules` é sempre `new Rules()` (default 4 jogadores, 10min, etc.). Não dá pra configurar.

**Mudança:**
- Rota raiz `app/index.tsx` (ou nova tela "Configurar Pelada") com form:
  - Nome da pelada
  - Jogadores por time (numeric)
  - Duração da partida (string HH:MM:SS)
  - Número de tempos
  - Limite de gols
  - Modo de escolha (dropdown com 3 opções)
- Validação reaproveita `Rules.check*` (mensagens em PT já prontas).
- Botão "Criar Pelada" cria o `GameManager` e navega para cadastro de jogadores.

**Critério:** consigo criar 2 peladas com regras diferentes em sequência.

---

#### COMMIT 3.2 — feat(ui): tela "Próximos" pós-partida
**Status:** `[ ]`

**Mudança:**
- Após encerrar partida (COMMIT 1.2), navegar para tela mostrando:
  - Resultado da partida (X x Y, vencedor, autores dos gols).
  - Próxima partida (times A e B).
  - Fila de próximos.
  - Time com vantagem (se houver).
  - Botão "Iniciar próxima partida".

**Critério:** após 3 partidas, a fila de próximos reflete a ordem correta (vitórias mantêm vencedor, empates aplicam regra de vantagem).

---

#### COMMIT 3.3 — refactor(navigation): renomeia rotas para vocabulário PT
**Status:** `[ ]`

**Problema:** `index`, `index2`, `List`, `Geriamento` (typo), `currentGame` — nomes inconsistentes.

**Mudança proposta:**
- `index` → `inicio` (home)
- `list` → `jogadores`
- `Teams` → `times`
- `GameManager` → `placar`
- `CurrentGame` → `partida`
- Decidir entre `createBottomTabNavigator` manual ou `Tabs` do Expo Router (hoje há ambos em [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx)).

**Critério:** navegação funciona em iOS, Android e Web; nomes refletem o domínio.

---

### Etapa 4 — Persistência

#### COMMIT 4.1 — feat(persistence): AsyncStorage com snapshot do GameManager
**Status:** `[ ]`

**Mudança:**
- Adicionar `@react-native-async-storage/async-storage` ao package.json.
- Em `src/domain/`: serializador puro (`GameManagerSnapshot.ts`) que converte `GameManager → JSON` e `JSON → GameManager` (sem dependência de AsyncStorage).
- Em `src/infrastructure/StoragePort.ts`: interface `StoragePort`.
- Em `src/infrastructure/AsyncStorageAdapter.ts`: implementação RN.
- Hook `usePersistedSoccer` que faz hydrate na montagem e save (debounced ~500ms) em cada mudança.

**Critério:** cadastrar pelada → fechar e reabrir app (ou reload no Expo) → continuar de onde parou.

---

### Etapa 5 — Polimento visual

#### COMMIT 5.1 — chore(ui): remove cores debug e centraliza em Colors.ts
**Status:** `[ ]`

**Problema:** várias telas usam `backgroundColor: "red"`, `"yellow"`, `"purple"` — sobrou de debug.

**Mudança:**
- Definir paleta light/dark coerente em [constants/Colors.ts](constants/Colors.ts).
- Substituir literais nas telas e na tab bar.
- Adotar `ThemedView`/`ThemedText` consistentemente.

**Critério:** screenshot das telas não tem cor de debug; consigo alternar light/dark sem quebra.

---

#### COMMIT 5.2 — chore(ui): polimento de cada tela
**Status:** `[ ]`

**Mudança por tela:**
- Espaçamento e tipografia consistente (substituir `<ThemedView style={titleContainer}></ThemedView>` vazios usados como spacer).
- Estado vazio bem definido (ex.: lista de jogadores vazia mostra "Adicione o primeiro jogador").
- Loading states onde houver hidratação async.
- Ícones com `aria-label` para acessibilidade.

**Critério:** as 5 telas principais (`inicio`, `jogadores`, `times`, `placar`, `partida`) renderizam sem visual quebrado em iOS, Android e Web.

---

### Etapa 6 — Cobertura de testes de UI

#### COMMIT 6.1 — test(ui): smoke tests das telas principais
**Status:** `[ ]`

**Telas a cobrir (caminho feliz mínimo):**
- `inicio` — criar pelada com regras customizadas.
- `jogadores` — adicionar jogador via modal/input.
- `times` — exibir times criados.
- `placar` — exibir contagem correta.
- `partida` — iniciar, pausar, continuar, gol, encerrar.

**Critério:** `npm test` passa com novos testes; smoke tests rodam em <5s.

---

### Etapa 7 — Refatoração de organização e centralização

Disparada em 2026-06-02 a partir de uma análise completa do `src/`. Cada
PR aqui é independente e roda `npm test` antes do merge.

#### COMMIT 7.1 — refactor: centralizar constantes em pontos únicos
**Status:** `[X]` `94af3c4`

**Problema:** literais espalhados em 3+ arquivos sem fonte única — chave de storage `"futelista:pelada:ativa-id"` repetida em `peladaAtiva.ts` e `devSeed.ts`; prefixos `"futelista:execucao:"` etc com filtro cru `"futelista:"` em `devSeed.ts:19`; defaults de Rules (`4`, `"00:10:00"`) reaparecem em `devSeed.ts`; `"Pelada avulsa"` em `soccerProvider.tsx` e `devSeed.ts`; rotas `"/regras"`, `"/partida"` literais em `PeladaHeader.tsx`; `AVATAR_COLORS` solto em `PlayerRow.tsx`.

**Mudança:**
- `src/domain/defaults.ts` — `RULES_DEFAULTS` (playersPerTeam, timeMatch, numberTimes, goalLimit, choosingTeams). Domínio fica puro e tem seus defaults exportados.
- `src/infrastructure/storage/storageKeys.ts` — `STORAGE_NAMESPACE`, `STORAGE_KEYS` com prefixes e key de pelada ativa.
- `src/app-shell/constants.ts` — `AUTOSAVE_DEBOUNCE_MS`, `NOME_AVULSA_DEFAULT`, `ROUTES`.
- `src/shared/theme/Colors.ts` — adicionar `AvatarPalette` (mover os 8 hexa do `PlayerRow`).
- Atualizar todos os consumidores: `Rules.ts`, `peladaAtiva.ts`, `AsyncStoragePeladaRepository.ts`, `devSeed.ts`, `soccerProvider.tsx`, `PeladaHeader.tsx`, `PlayerRow.tsx`.

**Critério:** `npm test` continua verde; trocar uma constante (ex.: namespace de storage) reflete em todo o app via 1 edição.

---

#### COMMIT 7.2 — docs: JSDoc completo + 3 READMEs + catálogo UI
**Status:** `[X]` `5b23f6b`

**Problema:** cobertura desigual de JSDoc — `GameManager`/`Pelada`/`Timer`/`SoccerProvider`/`serializer` documentados; `Player`/`Team`/`Match`/`Goal`/`Switch`/`Rules`/`ScreenTime`/`CreateTeam*`/`UpdateDraw*` sem doc. Sem catálogo de componentes UI.

**Mudança:**
- JSDoc em todas as classes/funções públicas faltantes (uma linha de propósito + invariantes não-óbvias).
- `src/domain/README.md` — mapa entidade × responsabilidade, padrões usados.
- `src/infrastructure/storage/README.md` — chaves, versão de payload, política de migração.
- `src/shared/ui/README.md` — catálogo: cada componente com props, exemplo curto, quando usar.

**Critério:** nenhum arquivo de runtime muda; PR só de docs.

---

#### COMMIT 7.3 — refactor(domain): Rules.toData() + Rules.merge(parcial)
**Status:** `[X]` `c51be12`

**Problema:** conversão `Rules → DataRules` duplicada em `soccerProvider.tsx:322` e clonagem em `devSeed.ts:181`; reconstrução dos 6 campos em `GameManager.atualizarRegras:378` e `Pelada.atualizarRegras:48`.

**Mudança:** mover ambas operações para métodos estáticos/instância em `Rules` e atualizar consumidores.

**Critério:** specs continuam verdes; `atualizarRegras` em `GameManager` e `Pelada` vira ~2 linhas.

---

#### COMMIT 7.4 — refactor(domain): DRY em handlers e estratégias
**Status:** `[X]` `8440390`

**Bônus aplicado:** `WithDrawAndExternalAdvantageAndTwoTeams` (que estava órfão) foi incluído na cadeia em `FinalResult.processor` — decisão tomada aqui, não no 7.5.

**Problema:**
- `hasSecondNextAndIsFull(game)` idêntico em 4 handlers de `UpdateDraw/`.
- `createTeams(players, perTeam)` quase idêntico em 3 estratégias de `TeamBuilder/`.
- `shuffleList()` duplicado em `Mixed` e `MixingTopTwoTeams`.
- Só `CreateTeamByOrder` herda `CreateTeam` abstract.

**Mudança:**
- `BaseUpdateDrawHandler` ganha `protected hasSecondNextAndIsFull(game)`.
- `CreateTeam` abstract ganha `protected distribuir(players, perTeam)` e `protected shuffle(list)`.
- Strategies só implementam `prepararLista()`.

**Critério:** specs verdes; redução visível de linhas e duplicação zero.

---

#### COMMIT 7.5 — refactor: renomeações de baixo risco
**Status:** `[X]` (fragmentado em 4 sub-commits para revisão isolada)

**Sub-commits aplicados:**
- `[X]` `e582006` 7.5a — Pasta `UpdateDraw/` → `FinalResult/` + arquivo `UpdateDray.processor.ts` → `FinalResult.processor.ts` (typo) + `UpdateDraw.handler.ts` → `FinalResult.handler.ts`.
- `[X]` `5e44359` 7.5b — `team.Switches` → `team.switches` (camelCase).
- `[X]` `a405473` 7.5c — `GameManager.addPlayerList` → `setPlayers` + reset de `playersWithoutTeam` antes do loop.
- `[X]` `5b1210b` 7.5d — `GameManager.removeFirstNext` → `tirarDaFila` (vocabulário do domínio).

**Follow-up consciente (não feito):** os identificadores TS `UpdateDrawHandler` e `BaseUpdateDrawHandler` continuam com o nome antigo apesar do arquivo se chamar `FinalResult.handler.ts`. Renomear é PR separado.

**Critério atendido:** `npm test` verde após cada sub-commit (39/381). Busca por `Switches`, `UpdateDray`, `removeFirstNext`, `addPlayerList` retorna 0 no código.

---

#### COMMIT 7.6 — fix: ajustes pontuais (Timer.continue, Player.id via ctor, playersWithoutTeam)
**Status:** `[X]` `82977a5` (mais fix do `playersWithoutTeam` antecipado no 7.5c)

**Mudanças aplicadas:**
- `Timer.continue(): void` — retorno explícito.
- `Player` e `Team` aceitam **objeto de input** (`PlayerInput`/`TeamInput`) com `id?` opcional. Elimina os casts feios `(player as { id }).id = dto.id` e `(team as { id }).id = dto.id` no serializer. Chamadores passam de `new Player('X')` para `new Player({ name: 'X' })` e de `new Team(N)` para `new Team({ limit: N })`.
- `setPlayers` zera `playersWithoutTeam` antes do loop — **já feito no 7.5c** como parte do renomeação (semântica de "set" exige reset).

**Critério atendido:** specs verdes; `as { id: string }` removido do serializer.

---

## 🛌 Em pausa (re-ativar depois)

### Sistema de travas (locks)

Os arquivos abaixo continuam no repo, mas o `registry.yaml` está vazio
durante a fase de estabilização — para não criar fricção com refatorações
que vão tocar várias camadas. Reativar quando o produto estiver estável.

```
features/registry.yaml      ← lista de travas (vazia por enquanto)
features/README.md          ← guia
bin/check-lock.py           ← CLI
.githooks/commit-msg        ← hook git
.github/workflows/lock-check.yml  ← CI (passa verde com registry vazio)
```

Para ativar de volta:
```powershell
python bin/check-lock.py lock <id> --description "..." <arquivos>
```

### GitHub Actions

Sem novos workflows nesta fase. O `lock-check.yml` continua, mas não barra
nada enquanto não houver travas no registry.

---

## Notas

- Cada commit deve ter `npm test` passando antes e depois.
- A ordem 1 → 2 → 3 → 4 → 5 → 6 é deliberada: bugs bloqueadores primeiro
  (sem isso o app nem é testável), depois estado confiável (sem isso bugs
  voltam mascarados), depois fluxos, depois persistência, depois visual,
  depois testes de UI.
- Quando começar uma etapa, verifique se as dependentes estão verdes.
