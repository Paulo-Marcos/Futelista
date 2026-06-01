# Camada de UI

Como a UI do FuteLista é organizada: rotas, providers, contexto, hooks e o fluxo de re-render que conecta o domínio à tela.

> Regras de estilo, navegação e acesso ao domínio ficam em [.claude/rules/mobile.md](../../.claude/rules/mobile.md). Esta página descreve **a estrutura** e **o porquê** das peças.

---

## Camadas que formam a UI

```mermaid
flowchart TB
  subgraph Routes["app/ — Expo Router (file-based)"]
    L[_layout.tsx]
    T[(tabs)/_layout.tsx]
    S1[index.tsx]
    S2[list.tsx]
    S3[Teams.tsx]
    S4[CurrentGame.tsx]
    S5[GameManager.tsx]
    S6[ResultGame.tsx]
  end

  subgraph Glue["Cola React"]
    MP[MyProviders]
    SP[SoccerProvider]
    SC[SoccerContext]
    H1[useSoccer]
    H2[useGameSlice]
    HT[useColorScheme<br/>useThemeColor]
  end

  subgraph Comp["components/ — burros"]
    TT[ThemedText]
    TV[ThemedView]
    BI[ButtonIcon]
    PS[ParallaxScrollView]
    NV[navigation/TabBarIcon]
  end

  subgraph Domain["src/domain/"]
    GM[(GameManager)]
  end

  L --> MP --> SP --> SC
  T --> S1 & S2 & S3 & S4 & S5 & S6
  S1 -. usa .-> H1
  S2 -. usa .-> H2
  S3 -. usa .-> H2
  S4 -. usa .-> H2
  H1 --> SC
  H2 --> H1
  H2 --> GM
  SP --> GM
  S1 & S2 & S3 -. compõe .-> TT & TV & BI & PS
  T --> NV
```

## Pastas da UI

| Pasta              | O que tem                                                                       |
| ------------------ | ------------------------------------------------------------------------------- |
| `app/`             | Rotas Expo Router. `_layout.tsx` é a raiz; `(tabs)/` agrupa as tabs.            |
| `components/`      | Componentes "burros" reutilizáveis (`ThemedText`, `ParallaxScrollView`, etc.).  |
| `components/__tests__/` | Snapshots de componentes simples (`react-test-renderer`).                  |
| `components/navigation/` | Componentes específicos de navegação (`TabBarIcon`).                       |
| `contexts/`        | Contexts React — hoje só `SoccerContext`.                                       |
| `providers/`       | Provider que cria o `GameManager` e injeta no Context.                          |
| `hooks/`           | Hooks: `useSoccer`, `useGameSlice`, `useColorScheme`, `useThemeColor`.          |
| `constants/`       | Cores (light/dark) e outras constantes de estilo.                               |
| `assets/`          | Fontes (`SpaceMono`), imagens, ícones do app.                                   |

## Rotas (Expo Router)

Roteamento file-based. Arquivos dentro de `app/` viram rotas; pastas viram grupos.

```
app/
├── _layout.tsx          ← Raiz: ThemeProvider + MyProviders + Stack
├── +html.tsx            ← Wrapper HTML (web only)
├── +not-found.tsx       ← 404
└── (tabs)/              ← Grupo de tabs
    ├── _layout.tsx      ← createBottomTabNavigator
    ├── index.tsx        ← Home
    ├── list.tsx         ← Lista de jogadores
    ├── Teams.tsx        ← Times montados
    ├── CurrentGame.tsx  ← Partida em andamento
    ├── GameManager.tsx  ← Configuração da pelada (UI provisória)
    └── ResultGame.tsx   ← Resultado pós-partida
```

### Estado atual da navegação (atenção)

O `app/(tabs)/_layout.tsx` hoje mistura **Expo Router** (file-based) com **`createBottomTabNavigator`** (imperativo do `@react-navigation/bottom-tabs`). Isso funciona mas duplica responsabilidades — a unificação está prevista (ver [COMMITS_PLAN.md](../../COMMITS_PLAN.md)).

Outros pontos da UI que ainda vão mudar:

- Nomes de rota com typo ou em inglês: `index2`, `Geriamento`, `GameManager` → vão para `times`, `gerenciamento`, `partida-atual`, `placar`.
- Cores hard-coded para debug (`backgroundColor: "red"`, `"yellow"`, `"purple"`) no `(tabs)/_layout.tsx` — devem virar tokens em `constants/Colors.ts`.
- 175 linhas comentadas no `(tabs)/_layout.tsx` aguardando limpeza.

## Cola React: como o domínio chega à tela

O fluxo é curto e tem só 4 peças:

### 1. `MyProviders` ([providers/myProviders.tsx](../../providers/myProviders.tsx))

Composição de providers. Hoje só envolve o `SoccerProvider`, mas o ponto único existe pra quando entrarem outros (ex.: `ThemeProvider` customizado, `PersistenceProvider`).

### 2. `SoccerProvider` ([providers/soccerProvider.tsx](../../providers/soccerProvider.tsx))

Cria **uma única instância** do `GameManager` (via `useRef`) que vive o ciclo todo do app e a injeta no Context:

```tsx
const manager = useRef(new GameManager("teste", new Rules())).current;
return (
  <SoccerContext.Provider value={{ manager }}>
    {children}
  </SoccerContext.Provider>
);
```

> O nome `"teste"` e o `Rules()` default são provisórios — quando a tela de criação de pelada estiver pronta, esses parâmetros vêm de input do usuário.

### 3. `SoccerContext` ([contexts/soccerContext.ts](../../contexts/soccerContext.ts))

Context React puro. Tipo: `{ manager: GameManager }`. Nada mais.

### 4. `useSoccer()` ([hooks/useSoccer.ts](../../hooks/useSoccer.ts))

Atalho para `useContext(SoccerContext)`. Devolve `{ manager }`. Componente que só precisa **disparar ações** (e não reagir a estado) usa esse hook.

## Reatividade: `useGameSlice`

O `GameManager` é mutável (entidades de domínio se referenciam, mudam in-place). React quer imutabilidade. A ponte é o contrato de _external store_:

- `GameManager` expõe `version` (número monotônico) e `subscribe(listener)`.
- Cada método público que muta estado chama `notify()` → incrementa `version` → dispara listeners.
- O `Timer` recebe um `onChange` no construtor, então **ticks de cronômetro também disparam** `notify`.

O hook [hooks/useGameSlice.ts](../../hooks/useGameSlice.ts) embrulha isso em `useSyncExternalStore`:

```ts
export function useGameSlice<T>(selector: (game: GameManager) => T): T {
  const { manager } = useSoccer();
  const subscribe = useCallback(
    (listener: () => void) => manager.subscribe(listener),
    [manager],
  );
  const getSnapshot = useCallback(() => manager.version, [manager]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector(manager);
}
```

### Como um componente lê estado

```tsx
import { useGameSlice } from "@/src/app-shell/useGameSlice";

function PlayerCount() {
  const total = useGameSlice((g) => g.players.length);
  return <ThemedText>{total} jogadores</ThemedText>;
}

function Scoreboard() {
  const placar = useGameSlice((g) => g.playing?.countGoals());
  if (!placar) return null;
  return <ThemedText>{placar.teamA} × {placar.teamB}</ThemedText>;
}
```

### Como um componente dispara ação

Quando o componente **só precisa chamar** um método (sem ler estado), `useSoccer()` basta:

```tsx
import { useSoccer } from "@/src/app-shell/useSoccer";

function StartButton() {
  const { manager } = useSoccer();
  return <Button title="Iniciar" onPress={() => manager.start()} />;
}
```

### Re-render: o que considerar

- O `useSyncExternalStore` compara **apenas a `version`** — qualquer mudança no agregado re-renderiza **todos** os componentes que usam `useGameSlice`.
- O `selector` roda toda vez, mas React **não** compara o resultado dele. Se você seleciona um array gigante só pra ler `.length`, o componente vai re-renderizar a cada tick do cronômetro com o mesmo `.length`. Não é incorreto, mas é desperdício.
- **Boa prática:** selectors que retornam **primitivos** (`number`, `string`, `boolean`) tendem a casar bem com React.memo de componentes filhos. Selectors que retornam objetos/arrays diretos do agregado são OK porque a referência só muda quando o array muda.

Detalhes de performance em React: skill `@react-best-practices`. Convenção do projeto: [.claude/rules/mobile.md → Estado e re-render](../../.claude/rules/mobile.md#estado-e-re-render).

### Antes do `useSyncExternalStore`

Existia uma gambiarra `setState([])` em alguns lugares pra forçar re-render. O `useGameSlice` substitui isso. Se você encontrar o padrão antigo em algum componente, troque por `useGameSlice` com selector apropriado — está na lista de limpeza ([COMMITS_PLAN.md](../../COMMITS_PLAN.md)).

## Componentes (`components/`)

Componentes **burros**: JSX + estilo, **sem** acesso ao domínio. Recebem dados por props.

| Componente              | O que faz                                                                |
| ----------------------- | ------------------------------------------------------------------------ |
| `ThemedText`            | `<Text>` com cor adaptada a light/dark (lê `useThemeColor`).             |
| `ThemedView`            | `<View>` equivalente.                                                    |
| `ButtonIcon`            | Botão com ícone do `@expo/vector-icons`.                                 |
| `ParallaxScrollView`    | Scroll com header parallax (vem do template Expo).                       |
| `Collapsible`           | Section expansível.                                                      |
| `ExternalLink`          | Link que abre browser externo no nativo, target=_blank no web.           |
| `HelloWave`             | Mão acenando animada (template).                                         |
| `Icons`                 | Re-export de ícones usados.                                              |
| `navigation/TabBarIcon` | Ícone padronizado das tabs.                                              |

**Regra:** se um componente precisa do `GameManager`, ele **não** é burro — fica em `app/` ou vira hook em `hooks/`.

## Tema (light/dark)

- Cores em [constants/Colors.ts](../../constants/Colors.ts) com chaves `light` e `dark`.
- [hooks/useColorScheme.ts](../../hooks/useColorScheme.ts) detecta o modo do sistema.
- [hooks/useThemeColor.ts](../../hooks/useThemeColor.ts) resolve uma cor pelo modo atual.
- O `_layout.tsx` raiz embrulha tudo em `<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>` (do `@react-navigation/native`).

**Não usar** cor hard-coded no JSX (`backgroundColor: "red"`). Se for debug, é debug — não comita.

## Convenções rápidas

- **Componente com mais de 80 linhas** → extraia subcomponentes ou um hook.
- **Listas variáveis** → `FlatList` ou `SectionList` com `keyExtractor` por `id`. Nunca `Array.map` dentro de `ScrollView` pra lista que cresce.
- **Imports** respeitam casing exato do arquivo (`./Player`, não `./player`) — CI Linux quebra.
- **Sem `// @ts-ignore` silencioso.** `strict: true` está ligado.
- **Alias `@/`** aponta pra raiz do projeto.

## Próximo passo

→ [Como rodar e escrever testes](testes.md). _(em construção)_
→ [Build e release com EAS](build-release.md). _(em construção)_
