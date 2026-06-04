# Architecture Decision Records (ADRs)

Decisões de arquitetura registradas em arquivos curtos e numerados. Cada ADR descreve:

1. **Contexto** — o problema que apareceu.
2. **Decisão** — o que foi escolhido.
3. **Consequências** — o que ficou bom, o que ficou ruim.

A ideia é simples: **quando você (ou outra pessoa) voltar ao código em 6 meses e perguntar "por que isso?", o ADR responde**. Sem ADR, a resposta vira "achei que era a melhor opção na época" — e isso não ajuda ninguém.

## Quando criar um ADR

Crie um ADR quando:

- A decisão **mudaria o desenho** do app se for revertida.
- Há **trade-off real** entre opções (não é a única escolha possível).
- Outra pessoa razoavelmente questionaria a escolha depois.

**Não** crie ADR para:

- Convenções de estilo (mora em `.claude/rules/`).
- Versão de biblioteca (`package.json` resolve).
- Bugs e fix (mora em commit + CHANGELOG).

## Formato

```
NNNN-titulo-curto-com-hifens.md
```

Numeração monotônica. Status: `proposto`, `aceito`, `substituído por NNNN`, `descontinuado`. ADR aceito é **imutável** — mudou de ideia? Crie um novo que substitui o anterior.

## Lista

| #    | Título                                                | Status   |
| ---- | ----------------------------------------------------- | -------- |
| 0001 | [Expo Router file-based como roteador](0001-expo-router.md) | Aceito   |
| 0002 | [Reatividade via External Store no GestorJogo](0002-reatividade-external-store.md) | Aceito   |

## Template

Quando criar um ADR novo, copie esta estrutura:

```markdown
# NNNN — Título

**Status:** proposto | aceito | substituído por NNNN | descontinuado
**Data:** AAAA-MM-DD

## Contexto

Qual era o problema? O que estava acontecendo no código/projeto que forçou a decisão?

## Decisão

O que foi escolhido. Em uma frase, depois detalhes.

## Alternativas consideradas

Pelo menos duas opções, com prós/contras de cada uma. Senão, não havia decisão de verdade.

## Consequências

### Boas
- ...

### Ruins (ou trade-offs)
- ...

### Neutras
- ...

## Referências

- Link para PRs, issues, código que materializa a decisão.
```
