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
