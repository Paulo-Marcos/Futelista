# Changelog

Histórico de mudanças relevantes do FuteLista.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

> A versão atual em `app.json` e `package.json` é sempre a fonte da verdade para releases. Este arquivo descreve **o que mudou**.

---

## [Não lançado]

### Adicionado

- Versão **web** publicada em <https://futelista.expo.app> via EAS Hosting (deploy com `npm run deploy:web`). Scripts `export:web`/`deploy:web` no `package.json` e seção "Web (EAS Hosting)" em `docs/desenvolvedor/build-release.md`.
- Documentação humana inicial em `docs/`: vitrine no `README.md`, índice, guias de usuário (primeiros passos, fluxo, regras) e de desenvolvedor (instalação, arquitetura, domínio, UI, testes, build/release).
- Política de privacidade em `PRIVACY.md` (pré-requisito para publicação nas lojas).
- Primeiros ADRs em `docs/adr/`: roteador (Expo Router file-based) e reatividade (External Store + `useGameSlice`).
- `LICENSE` MIT — projeto agora é oficialmente código aberto.
- `CHANGELOG.md` (este arquivo).

### A fazer (rastreado em `COMMITS_PLAN.md`)

- Renomear telas/rotas para PT (`Geriamento`, `index2`, `_layou_t.tsx`, `in_dex.tsx`).
- Remover `app-example/` (resíduo do template Expo).
- Substituir `setState([])` por `useSyncExternalStore` na cola React.
- Corrigir imports case-inconsistentes (`./player` → `./Player`).
- Limpar 175 linhas comentadas em `app/(tabs)/_layout.tsx`.
- Remover `console.log` de `providers/soccerProvider.tsx`.

## [1.0.0] — inicial

### Adicionado

- Camada de domínio completa em `src/domain/`: `Player`, `Team`, `Match`, `Goal`, `Switch`, `ScreenTime`, `Timer`, `Rules`, `GameManager`.
- Factory + Strategy em `TeamBuilder/` (3 modos de escolha de times).
- Chain of Responsibility em `UpdateDraw/` (4 handlers pós-partida).
- ~20 specs Jest cobrindo o domínio.
- UI provisória em `app/(tabs)/` com Expo Router + tabs.
- Governança para agentes de IA: `CLAUDE.md`, `AGENTS.md`, `AI_NAVIGATION.md`, `.claude/skills/`, `.claude/rules/`, `features/registry.yaml` (lock por arquivo).
