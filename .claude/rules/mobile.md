---
trigger: model_decision
description: Utilizar quando for mexer na camada Expo/React Native (app/, src/app-shell/, src/shared/).
---

# Regras para a camada Mobile (Expo + React Native)

A UI fica em `app/` (rotas Expo Router file-based), na cola React de `src/app-shell/` (provider, contexto e hooks) e nos componentes/transversais de `src/shared/` (`ui/`, `theme/`, `hooks/`, `navigation/`, `prefs/`).

## Skills aplicáveis

- `@clean-code` — nomes, tamanho de função, código morto.
- `@react-best-practices` — re-render, derived state, lazy init, transitions, listas grandes.

## Acesso ao domínio

- **Sempre** via `useSoccer()` (que entrega o `GestorJogo` do Context).
- **Nunca** instanciar `GestorJogo`, `Player`, `Team`, `Match` em componente — deixe isso para o provider.
- Componente consome estado, dispara métodos do `GestorJogo`, recebe novos valores via observers/seleção.

## Estado e re-render

- **Não** force re-render com `setValorAtual([])`. Isso é cheiro de gambiarra.
- O padrão reativo já está **decidido e implementado** ([ADR-0002](../../docs/adr/0002-reatividade-external-store.md)): o `GestorJogo` implementa o contrato de **external store** do React — expõe `subscribe(listener)`, `version` e chama `notify()` internamente a cada mudança de estado (inclusive ticks do `Timer`).
- Para reagir a mudanças do domínio, **sempre** consuma via [`useGameSlice`](../../src/app-shell/useGameSlice.ts) (ou `useGameSliceRequired` quando há garantia de execução ativa). O hook centraliza o `useSyncExternalStore` — não escreva `useSyncExternalStore` solto no componente nem reintroduza observers ad hoc.
- O `useGameSlice` compara **só `version`** (ADR-0002): todo `notify()` — inclusive cada tick do `Timer` — re-renderiza **todo** componente que usa o hook, seja qual for o seletor. O seletor **não** evita re-render; ele decide a **referência** que chega aos filhos `React.memo`/`useMemo`. Por isso prefira seletores que devolvem primitivos (`g.players.length`, `g.playing?.teamA.id`) em vez de objetos inteiros.
- **Arrays do domínio são vivos**: o `GestorJogo` faz `splice`/`push` no próprio `next`, `players`, `team.players` e `playing.goals` — a referência nunca muda. Nunca use esses arrays como dependência de `useMemo` nem os passe direto a um filho `React.memo`: o memo congela a versão antiga (fila que não reordena, banco com quem já entrou). Leia listas com [`useGameListaRequired`](../../src/app-shell/useGameSlice.ts), que devolve uma cópia identificada por uma chave de ids (nova quando a composição/ordem muda, estável num tick).

## Listas

- Listas variáveis: `FlatList` ou `SectionList` com `keyExtractor` por `id`.
- `Array.map` dentro de `ScrollView` só para listas curtas e fixas.

## Navegação

- O projeto usa **Expo Router** (file-based) em `app/`. Não há tab-bar imperativa: as rotas são definidas por arquivos.
- O fluxo da pelada vive no grupo `app/(pelada)/` (`index`, `jogadores`, `times`, `partida`, `historico`, `_layout`); telas avulsas ficam direto em `app/` (`configuracoes`, `regras`, `onboarding`, `resultado`, `peladas/`, …).
- Prefira o roteamento file-based do Expo Router; não reintroduza `createNativeStackNavigator` / `createBottomTabNavigator` no mesmo nível sem entender as consequências.
- Nomes de rotas devem refletir a função: `index`, `jogadores`, `times`, `partida`, `historico`. Evite `index2`, `Geriamento`.

## Componentes

- "Burros" (JSX + estilo) reutilizáveis ficam em `src/shared/ui/` (com subpastas/agrupamento por tela quando fizer sentido: jogadores, times, home, partida).
- "Inteligentes" (lógica + chamada a `useSoccer`) ficam nas rotas de `app/` ou em hooks dedicados de `src/app-shell/`.
- Componente passa de 80 linhas? Extraia subcomponentes ou hooks.

## Estilo

- Sem hardcode de cores no JSX (`backgroundColor: "red"` para debug não fica em produção).
- Cores e tema em [src/shared/theme/](../../src/shared/theme/) (ex.: [Colors.ts](../../src/shared/theme/Colors.ts)) com suporte a light/dark.
- `StyleSheet.create` no fim do arquivo, com seções nomeadas.

## TypeScript

- `strict: true` está ligado ([tsconfig.json](../../tsconfig.json)). Sem `any`. Sem `// @ts-ignore` silencioso.
- Imports do alias `@/` apontam para a raiz do projeto.

## Antes de declarar pronto

- Rode no Expo Go ou emulador. Type-check e lint não detectam regressão visual.
- Verifique todas as telas afetadas (especialmente as que compartilham o `GestorJogo`).
- Se mexeu em texto/string, valide nas telas onde aparece.
