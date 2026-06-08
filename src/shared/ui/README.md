# Catálogo de componentes UI

Componentes reutilizáveis do FuteLista. Todos consomem tokens de [`../theme/Colors.ts`](../theme/Colors.ts) via [`usePalette`](../hooks/usePalette.ts) — **não hardcodar** cor, espaço ou raio.

Quando o componente precisa ler estado da pelada (nome, regras, partida ativa), usa [`useGameSlice`](../../app-shell/useGameSlice.ts).

## Botões e ações

### `PrimaryButton`
Botão preenchido (Material 3) para a ação principal de uma tela.

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `label` | `string` | — | Texto do botão. |
| `onPress` | `() => void` | — | Handler. |
| `icon` | `MaterialIcons.name` | — | Ícone opcional à esquerda do texto. |
| `disabled` | `boolean` | `false` | Desabilita interação e reduz contraste. |
| `fullWidth` | `boolean` | `false` | Ocupa 100% da largura disponível. |
| `testID` / `accessibilityLabel` | `string` | — | Acessibilidade / RTL. |

**Quando usar**: ação principal — "Iniciar partida", "Criar Pelada", "Adicionar jogador".

### `SecondaryButton`
Botão outlined. Mesmas props que `PrimaryButton` + `destructive: boolean` que troca a borda/texto para `error`.

**Quando usar**: ações secundárias e destrutivas ("Cancelar", "Limpar", "Excluir").

### `Fab` — Floating Action Button
Botão circular elevado, fixo no canto inferior direito.

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `icon` | `MaterialIcons.name` | — | Ícone central. |
| `onPress` | `() => void` | — | Handler. |
| `extended` | `{ label: string }` | — | Versão "extended" com texto ao lado do ícone. |
| `testID` / `accessibilityLabel` | `string` | — | Acessibilidade. |

**Quando usar**: ação criadora persistente em telas de listagem (adicionar jogador, criar pelada).

### `ButtonIcon` / `Icons`
Wrappers tipados sobre `@expo/vector-icons`. `Icons` faz switch sobre 6 famílias de ícones; use quando o `type` precisar ser dinâmico.

## Estrutura e layout

### `Card`
Container Material 3 (`variant: "surface" | "primary" | "outlined"`, padding configurável). Sombra suave + cantos arredondados.

### `Collapsible`
Seção expansível com chevron. Props: `{ title: string; children: ReactNode }`.

### `ParallaxScrollView`
ScrollView com header animado por `react-native-reanimated`. Props: `{ headerImage, headerBackgroundColor, children }`. Herança do template Expo — substituir quando refatorar telas de boas-vindas.

### `EmptyState`
Estado vazio padrão para listas sem dados. Centralizado vertical e horizontalmente.

| Prop | Tipo | Descrição |
|---|---|---|
| `icon` | `MaterialCommunityIcons.name` | Ícone grande (64px) no topo. |
| `title` | `string` | Título principal. |
| `description` | `string?` | Texto explicativo opcional. |
| `actionLabel` / `onAction` | `string` / `() => void` | CTA opcional (só renderiza se ambos definidos). |
| `actionDisabled` | `boolean?` | Desabilita o CTA. |

**Quando usar**: lista vazia, sem-resultado de busca, primeira vez na tela.

## Conteúdo de pelada

### `PeladaHeader`
Cabeçalho persistente das tabs dentro de uma execução. Lê do `useGameSlice`: nome, regras (chips), total de jogadores, total de times, partida em andamento e status do timer. Decide um CTA contextual ("Adicionar jogadores" / "Montar times" / "Iniciar partida" / "Voltar à partida").

**Sem props** — todo o estado vem de `useSoccer` via `useGameSlice`. Aparece em todas as rotas dentro de `(pelada)`.

### `TabHeader`
Header compacto (uma linha) para sub-telas. Props: `{ title: string }`.

### `RuleChip`
Chip pequeno usado no `PeladaHeader` para exibir uma regra ("4×4", "10min", "2 gols"). Props: `{ label: string }`.

### `TeamCard`
Card de um time com lista de jogadores via `PlayerRow`. Props:

| Prop | Tipo | Descrição |
|---|---|---|
| `team` | `Team` | Entidade do domínio. |
| `title` | `string` | Cabeçalho do card (ex.: "Time 1"). |
| `state` | `"playing" \| "next" \| "stopped"` | Cor de fundo do card. |
| `showAdvantage` | `boolean?` | Mostra badge "Vantagem" quando `team.advantage`. |
| `selectedPlayerId` / `onPlayerPress` / `onPlayerLongPress` / `onActionsPress` | — | Hooks de interação. |

### `PlayerRow`
Linha de jogador reutilizável (Jogadores, Partida, dentro de `TeamCard`). Mostra avatar circular com inicial (cor derivada do `id` via `AvatarPalette`), nome, badge de situação e contador de gols opcional.

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `player` | `Player` | — | Entidade do domínio. |
| `onPress` / `onLongPress` | `() => void` | — | Interação opcional. |
| `right` | `ReactNode` | — | Slot livre à direita (botão/ícone). |
| `showSituation` | `boolean` | `false` | Mostra badge "Jogando/Parou/Sem time". |
| `showGoals` | `boolean` | `false` | Mostra contador de gols. |
| `compact` | `boolean` | `false` | Reduz padding vertical. |
| `selected` | `boolean` | `false` | Destaca borda/fundo (seleção ativa). |

### `Stepper`
Incrementador numérico (botões `-` / `+`). Props: `{ value, onChange, min=1, max=99, step=1, disabled? }`. Usado em telas de configuração de regras.

### `ScoreBoard`
Placar grande de partida em andamento. Props: `{ teamAName, teamBName, goalsA, goalsB }`. Usa `fontVariant: ["tabular-nums"]` para evitar saltos quando o gol muda.

### `TimerDisplay`
Cronômetro grande com status legível ("Pronto", "Em jogo", "Pausado", "Intervalo", "Encerrado"). Props: `{ restSeconds, currentHalf?, totalHalves?, status? }`.

## Texto temático

### `ThemedText`
`<Text>` que resolve cor pelo tema. Props: `ThemeProps + TextProps + { type?: "default" | "title" | "subtitle" | "link" | "defaultSemiBold" }`.

### `ThemedView`
`<View>` com `backgroundColor` resolvido pelo tema.

## Utilitários

### `confirmAcao(opcoes)`
Confirma uma ação com `Alert.alert` (nativo) ou `window.confirm` (web). Retorna `Promise<boolean>`. Use sempre que a ação for destrutiva ("Tem certeza que quer excluir esta pelada?").

### `escolherOpcao(opcoes)`
Variante que oferece N opções via `Alert.alert` (até 3 no nativo) ou `window.confirm` (2 no web). Retorna `Promise<T | null>`.

### `ExternalLink`
Wrapper de `expo-router/Link` que abre URLs externas em `WebBrowser` no nativo e em nova aba no web.

### `HelloWave`
Animação de "👋" do template Expo. Cosmético — remover quando refatorar a tela de boas-vindas.

---

## Padrão de adição

Ao criar componente novo:

1. Props como `type` no topo do arquivo.
2. Default export `export function NomeDoComponente(...)`.
3. Estilo com `StyleSheet.create` no final.
4. Cores via `usePalette()`; espaços via `Spacing`/`Radius`.
5. JSDoc curto explicando "quando usar".
6. Adicionar entrada neste catálogo.

---

## Quando usar **glow vermelho** (`palette.glow` / `shadowColor: palette.primary`)

O glow vermelho é a assinatura visual do app — usar com parcimônia
para que continue significando "ação principal aqui". Convenção:

**✅ Usar glow em**:
- CTA principal de uma tela inteira (largura cheia ou hero card):
  "Iniciar partida", "Criar e entrar na pelada", "Salvar alterações",
  "Iniciar nova execução".
- Card hero da Home com call-to-action embutido: AvulsaCard.

**❌ Não usar glow em**:
- Botões pequenos de ícone (40–48×48), incluindo "+ adicionar jogador".
- Botões dentro de modais / sheets — eles já estão sobrepostos ao fundo
  e não precisam disputar atenção com o glow do CTA principal.
- Botões secundários ou de navegação (chevron, voltar, share, kebab).
- Toggles, chips, segmented controls.

**Receita do glow** (qualquer CTA elegível): wrapper com
`shadowColor: palette.primary` + `boxShadow: 0 14px 40px -10px ${palette.glow}`
no web + `<GlowHalo backgroundColor={palette.primary} />` no Android
(elevation só dá relevo cinza; halo translúcido vai por baixo). A receita
canônica vive em `app/pelada-nova.tsx` (`PrimaryCTA`) e em
`app/peladas/[id].tsx` (`PrimaryCTAComGlow`).
