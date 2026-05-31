---
trigger: model_decision
description: Utilizar quando for escrever, alterar ou revisar testes (*.spec.ts, *-test.tsx).
---

# Regras para testes

## Stack

- **Jest** com preset `jest-expo` (configurado em [package.json](../../package.json)).
- **react-test-renderer** para snapshot de componentes simples.
- Comando: `npm test` (modo watch). Para CI/uma rodada: `npx jest`.

## Skills aplicáveis

- `@clean-code` — F.I.R.S.T. e nomes que descrevem o cenário.
- `@uncle-bob-craft` — TDD e regressão para bug fix.

## Convenções

- Especs em `*.spec.ts`, co-localizadas com o código que testam.
- Componentes em `*-test.tsx` dentro de `__tests__/` (padrão do template Expo).
- Use `describe` para a unidade testada; `it`/`test` para o comportamento.
- Em português, descrever o esperado: `it('deverá criar as regras default', ...)`.

## O que cobrir

- **Domínio (`src/domain/`)**: caminho feliz **e** invariantes (limites, erros).
- **Bug fix**: cria um teste que falha **antes** do fix e passa **depois**.
- **Componentes**: comportamento observável (texto renderizado, handler chamado). Não teste implementação interna.

## O que NÃO fazer

- Não mockar entidades de domínio entre si (elas formam o grafo natural; o teste fica falso).
- Não usar `setTimeout` longo para "esperar" — sincronize com promises ou fake timers (`jest.useFakeTimers()`).
- Não copiar estrutura sem entender o cenário: cada teste deve ter um objetivo nomeável.
- Não deixar `it.skip` / `describe.only` em main.

## Quando um teste quebra

- Não "ajuste o teste para passar". Investigue se o comportamento mudou de propósito (atualize o teste) ou se quebrou de fato (corrija o código).
- Se a alteração quebra cobertura, a tarefa **não** está pronta.
