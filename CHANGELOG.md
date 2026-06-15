# Changelog

Histórico de mudanças relevantes do FuteLista.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

> A versão atual em `app.json` e `package.json` é sempre a fonte da verdade para releases. Este arquivo descreve **o que mudou**.

---

## [Não lançado]

### Planejado (rastreado em `COMMITS_PLAN.md`)

- Passada de formatação (`prettier --write`) e ativação do passo de lint no CI.
- Substituir `setState([])` por `useSyncExternalStore` na cola React.
- Publicação nas lojas (Google Play / App Store).

## [1.0.0] — 2026-06-14

Primeira versão oficial: domínio completo e testado, UI navegável, persistência local e o app disponível na **web** e como **APK Android**.

### Adicionado

- **Domínio** puro e completo em `src/domain/` (`Player`, `Team`, `Match`, `Goal`, `Switch`, `ScreenTime`, `Timer`, `Rules`, `GestorJogo`), coberto por **540 testes** Jest.
- **Padrões**: Factory + Strategy (escolha de times) e Chain of Responsibility (pós-partida).
- **UI** navegável em Expo Router: jogadores, times, partida, placar, histórico, configurações e onboarding.
- **Persistência local** via AsyncStorage com serialização versionada (payload v4) e cura de saves antigos.
- **Identidade visual**: ícone oficial em todos os slots de produção, splash e wordmark.
- **Disponibilização**:
  - Web pública via EAS Hosting — <https://futelista.expo.app> (`npm run deploy:web`).
  - APK Android (perfil `preview` do EAS); id do app `com.paulomarcos.futelista`.
- **CI** (GitHub Actions): type-check (`tsc`) + testes (`jest`) a cada push/PR.
- **Documentação** humana em `docs/` (guias de usuário e de desenvolvedor, ADRs) e `PRIVACY.md`.
- **Governança para agentes de IA**: `CLAUDE.md`, `AGENTS.md`, `AI_NAVIGATION.md`, skills/rules e lock por arquivo (`features/registry.yaml`).
- `LICENSE` MIT — projeto oficialmente código aberto.

### Corrigido

- Guards contra fila vazia e referências nulas no domínio.
- Arquivamento de partida encerrada no histórico (`setNextMatch`).
