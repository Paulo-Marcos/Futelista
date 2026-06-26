---
trigger: model_decision
description: Utilizar quando for mexer na camada Expo/React Native (app/, components/, providers/, contexts/, hooks/).
---

# Regras para a camada Mobile (Expo + React Native)

A UI fica em `app/` (rotas Expo Router), `components/`, `providers/`, `contexts/`, `hooks/`.

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
- Passe ao `useGameSlice` um **seletor** que devolve só o slice necessário. Subscreva o **mínimo** que o componente precisa: subscrever um array enorme só para ler `.length` causa re-render desnecessário (`@react-best-practices: rerender-derived-state`).

## Listas

- Listas variáveis: `FlatList` ou `SectionList` com `keyExtractor` por `id`.
- `Array.map` dentro de `ScrollView` só para listas curtas e fixas.

## Navegação

- O projeto usa **Expo Router** (file-based) em `app/`.
- Não misture `createNativeStackNavigator` / `createBottomTabNavigator` com Expo Router no mesmo nível sem entender as consequências. Hoje há ambos em `app/(tabs)/_layout.tsx` — assume-se que será unificado.
- Nomes de rotas devem refletir a função: `index`, `jogadores`, `times`, `partida-atual`, `placar`. Evite `index2`, `Geriamento`.

## Componentes

- "Burros" (JSX + estilo) ficam em `components/`.
- "Inteligentes" (lógica + chamada a `useSoccer`) ficam em `app/` ou em hooks dedicados.
- Componente passa de 80 linhas? Extraia subcomponentes ou hooks.

## Estilo

- Sem hardcode de cores no JSX (`backgroundColor: "red"` para debug não fica em produção).
- Cores no [constants/Colors.ts](../../constants/Colors.ts) com suporte a light/dark.
- `StyleSheet.create` no fim do arquivo, com seções nomeadas.

## TypeScript

- `strict: true` está ligado ([tsconfig.json](../../tsconfig.json)). Sem `any`. Sem `// @ts-ignore` silencioso.
- Imports do alias `@/` apontam para a raiz do projeto.

## Antes de declarar pronto

- Rode no Expo Go ou emulador. Type-check e lint não detectam regressão visual.
- Verifique todas as telas afetadas (especialmente as que compartilham o `GestorJogo`).
- Se mexeu em texto/string, valide nas telas onde aparece.
