# 0002 — Reatividade via External Store no GameManager

**Status:** aceito
**Data:** 2026-05-22

## Contexto

O `GameManager` é o **agregado raiz** do domínio. Ele e as entidades que orquestra (`Player`, `Team`, `Match`, `Timer`) são **mutáveis** — métodos como `addPlayer`, `addGoal`, `start` mudam estado in-place.

React, por outro lado, depende de **comparação de referência** para decidir re-render. Duas opções clássicas:

1. **Tornar o domínio imutável** (copiar a cada mudança).
2. **Avisar o React** quando o domínio mudou.

Adicionalmente, o `Timer` decrementa via `setInterval` — cada tick precisa atualizar a UI sem que ninguém precise chamar `forceUpdate`.

Antes desta decisão, alguns componentes usavam o anti-padrão `setState([])` para forçar re-render manual após chamar um método do `GameManager`. Funcionava, mas escondia o fluxo, esquecia em pontos e re-renderizava demais.

## Decisão

Implementar o contrato de **external store do React** no próprio `GameManager`, e consumir via **`useSyncExternalStore`** num hook dedicado (`useGameSlice`).

O contrato tem três peças:

```ts
class GameManager {
  private _version = 0;
  private listeners = new Set<() => void>();

  get version(): number { return this._version; }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify(): void {
    this._version++;
    this.listeners.forEach((l) => l());
  }
}
```

Todo método público que muda estado chama `notify()` no final. O `Timer` recebe um callback `onChange` no construtor; o `GameManager` passa `() => this.notify()` para que ticks também propaguem.

O hook em [hooks/useGameSlice.ts](../../hooks/useGameSlice.ts):

```ts
export function useGameSlice<T>(selector: (game: GameManager) => T): T {
  const { manager } = useSoccer();
  const subscribe = useCallback(
    (l) => manager.subscribe(l),
    [manager],
  );
  const getSnapshot = useCallback(() => manager.version, [manager]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector(manager);
}
```

## Alternativas consideradas

### A. External Store no próprio GameManager (escolhida)

**Prós**
- Sem dependência nova (Zustand, Jotai, Redux).
- Domínio continua **puro** — `subscribe`/`version` são padrão React (`useSyncExternalStore`), não um framework de UI.
- Concorrência segura — `useSyncExternalStore` cuida do tearing do React 18.
- Cobertura por testes do domínio fica intacta (subscribe/notify são síncronos e simples de testar).

**Contras**
- Domínio passa a expor uma API React-idiomática (`subscribe`, `version`). Filosoficamente, isso é uma porosidade.
- Cada `notify()` re-renderiza **todos** os consumidores — sem seletor com `Object.is`, é menos eficiente que Zustand.

### B. Tornar o domínio imutável (cópias com Immer/spread)

**Prós**
- Igualdade referencial natural — React feliz.
- Combina bem com Redux/Zustand.

**Contras**
- Domínio rico (entidades com referências cíclicas: `Player.currentTeam`, `Team.players`) **briga** com imutabilidade. Seria uma reescrita.
- ~20 specs do domínio precisariam mudar.
- Custo de cópia em cada `addGoal` durante uma partida com cronômetro rodando.

### C. Adapter externo (Zustand/Jotai) envolvendo o GameManager

**Prós**
- Seletor com igualdade — re-render mínimo.
- API conhecida.

**Contras**
- Dependência adicional.
- Duplica o "estado" do GameManager dentro do store — fonte da verdade em dois lugares.
- Para o tamanho do app (pessoal, escopo pequeno), é abstração futura.

### D. `setState([])` ad hoc (o que existia)

**Prós**
- Zero infra.

**Contras**
- Espalhado pela UI — fácil esquecer.
- Re-renderiza o componente inteiro mesmo quando só o `Timer` mudou.
- Não cobre ticks automaticamente (tem que chamar manualmente).
- Anti-padrão React reconhecido.

## Consequências

### Boas
- Reatividade automática para **qualquer** método do `GameManager`, incluindo ticks do `Timer`, sem que componente precise lembrar de "atualizar".
- Hook único (`useGameSlice`) padroniza o consumo. Quem vai escrever uma tela nova sabe exatamente o padrão.
- Migração incremental — onde havia `setState([])`, troca por `useGameSlice` com selector.

### Ruins (ou trade-offs)
- Domínio **não é mais 100% agnóstico de React**: a API `subscribe`/`version` é desenhada pensando em `useSyncExternalStore`. Mitigação: a forma do contrato é genérica o suficiente para outros consumidores (Vue, Solid) também usarem.
- Toda mudança no agregado dispara re-render em todos os componentes que usam `useGameSlice`. Para o tamanho atual do app, isso é OK. Se virar gargalo, **alternativa C** (Zustand como adapter de seleção) volta à mesa.

### Neutras
- O `selector` em `useGameSlice` **não** participa da comparação — o React só compara `version`. Selectors que retornam objetos/arrays novos a cada chamada não causam loop, apenas perdem a oportunidade de `React.memo` no filho.

## Referências

- [hooks/useGameSlice.ts](../../hooks/useGameSlice.ts) — implementação.
- [src/domain/GameManager.ts](../../src/domain/GameManager.ts) → `subscribe`, `version`, `notify`.
- [src/domain/Timer.ts](../../src/domain/Timer.ts) → callback `onChange`.
- [docs/desenvolvedor/ui.md → Reatividade](../desenvolvedor/ui.md#reatividade-usegameslice)
- [React docs — useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).
