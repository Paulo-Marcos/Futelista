# Diagnóstico do projeto — FuteLista · 2026-06-24

## Resumo executivo

O FuteLista está em estado **maduro e saudável** nas lentes estruturais: o domínio
(`src/domain/`) é exemplarmente puro, a direção de dependência é respeitada (UI consome o
domínio só via `useSoccer`/`useGameSlice`), os padrões (Factory+Strategy, Chain of
Responsibility, Aggregate Root, Porta+Adapters de persistência) respondem a variação real
sem overengineering, o ponto frágil de reatividade já foi decidido e implementado
(ADR-0002, external store via `useSyncExternalStore`), e a prontidão open-source atende aos
três pilares de Akita (instalação, CI rodando typecheck+lint+testes, README/CHANGELOG/LICENSE).
Os riscos concentram-se em **três temas**: (1) **drift de documentação** — `CLAUDE.md` e
sobretudo `AGENTS.md` descrevem uma arquitetura que não existe mais (resíduo do gerador-cortes,
pastas e vocabulário errados), o que engana humanos e agentes; (2) **god components** — as
telas em `app/(pelada)/` chegam a ~3000 linhas, muito acima do limite do próprio projeto; e
(3) **re-render** — todo tick do cronômetro re-renderiza o campo inteiro por falta de `memo`.
Nenhum achado bloqueia publicação; o trabalho restante é manutenção e refino.

## Cobertura das skills

| Skill planejada | Invocada? | Status | Nº de achados |
|---|---|---|---|
| skill-router | sim | ok | 4 |
| clean-architecture-guardian | sim | ok | 5 |
| clean-code-review | sim | ok | 7 |
| open-source-readiness | sim | ok | 7 |
| proposal-architect | sim | ok | 6 |
| conventional-commit-gitmoji | sim | ok | 5 |
| react-best-practices | sim | ok | 5 |

Todas as 7 skills confirmadas foram efetivamente invocadas (ferramenta Skill) e retornaram
seção estruturada. Nenhuma ignorada em silêncio.

## Prioridades (severidade ALTA, agrupadas por tema)

| # | severidade | tema | achado | skill | arquivo:linha | próximo passo |
|---|---|---|---|---|---|---|
| 1 | alta | Drift de documentação | `AGENTS.md` ainda descreve a stack do gerador-cortes (FastAPI/SQLAlchemy/n8n/Gemini, vocabulário `Projeto/Corte/Short`) e referencia `.agents/` inexistente — instrução ativamente enganosa para agentes | open-source-readiness / proposal-architect / clean-code-review | AGENTS.md:26-55,135 | → reescrever AGENTS.md a partir do CLAUDE.md atual (tarefa de docs) |
| 2 | alta | Drift de documentação | `CLAUDE.md`/`AGENTS.md` descrevem cola React em `providers/`/`contexts/`/`hooks/` e rotas `app/(tabs)/`, mas o real é `src/app-shell/` e `app/(pelada)/`; quem segue o doc procura pastas que não existem | proposal-architect / clean-architecture-guardian / clean-code-review | CLAUDE.md:87-102; AGENTS.md:81-97 | → atualizar seção "Arquitetura" (docs) |
| 3 | alta | Decisão sem ADR | Camada de persistência completa (porta `RepositorioPelada` + adapters AsyncStorage/EmMemória + serializers + backup) adicionada sem ADR — decisão com trade-off real, o próprio critério do projeto para registrar | proposal-architect | src/domain/ports/RepositorioPelada.ts:17; src/infrastructure/storage/* | → `proposal-architect` para escrever `docs/adr/0003-persistencia-ports-adapters.md` |
| 4 | alta | God components / SRP de UI | Telas gigantes misturam render, estado e orquestração: `partida.tsx` ~2999 linhas, `(pelada)/index.tsx` ~2478, `times.tsx` ~1477, `jogadores.tsx` ~1393 — muito acima do limite "passa de 80 linhas? extraia" | clean-architecture-guardian / clean-code-review | app/(pelada)/partida.tsx:1; index.tsx:1; times.tsx:1; jogadores.tsx:1 | → `react-frontend-engineer`/`clean-code` para extrair hooks (`usePartida`) e subcomponentes |
| 5 | alta | Re-render / performance | Cada tick do cronômetro re-renderiza todos os `PlayerDot` (campo inteiro + animações) 1×/s; store compara só `version` e nenhum item usa `React.memo` | react-best-practices | app/(pelada)/partida.tsx:393-426,872 | → `react-best-practices` para envolver `PlayerDot` em `memo` e estabilizar handler |
| 6 | alta | Tipo proibido no domínio | `choosingTeams: any` no domínio puro, que veda `any` | clean-code-review | src/domain/Rules.ts:54 | → `clean-code` para trocar por `unknown`/`ChoosingTeams` validado |
| 7 | alta | Consistência de nomes | Mistura PT/EN no mesmo agregado (`addPlayer`/`removeFromGame` vs `reordenarJogadores`/`esvaziarTime`) — API consumida pela UI, renome arriscado | clean-code-review | src/domain/GestorJogo.ts (classe); Team.ts | → `clean-code` para decidir convenção e renomear em bloco (confirmar antes) |

> Observação: vários itens de drift de documentação aparecem em mais de uma lente (3 skills
> independentes sinalizaram `AGENTS.md`/`CLAUDE.md` defasados) — é o achado mais corroborado
> do diagnóstico.

## Achados por skill

### skill-router
- status: ok
- skill_invocada: sim
- resumo: A cobertura é boa — os 3 escopos reais (domínio puro, mobile, testes) têm skills mapeadas no CLAUDE.md e nas rules; porém o mapeamento é só documental (nenhuma skill declara `paths:`), há sobreposição clean-code↔uncle-bob-craft e um gatilho enviesado para web/Next.js em projeto Expo/React Native.
- achados:

| # | severidade | descrição | arquivo:linha | fonte/regra | próximo passo |
|---|---|---|---|---|---|
| 1 | média | **Gatilho fraco (escopo→skill só documental).** Nenhuma das 4 skills do projeto tem `paths:` no frontmatter — o vínculo escopo→skill (domínio→ddd, mobile→react) vive só no CLAUDE.md/rules, prosa que o modelo pode ou não consultar. O auto-disparo por diretório não acontece. | `.claude/skills/*/SKILL.md` (frontmatter, sem campo `paths`); confirmado por grep `^paths:` sem matches | activation-mechanisms (alavanca `paths:`) | Propor diff adicionando `paths:` a cada skill: `domain-driven-design`→`src/domain/**`; `react-best-practices`→`app/**, components/**, providers/**, contexts/**, hooks/**`; `clean-code`/`uncle-bob-craft`→ambos. Verificação: editar `src/domain/GestorJogo.ts` deve sugerir ddd (should); editar `assets/**` não (should-not). |
| 2 | média | **Gatilho largo demais / fora de escopo.** `react-best-practices` descreve-se como "React and Next.js… maintained by Vercel… Next.js pages… server-side data fetching", mas o projeto é Expo Router + React Native sem Next.js. Os termos que o dev diria (FlatList, re-render do GestorJogo, Expo, RN) não estão na description; termos irrelevantes (Next.js, SSR) estão. | `.claude/skills/react-best-practices/SKILL.md:3` | rule `mobile.md` (escopo é Expo+RN); CLAUDE.md "não tem backend/Next" | Encaminhar ao skill-creator para retunar a `description` incluindo "React Native / Expo, listas com FlatList/SectionList, re-render derivado" e removendo o viés Next.js/SSR. Verificação: "por que essa FlatList re-renderiza no app Expo?" (should); "otimizar SSR no Next.js" (should-not, near-miss). |
| 3 | baixa | **Sobreposição.** `clean-code` e `uncle-bob-craft` competem pelos mesmos gatilhos ("writing/refactoring/reviewing code", Clean Code de Uncle Bob). A própria description de uncle-bob-craft admite "complements clean-code" mas ambas disparam juntas em qualquer edição, inflando contexto. | `.claude/skills/clean-code/SKILL.md:3` e `.claude/skills/uncle-bob-craft/SKILL.md:3` | auditing-and-evals (gatilho sobreposto) | Manter ambas (são deliberadamente complementares por CLAUDE.md), mas estreitar uncle-bob-craft para o ângulo macro (arquitetura/SOLID/boundaries) e clean-code para micro (nomes/funções/smells), evitando overlap de termos. Verificação: "esse nome de função está bom?"→clean-code; "a dependência aponta pro lado certo?"→uncle-bob-craft. |
| 4 | baixa | **Anti-padrão de description *pushy* / genérica.** `clean-code` ("transform code that works into code that is clean") e `uncle-bob-craft` ("Use when… writing or refactoring code") têm gatilhos amplos demais que disparam em quase toda edição — inclusive na fase atual em que a UI está só começando. Não é colisão com regra documentada, mas ruído de ativação. | `.claude/skills/clean-code/SKILL.md:3`; `.claude/skills/uncle-bob-craft/SKILL.md:3` | auditing-and-evals (gatilho largo) | Opcional: tornar uma delas `disable-model-invocation: true` (manual-only) se o ruído incomodar, OU restringir via `paths:` (achado #1) para que só disparem em código, não em assets/config. Verificação: editar `package.json`/`app.json` não deve ativar clean-code (should-not). |

Observações de fechamento: não há `settings.json`/`skillOverrides`/`permissions Skill(...)` no projeto, então nenhum achado de override; o vocabulário do domínio é PT (`Pelada/Partida/...`) e a `domain-driven-design` está corretamente apontada para `src/domain/` pelo CLAUDE.md e `rules/domain.md`. Todos os diffs acima são apenas recomendações — nada foi aplicado (postura read-only respeitada).

### clean-architecture-guardian
- status: ok
- skill_invocada: sim
- resumo: A direção de dependência e a pureza de domínio estão exemplarmente respeitadas — `src/domain/` é puro, há uma porta `RepositorioPelada` definida no domínio e implementada na infraestrutura (DIP correto), e a UI consome o domínio só via `useSoccer`/`useGameSlice`, sem instanciar entidades em telas de produção. Os achados são de coesão/SRP no nível de componente e de tamanho do agregado raiz, não violações de camada.
- achados:

| # | severidade | descrição | arquivo:linha | fonte/regra | próximo passo |
|---|---|---|---|---|---|
| 1 | 🟠 Alto | God components: telas gigantes misturam render, estado e orquestração de fluxo (SRP no nível de componente). `partida.tsx` 2998 linhas, `(pelada)/index.tsx` 2478, `times.tsx` 1477, `jogadores.tsx` 1393 — muito acima do limite "passa de 80 linhas? extraia" da regra. | app/(pelada)/partida.tsx:1; app/(pelada)/index.tsx:1; app/(pelada)/times.tsx:1; app/(pelada)/jogadores.tsx:1 | SRP / mobile.md ("componente passa de 80 linhas? extraia subcomponentes ou hooks") | Extrair hooks dedicados (ex.: `usePartida`, `useMontagemDeTimes`) e subcomponentes; manter a tela como composição. Delegar o craft fino a `clean-code-review`/`react-best-practices`. |
| 2 | 🟡 Médio | Aggregate root grande: `GestorJogo` (~892 linhas, ~50 métodos) acumula jogadores, times, timer, gols, ciclo da partida, regras E o contrato de external-store (subscribe/notify/version) na mesma classe — múltiplos motivos para mudar. | src/domain/GestorJogo.ts:26 | SRP | Avaliar extrair a reatividade para um mixin/colaborador `Observable` e agrupar operações de time/jogador em serviços de domínio coesos. Não urgente; é coesão, não violação de camada. Aprofundar com `ddd-implementation` se for refatorar. |
| 3 | 🟡 Médio | Lógica de leitura/derivação em telas: `partida.tsx` tem 14 e `index.tsx` 7 ocorrências de `sort/filter/reduce/map`. Parte é apresentação legítima, mas há risco de regra de derivação vazar do domínio para a UI. | app/(pelada)/partida.tsx; app/(pelada)/index.tsx | direção de camada (lógica de negócio no domínio) | Auditar caso a caso: cálculo/ordenação que é regra (ex.: ordenação de fila, agregação de placar) deve virar seletor/método no domínio; só formatação fica na tela. |
| 4 | 🔵 Sugestão | Drift de documentação vs. estrutura real: CLAUDE.md/AGENTS.md descrevem `providers/`, `contexts/`, `hooks/`, `components/` na raiz e provider `MyProviders`, mas a estrutura real é `src/app-shell/` (provider = `soccerProvider.tsx`), `src/infrastructure/`, `src/shared/`. A camada de infraestrutura (que os docs dizem inexistir) já existe e está correta. | CLAUDE.md:77-102; AGENTS.md:79-107 | consistência docs↔código | Atualizar a seção Arquitetura para refletir `src/{domain,app-shell,infrastructure,shared}` e renomear a menção a `MyProviders`. Sem impacto estrutural. |
| 5 | 🔵 Sugestão | Fronteira de camada é convenção, não verificada por máquina. A pureza atual é ótima, mas nada impede um futuro `import` de `react-native` no domínio passar despercebido. | (todo o `src/domain/`) | enforcement de fronteira (DIP arquitetural) | Adicionar um teste de arquitetura/lint (ex.: dependency-cruiser ou regra ESLint `no-restricted-imports` barrando `react`/`react-native`/`expo`/infra dentro de `src/domain/`, com a exceção whitelisted do polyfill `react-native-get-random-values`). |

Pontos positivos confirmados (não são achados, mas sustentam o status ok): domínio sem React/RN/Expo/I-O salvo o polyfill documentado (`react-native-get-random-values`); porta `RepositorioPelada` definida no domínio e implementada em `AsyncStoragePeladaRepository implements RepositorioPelada` (seta apontando para dentro); instanciamento de entidades isolado no provider (`soccerProvider.tsx:144,229,248,279`) e em fixtures de teste, nunca em telas de produção; Factory+Strategy com o único `switch` corretamente confinado em `CreateTeam.factory.ts` (OCP preservado nos consumidores); Chain of Responsibility canônica em `FinalResult.handler.ts`/`FinalResult.processor.ts`. Nenhum sinal de overengineering — os padrões respondem a variação real de comportamento.

### clean-code-review
- status: ok
- skill_invocada: sim
- resumo: O domínio puro é, no geral, exemplar (nomes intencionais, guard clauses, erros em PT descritivos, comentários focados no "porquê"), mas há dois pontos micro de legibilidade que doem de fato — a tela `app/(pelada)/partida.tsx` com ~3000 linhas (dezenas de componentes num só arquivo) e um `any` proibido no domínio — além de mistura inconsistente PT/EN nos nomes e um `CLAUDE.md` que descreve uma arquitetura que não existe mais.
- achados:

| # | severidade | descrição | arquivo:linha | fonte/regra | próximo passo |
|---|---|---|---|---|---|
| 1 | 🟠 importante | `partida.tsx` tem ~2999 linhas com ~15+ componentes (MatchScoreboard, FieldBackdrop, PlayerDot, CenterDisc, BenchRail, ScorerSheet, SubstitutionSheet, GoalCelebration…) num único arquivo; mobile.md manda extrair acima de 80 linhas | app/(pelada)/partida.tsx (arquivo inteiro) | Fowler: Large Class/Long File → Extract Class/Move Function; regra do projeto `.claude/rules/mobile.md` ("passa de 80 linhas? extraia") | Mover cada subcomponente + seu styles para `src/shared/ui/partida/*.tsx`; deixar `partida.tsx` só com `PartidaInner` e a orquestração |
| 2 | 🟠 importante | `any` proibido no domínio puro: parâmetro `choosingTeams: any` | src/domain/Rules.ts:54 | regra do projeto domain.md ("Sem `any`. Tipos explícitos."); Clean Code Cap. 6 (tipos honestos) | Trocar por `checkChoosingTeams(choosingTeams: unknown)` (já há `includes()`), ou tipar `ChoosingTeams` e validar via `Object.values(...).includes(choosingTeams as ChoosingTeams)` |
| 3 | 🟠 importante | Mistura PT/EN inconsistente no mesmo objeto de domínio: métodos `addPlayer`/`removeFromGame`/`switchPlayerLeft`/`setNextMatch` convivem com `reordenarJogadores`/`esvaziarTime`/`moverTimeParaFim`/`atualizarRegras`; idem campos `next`/`playing` vs `advantageToNext` | src/domain/GestorJogo.ts (toda a classe); Team.ts (`renomear`/`mudarCor` vs `addPlayer`) | Clean Code Cap. 2 ("Use Consistent Names per Concept"); domain.md ("nomes em PT quando refletirem o vocabulário") | Decidir uma convenção (a regra do projeto sugere PT para vocabulário de domínio) e renomear em bloco; arriscado (API consumida pela UI) → confirmar antes |
| 4 | 🟡 nit | Comentário-cicatriz que descreve bug antigo em vez do "porquê" atual, com português coloquial: `//tava deletando mais de um.` | src/domain/Team.ts:114 | Clean Code Cap. 4 ("Journal/Noise Comments" — não comente o histórico, o git guarda) | Remover o comentário (o nome `removePlayer` + o teste de regressão já documentam) |
| 5 | 🟡 nit | Ternário usado só por efeito colateral (não por valor) reduz legibilidade vs `if/else` | src/domain/GestorJogo.ts:378-380 (`updateTeams`) e Match.ts:46-50 (`countGoals` reduce) | Clean Code Cap. 3/Fowler: prefira statement a expressão quando há side-effect | Converter o ternário de `updateTeams` em `if/else`; em `countGoals`, `if (goal.team.id === this.teamA.id) acc.teamA++; else acc.teamB++;` |
| 6 | 🟡 nit | `Rules.toSeconds` reatribui o parâmetro (`timeString = "00:00:00"`) e usa `parseInt` sem radix nem validação de partes ausentes | src/domain/Rules.ts:62-69 | Clean Code Cap. 3 ("no output/reassigned arguments"); Fowler: Split Variable | Usar variável local em vez de reatribuir o parâmetro; `parseInt(parts[i], 10)` com guarda de formato |
| 7 | 💡 sugestão | `CLAUDE.md` descreve estrutura inexistente (`app/(tabs)/`, `contexts/SoccerContext`, `hooks/useSoccer`, vocabulário `Projeto/Corte/Short`) — o código real é `src/app-shell/`, `src/shared/`, `src/infrastructure/`. Doc desatualizada mente sobre o sistema | CLAUDE.md:78-99, 30-35, 87-90 (vs. estrutura real em src/) | Clean Code Cap. 4 ("comentário/doc que mente é pior que nenhum") | Atualizar a seção Arquitetura do CLAUDE.md/AGENTS.md para refletir `src/app-shell` + `src/shared` + `src/infrastructure` (fora do escopo read-only desta rodada) |

Observações de escopo (não sinalizadas de propósito): os `as any` em `app/__tests__/*` e `jest.setup.ts` são scaffolding de teste, aceitáveis. O `console.warn` em `src/app-shell/soccerProvider.tsx` é logging de infraestrutura documentado (não é domínio), portanto fora da proibição de `console.log` do domínio. Formatação pura foi deferida ao ESLint/Prettier. O veredito estrutural sobre `partida.tsx` no nível de arquitetura/camadas (se a tela deveria delegar mais ao domínio) é de `clean-architecture-guardian`, não desta lente.

Elogio (🌟): `GestorJogo` e `useGameSlice.ts` são modelos de craft — guard clauses no topo, erros de domínio em PT específicos com o valor ofensor, funções privadas pequenas (`recomputePlayersWithoutTeam`, `limparEstatisticasDoGol`, `arquivarPartidaEncerrada`) extraídas por intenção, e comentários que explicam o "porquê" não-óbvio (ex.: por que `setPlayingGame` precisa do guard de 2 times).

### open-source-readiness
- status: ok
- skill_invocada: sim
- resumo: Projeto bem acima do "mínimo" de Akita nos 3 pilares — README focado no problema, web pública em 1 clique, CI rodando typecheck+lint+testes a cada PR/push, CHANGELOG (Keep a Changelog), LICENSE MIT, PRIVACY.md e AGENTS.md presentes. As lacunas restantes são de manutenção (drift de docs, release.yml ausente, .env.example), não de prontidão.
- achados:

| # | severidade | descrição | arquivo:linha | fonte/regra | próximo passo |
|---|---|---|---|---|---|
| 1 | 🟡 | AGENTS.md está dessincronizado e errado: descreve a stack do gerador-cortes (FastAPI/SQLAlchemy/n8n/Gemini, vocabulário `Projeto/Corte/Short`, `routers→services→domain`) em vez do FuteLista. O próprio cabeçalho diz ser "espelho idêntico do CLAUDE.md", mas não é — e referencia `.agents/skills` / `.agents/rules` que não existem (o real é `.claude/`). Para um agente, é instrução ativamente enganosa. | FuteLista/AGENTS.md:26-55,139-145 | Pilar transversal — Legível por agentes (AGENTS.md deve complementar, não contradizer) | Reescrever AGENTS.md a partir do CLAUDE.md atual do FuteLista; corrigir caminhos para `.claude/` |
| 2 | 🟡 | Drift de versão no README: tabela de stack diz "Expo 51, RN 0.74, Expo Router 3", mas o package.json tem Expo 54, RN 0.81, Router 6. PRIVACY.md também cita "Expo SDK 51". | FuteLista/README.md:49-50; FuteLista/PRIVACY.md:47 | Regra de ouro do README / confiabilidade da doc | Atualizar versões para Expo 54 / RN 0.81 / Router 6 |
| 3 | 🟡 | Contradição factual no PRIVACY.md: afirma "não há persistência; ao fechar o app os dados são descartados" e trata AsyncStorage como "planejada", mas README e CHANGELOG confirmam persistência local via AsyncStorage já entregue na 1.0.0. Política de privacidade desatualizada é risco em publicação de loja. | FuteLista/PRIVACY.md:29-31 | Pilar 3 — docs padronizadas / compliance de loja | Atualizar a seção "Dados que ficam no dispositivo" para refletir AsyncStorage ativo |
| 4 | 🟡 | Falta `release.yml` separado, disparado só em tags `v*.*.*`. Há `ci.yml` (qualidade) e `lock-check.yml`, mas nenhum workflow de release/empacotamento; CHANGELOG e versionamento semântico estão prontos para alimentá-lo. | FuteLista/.github/workflows/ (ausente) | Pilar 2 — `release.yml` em tags v*.*.* | Andaimar release.yml (build APK via EAS + publicação de release a partir do CHANGELOG) quando o usuário for distribuir |
| 5 | 🔵 | Sem `*.env.example`. Hoje não há `.env` versionado (bom) e o app não usa segredos, mas o `.gitignore` não lista `.env`/`config/deploy.env` — se um segredo EAS/deploy entrar no futuro, não há rede de proteção nem template. | FuteLista/.gitignore:1-20 | Transversal — Segurança (.env.example + gitignore de segredos) | Adicionar `.env*` ao .gitignore preventivamente; criar `.env.example` se/quando surgir config |
| 6 | 🔵 | CHANGELOG "[Não lançado]" referencia `COMMITS_PLAN.md`, mas o README diz que parte desse trabalho (lint no CI) já está feito — pequeno descompasso entre o planejado e o estado real. | FuteLista/CHANGELOG.md:13-15 | Pilar 3 — CHANGELOG mantido | Mover "ativação do lint no CI" de Planejado para a 1.0.0/Adicionado |
| 7 | 🔵 | `AI_NAVIGATION.md` e `docs/` (incl. `docs/adr/`, guias de usuário) são citados em README/CHANGELOG mas não verifiquei existência nesta auditoria focada — possível link quebrado se algum não existir. | FuteLista/README.md:23-25,58-60 | Pilar 3 — docs/ para contribuidores | Conferir que os arquivos linkados em docs/ existem (verificação rápida de links) |

Observação: os itens 🔴 do checklist (caminho de instalação testável, CI com testes a cada PR/push, README pelo problema, sem segredos versionados, LICENSE) estão **todos atendidos**. Nenhuma lacuna bloqueia publicação; o foco recomendado é corrigir o drift de documentação (achados 1–3), que é o maior risco real para quem instala/contribui e para um agente que lê o AGENTS.md.

### proposal-architect
- status: ok
- skill_invocada: sim
- resumo: A stack (Expo Router + RN + TS estrito + domínio puro com Factory/Strategy/Chain/Aggregate Root) continua certeira e bem right-sized para um app pessoal offline-first; o ponto frágil da reatividade já foi decidido e implementado (ADR-0002, useSyncExternalStore), mas a arquitetura real cresceu (persistência via porta/adapters + novos agregados) sem ADR e a documentação-guia (CLAUDE.md/AGENTS.md) está dessincronizada do código.
- achados:

| # | severidade | descrição | arquivo:linha | fonte/regra | próximo passo |
|---|---|---|---|---|---|
| 1 | alta | Decisão arquitetural NÃO registrada em ADR: foi adicionada uma camada de persistência completa (porta `RepositorioPelada` no domínio + adapters AsyncStorage/EmMemória + serializers + backup). É exatamente o tipo de escolha (Hexagonal/Ports&Adapters, formato de serialização, soft-delete/arquivamento, backup JSON) que muda o desenho se revertida e tem trade-off real — o critério do próprio projeto para criar ADR. | `FuteLista/src/domain/ports/RepositorioPelada.ts:17`; `FuteLista/src/infrastructure/storage/*` | Right-sizing diz "decisão com trade-off real → ADR". Falta `docs/adr/0003-persistencia-ports-adapters.md` (não escrever aqui; só registrar a lacuna) |
| 2 | alta | Desalinhamento estrutura real × documentada: CLAUDE.md/AGENTS.md descrevem a cola React em `providers/`, `contexts/`, `hooks/` e rotas em `app/(tabs)/` com telas `index/list/Teams/GestorJogo/CurrentGame`. Na prática a cola está em `src/app-shell/` (soccerProvider, useSoccer, useGameSlice, myProviders) e as rotas em `app/(pelada)/` com `index/jogadores/times/partida/historico`. Quem segue o doc procura pastas que não existem. | `FuteLista/CLAUDE.md:87-92,98`; `FuteLista/AGENTS.md:81-97`; real: `FuteLista/src/app-shell/*`, `FuteLista/app/(pelada)/*` | Atualizar a seção "Arquitetura" do CLAUDE.md/AGENTS.md para refletir `src/app-shell/`, `src/infrastructure/` e `app/(pelada)/` |
| 3 | alta | AGENTS.md (espelho declarado do CLAUDE.md) está fortemente defasado: ainda fala de backend FastAPI/SQLAlchemy/n8n/Gemini/FFmpeg e vocabulário `Projeto/Corte/Short` (herança do gerador-cortes), e lista só 4 handlers de FinalResult. O próprio cabeçalho promete "conteúdo idêntico ao CLAUDE.md". | `FuteLista/AGENTS.md:5-6,26-40,135` vs `FuteLista/CLAUDE.md:124-132` | Re-sincronizar AGENTS.md com CLAUDE.md (remover resíduo do gerador-cortes) |
| 4 | média | Lacuna de ADR sobre o crescimento do modelo de domínio: surgiram agregados/conceitos novos (`Pelada` como tipo cadastrado vs `GestorJogo`/Execução como sessão, `AgregadosPelada`, `ConvitePelada`, `RelatorioExecucao`) que mudam a fronteira do agregado raiz descrita nos docs. A separação Pelada(tipo)×Execução(sessão) é uma decisão de modelagem com trade-off, sem registro. | `FuteLista/src/domain/Pelada.ts`; `FuteLista/src/domain/AgregadosPelada.ts`; `FuteLista/src/domain/ConvitePelada.ts` | Avaliar ADR de modelagem (Pelada vs Execução); no mínimo atualizar `docs/desenvolvedor/dominio.md` e a seção "Conceitos do Domínio" do CLAUDE.md |
| 5 | baixa | ADR-0001 referencia `COMMITS_PLAN.md` e fala de "175 linhas comentadas / dois navegadores lado a lado" como estado transitório; convém um gatilho de revisão objetivo para fechar quando a unificação do roteador (remover `createBottomTabNavigator`) estiver concluída. ADR é imutável, então a revisão seria um novo ADR ou nota de status. | `FuteLista/docs/adr/0001-expo-router.md:52,66` | Confirmar se a tab-bar imperativa foi removida; se sim, registrar fechamento (novo ADR/nota), não reescrever o 0001 |
| 6 | info | Ponto frágil conhecido (reatividade do GestorJogo / evitar `setState([])`) JÁ está decidido e implementado: external store no agregado (`subscribe`/`version`/`notify`) consumido por `useGameSlice` via `useSyncExternalStore`, documentado em ADR-0002 (aceito). Não há lacuna de decisão aqui — apenas as `rules/mobile.md` ainda dizem "a definir em refactor futuro", desatualizadas frente ao ADR. Sem over/under-engineering: Zustand seria over para o escopo atual; a postura "reabrir se virar gargalo" está correta. | `FuteLista/docs/adr/0002-reatividade-external-store.md`; `FuteLista/src/app-shell/useGameSlice.ts`; `FuteLista/src/domain/GestorJogo.ts`; `FuteLista/.claude/rules/mobile.md:25-28` | Atualizar `rules/mobile.md` para apontar o padrão já decidido (useGameSlice) em vez de "a definir" |

### conventional-commit-gitmoji
- status: ok
- skill_invocada: sim
- resumo: O histórico é disciplinado e consistente — Conventional Commits com escopo, mensagem em PT no imperativo, um assunto por commit e corpo explicando o "porquê", com rodapé Co-Authored-By presente. O único desvio sistemático contra o padrão da skill é a ausência do gitmoji ANTES do tipo em 100% dos commits.
- achados:

| # | severidade | descrição | arquivo:linha | fonte/regra | próximo passo |
|---|---|---|---|---|---|
| 1 | média | Nenhum dos ~50 commits recentes usa o emoji gitmoji antes do tipo (a regra central da skill: `✨ feat`, `🐛 fix`...). Todos começam direto pelo tipo (`fix(android):`, `feat(ui):`). | histórico git (HEAD..-50) | skill: "Emoji ANTES do tipo" / tabela tipo→emoji | Adotar o emoji nos próximos commits; histórico passado é imutável (não reescrever). Confirmar se o hook `commit-msg` deve passar a exigir/validar o emoji. |
| 2 | baixa | Rodapé Co-Authored-By inconsistente: parte usa `Claude Opus 4.8 (1M context)` (de63cfb, 576fdd2, 95acfcf, 6b09883, b04566f) e parte usa `Claude Opus 4.8` (4df6991, 818b92d, etc.). CLAUDE.md/skill definem a forma canônica `Claude Opus 4.8 <noreply@anthropic.com>`. | commits de63cfb/576fdd2/95acfcf/6b09883/b04566f (rodapé) | skill: "Rodapé de co-autoria… aplique-as" | Padronizar o trailer para a forma canônica daqui em diante. |
| 3 | informativo | Marca `[unlock:<feature>]` ausente em todos os commits, inclusive os que tocam `src/domain/GestorJogo.ts` (95acfcf, a1b5db1, 309e5bc). Verificado: `features/registry.yaml` tem `locks: []`, ou seja, nenhum arquivo travado — portanto a ausência da marca está CORRETA, sem violação do protocolo de lock. | features/registry.yaml:6 | CLAUDE.md §"Protocolo de Alteração (Lock)" | Nenhuma ação; manter a marca quando/se algum arquivo entrar no registry. |
| 4 | informativo | "Um commit por funcionalidade" bem respeitado: cada commit carrega uma intenção coerente, com testes co-localizados junto da feature/fix (ex.: 95acfcf agrupa domínio + UI + specs do MESMO cenário — exceção legítima da skill, não mistura). Sem commits do tipo "X e Y". | histórico git | skill: "Um commit por funcionalidade" | Nenhuma ação; padrão saudável. |
| 5 | informativo | Citação de regra de negócio (RN-xx/D-xxx) ausente no corpo, mas há rastreabilidade própria do projeto via marcadores `[M-NN]`/`[F-NN]` no assunto (ex.: M-20, F-21). Convenção alternativa coerente com o repo. | commits 49910cb, 9b446da, etc. | skill: "Citação de origem quando o commit implementa uma regra" | Opcional: documentar M-/F- como o esquema oficial de origem no CLAUDE.md. |

### react-best-practices
- status: ok
- skill_invocada: sim
- resumo: A camada de UI está, no geral, bem arquitetada — o anti-padrão `setState([])` foi eliminado e substituído por um external store (`useSyncExternalStore` + `useGameSlice`), com listas em `FlatList`/`SectionList`, `keyExtractor` por `id` e seletores de slice mínimos. O ponto fraco real é re-render: o snapshot do store é só `version`, então todo `notify()` (incluindo cada tick do cronômetro) re-renderiza todos os consumidores, e nenhum componente de lista/campo usa `React.memo` para conter a propagação.
- achados:

| # | severidade | descrição | arquivo:linha | fonte/regra | próximo passo |
|---|---|---|---|---|---|
| 1 | alta | A cada tick do cronômetro `PartidaInner` re-renderiza e `teamA.players.map(...)`/`teamB.players.map(...)` recriam todos os `PlayerDot` com closures `onScore` novas. `PlayerDot` não é memoizado, então o campo inteiro (avatares + animações) re-renderiza 1×/s. Como o store compara só `version` (ADR-0002 §Neutras), `React.memo` aqui é o que faltava para cortar isso. | app/(pelada)/partida.tsx:393-426, 872 | rerender-memo | Envolver `PlayerDot` em `memo` e estabilizar o handler (passar `player`+`onScore(side,player)` em vez de closure por item, ou `useCallback`). |
| 2 | média | `TeamMini`, `TeamQueue` e os filhos de `src/shared/ui` (PlayerRow, PlayerAvatar, TeamCard etc.) não usam `memo`. Em Times/Home, qualquer `notify()` do agregado re-renderiza toda a árvore de itens, pois o store não compara o resultado do selector. | src/shared/ui/TeamMini.tsx:20, src/shared/ui/TeamQueue.tsx:17 (nenhum `memo` em todo src/shared/ui) | rerender-memo | Memoizar os componentes de item renderizados em `FlatList.renderItem`/`.map`, com props primitivas/estáveis. |
| 3 | média | `SoccerContext.Provider value={{...}}` recebe um objeto literal novo a cada render do provider; quando `saving`/`gestor` mudam, todos os `useSoccer()` re-renderizam ainda que só usem callbacks estáveis. | src/app-shell/soccerProvider.tsx:346-369 | rerender-derived-state | Envolver o value em `useMemo` (deps: gestor, saving, callbacks já estáveis via `useCallback`). |
| 4 | baixa | Em `partida.tsx`, `goalEvents`/`goals`/`reservas` derivados via selector são recriados a cada tick (novo array/objeto), mas alimentam `MatchTimeline`/`BenchRail`/`SubstitutionSheet` não-memoizados — sem `Object.is` no store, re-render garantido a cada segundo mesmo sem gol. | app/(pelada)/partida.tsx:74-77, 113, 454-460 | rerender-derived-state | Memoizar os consumidores e/ou retornar primitivos no selector (ex.: contagem em vez do array) onde só se usa `.length`. |
| 5 | informativo | `next.length === 0 && !temPartida ? (...) : next.length === 0 && temPartida ? (...) : (...)` é ternário aninhado (correto pela regra — evita `&&` com número), mas a leitura sofre; idem cadeias de `?:` longas no scoreboard. | app/(pelada)/times.tsx:362-390 | rendering-conditional-render | Manter o ternário (não trocar por `&&`); opcionalmente extrair em variável/`switch` para legibilidade (Clean Code). |

Observações de conformidade (sem achado): Rules of Hooks respeitadas; `useEffect` com cleanup correto (timers, `BackHandler`, subscribe do autosave); `keyExtractor`/`key` por `id`; listas variáveis em `FlatList` (os `.map` restantes são listas curtas e fixas, uso aceito pela regra do projeto); `setState([])` ausente em toda a base (ADR-0002 cumprida).

## Pontos a confirmar

1. **Existência dos arquivos linkados em `docs/`** (open-source #7): README/CHANGELOG citam
   `AI_NAVIGATION.md` e guias de usuário; uma verificação de links pendente confirmaria que
   nenhum link está quebrado.
2. **Fechamento do ADR-0001** (proposal #5): a tab-bar imperativa (`createBottomTabNavigator`)
   já foi removida? Se sim, vale registrar o fechamento.
3. **Política do hook de commit** (commit #1): o `commit-msg` deve passar a exigir o gitmoji,
   ou o emoji fica como convenção não validada?

## Próximos passos sugeridos (priorizados — este diagnóstico não corrige nada)

1. **Re-sincronizar a documentação-guia** (temas #1 e #2 das Prioridades): reescrever
   `AGENTS.md` a partir do `CLAUDE.md` e atualizar a seção "Arquitetura" de ambos para
   `src/{domain,app-shell,infrastructure,shared}` e `app/(pelada)/`. É o achado mais
   corroborado (3 skills) e o de maior risco para humanos e agentes. → tarefa de docs.
2. **Registrar os ADRs em aberto** (Prioridade #3 e proposal #4): `0003-persistencia-ports-adapters`
   e, se couber, um ADR de modelagem Pelada×Execução. → `proposal-architect`.
3. **Quebrar os god components** (Prioridade #4): começar por `partida.tsx`, extraindo
   subcomponentes para `src/shared/ui/partida/*` e hooks (`usePartida`). →
   `react-frontend-engineer` + `clean-code`.
4. **Cortar o re-render do campo** (Prioridade #5): `React.memo` em `PlayerDot`/itens de lista
   e `useMemo` no value do `SoccerContext`. → `react-best-practices`.
5. **Eliminar o `any` do domínio e decidir a convenção PT/EN de nomes** (Prioridades #6 e #7).
   → `clean-code`.
6. **Atualizar `rules/mobile.md`** para apontar o padrão já decidido (`useGameSlice`/ADR-0002)
   em vez de "a definir". → tarefa de docs.
7. **Endurecer a fronteira de domínio** com `no-restricted-imports`/dependency-cruiser
   (clean-arch #5) e adicionar `paths:` às skills do projeto (skill-router #1). Opcionais, de
   higiene. → `skill-router` para os `paths:`.

---
*Diagnóstico read-only gerado pela skill `project-diagnostic` orquestrando 7 skills avaliativas
em paralelo. Nenhum arquivo do projeto foi alterado — a única escrita foi este relatório.*
