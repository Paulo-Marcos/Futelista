# Changelog

Histórico de mudanças relevantes do FuteLista.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

> A versão atual em `app.json` e `package.json` é sempre a fonte da verdade para releases. Este arquivo descreve **o que mudou**.

---

## [Não lançado]

### Planejado

- Publicação nas lojas (Google Play / App Store).
- Agrupar métodos do `GestorJogo` em serviços de domínio (D-042, em backlog).

## [1.0.1] — 2026-06-26

Versão de manutenção a partir de um diagnóstico orquestrado, executado em 4 ondas (~30 demandas). **Sem mudança de comportamento para o usuário**; a suíte cresceu para **588 testes** Jest, sempre verde.

### Alterado

- **Telas god-component quebradas**: `app/(pelada)/{partida,index,times,jogadores}` foram de ~8.346 → ~3.100 linhas, com ~50 subcomponentes extraídos para `src/shared/ui/{partida,home,times,jogadores}/`.
- **Domínio**: external store extraído do `GestorJogo` para `Observable`; vocabulário de ação padronizado para português (`adicionarJogador`, `tirarDoJogo`, `marcarGol`, …); `any` eliminado; ternários de efeito colateral viraram `if/else`; regra de "partidas encerradas" movida da UI para o domínio.
- **Performance**: `React.memo` no campo (`PlayerDot`), nas folhas de lista (`PlayerRow`, `TeamMini`…) e nos consumidores de seletores; `useMemo` no value do `SoccerContext`.
- **Documentação sincronizada**: `CLAUDE.md`, `AGENTS.md` e `.claude/rules/` alinhados à estrutura real (`src/app-shell`, `src/shared`, `app/(pelada)`).

### Adicionado

- **Guarda de fronteira do domínio** via ESLint (`no-restricted-imports`), impedindo `react`/`react-native`/`expo` em `src/domain/`.
- **Workflow de release** (`release.yml`) disparado em tags `v*.*.*`: builda o APK no EAS e publica o GitHub Release com as notas do CHANGELOG.
- **Hook `commit-msg` exigindo gitmoji** (`bin/check-gitmoji.py`).
- **ADRs**: 0003 (persistência Ports & Adapters), 0004 (modelagem Pelada × Execução), 0005 (conclusão da migração Expo Router).
- `.env.example` e `.env*` no `.gitignore`.

### Removido

- Componentes mortos sem consumidor: `TeamCard`, `MiniPlacar`, `UltimaPartidaCard`.

### Corrigido

- Drift de documentação: `AGENTS.md` (resíduo do gerador-cortes), versões de stack no `README` e a política de persistência no `PRIVACY.md`.

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
- **CI** (GitHub Actions): type-check (`tsc`) + lint (`eslint` + `prettier`) + testes (`jest`) a cada push/PR.
- **Documentação** humana em `docs/` (guias de usuário e de desenvolvedor, ADRs) e `PRIVACY.md`.
- **Governança para agentes de IA**: `CLAUDE.md`, `AGENTS.md`, `AI_NAVIGATION.md`, skills/rules e lock por arquivo (`features/registry.yaml`).
- `LICENSE` MIT — projeto oficialmente código aberto.

### Corrigido

- Guards contra fila vazia e referências nulas no domínio.
- Arquivamento de partida encerrada no histórico (`setNextMatch`).
