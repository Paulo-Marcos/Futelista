# `src/domain` — núcleo de domínio (puro)

Domínio do FuteLista: entidades, regras e padrões que não dependem de React, Expo, AsyncStorage ou qualquer fonte de I/O.

A pasta inteira deve continuar **portável** — em teoria poderia rodar num Node.js zero-config e produzir o mesmo comportamento. A única exceção tolerada é o polyfill `react-native-get-random-values` (necessário para `uuid.v4()` rodar no JS engine do RN).

Detalhes da regra: [`.claude/rules/domain.md`](../../.claude/rules/domain.md).

## Mapa de entidades

| Arquivo | Papel | Imutável? |
|---|---|---|
| [`GameManager.ts`](GameManager.ts) | **Aggregate Root** — orquestra a execução (sessão) inteira de uma pelada. Implementa `subscribe`/`version` para integração com `useSyncExternalStore`. | Não — único ponto autorizado de mutação |
| [`Pelada.ts`](Pelada.ts) | **Tipo cadastrado** (nome + regras default). Não confundir com `GameManager` (execução). | Parcial |
| [`Rules.ts`](Rules.ts) | Política da pelada (jogadores/time, tempo, modo de escolha). Defaults em `RULES_DEFAULTS`. | Sim, por convenção |
| [`Player.ts`](Player.ts) | Jogador participante. Mantém histórico (times, partidas, gols). | Não |
| [`Team.ts`](Team.ts) | Time de até `limit` jogadores. Mantém histórico de partidas, gols, trocas. | Não |
| [`Match.ts`](Match.ts) | Partida entre dois times. Computa vencedor e empate. | Não |
| [`Goal.ts`](Goal.ts) | Gol (partida + autor + time + tempo + `ownGoal`). | Sim |
| [`Switch.ts`](Switch.ts) | Troca de jogador num time. | Sim |
| [`ScreenTime.ts`](ScreenTime.ts) | Instante de um evento (`stroke`, `timeStroke`). | Sim |
| [`Timer.ts`](Timer.ts) | Cronômetro da partida com estados (`CREATED`, `STARTED`, `PAUSED`, `INTERVAL`, `ENDED`). Usa `setInterval`. | Não |

## Padrões aplicados

- **Aggregate Root**: `GameManager` é o único ponto de entrada para mudanças no estado da execução.
- **Factory + Strategy** ([`TeamBuilder/`](TeamBuilder)): `CreateTeamFactory.fabricate(enum)` resolve a estratégia concreta de montagem dos times.
- **Chain of Responsibility** ([`FinalResult/`](FinalResult)): `FinalResultProcessor` encadeia handlers que decidem o que fazer após uma partida (vitória, empate com vantagem interna, empate com vantagem externa).
- **Ports & Adapters**: [`ports/RepositorioPelada.ts`](ports/RepositorioPelada.ts) declara o contrato de persistência. Adapters concretos ficam em [`src/infrastructure/storage/`](../infrastructure/storage/).
- **Observer + External Store**: `GameManager.subscribe(listener)` + `version` snapshot, consumido por `useGameSlice` (em [`src/app-shell/`](../app-shell/)) via `useSyncExternalStore`.

## Enums de contrato

Mudanças nesses enums **quebram** consumidores e payload salvo — exigem migração (ver `serializer.ts:migrarPayload`).

- `PlayerSituation` — `STOPPED`, `ACTIVE`, `NO_TEAM`
- `TeamSituation` — `PLAYING`, `STOPPED`, `ON_NEXT`, `CREATED`
- `TimerStatus` — `CREATED`, `STARTED`, `PAUSED`, `INTERVAL`, `ENDED`
- `ResultMatch` — `DRAW`, `VICTORY`
- `ChoosingTeams` — `BY_ORDER`, `BY_ORDER_MIXING_TOP_TWO_TEAMS`, `BY_MIXING_TEAMS`
- `PeladaStatus` — `CREATED`, `ATIVA`, `FINALIZADA`

## Vocabulário ubíquo (PT)

Pelada · Partida · Time · Jogador · Vantagem · Próximos · Tempo · Cronômetro · Tempos · Limite de gols.
Evitar sinônimos (não dizer "match"/"jogo" intercambiavelmente).

## Testes

Cada entidade tem `*.spec.ts` co-localizado. Cobertura inclui caminho feliz e invariantes (limites, erros de validação). Não mockar entidades entre si — elas formam o grafo natural do domínio.

Cobertura atual (em 2026-06-02): 39 suites, 381 testes verdes.
