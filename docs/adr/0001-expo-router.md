# 0001 — Expo Router file-based como roteador

**Status:** aceito
**Data:** 2026-05-19

## Contexto

O FuteLista nasceu do template do Expo (`create-expo-app`), que já vem com **Expo Router** configurado. Cedo no projeto, surgiu a pergunta: vale a pena manter o Expo Router (file-based) ou migrar para `@react-navigation/native` puro (imperativo)?

A dúvida apareceu por dois motivos:

1. O template colocou um **`createBottomTabNavigator`** dentro de `app/(tabs)/_layout.tsx` (uso imperativo do React Navigation) **junto** do roteamento file-based do Expo Router. Isso é redundante e confuso.
2. O Expo Router 3 ainda era jovem (saiu em meados de 2024); havia receio de paradigma instável.

## Decisão

**Manter Expo Router file-based** como roteador único do app. Quando a UI for unificada, remover o `createBottomTabNavigator` imperativo e usar **apenas** o agrupamento de rotas `app/(tabs)/` do Expo Router.

## Alternativas consideradas

### A. Manter Expo Router (escolhida)

**Prós**
- Convenção igual à do Next.js — barreira de entrada baixa.
- Rotas tipadas (`experiments.typedRoutes: true` em `app.json`).
- Deep linking automático com `scheme: "myapp"`.
- Suporte nativo a iOS/Android/Web no mesmo arquivo.
- Mantido pela Expo — segue o ciclo do SDK.

**Contras**
- Documentação ainda menos densa que React Navigation puro.
- Algumas customizações de tab bar exigem `Tabs.Screen` em vez de prop direta.

### B. Migrar para `@react-navigation/native` imperativo

**Prós**
- Doc e exemplos mais antigos/abundantes.
- Controle total sobre quando declarar cada Stack/Tab.

**Contras**
- Perde file-based routing — toda rota declarada manualmente.
- Perde deep linking automático.
- Perde rotas tipadas (precisaria de tipos manuais).
- Saída do padrão Expo — atrito em upgrades do SDK.

### C. Manter os dois lado a lado (estado atual transitório)

**Contras**
- Duplica responsabilidade.
- Confuso para quem chega ao código.
- Bugs sutis quando os dois disputam a hierarquia de navegação.
- Hoje há cores hard-coded e 175 linhas comentadas testemunhando essa indecisão.

## Consequências

### Boas
- Rotas continuam declaradas como arquivos — fácil ver o mapa do app dando `ls app/`.
- Refatoração futura é localizada (`app/(tabs)/_layout.tsx`) — não vira reescrita.
- Apostamos no caminho oficial da Expo, alinhando com o ciclo do SDK.

### Ruins (ou trade-offs)
- Algumas customizações de UI da tab bar exigem indireção via `Tabs.Screen options`.
- Quando algo dá errado, debug envolve tanto o file-based quanto o histórico do `_layout`.

### Neutras
- Renomes de rota (`index2` → `times`, `Geriamento` → `gerenciamento`) viram mudança de **nome de arquivo** — apenas isso. Está rastreado em [COMMITS_PLAN.md](../../COMMITS_PLAN.md).

## Referências

- [docs/desenvolvedor/ui.md → Rotas](../desenvolvedor/ui.md#rotas-expo-router)
- [Expo Router — docs oficiais](https://docs.expo.dev/router/introduction/)
- `app.json` → `expo.plugins: ["expo-router"]` + `experiments.typedRoutes: true`.
