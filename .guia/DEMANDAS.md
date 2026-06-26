# Demandas

---

## [D-014] 🧹 Extrair subcomponentes e hooks de jogadores.tsx

- **Status:** Aguardando validacao
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** jogadores.tsx ~1393 linhas. Acao: extrair subcomponentes/hooks. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #1). Skills-base: react-best-practices, clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `app/(pelada)/jogadores.tsx`
- `src/shared/ui/jogadores/AddButton.tsx`
- `src/shared/ui/jogadores/LinhaJogador.tsx`
- `src/shared/ui/jogadores/LinhaEdicao.tsx`
- `src/shared/ui/jogadores/ModalAdicionarLote.tsx`
- `src/shared/ui/jogadores/EstatisticasJogadorSheet.tsx`
- `src/shared/ui/jogadores/StatTile.tsx`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Extrai 6 subcomponentes de jogadores.tsx para src/shared/ui/jogadores/ (1393->672 linhas); StyleSheet particionado por consumo. Estrutural, comportamento identico.

### Validacao feita

- npx tsc --noEmit (0); npx eslint nos 7 arquivos (0)

### Validacao pendente

- VALIDAR NO APP (Expo/emulador): tela Jogadores visualmente identica - adicionar, editar, lote, estatisticas, busca

## [D-019] 🧹 Avaliar extrair reatividade/servicos de GestorJogo

- **Status:** Aguardando validacao
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** GestorJogo ~892 ln/50 metodos acumula jogadores/times/timer/gols/regras + contrato de store. Acao: avaliar extrair Observable e servicos de dominio coesos. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #2). Skills-base: clean-architecture-guardian, domain-driven-design, uncle-bob-craft.

### Arquivos modificados/criados

- `src/domain/GestorJogo.ts`
- `src/domain/Observable.ts`
- `src/domain/Observable.spec.ts`

### O que foi feito

- Extrai o external store para Observable (composicao); GestorJogo delega version/subscribe/notify. API publica e comportamento identicos. Agrupamento em servicos adiado (nota).

### Validacao feita

- npx jest src/domain 29 suites/273 testes; tsc --noEmit; eslint 0 errors

### Validacao pendente

- Agrupar metodos de time/jogador em servicos de dominio: demanda futura (invasivo)


## [D-017] 🧹 Envolver value do SoccerContext em useMemo

- **Status:** Aguardando validacao
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** value={{...}} literal novo a cada render re-renderiza todos useSoccer(). Acao: useMemo no value. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (react-best-practices #3). Skills-base: react-best-practices.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/app-shell/soccerProvider.tsx`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Envolve o value do SoccerContext.Provider em useMemo (antes do early-return de boot), evitando re-render de todos os useSoccer a cada render

### Validacao feita

- npx tsc --noEmit; npx eslint src/app-shell/soccerProvider.tsx (sem rules-of-hooks/exhaustive-deps)

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-021] 🧹 Remover any do dominio em Rules.ts:54

- **Status:** Aguardando validacao
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** choosingTeams: any viola a regra 'sem any' do dominio. Acao: trocar por unknown/ChoosingTeams validado via includes. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-code-review #2, alta). Skills-base: clean-code, uncle-bob-craft.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/domain/Rules.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Troca any por unknown em checkChoosingTeams (validacao de entrada); narrowing via as ChoosingTeams no includes

### Validacao feita

- npx jest src/domain/Rules (10/10)

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-002] 🧹 Atualizar secao Arquitetura em CLAUDE.md e AGENTS.md

- **Status:** Aguardando validacao
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** Docs apontam providers/contexts/hooks e app/(tabs)/ que nao existem; real e src/{domain,app-shell,infrastructure,shared} e app/(pelada)/. Acao: atualizar a secao Arquitetura/Conceitos. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #4, clean-code-review #7, proposal-architect #2). Skills-base: proposal-architect, clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `CLAUDE.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Alinha secao Arquitetura do CLAUDE.md a estrutura real (src/app-shell, src/infrastructure, src/shared; app/(pelada))

### Validacao feita

- grep: sem mencoes a app/(tabs), MyProviders na raiz, providers/contexts/hooks na raiz

### Validacao pendente

- rules/mobile.md ainda descreve estrutura antiga (demanda derivada)

## [D-001] 🧹 Reescrever AGENTS.md a partir do CLAUDE.md

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** AGENTS.md descreve stack do gerador-cortes (FastAPI/SQLAlchemy/n8n, vocab Projeto/Corte/Short) e cita .agents/ inexistente. Acao: reescrever espelhando o CLAUDE.md atual; corrigir caminhos p/ .claude/. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #1, proposal-architect #3). Skills-base: open-source-readiness, proposal-architect.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `AGENTS.md`
- `PRIVACY.md`
- `docs/adr/0002-reatividade-external-store.md`
- `docs/desenvolvedor/arquitetura.md`
- `docs/desenvolvedor/ui.md`
- `src/domain/Team.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Reescrevi AGENTS.md para refletir o FuteLista real, espelhando o CLAUDE.md: removi a stack herdada do gerador-cortes (FastAPI/SQLAlchemy/n8n/Gemini/FFmpeg, vocabulario Projeto/Corte/Short, camadas routers->services, caminhos .agents/). Agora descreve Expo Router + RN + TS estrito; estrutura real src/{domain,app-shell,infrastructure,shared} + app/(pelada)/; vocabulario Pelada/Partida/Time/Jogador/Vantagem/Proximos; enums de contrato PlayerSituation/TeamSituation/TimerStatus/ResultMatch/ChoosingTeams; FinalResult com as 5 estrategias; protocolo de lock e caminhos .claude/skills e .claude/rules.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- revisao manual: AGENTS.md condiz com CLAUDE.md e com a arvore src/
- grep -nE 'FastAPI|SQLAlchemy|n8n|Gemini|FFmpeg|Projeto|Corte|Short|.agents|routers/|services/' AGENTS.md => nenhum termo proibido

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T21:18:49-03:00

## [D-008] ✨ Escrever ADR-0003 persistencia Ports&Adapters

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Feature
- **Contexto:** Camada de persistencia (porta RepositorioPelada + adapters AsyncStorage/EmMemoria + serializers + backup) adicionada sem ADR; decisao com trade-off real. Acao: criar docs/adr/0003. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (proposal-architect #1, alta). Skills-base: proposal-architect.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `docs/adr/0003-persistencia-ports-adapters.md`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- ADR-0003 retroativo: porta RepositorioPelada no dominio + adapters AsyncStorage/EmMemoria, serializers (grafo ciclico, PAYLOAD_VERSION), storageKeys e backup JSON; injecao via soccerProvider. Formato espelha ADR-0001/0002 (contexto, decisao, 4 alternativas, consequencias boas/ruins/neutras), status Aceito.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- conferência manual contra src/domain/ports e src/infrastructure/storage

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T22:42:25-03:00

## [D-004] 🧹 Corrigir PRIVACY.md (persistencia AsyncStorage ativa)

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** PRIVACY.md afirma que nao ha persistencia, mas AsyncStorage foi entregue na 1.0.0. Risco de compliance de loja. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #3). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `PRIVACY.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Corrigi a seção de dados/persistência: os dados da pelada são persistidos localmente no dispositivo via AsyncStorage (não mais descartados ao fechar), exclusivamente no aparelho, sem envio a servidor. Atualizei Portabilidade (export JSON local), Exclusão, o Expo SDK 51->54 e adicionei entrada no histórico (25/06/2026) + data de atualização.
- ATENCAO: por corrida entre chips concorrentes, o D-026 rodou um commit abrangente e capturou meu PRIVACY.md ja staged; a mudanca ficou integra dentro do commit f27b142 em vez de um commit dedicado 'docs(D-004)'. Conteudo correto e versionado; nao fiz reescrita de historico para nao corromper o trabalho paralelo.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- conferência manual contra src/infrastructure/storage e CHANGELOG

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T23:12:45-03:00

## [D-009] ✨ Escrever ADR modelagem Pelada x Execucao

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Feature
- **Contexto:** Novos agregados (Pelada tipo vs GestorJogo/Execucao sessao, AgregadosPelada, ConvitePelada) mudam a fronteira do agregado raiz, sem registro. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (proposal-architect #4). Skills-base: proposal-architect, domain-driven-design.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `docs/adr/0004-modelagem-pelada-execucao.md`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `PRIVACY.md`
- `src/domain/Team.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Escrevi ADR-0004 registrando a separação Pelada (tipo/cadastro) × GestorJogo (execução/sessão), ligados pelo id fraco peladaId, com Rules viajando por valor; documenta o lado certo de AgregadosPelada (cross-execução, identidade por nome), ConvitePelada (do tipo) e RelatorioExecucao (da sessão), com 3 alternativas e trade-offs. Formato idêntico aos ADRs 0001/0002, status aceito.
- ATENÇÃO: por uma race com chip paralelo, o arquivo staged foi absorvido pelo commit acd4169 (D-032), que NÃO contém a marca [unlock:adicoes-exigem-autorizacao]. O conteúdo está íntegro em HEAD; não reescrevi história compartilhada.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- conferência manual contra src/domain/Pelada.ts e correlatos

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T21:27:42-03:00

## [D-007] 🧹 Verificar links de docs/ (AI_NAVIGATION, guias)

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** [Confirmar] README/CHANGELOG citam AI_NAVIGATION.md e guias; conferir que os arquivos linkados existem. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #7). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `AI_NAVIGATION.md`
- `docs/desenvolvedor/ui.md`
- `docs/desenvolvedor/arquitetura.md`
- `docs/adr/0002-reatividade-external-store.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Varredura de links relativos em README/CHANGELOG/AI_NAVIGATION/docs (161 links). README e CHANGELOG: todos resolvem. Corrigi 14 links quebrados por refactor (raiz contexts/providers/hooks/components -> src/app-shell e src/shared; app/(tabs) -> app/(pelada)): 8 em ui.md, 1 em arquitetura.md, 2 em adr/0002, 11 em AI_NAVIGATION.md.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- varredura manual/script de links relativos em README/CHANGELOG/docs; re-scan confirma 0 quebrados com alvo existente

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T23:19:01-03:00

## [D-023] 🧹 Remover comentario-cicatriz em Team.ts:114

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** Comentario '//tava deletando mais de um.' descreve bug antigo. Acao: remover (nome+teste ja documentam). Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-code-review #4). Skills-base: clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `src/domain/Team.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Removido o comentario-cicatriz '//tava deletando mais de um.' em removePlayer (Team.ts:114). Logica intacta; nome do metodo + regressao em Team.spec.ts ja documentam o comportamento.
- ATENCAO: o working tree e compartilhado por varios chips guia concorrentes. O Team.ts staged foi varrido para o commit acd4169 (rotulado D-032) por outro processo; nao ha commit D-023 dedicado e nao reescrevi historico (seria destrutivo).
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx jest Team

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T22:40:52-03:00

## [D-032] 🧹 Adicionar paths: as 4 skills do projeto

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** [Opcional] Nenhuma skill do projeto declara paths:; vinculo escopo->skill vive so em prosa. Acao: paths: em domain-driven-design(src/domain/**), react-best-practices(app|components|providers|contexts|hooks), clean-code/uncle-bob-craft(ambos). Fonte: docs/diagnostico/diagnostico-2026-06-24.md (skill-router #1). Skills-base: skill-router, skill-creator.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.claude/skills/clean-code/SKILL.md`
- `.claude/skills/uncle-bob-craft/SKILL.md`
- `.claude/skills/domain-driven-design/SKILL.md`
- `.claude/skills/react-best-practices/SKILL.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Adicionei o campo paths: (lista YAML de globs) ao frontmatter das 4 skills: domain-driven-design -> src/domain/**; react-best-practices -> camada de UI (app/components/providers/contexts/hooks/src/app-shell/src/shared); clean-code e uncle-bob-craft -> ambos os conjuntos. name/description/corpo intactos.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- frontmatter YAML válido nas 4 skills (yaml.safe_load confirma paths em cada uma)

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T22:58:22-03:00

## [D-006] 🧹 Atualizar rules/mobile.md p/ apontar useGameSlice

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** rules/mobile.md diz reatividade 'a definir em refactor futuro', mas ADR-0002 ja decidiu external store via useGameSlice. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (proposal-architect #6). Skills-base: proposal-architect.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.claude/rules/mobile.md`
- `docs/adr/0002-reatividade-external-store.md`
- `docs/desenvolvedor/arquitetura.md`
- `docs/desenvolvedor/ui.md`
- `src/domain/Team.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Reescrevi a secao 'Estado e re-render' apontando o padrao reativo decidido: GestorJogo como external store (subscribe/version/notify) consumido via useGameSlice/useGameSliceRequired com useSyncExternalStore, e selector para subscrever o minimo. Removido o 'a definir em refactor futuro' e as opcoes observer/Zustand; adicionados links para ADR-0002 e useGameSlice.ts.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- conferência manual contra ADR-0002 e useGameSlice.ts

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T21:11:48-03:00

## [D-005] 🧹 Ajustar CHANGELOG (lint no CI ja feito)

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** CHANGELOG lista lint-no-CI como Planejado, mas ja esta ativo. Mover p/ 1.0.0/Adicionado. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #6). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `CHANGELOG.md`
- `.claude/skills/clean-code/SKILL.md`
- `.claude/skills/domain-driven-design/SKILL.md`
- `.claude/skills/react-best-practices/SKILL.md`
- `.claude/skills/uncle-bob-craft/SKILL.md`
- `.eslintrc.js`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/reports/D-027-ready-20260625-210702.md`
- `.guia/reports/D-027-start-20260625-012833.md`
- `.guia/tasks.json`
- `AGENTS.md`
- `PRIVACY.md`
- `src/domain/Team.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Movi a 'ativacao do passo de lint no CI' de [Nao lancado]/Planejado para [1.0.0]/Adicionado: a entrada de CI agora lista type-check + lint (eslint+prettier) + testes; o item planejado restou apenas a passada de formatacao prettier --write
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- conferencia manual contra ci.yml

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T21:08:42-03:00

## [D-003] 🧹 Corrigir versoes de stack no README

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** README diz Expo 51/RN 0.74/Router 3; package.json tem Expo 54/RN 0.81/Router 6. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #2). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `README.md`
- `.claude/skills/clean-code/SKILL.md`
- `.claude/skills/domain-driven-design/SKILL.md`
- `.claude/skills/react-best-practices/SKILL.md`
- `.eslintrc.js`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `src/domain/Team.ts`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Tabela de stack do README alinhada ao package.json: Expo 51→54, React Native 0.74→0.81, Expo Router 3→6. Nenhuma outra menção de versão de stack no README.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- conferência manual README x package.json

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T21:06:49-03:00

## [D-028] 🧹 Adicionar .env* ao gitignore e criar .env.example

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** .gitignore nao lista .env; sem rede de protecao se um segredo EAS/deploy surgir. Acao: ignorar .env* e criar template .env.example. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #5). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.gitignore`
- `.env.example`
- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `AI_NAVIGATION.md`

### O que foi feito

- Adicionei .env/.env.local/.env*.local ao .gitignore e criei .env.example documentando chaves EXPO_PUBLIC_* e segredos EAS sem valor real. Inspecao do codigo: app so le Constants.expoConfig.version via expo-constants (app/configuracoes.tsx); nenhum process.env real, logo placeholders ficam comentados.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- git check-ignore .env

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T21:13:31-03:00

## [D-026] ✨ Regra ESLint no-restricted-imports na fronteira do dominio

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Feature
- **Contexto:** Pureza do dominio e so convencao; nada barra um import de react/react-native/expo em src/domain. Acao: ESLint no-restricted-imports (ou dependency-cruiser) com whitelist do polyfill react-native-get-random-values. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #5). Skills-base: clean-architecture-guardian, open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.eslintrc.js`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Adicionado overrides para src/domain/** no .eslintrc.js com no-restricted-imports barrando react, react-dom, react-native (e react-native/*), expo, expo-*, @expo/*, @react-native-async-storage/* e a camada de infra (@/providers|contexts|hooks|app-shell). Polyfill react-native-get-random-values preservado por barrar apenas o nome exato react-native, nunca react-native*. Pureza do dominio agora verificada por maquina.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npm run lint
- teste negativo: probe temporario com imports de react/react-native/expo-constants/expo-router gerou 4 erros no-restricted-imports; react-native-get-random-values e uuid passaram

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T23:16:55-03:00

## [D-027] ✨ Criar release.yml disparado em tags v*.*.*

- **Status:** Validada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Feature
- **Contexto:** Ha ci.yml e lock-check.yml mas nenhum workflow de release. Acao: release.yml (build APK via EAS + release a partir do CHANGELOG). Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #4). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.github/workflows/release.yml`
- `.guia/current-task.json`
- `.guia/tasks.json`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Criei .github/workflows/release.yml disparado somente em tags v*.*.*; build do APK Android via EAS (perfil preview, unico que gera APK no eas.json) com expo/expo-github-action e EXPO_TOKEN, extracao das notas da secao correspondente do CHANGELOG.md via awk, e publicacao do GitHub Release com softprops/action-gh-release anexando o APK.
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- npx js-yaml parseou sem erro; python yaml.safe_load confirmou que on.push.tags == ['v*.*.*'] (nao roda em push de branch nem PR).

### Validacao pendente

- Nenhuma.

### Timing (D-052)

- **Iniciada:** Nenhuma.
- **Ready:** Nenhuma.
- **Terminada:** 2026-06-25T23:02:26-03:00

## [D-030] 🧹 Padronizar trailer Co-Authored-By canonico

- **Status:** Cancelada
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** Trailer alterna entre 'Claude Opus 4.8 (1M context)' e 'Claude Opus 4.8'. Acao: padronizar p/ forma canonica com email daqui pra frente. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (conventional-commit-gitmoji #2). Skills-base: conventional-commit-gitmoji.

### Arquivos modificados/criados

- Nenhuma.

### O que foi feito

- Cancelada em 2026-06-25: Nao e codigo: trailer Co-Authored-By e convencao daqui pra frente, nao demanda implementavel. Decisao do desenvolvedor (Guia 2026-06-25).

### Validacao feita

- Nenhuma.

### Validacao pendente

- Nenhuma.


## [D-041] ✨ Chip de regra de sorteio e ajustes visuais

- **Status:** Aguardando validacao
- **Origem:** Sessao 2026-06-24
- **Tipo:** Feature
- **Contexto:** Aba Times ganha chip 'Sorteio: <regra>' que leva as Regras; glow do CTA vira LinearGradient (times e peladas/[id]); formacao sem goleiro dedicado (ate 3 na linha); badge da splash redondo; linha do campo mais visivel no tema.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `app/(pelada)/times.tsx`
- `app/peladas/[id].tsx`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`

### O que foi feito

- Demanda criada via Guia Fluxo.
- RegraTimesChip + glow gradiente + formacao + Splash + themes

### Validacao feita

- npx jest formacao.spec themes.spec

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-040] ✨ Reabrir partida encerrada para analise no resultado

- **Status:** Aguardando validacao
- **Origem:** Sessao 2026-06-24
- **Tipo:** Feature
- **Contexto:** Na tela de resultado, 'Encerrar pelada' vira 'Voltar ao inicio' (home) e 'Voltar a partida' agora reabre a partida (reabrirPartida limpa resultado/vencedor e pausa o cronometro) e navega para /partida, em vez de router.back.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `app/__tests__/resultado-test.tsx`
- `app/peladas/[id].tsx`
- `app/resultado.tsx`
- `src/domain/GestorJogo.ts`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`

### O que foi feito

- Demanda criada via Guia Fluxo.
- reabrirPartida() no dominio + nova navegacao em resultado.tsx

### Validacao feita

- npx jest resultado-test

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-039] 🐛 Times duplicavam jogadores em saves antigos

- **Status:** Aguardando validacao
- **Origem:** Sessao 2026-06-24
- **Tipo:** Bug / regressao
- **Contexto:** Saves de versoes com bugs de troca/remocao gravavam jogador no roster de dois times ou time repetido em next; o relink reproduzia a corrupcao e a tela de Times mostrava jogadores duplicados. Novo repararIntegridadeDosTimes() sanea no rehydrate; setPlayers passa a deduplicar; botao DEV repara manualmente.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `app/(pelada)/times.tsx`
- `app/__tests__/resultado-test.tsx`
- `app/peladas/[id].tsx`
- `app/resultado.tsx`
- `src/domain/GestorJogo.ts`
- `src/infrastructure/storage/serializer.ts`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`

### O que foi feito

- Demanda criada via Guia Fluxo.
- repararIntegridadeDosTimes() idempotente no serializer + dedup em setPlayers + botao DEV

### Validacao feita

- npx jest GestorJogo.integridade.spec

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-038] 🐛 Cronometro nao encerrava ao fim da partida

- **Status:** Aguardando validacao
- **Origem:** Sessao 2026-06-24
- **Tipo:** Bug / regressao
- **Contexto:** Ao encerrar (manual ou gol-limite) o Timer seguia decrementando em segundo plano e era reaproveitado pela metade na proxima partida. Novo Timer.encerrar() limpa o setInterval e marca ENDED; setNextMatch descarta o timer.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `app/(pelada)/times.tsx`
- `app/__tests__/resultado-test.tsx`
- `app/peladas/[id].tsx`
- `app/resultado.tsx`
- `src/domain/GestorJogo.ts`
- `src/domain/Timer.ts`
- `src/infrastructure/storage/serializer.ts`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`

### O que foi feito

- Demanda criada via Guia Fluxo.
- Timer.encerrar() + descartarTimer; chamado em gol-limite, setResult e setNextMatch

### Validacao feita

- npx jest GestorJogo.timer.spec

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-037] 🧹 Extrai enums do dominio para quebrar require cycles

- **Status:** Aguardando validacao
- **Origem:** Sessao 2026-06-24
- **Tipo:** Chore
- **Contexto:** Move ResultMatch, PlayerSituation e TeamSituation para arquivos proprios, com re-export nos modulos originais e imports type-only. Quebra o ciclo Match<->Team<->Player sem mudar a API publica.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `app/(pelada)/times.tsx`
- `app/__tests__/resultado-test.tsx`
- `app/peladas/[id].tsx`
- `app/resultado.tsx`
- `src/domain/GestorJogo.ts`
- `src/domain/Goal.ts`
- `src/domain/Match.ts`
- `src/domain/Player.ts`
- `src/domain/Switch.ts`
- `src/domain/Team.ts`
- `src/domain/Timer.ts`
- `src/infrastructure/storage/serializer.ts`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`

### O que foi feito

- Demanda criada via Guia Fluxo.
- Enums em arquivos proprios + import type; API preservada via re-export

### Validacao feita

- npx tsc --noEmit

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-036] 🧹 Atualiza Expo SDK 51 para 54

- **Status:** Aguardando validacao
- **Origem:** Sessao 2026-06-24
- **Tipo:** Chore
- **Contexto:** Sobe Expo 51->54, React 18->19, RN 0.74->0.81, router 3->6, reanimated 3->4. Inclui metro.config.js (uuid sem package-exports), expo-file-system/legacy e ajustes de teste para RN 0.81 (Pressable memo) e React 19 (act).

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.eslintignore`
- `.guia/chat-title.txt`
- `.guia/current-task.json`
- `.guia/tasks.json`
- `app.json`
- `app/(pelada)/times.tsx`
- `app/__tests__/regras-test.tsx`
- `app/__tests__/resultado-test.tsx`
- `app/__tests__/times-test.tsx`
- `app/peladas/[id].tsx`
- `app/resultado.tsx`
- `package-lock.json`
- `package.json`
- `src/app-shell/fotoJogador.ts`
- `src/domain/GestorJogo.ts`
- `src/domain/Goal.ts`
- `src/domain/Match.ts`
- `src/domain/Player.ts`
- `src/domain/Switch.ts`
- `src/domain/Team.ts`
- `src/domain/Timer.ts`
- `src/infrastructure/storage/serializer.ts`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/__tests__/Stepper-test.tsx`
- `src/shared/ui/__tests__/ThemedText-test.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`
- `src/test/renderWithProviders.tsx`

### O que foi feito

- Demanda criada via Guia Fluxo.
- Upgrade SDK 51->54; testes ajustados; tsc e jest verdes

### Validacao feita

- npx tsc --noEmit
- npx jest --ci (579/579)

### Validacao pendente

- Validacao manual do desenvolvedor.

## [D-035] 🧹 Versiona estado do Guia Fluxo e diagnostico do projeto

- **Status:** Validada
- **Origem:** Sessao 2026-06-24
- **Tipo:** Chore
- **Contexto:** Passa a versionar .guia/ (estado do fluxo, backlog do diagnostico, locks) e docs/diagnostico/ no git, conforme decisao do desenvolvedor.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.eslintignore`
- `app.json`
- `app/(pelada)/times.tsx`
- `app/__tests__/regras-test.tsx`
- `app/__tests__/resultado-test.tsx`
- `app/__tests__/times-test.tsx`
- `app/peladas/[id].tsx`
- `app/resultado.tsx`
- `package-lock.json`
- `package.json`
- `src/app-shell/fotoJogador.ts`
- `src/domain/GestorJogo.ts`
- `src/domain/Goal.ts`
- `src/domain/Match.ts`
- `src/domain/Player.ts`
- `src/domain/Switch.ts`
- `src/domain/Team.ts`
- `src/domain/Timer.ts`
- `src/infrastructure/storage/serializer.ts`
- `src/shared/theme/themes.spec.ts`
- `src/shared/theme/themes.ts`
- `src/shared/ui/Splash.tsx`
- `src/shared/ui/__tests__/Stepper-test.tsx`
- `src/shared/ui/__tests__/ThemedText-test.tsx`
- `src/shared/ui/formacao.spec.ts`
- `src/shared/ui/formacao.ts`
- `src/test/renderWithProviders.tsx`

### O que foi feito

- Demanda criada via Guia Fluxo.
- Adiciona .guia/ e docs/diagnostico/ ao versionamento
- Demanda finalizada via Guia Fluxo.

### Validacao feita

- git status: arquivos rastreados

### Validacao pendente

- Nenhuma.

o.

### Validacao feita

- git status: arquivos rastreados

### Validacao pendente

- Nenhuma.

