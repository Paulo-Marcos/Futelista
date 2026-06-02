# `src/shared` — UI, tema, navegação e hooks reutilizáveis

Camada "neutra" da aplicação: componentes, hooks e tokens visuais que não conhecem domínio nem persistência. Onde o domínio precisar aparecer, vem por props (ex.: `PlayerRow` recebe um `Player`).

## Estrutura

| Subpasta | Conteúdo |
|---|---|
| [`theme/`](theme) | Tokens visuais: `Colors` (light/dark Material 3), `Spacing`, `Radius`, `Typography`, `AvatarPalette`. |
| [`hooks/`](hooks) | Hooks atômicos: `useColorScheme`, `useThemeColor`, `usePalette` (paleta resolvida para o tema atual). |
| [`navigation/`](navigation) | Wrappers de ícones para tabs do Expo Router. |
| [`ui/`](ui) | Componentes reutilizáveis (botões, cards, scoreboard, header de pelada, etc.). **Veja [`ui/README.md`](ui/README.md) para o catálogo.** |

## Tokens visuais — ponto único de mudança

Toda cor, espaço, raio ou estilo de texto vem de [`theme/Colors.ts`](theme/Colors.ts):

```ts
import { Colors, Spacing, Radius, Typography } from "@/src/shared/theme/Colors";
import { usePalette } from "@/src/shared/hooks/usePalette";

const palette = usePalette();  // já resolve light/dark
palette.primary, palette.surface, palette.onSurface, ...
```

**Não hardcodar** cores no JSX. Quando uma cor faltar no token, o caminho certo é estender `Colors` (não improvisar no componente).

## Acesso ao domínio — não direto

Componentes em `shared/ui` que precisam ler o estado da pelada usam `useGameSlice` (definido em [`src/app-shell/useGameSlice.ts`](../app-shell/useGameSlice.ts)). Exemplos: `PeladaHeader`, `TabHeader`.

Componentes "burros" (recebem dados por props) preferem essa via — fica mais fácil de testar.

## Convenções

- 1 componente por arquivo, default export nomeado (`export function`).
- Props como `type` no topo do arquivo, **antes** do componente.
- `StyleSheet.create` no final do arquivo.
- Componentes acima de ~80 linhas devem extrair subcomponente ou hook.
