# Demandas

---

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

