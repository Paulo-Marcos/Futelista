# Plano de Commits — FuteLista

Arquivo de controle para organizar refatoração e implementação de boas práticas no FuteLista.

**Legenda de status:**

- `[ ]` Aguardando refatoração
- `[R]` Refatorado, aguardando revisão
- `[OK]` Revisado e aprovado
- `[X]` Commitado

---

## COMMIT 1 — chore: documentação e governança (CLAUDE/AGENTS/AI_NAVIGATION + skills + locks)

**Contexto:** Estabelece governança do projeto (skills, regras, sistema de locks, hooks, CI). Sem mudanças de código de produto.
**Status:** `[ ]`

### Arquivos novos

```
CLAUDE.md
AGENTS.md
AI_NAVIGATION.md
COMMITS_PLAN.md
.claude/rules/{domain,mobile,testing}.md
.claude/skills/{clean-code,uncle-bob-craft,domain-driven-design,react-best-practices}/...
.agents/rules/{domain,mobile,testing}.md
.agents/skills/{clean-code,uncle-bob-craft,domain-driven-design,react-best-practices}/...
features/registry.yaml
features/README.md
bin/check-lock.py
.githooks/commit-msg
.githooks/README.md
.github/workflows/lock-check.yml
```

### Critérios

- `python bin/check-lock.py list` imprime "Nenhuma trava ativa."
- `git config core.hooksPath .githooks` configurado por clone (manual, não versionável).
- `npm test` continua passando (não tocamos código).

---

## COMMIT 2 — chore: remove código morto e arquivos do template

**Contexto:** Limpar entulho que confunde Expo Router e polui o diff.
**Status:** `[ ]`

### Arquivos a remover

```
app/_layou_t.tsx               # typo, duplicata "morta" de _layout.tsx
app/in_dex.tsx                 # typo, duplicata "morta" de index.tsx
app-example/                   # pasta inteira (template create-expo-app)
components/HomeTabs.tsx        # duplicata do app/(tabs)/_layout.tsx, não referenciado
```

### Arquivos a editar

```
app/(tabs)/_layout.tsx         # remover 175 linhas comentadas
providers/soccerProvider.tsx   # remover 9 console.log
```

### Critérios

- `npm test` passa.
- `npm start` sobe e a navegação por tabs funciona como antes.
- Nenhuma referência quebrada nos imports.

---

## COMMIT 3 — fix(domain): corrige imports case-sensitive e bug em Team.switchPlayer

**Contexto:** Imports com casing errado quebram CI Linux; `splice(index)` sem 2º arg remove até o fim do array em vez de remover 1.
**Status:** `[ ]`

### Arquivos a editar

```
src/domain/Goal.ts             # import './player' → './Player'
src/domain/Game.spec.ts        # import './player' → './Player'
src/domain/Team.ts             # splice(index) → splice(index, 1) em switchPlayer
src/domain/Team.spec.ts        # adiciona regressão para switchPlayer
```

### Critérios

- `npm test` passa.
- Cria um teste que falha **antes** do fix e passa **depois** (regressão).

---

## COMMIT 4 — refactor(navigation): unifica rotas Expo Router e renomeia tabs

**Contexto:** Hoje `app/(tabs)/_layout.tsx` usa `createBottomTabNavigator` por dentro do Expo Router. Unifica usando `Tabs` do `expo-router` e renomeia para vocabulário do domínio.
**Status:** `[ ]`

### Mudança proposta

- `app/(tabs)/_layout.tsx` → usa `<Tabs>` do expo-router.
- Renomear arquivos de tela:
  - `index.tsx` (home) → mantém
  - `list.tsx` → `jogadores.tsx`
  - `Teams.tsx` → `times.tsx`
  - `GameManager.tsx` → `placar.tsx` (ou `gerenciamento.tsx`)
  - `CurrentGame.tsx` → `partida-atual.tsx`
- Remover `index2` / `Geriamento` dos screen names.

### Critérios

- Navegação funciona em iOS, Android e Web.
- Tab icons consistentes (sem `backgroundColor: "yellow"` de debug).
- Imports atualizados.

---

## COMMIT 5 — refactor(state): substitui observer manual por padrão reativo

**Contexto:** `soccerProvider` usa `useRef + setState([])` para forçar re-render — anti-pattern. Substituir por observer tipado + `useSyncExternalStore` ou store externo (Zustand).
**Status:** `[ ]`

### Direção (a confirmar antes de codar)

- Opção A — observers no `GameManager` + hook `useSyncExternalStore` (sem dependência nova).
- Opção B — store Zustand que envelopa o `GameManager` e expõe seletores.

### Critérios

- Componentes só re-renderizam quando o slice que consomem muda.
- Sem `setValorAtual([])`.
- Specs do domínio continuam passando.
- Existe teste de hook (caso opção A) ou de store (caso opção B).

---

## COMMIT 6 — feat(persistence): persiste GameManager entre sessões (AsyncStorage)

**Contexto:** Hoje a pelada inteira evapora ao recarregar o app. Persistir snapshots no AsyncStorage.
**Status:** `[ ]`

### Mudança proposta

- Adapter em `src/infrastructure/StoragePort.ts` (interface) + `AsyncStorageAdapter.ts` (implementação).
- Serializador/desserializador do `GameManager` em `src/domain/` (puro, sem dependência de Storage).
- Hook `usePersistedSoccer` que faz hydrate na montagem e save em mudanças (debounced).

### Critérios

- Domínio continua puro (não importa AsyncStorage).
- Tela mostra mesma pelada após `npm start` parar e voltar.
- Testes de roundtrip (serialize → parse → deep equal).

---

## COMMIT 7 — feat(ui): tela de criação de pelada com Rules customizadas

**Contexto:** Hoje a `Rules` é hardcoded (`new Rules()`). Permitir configurar antes de cadastrar jogadores.
**Status:** `[ ]`

### Mudança proposta

- Tela "Nova pelada" → form com jogadoresPorTime, tempo, número de tempos, gols-limite, modo de escolha.
- Validação reaproveita os `check*` da entidade `Rules` (mensagens em PT já prontas).

### Critérios

- Tela acessível como rota inicial.
- Erros aparecem por campo, não em alerta genérico.
- Teste de componente para fluxo de submit válido e inválido.

---

## COMMIT 8 — test(ui): cobertura de componentes críticos

**Contexto:** Hoje só existe o `ThemedText-test.tsx` do template. Adicionar testes para telas de fluxo principal.
**Status:** `[ ]`

### Telas a cobrir (caminho feliz mínimo)

- `app/(tabs)/jogadores.tsx` — adicionar jogador.
- `app/(tabs)/times.tsx` — exibir times criados.
- `app/(tabs)/partida-atual.tsx` — exibir placar.

### Critérios

- `npm test` passa com novos testes.
- Sem snapshots gigantes — preferir `getByText` / `getByRole`.

---

## COMMIT 9 — chore(lock): trava features estáveis do domínio

**Contexto:** Quando os COMMITS 3–5 estabilizarem o domínio, travar para evitar regressão.
**Status:** `[ ]`

### Travas propostas

```yaml
locks:
  - id: domain-rules
    files: [src/domain/Rules.ts, src/domain/Rules.spec.ts]

  - id: domain-team-builder
    files:
      - src/domain/TeamBuilder/CreateTeam.abstract.ts
      - src/domain/TeamBuilder/CreateTeam.factory.ts
      - src/domain/TeamBuilder/CreateTeamByOrder.ts
      - src/domain/TeamBuilder/CreateTeamMixed.ts
      - src/domain/TeamBuilder/CreateTeamMixingTopTwoTeams.ts
      - src/domain/TeamBuilder/*.spec.ts

  - id: domain-update-draw
    files:
      - src/domain/UpdateDraw/UpdateDraw.handler.ts
      - src/domain/UpdateDraw/UpdateDray.processor.ts
      - src/domain/UpdateDraw/WithVictory.ts
      - src/domain/UpdateDraw/WithDrawAndAdvantageAndTwoTeams.ts
      - src/domain/UpdateDraw/WithDrawAndAdvantageAndNotTwoTeams.ts
      - src/domain/UpdateDraw/WithDrawAndExternalAdvantageAndTwoTeams.ts
      - src/domain/UpdateDraw/WithDrawAndExternalAdvantageAndNotTwoTeams.ts
      - src/domain/UpdateDraw/*.spec.ts
```

### Critérios

- `python bin/check-lock.py list` lista as 3 features.
- Tentativa de commit sem `[unlock:<id>]` é rejeitada (testar com `--no-verify` desligado).

---

## Notas

- A ordem 2 → 3 → 4 → 5 → 6 é deliberada: limpa, conserta bugs, organiza navegação, depois mexe em estado, depois persiste.
- Cada commit deve ser auto-contido: `npm test` passa antes e depois.
- Travar (COMMIT 9) só **depois** que o domínio estiver estabilizado.
