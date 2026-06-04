# CLAUDE.md

Guia para Claude Code (claude.ai/code) ao trabalhar neste repositório.

---

## Princípios de Engenharia (aplicar com pragmatismo)

Esta é uma aplicação pessoal. Aplique o que faz sentido para o tamanho do projeto; **não invente abstrações para o futuro**. Quando em dúvida sobre escopo, prefira o caminho mais direto.

### Testes
- Código novo em `domain/` ou `services/` nasce com pelo menos um teste de caminho feliz.
- Se uma alteração quebra teste existente, a tarefa **não** está pronta — investigue a causa antes de continuar.

### Clean Code (Uncle Bob)
- Nomes intencionais: verbos para funções, substantivos para entidades de domínio.
- Funções pequenas, com uma responsabilidade clara.
- Comente o "porquê" não-óbvio; nunca o "o quê" (o nome já diz).
- Sem código morto, sem TODO genérico, sem `console.log` / `print` esquecidos.

### Clean Architecture
Camadas e dependências do backend:

```
routers/ (HTTP)  →  services/ (orquestração)  →  domain/ (puro)
                                              ↘  infrastructure/ (n8n, Gemini, FFmpeg)
```

- `domain/` é **puro**: sem FastAPI, sem SQLAlchemy, sem HTTP, sem cliente externo.
- Routers só convertem HTTP ↔ serviço; nada de lógica de negócio.
- Frontend: componente "burro" (UI/JSX) separado de hook/serviço (lógica + I/O).

### DDD pragmático
- Cada feature travada em `registry.yaml` corresponde aproximadamente a um bounded context.
- Vocabulário do domínio (`Projeto`, `Corte`, `Short`, `Metadado`, `Ingestão`, `Análise`) é **consistente** em código, banco e UI — não invente sinônimos.
- Status enums (`StatusProjeto`, `StatusCorte`, `StatusShort`) são parte do contrato; mudanças exigem migração de banco.

### Não-regressão
- Não "limpe" código adjacente ao que você precisa mudar. Refactor de brinde = PR separado.
- Antes de declarar uma tarefa pronta: rode os testes que tocam a área alterada.
- Em mudanças de UI: teste no navegador, não confie só no type-check.

### Em caso de dúvida
**Pergunte antes de editar.** O custo de uma pergunta é baixo; o custo de uma regressão silenciosa em algo já estável é alto.

### Frontend (vale o mesmo padrão)
Estas boas práticas valem **também no frontend** deste projeto. Aplique, além disso, as melhores práticas de desenvolvimento de software:

- **Web / React**: componentes pequenos e focados; separação clara entre componente burro (JSX/estilo) e hook (lógica + I/O); estado mínimo necessário e elevado só quando justificado; `key` estável em listas; evitar re-render desnecessário (`useMemo`/`useCallback` quando o profiler indicar, não preventivamente); efeitos com dependências corretas e cleanup; acessibilidade básica (labels, foco, contraste).
- **Mobile / React Native + Expo**: listas grandes com `FlatList`/`SectionList` (nunca `Array.map` dentro de `ScrollView` para listas variáveis); `keyExtractor` por `id`; respeitar safe area; teste em iOS, Android e Web quando o componente for compartilhado; cuidado com `Image` (cache, dimensões), animações via `Animated`/`Reanimated` no driver nativo quando possível; offline-first quando houver persistência.
- **Adaptação ao FuteLista**: este projeto não tem backend FastAPI/SQLAlchemy nem `infrastructure/n8n/Gemini/FFmpeg` — a "camada pura" equivalente é [src/domain/](src/domain/), e a "cola" entre UI e domínio são [providers/](providers/), [contexts/](contexts/) e [hooks/](hooks/). O vocabulário aqui é **Pelada / Partida / Time / Jogador / Vantagem / Próximos** (não `Projeto/Corte/Short`). Os enums de contrato são `PlayerSituation`, `TeamSituation`, `TimerStatus`, `ResultMatch`, `ChoosingTeams`. Em "teste no navegador" entenda **teste no Expo Go / emulador / web**.

---

## Visão Geral

**FuteLista** é um app **Expo Router + React Native** (TypeScript estrito) para gerenciar peladas de futebol: cadastrar jogadores, montar times, gerenciar partidas, trocar jogadores, contabilizar gols, controlar cronômetro e atualizar a fila de "próximos" de acordo com vitória, empate ou vantagem.

- **Plataformas**: iOS, Android, Web (Metro bundler).
- **Estado atual**: domínio rico testado em [src/domain](src/domain); UI ainda em construção.
- **Idioma do domínio**: português (Pelada, Partida, Time, Jogador, Vantagem, Próximos).

## Comandos de Desenvolvimento

```bash
npm install              # Instala dependências
npm start                # Expo dev server (escolhe iOS/Android/Web/Expo Go)
npm run android          # Abre direto no emulador Android
npm run ios              # Abre direto no simulador iOS
npm run web              # Abre versão web
npm test                 # Jest em watch mode (preset jest-expo)
npm run lint             # ESLint (config expo + prettier)
```

## Arquitetura

```
app/                    ← Rotas Expo Router (file-based routing)
  (tabs)/               ← Tabs (index, list, Teams, GestorJogo, CurrentGame)
  _layout.tsx           ← Layout raiz com ThemeProvider + MyProviders
src/
  domain/               ← Domínio puro TS, sem React, sem I/O, sem persistência
    Player, Team, Match, Goal, Switch, ScreenTime, Timer, Rules
    GestorJogo        ← Agregado raiz / orquestrador
    TeamBuilder/       ← Factory + Strategy: criação de times
    FinalResult/       ← Chain of Responsibility: pós-partida
components/             ← Componentes RN reutilizáveis (ThemedText, ParallaxScrollView…)
contexts/               ← React Contexts (SoccerContext)
providers/              ← Provider que injeta o GestorJogo via Context
hooks/                  ← Hooks (useSoccer, useColorScheme, useThemeColor)
constants/              ← Cores e constantes
assets/                 ← Fontes, imagens, ícones
```

### Dependência entre camadas

```
app/ (rotas)  →  hooks/providers/contexts  →  src/domain/ (puro)
```

- `src/domain/` é **puro**: sem React, sem Expo, sem AsyncStorage, sem HTTP.
- Componentes em `app/` e `components/` consomem domínio **apenas via hooks/providers** — nunca instanciam `GestorJogo` direto.
- Lógica de negócio mora no domínio. Componentes só renderizam e disparam ações.

## Conceitos do Domínio

- **Player** — jogador da pelada (id, nome, gols, times, partidas, situação).
- **Team** — time formado por N jogadores (`playersPerTeam` da `Rules`). Gerencia trocas, gols recebidos/feitos, situação.
- **Match** — partida entre dois times. Computa gols, vencedor, empate.
- **GestorJogo** — agregado que orquestra a pelada inteira: lista de jogadores, fila de `next`, `playing` atual, histórico de partidas, `advantageToNext`, `Timer` ativo.
- **Rules** — política da pelada (jogadores por time, tempo, número de tempos, gols-limite, modo de escolha de times).
- **Timer** — cronômetro com `TimerStatus` (CREATED, STARTED, PAUSED, INTERVAL, ENDED).
- **ScreenTime** — `(stroke, timeStroke)` representando o instante de um gol.
- **Switch** — registro de substituição (entra/sai/time).

### Modos de escolha de times (`ChoosingTeams`)

- `BY_ORDER` — times formados na ordem de inscrição.
- `BY_ORDER_MIXING_TOP_TWO_TEAMS` — embaralha apenas os primeiros 2× times, mantém o resto.
- `BY_MIXING_TEAMS` — embaralha tudo.

Implementado via **Factory + Strategy** em [src/domain/TeamBuilder](src/domain/TeamBuilder).

### Pós-partida (`FinalResultProcessor`)

Cadeia em [src/domain/FinalResult](src/domain/FinalResult) decide quem vai pra próxima:

1. `WithVictory` — vitória: perdedor vai pro fim, vencedor segue com vantagem.
2. `WithDrawAndAdvantageAndTwoTeams` — empate com vantagem prévia e fila cheia.
3. `WithDrawAndAdvantageAndNotTwoTeams` — empate com vantagem prévia e fila parcial.
4. `WithDrawAndExternalAdvantageAndNotTwoTeams` — empate com vantagem externa (manual) e fila parcial.
5. `WithDrawAndExternalAdvantageAndTwoTeams` — empate com vantagem externa (manual) e fila cheia.

## Regras de Código

Este projeto adota guidelines baseadas em skills (ver [.claude/skills](.claude/skills)):

- **Domínio (`src/domain/`)**: aplicar `@clean-code`, `@uncle-bob-craft`, `@domain-driven-design`.
- **UI (`app/`, `components/`, `providers/`, `hooks/`)**: aplicar `@clean-code`, `@react-best-practices`.
- **Testes (`*.spec.ts`)**: aplicar `@clean-code` (F.I.R.S.T.) e princípios TDD do `@uncle-bob-craft`.

As regras por área estão em [.claude/rules/](.claude/rules/).

---

## Protocolo de Alteração (Lock de Funcionalidades)

> **Esta seção vale para qualquer agente de IA — Claude, Cursor, Codex, Cline, Copilot, etc.**

### Antes de editar QUALQUER arquivo

1. Verifique se ele aparece em [`features/registry.yaml`](features/registry.yaml).
2. Se aparecer, **o arquivo está TRAVADO**: você pode lê-lo, mas **não pode editar, deletar, renomear, mover, nem criar substituto em outro caminho**.
3. Para destravar, **peça autorização explícita ao desenvolvedor**. Não decida sozinho. Não tente burlar (renomear arquivo, refazer noutro lugar, dividir em vários).
4. Se o arquivo NÃO aparece no registry, edite normalmente — respeitando os princípios abaixo.

### Como o desbloqueio funciona

Quando o desenvolvedor autorizar, ele incluirá no commit a marca:

```
[unlock:<feature-id>] motivo: <razão curta>
```

O hook `.githooks/commit-msg` e o workflow `.github/workflows/lock-check.yml` validam isso. Sem a marca, o commit é rejeitado (local e/ou no PR).

### Comandos úteis

```powershell
# Listar travas ativas
python bin/check-lock.py list

# Checar se um conjunto de arquivos está travado
python bin/check-lock.py check src/domain/GestorJogo.ts

# Instalar o hook git (uma vez por clone)
git config core.hooksPath .githooks
```

Detalhes completos em [features/README.md](features/README.md).

---

## Princípios de Engenharia (aplicar com pragmatismo)

Este é um app pessoal. Aplique o que faz sentido para o tamanho do projeto; **não invente abstrações para o futuro**. Quando em dúvida sobre escopo, prefira o caminho mais direto.

### Testes

- Código novo em `src/domain/` **nasce com pelo menos um teste de caminho feliz** e um de borda quando houver invariante.
- Se uma alteração quebra teste existente, a tarefa **não** está pronta — investigue a causa antes de continuar.
- Rode `npm test` antes de fechar uma tarefa que toca o domínio.

### Clean Code (Uncle Bob)

- Nomes intencionais: verbos para funções (`addPlayer`, `setNextMatch`), substantivos para entidades (`Player`, `Match`).
- Funções pequenas (4–20 linhas), com uma responsabilidade clara.
- Comente o "porquê" não-óbvio; nunca o "o quê" (o nome já diz).
- Sem código morto, sem TODO genérico, sem `console.log` esquecido.
- Strings de erro em português e específicas: `"Limite mínimo de jogadores por time é 1."`, não `"erro"`.

### Clean Architecture

```
app/ (rotas Expo)  →  providers/contexts/hooks (cola React)  →  src/domain/ (puro)
```

- `src/domain/` é **puro**: sem `expo-*`, sem `react`, sem `react-native`, sem `AsyncStorage`, sem `fetch`.
- Componentes em `app/` e `components/` **não instanciam** entidades de domínio diretamente — passam pelo `GestorJogo` via `useSoccer()`.
- Componente "burro" (JSX/estilo) separado de hook (lógica + leitura de estado).

### DDD pragmático

- Cada feature relevante em `registry.yaml` corresponde aproximadamente a um conjunto coeso (entidade + serviços + testes).
- Vocabulário do domínio (`Pelada`, `Partida`, `Time`, `Jogador`, `Vantagem`, `Próximos`) é **consistente** em código, UI e mensagens — não invente sinônimos.
- Enums (`PlayerSituation`, `TeamSituation`, `TimerStatus`, `ResultMatch`, `ChoosingTeams`) são parte do contrato; mudanças exigem revisar todos os consumidores e testes.

### React / React Native

- Estado vive nos hooks/providers. Componentes lêem via `useSoccer()`.
- Evite forçar re-render com `setState([])`. Quando precisar reagir a mudanças do `GestorJogo`, use um pattern reativo (observers tipados, store externo, ou estado derivado por seleção).
- Listas grandes: use `FlatList`/`SectionList`, não `Array.map` dentro de `ScrollView`.
- Imports devem respeitar o casing exato do arquivo (ex.: `./Player`, não `./player`) — falha em CI Linux.

### Não-regressão

- Não "limpe" código adjacente ao que você precisa mudar. Refactor de brinde = PR separado.
- Antes de declarar uma tarefa pronta: rode os testes que tocam a área alterada (`npm test`).
- Em mudanças de UI: teste no app (Expo Go ou emulador), não confie só no `tsc` / lint.

### Em caso de dúvida

**Pergunte antes de editar.** O custo de uma pergunta é baixo; o custo de uma regressão silenciosa em algo já estável é alto.
