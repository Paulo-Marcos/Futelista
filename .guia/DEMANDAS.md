# Demandas

---

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

