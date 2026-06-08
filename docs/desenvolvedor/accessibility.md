# Acessibilidade no FuteLista — guia rápido

Auditoria base (F-21) feita em 2026-06-XX. Este doc descreve o que já é
**lei** no app e o que ainda é dívida explícita. Mantenha a régua —
qualquer tela nova precisa atender ao checklist abaixo.

## Lei (faça SEMPRE)

### 1. `accessibilityLabel` em todo `Pressable` interativo

```tsx
<Pressable
  onPress={...}
  accessibilityRole="button"
  accessibilityLabel="Iniciar partida"
  accessibilityHint="Abre a tela de cronômetro" // opcional
/>
```

- O label substitui o "texto do filho" no leitor de tela. Use uma frase
  curta no infinitivo ou substantivo (ex.: "Editar pelada", "Compartilhar
  resumo", "Fechar").
- Inclua a entidade quando o botão se repete na mesma tela ("Editar Time 1",
  "Remover Ana"). Sem isso o leitor narra "Editar, botão" 8 vezes.
- `accessibilityRole="button"` é redundante na maioria dos casos (Pressable
  já é botão). Mantemos quando há composição com outro Pressable como filho
  pra explicitar o papel — mas evite role="button" em wrappers que envolvem
  outro Pressable filho (confunde testing-library e leitores de tela; ver
  comentário em `TeamMini.tsx`).

### 2. `TextInput` com label associado

Sempre passe `accessibilityLabel` ou tenha um `<Text>` label imediatamente
antes (com `accessibilityRole="header"` quando agrupar uma section).

```tsx
<Field
  icon="shield-outline"
  placeholder="Nome da pelada (ex.: Fute de Quarta)"
  accessibilityLabel="Nome da pelada"
  value={nome}
  onChangeText={setNome}
/>
```

Placeholder não conta — desaparece quando o usuário começa a digitar.

### 3. Banner de feedback dinâmico → `accessibilityLiveRegion="polite"`

Banner que aparece em resposta a uma ação (erro, sucesso, "salvando…")
deve ser **anunciado** pelo leitor de tela sem o usuário precisar focar:

```tsx
<View
  style={styles.errorBanner}
  accessibilityLiveRegion="polite"
  accessibilityRole="alert"
>
  <Text>{erro}</Text>
</View>
```

- `polite` espera o leitor terminar a frase atual (o que queremos
  praticamente sempre).
- `assertive` interrompe — só use em alerta crítico (ex.: timer 0).

### 4. `accessibilityState` para estados visuais

Quando o componente comunica estado visual (selecionado, disabled,
expanded), exponha pro leitor de tela:

```tsx
<Pressable
  accessibilityState={{ selected, disabled }}
  accessibilityLabel={`Aplicar paleta ${tema}`}
/>
```

Já é o padrão em `PickTeamCard`, `PaletaChip`, `Stepper` etc.

### 5. Hit target ≥ 44×44

WCAG 2.1 AA pede 44×44 pt. Quando o ícone visual é menor (36×36 ou
menos), use `hitSlop` pra expandir a área de toque sem mudar o layout:

```tsx
<Pressable
  hitSlop={8}        // expande 8pt para cada lado
  style={styles.iconBtnGhost} // visualmente 36×36
/>
```

Casos comuns onde aplicar: cog do header, close X de modais, chevron
de navegação. Containers já em 44+ (botões CTA com `minHeight: 54`,
linhas de lista 56) não precisam.

## Convenções do app

- **Português brasileiro** nos labels — não traduzir "Cancel" para
  "Cancel"; usar "Cancelar".
- **Frases curtas e específicas**: "Editar pelada" > "Editar"; "Trocar
  foto de Ana" > "Trocar foto".
- **SVG decorativo** → `aria-hidden` (`TeamCrest` faz isso). Imagens
  conteúdo (foto do jogador) NÃO escondem.
- **Lista de jogadores** já usa `accessibilityLabel` específico por linha
  ("Editar Ana", "Remover Bia") — esse é o padrão de referência.

## Dívida conhecida (follow-ups)

- **Contraste em estados pressed** — não auditado. Pressables que ficam
  `opacity: 0.7` quando pressionados podem perder contraste mínimo em
  alguns temas (verde sobre claro, p.ex.). Verificar manualmente em cada
  paleta nova.
- **Foco por teclado no web** — não implementado. RN-web usa o foco
  default do `<button>`, mas componentes que viram `<View>` (cards
  pressionáveis em listas) não recebem foco. Quando estabilizar a UI web,
  considerar `focusable` no Pressable.
- **Tamanho de texto dinâmico** — não testado com Type Size grande
  (iOS Dynamic Type). Várias telas usam `fontSize` literal; uma passada
  com `allowFontScaling` ligado pode quebrar layout.
- **Modo alto contraste** — não testado.

Esses itens podem virar tarefas futuras quando o app entrar em loja.
