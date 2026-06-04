# AI Navigation Index

Este arquivo é a porta de entrada para uma IA navegar no projeto sem varrer tudo.
Atualize quando criar fluxos, telas, regras de domínio ou decisões importantes.

## Como Usar

1. Comece por este arquivo.
2. Abra apenas o documento de índice do assunto relevante em `docs/ai-index/` (quando existir).
3. Só depois leia os arquivos-fonte citados no índice.
4. Ao concluir uma entrega, registre:
   - arquivos alterados;
   - telas e fluxos envolvidos;
   - decisões que evitam investigação repetida.

## Mapa Rápido

### Camada de domínio (puro TS, testado)

- Entidades: [src/domain/Player.ts](src/domain/Player.ts), [src/domain/Team.ts](src/domain/Team.ts), [src/domain/Match.ts](src/domain/Match.ts), [src/domain/Goal.ts](src/domain/Goal.ts), [src/domain/Switch.ts](src/domain/Switch.ts), [src/domain/ScreenTime.ts](src/domain/ScreenTime.ts), [src/domain/Timer.ts](src/domain/Timer.ts), [src/domain/Rules.ts](src/domain/Rules.ts)
- Agregado raiz: [src/domain/GestorJogo.ts](src/domain/GestorJogo.ts)
- Criação de times (Factory + Strategy): [src/domain/TeamBuilder/](src/domain/TeamBuilder)
  - Factory: [CreateTeam.factory.ts](src/domain/TeamBuilder/CreateTeam.factory.ts)
  - Estratégias: `CreateTeamByOrder`, `CreateTeamMixed`, `CreateTeamMixingTopTwoTeams`
- Pós-partida (Chain of Responsibility): [src/domain/FinalResult/](src/domain/FinalResult)
  - Processor: [FinalResult.processor.ts](src/domain/FinalResult/FinalResult.processor.ts)
  - Handlers: `WithVictory`, `WithDrawAndAdvantageAndTwoTeams`, `WithDrawAndAdvantageAndNotTwoTeams`, `WithDrawAndExternalAdvantage*`

### Camada de UI (Expo Router)

- Layout raiz: [app/_layout.tsx](app/_layout.tsx)
- Tabs: [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx)
- Telas:
  - Home: [app/(tabs)/index.tsx](app/(tabs)/index.tsx)
  - Lista de jogadores: [app/(tabs)/list.tsx](app/(tabs)/list.tsx)
  - Times (carrossel): [app/(tabs)/Teams.tsx](app/(tabs)/Teams.tsx)
  - Gerenciamento: [app/(tabs)/GestorJogo.tsx](app/(tabs)/GestorJogo.tsx)
  - Partida atual: [app/(tabs)/CurrentGame.tsx](app/(tabs)/CurrentGame.tsx)

### Cola React ↔ domínio

- Context: [contexts/soccerContext.ts](contexts/soccerContext.ts)
- Provider: [providers/soccerProvider.tsx](providers/soccerProvider.tsx)
- Hook de acesso: [hooks/useSoccer.ts](hooks/useSoccer.ts)
- Composição de providers: [providers/myProviders.tsx](providers/myProviders.tsx)

### Componentes reutilizáveis

- [components/ThemedText.tsx](components/ThemedText.tsx), [components/ThemedView.tsx](components/ThemedView.tsx)
- [components/ParallaxScrollView.tsx](components/ParallaxScrollView.tsx)
- Ícones e navegação: [components/navigation/TabBarIcon.tsx](components/navigation/TabBarIcon.tsx), [components/Icons.tsx](components/Icons.tsx)

### Testes

- Todos em `*.spec.ts` co-localizados com o código (Jest + jest-expo).
- Cobertura focada no domínio: ~20 specs em [src/domain/](src/domain).
- Componentes ainda sem testes além do template (`components/__tests__/ThemedText-test.tsx`).

## Governança

- Locks de feature: [features/registry.yaml](features/registry.yaml), guia completo em [features/README.md](features/README.md).
- CLI de locks: [bin/check-lock.py](bin/check-lock.py).
- Hook git: [.githooks/commit-msg](.githooks/commit-msg).
- CI: [.github/workflows/lock-check.yml](.github/workflows/lock-check.yml).
- Regras por área: [.claude/rules/](.claude/rules/) (espelhado em [.agents/rules/](.agents/rules/)).
- Skills: [.claude/skills/](.claude/skills/) (espelhado em [.agents/skills/](.agents/skills/)).

## Regras de Manutenção

- Prefira links para arquivos e funções em vez de textos longos.
- Mantenha este índice pequeno, orientado a decisão.
- Quando um comportamento parecer estranho, registre a causa raiz depois de corrigir.
- Se um fluxo tem etapas, documente os nomes exatos dos arquivos.
