---
trigger: model_decision
description: Utilizar quando for mexer no domínio puro do app (src/domain/). Regra crítica de pureza e testabilidade.
---

# Regras para `src/domain/`

`src/domain/` é o **coração** do FuteLista. Tudo o resto orbita em torno dele.

## Pureza obrigatória

- **Sem React**: nada de `import React`, `useState`, `useEffect`, `Component`.
- **Sem React Native**: nada de `react-native`, `View`, `Text`, `Animated`.
- **Sem Expo**: nada de `expo-*`, `expo-router`, `AsyncStorage`.
- **Sem I/O**: sem `fetch`, sem `axios`, sem leitura de arquivos, sem persistência.
- **Sem cliente externo**: nada de Firebase, Supabase, Sentry, analytics.

Exceções aceitas (são polyfills de runtime, não dependências de domínio):

- `import 'react-native-get-random-values'` antes de `import * as uuid from 'uuid'` — necessário para `uuid.v4()` rodar no JS engine do RN.

## Estilo

- Aplicar `@clean-code`, `@uncle-bob-craft`, `@domain-driven-design` (ver [.agents/skills/](../skills/)).
- Funções pequenas (4–20 linhas).
- Nomes em português quando refletirem o vocabulário do domínio (`removeFromGame`, `relocateTeam`, `addToNewTeam`).
- Mensagens de erro em português, descritivas, com o valor ofensor quando relevante.
- Sem `any`. Tipos explícitos. Enums para estados (`PlayerSituation`, `TeamSituation`, `TimerStatus`).

## Casing de imports

Imports devem refletir **exatamente** o nome do arquivo. CI Linux é case-sensitive.

```ts
// ✅ correto
import { Player } from './Player';

// ❌ falha em CI Linux mesmo passando no Windows
import { Player } from './player';
```

## Testes

- Todo arquivo de entidade/serviço tem um `*.spec.ts` co-localizado.
- F.I.R.S.T.: rápidos, independentes, repetíveis, auto-validantes, escritos a tempo.
- Cobrir caminho feliz **e** invariantes (limites, erros).
- Não mockar entidades de domínio entre si — elas formam o grafo natural.
- Para colaboradores externos (se houver no futuro), use fakes nomeados, não stubs inline.

## Padrões já aplicados (não reinventar)

- **Factory + Strategy** para escolha de times: [TeamBuilder/CreateTeam.factory.ts](../../src/domain/TeamBuilder/CreateTeam.factory.ts).
- **Chain of Responsibility** para pós-partida: [UpdateDraw/UpdateDray.processor.ts](../../src/domain/UpdateDraw/UpdateDray.processor.ts).
- **Aggregate Root** = `GameManager`: tudo que muda fluxo da pelada passa por ele.

## Quando adicionar uma classe nova

1. Tem invariante de domínio? Vira entidade ou Value Object.
2. É só dados? Pode ser um `type`/`interface`.
3. Tem variação de comportamento? Strategy + Factory (siga o padrão do TeamBuilder).
4. Cadeia de decisões mutuamente excludentes? Chain of Responsibility (siga UpdateDraw).
5. Cria `*.spec.ts` antes ou junto da implementação.
