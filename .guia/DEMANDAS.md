# Demandas

---

## [D-008] ✨ Escrever ADR-0003 persistencia Ports&Adapters

- **Status:** Em desenvolvimento
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Feature
- **Contexto:** Camada de persistencia (porta RepositorioPelada + adapters AsyncStorage/EmMemoria + serializers + backup) adicionada sem ADR; decisao com trade-off real. Acao: criar docs/adr/0003. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (proposal-architect #1, alta). Skills-base: proposal-architect.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.

### Validacao feita

- Nenhuma.

### Validacao pendente

- Nenhuma.


## [D-004] 🧹 Corrigir PRIVACY.md (persistencia AsyncStorage ativa)

- **Status:** Em desenvolvimento
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** PRIVACY.md afirma que nao ha persistencia, mas AsyncStorage foi entregue na 1.0.0. Risco de compliance de loja. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #3). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.

### Validacao feita

- Nenhuma.

### Validacao pendente

- Nenhuma.


## [D-009] ✨ Escrever ADR modelagem Pelada x Execucao

- **Status:** Em desenvolvimento
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Feature
- **Contexto:** Novos agregados (Pelada tipo vs GestorJogo/Execucao sessao, AgregadosPelada, ConvitePelada) mudam a fronteira do agregado raiz, sem registro. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (proposal-architect #4). Skills-base: proposal-architect, domain-driven-design.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.

### Validacao feita

- Nenhuma.

### Validacao pendente

- Nenhuma.


## [D-007] 🧹 Verificar links de docs/ (AI_NAVIGATION, guias)

- **Status:** Em desenvolvimento
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** [Confirmar] README/CHANGELOG citam AI_NAVIGATION.md e guias; conferir que os arquivos linkados existem. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #7). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.

### Validacao feita

- Nenhuma.

### Validacao pendente

- Nenhuma.


## [D-023] 🧹 Remover comentario-cicatriz em Team.ts:114

- **Status:** Em desenvolvimento
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** Comentario '//tava deletando mais de um.' descreve bug antigo. Acao: remover (nome+teste ja documentam). Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-code-review #4). Skills-base: clean-code.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.

### Validacao feita

- Nenhuma.

### Validacao pendente

- Nenhuma.


## [D-032] 🧹 Adicionar paths: as 4 skills do projeto

- **Status:** Em desenvolvimento
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** [Opcional] Nenhuma skill do projeto declara paths:; vinculo escopo->skill vive so em prosa. Acao: paths: em domain-driven-design(src/domain/**), react-best-practices(app|components|providers|contexts|hooks), clean-code/uncle-bob-craft(ambos). Fonte: docs/diagnostico/diagnostico-2026-06-24.md (skill-router #1). Skills-base: skill-router, skill-creator.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.

### Validacao feita

- Nenhuma.

### Validacao pendente

- Nenhuma.


## [D-006] 🧹 Atualizar rules/mobile.md p/ apontar useGameSlice

- **Status:** Em desenvolvimento
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** rules/mobile.md diz reatividade 'a definir em refactor futuro', mas ADR-0002 ja decidiu external store via useGameSlice. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (proposal-architect #6). Skills-base: proposal-architect.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.

### Validacao feita

- Nenhuma.

### Validacao pendente

- Nenhuma.


## [D-005] 🧹 Ajustar CHANGELOG (lint no CI ja feito)

- **Status:** Aguardando validacao
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** CHANGELOG lista lint-no-CI como Planejado, mas ja esta ativo. Mover p/ 1.0.0/Adicionado. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #6). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `CHANGELOG.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Movi a 'ativacao do passo de lint no CI' de [Nao lancado]/Planejado para [1.0.0]/Adicionado: a entrada de CI agora lista type-check + lint (eslint+prettier) + testes; o item planejado restou apenas a passada de formatacao prettier --write

### Validacao feita

- conferencia manual contra ci.yml

### Validacao pendente

- Validacao manual do desenvolvedor.

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

- **Status:** Em desenvolvimento
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Chore
- **Contexto:** .gitignore nao lista .env; sem rede de protecao se um segredo EAS/deploy surgir. Acao: ignorar .env* e criar template .env.example. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #5). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.

### Validacao feita

- Nenhuma.

### Validacao pendente

- Nenhuma.


## [D-026] ✨ Regra ESLint no-restricted-imports na fronteira do dominio

- **Status:** Em desenvolvimento
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Feature
- **Contexto:** Pureza do dominio e so convencao; nada barra um import de react/react-native/expo em src/domain. Acao: ESLint no-restricted-imports (ou dependency-cruiser) com whitelist do polyfill react-native-get-random-values. Fonte: docs/diagnostico/diagnostico-2026-06-24.md (clean-architecture-guardian #5). Skills-base: clean-architecture-guardian, open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.

### Validacao feita

- Nenhuma.

### Validacao pendente

- Nenhuma.


## [D-027] ✨ Criar release.yml disparado em tags v*.*.*

- **Status:** Aguardando validacao
- **Origem:** Diagnostico 2026-06-24
- **Tipo:** Feature
- **Contexto:** Ha ci.yml e lock-check.yml mas nenhum workflow de release. Acao: release.yml (build APK via EAS + release a partir do CHANGELOG). Fonte: docs/diagnostico/diagnostico-2026-06-24.md (open-source-readiness #4). Skills-base: open-source-readiness.

### Arquivos modificados/criados

- `.guia/DEMANDAS.md`
- `.github/workflows/release.yml`

### O que foi feito

- Em desenvolvimento desde 2026-06-25.
- Criei .github/workflows/release.yml disparado somente em tags v*.*.*; build do APK Android via EAS (perfil preview, unico que gera APK no eas.json) com expo/expo-github-action e EXPO_TOKEN, extracao das notas da secao correspondente do CHANGELOG.md via awk, e publicacao do GitHub Release com softprops/action-gh-release anexando o APK.

### Validacao feita

- npx js-yaml parseou sem erro; python yaml.safe_load confirmou que on.push.tags == ['v*.*.*'] (nao roda em push de branch nem PR).

### Validacao pendente

- Configurar o secret EXPO_TOKEN no repositorio (Settings > Secrets > Actions), se ainda nao houver.

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

