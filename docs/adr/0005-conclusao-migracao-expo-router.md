# 0005 — Conclusão da migração para Expo Router

**Status:** aceito
**Data:** 2026-06-26

## Contexto

O [ADR-0001](0001-expo-router.md) decidiu **manter o Expo Router file-based**
como roteador único do app, mas registrou um **estado transitório**: na época,
o `createBottomTabNavigator` imperativo (React Navigation) ainda coexistia com o
roteamento file-based dentro de `app/(tabs)/_layout.tsx`. Eram, na prática, dois
navegadores disputando a hierarquia, com cerca de 175 linhas comentadas e cores
hard-coded testemunhando a indecisão.

O ADR-0001 condicionou a remoção dessa duplicação a um momento futuro ("quando a
UI for unificada, remover o `createBottomTabNavigator` imperativo"). Como ADR
aceito é **imutável**, o fechamento desse estado transitório precisa ser
registrado num ADR novo — este.

## Decisão

**Registrar que a migração para Expo Router está concluída.** A tab-bar
imperativa (`createBottomTabNavigator` / `createNativeStackNavigator`) foi
**removida** do código, e a navegação é hoje **100% Expo Router file-based**,
organizada no agrupamento de rotas `app/(pelada)/`. Não há mais dois navegadores
coexistindo nem linhas comentadas remanescentes da indecisão.

## Alternativas consideradas

### A. Registrar a conclusão num ADR novo (escolhida)

**Prós**
- Preserva a imutabilidade do ADR-0001.
- Deixa rastro explícito de que o estado transitório foi resolvido — quem ler o
  0001 daqui a 6 meses encontra o desfecho.

**Contras**
- Adiciona um arquivo a mais à série de ADRs.

### B. Editar o ADR-0001 marcando-o como realizado

**Contras**
- Viola a regra de imutabilidade descrita no [README dos ADRs](README.md):
  "ADR aceito é imutável — mudou de ideia? Crie um novo".
- Reescreveria a história em vez de registrá-la.

## Consequências

### Boas
- O [ADR-0001](0001-expo-router.md) é considerado **plenamente realizado**: a
  decisão de roteador único saiu do estado transitório para o estado final.
- Sem dívida de navegação pendente — não há `createBottomTabNavigator` nem
  `createNativeStackNavigator` no código.
- O mapa do app continua legível por arquivos (`ls app/`), agora sem ambiguidade
  entre file-based e imperativo.

### Ruins (ou trade-offs)
- Nenhum relevante. A remoção elimina duplicação, não introduz indireção nova.

### Neutras
- Este ADR **conclui** (não substitui) o estado transitório do ADR-0001: a
  decisão original permanece válida; apenas seu desfecho passa a estar
  registrado.

## Referências

- [ADR-0001 — Expo Router file-based como roteador](0001-expo-router.md) —
  decisão original e descrição do estado transitório.
- `app/(pelada)/` — agrupamento de rotas file-based que materializa a navegação
  única.
- [docs/desenvolvedor/ui.md → Rotas](../desenvolvedor/ui.md#rotas-expo-router).
