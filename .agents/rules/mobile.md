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

- **Sempre** via `useSoccer()` (que entrega o `GameManager` do Context).
- **Nunca** instanciar `GameManager`, `Player`, `Team`, `Match` em componente — deixe isso para o provider.
- Componente consome estado, dispara métodos do `GameManager`, recebe novos valores via observers/seleção.

## Estado e re-render

- **Não** force re-render com `setValorAtual([])`. Isso é cheiro de gambiarra.
- Para reatividade real, prefira uma destas opções (a definir em refactor futuro):
  - Observer tipado no `GameManager` + hook que faz `useSyncExternalStore`.
  - Adapter externo (Zustand, Jotai) que escuta o agregado e expõe seletores.
- Subscreva o **mínimo** que o componente precisa. Subscrever um array enorme só para ler `.length` causa re-render desnecessário (`@react-best-practices: rerender-derived-state`).

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
- Verifique todas as telas afetadas (especialmente as que compartilham o `GameManager`).
- Se mexeu em texto/string, valide nas telas onde aparece.
