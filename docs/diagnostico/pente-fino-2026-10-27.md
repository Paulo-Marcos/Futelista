# Pente fino do FuteLista — 2026-10-27 (D-046)

Avaliação completa de `src/domain/`, `src/app-shell/`, `src/infrastructure/` e da UI (`app/`, `src/shared/`).
Três revisões independentes, uma por camada. Os achados graves foram reconferidos na fonte, e os de domínio foram
reproduzidos num teste descartável. Nenhum código de produção foi alterado nesta demanda.

## Portões medidos

| Portão | Resultado |
|---|---|
| `npx jest --ci` | 58 suítes / 588 testes verdes. Um worker é forçado a sair (timer vazando) e há avisos de `act(...)` em `VirtualizedList` |
| `npx tsc --noEmit` | limpo |
| `npm run lint` | 0 erros, 38 avisos (variáveis e imports sem uso em specs do `FinalResult`, `require()` em 2 specs) |
| `npm audit --omit=dev` | 41 alertas (2 críticos, 13 altos), a maioria em `ws`/ferramental do Metro/RN. `npm audit fix` resolve parte |

Pureza do domínio: **sem violações**. Nenhum componente instancia entidade de domínio, não há `any`/`ts-ignore` e
nenhum `setState([])` é usado para forçar render.

---

## P0 — quebram a pelada em uso real

| # | Onde | Defeito | Cenário |
|---|---|---|---|
| 1 | `src/domain/FinalResult/FinalResult.processor.ts:28`, `app/resultado.tsx:462` | **Empate sem vantagem não tem handler.** Os 4 handlers de empate exigem `advantageToNext` ou time externo | 1ª partida 0×0 com o 2º time cheio. A tela classifica como `draw_auto` e chama `definirProximaPartida()` sem time externo. Nada gira e `playing` continua sendo a partida encerrada |
| 2 | `app/(pelada)/partida.tsx:348` | **Fim natural do tempo some com o "Encerrar".** `ENDED` é tratado como `ready` | Acaba o último tempo: aparece "INICIAR" no lugar de "Encerrar". Tocar cria um Timer novo e a partida recomeça |
| 3 | `app/(pelada)/times.tsx:84`, `jogadores.tsx:84`, `partida.tsx:136` | **`useMemo` sobre array vivo do domínio.** `next`/`players`/`proximoTime.players` mudam por `splice`/`push` (`GestorJogo.ts:508-509`, `:279`, `:430`), então a referência nunca muda | "Mover para o fim" não reordena a fila na tela. Depois de `setPlayingGame`, Times 3–4 aparecem em dobro. Com busca ativa, jogador removido continua na lista. O banco mostra quem já entrou |
| 4 | `src/shared/ui/confirmAcao.ts:86-110` | **`escolherOpcao` corta opções.** O `Alert` do Android mostra só 3 botões, e na web "Cancelar" escolhe a 2ª opção | Menu "Gerenciar pelada" (6 opções) perde Limpar/Finalizar/Cancelar no Android. Na web, cancelar em `peladas/[id]` **inicia uma execução** |
| 5 | `src/domain/Timer.ts:34-46` | **Relógio sem âncora real.** O `restTime--` roda num `setInterval`. Não há `AppState` nem keep-awake | Tela apaga no bolso: no iOS o cronômetro congela. Matar o app faz ele voltar pausado, sem contar o tempo passado |
| 6 | `src/domain/GestorJogo.ts:388-394`, `Team.ts:113-119` | **`tirarDoJogo` não zera `currentTeam`, e `removePlayer` com `indexOf === -1` remove o último.** O mesmo vale na troca (`GestorJogo.ts:343`) | Tirar P4 e depois removê-lo da pelada faz o **P6 sumir** de todos os times, e um time vazio fica na fila |

## P1 — erram em cenários comuns

| # | Onde | Defeito |
|---|---|---|
| 7 | `Match.ts:33`, `GestorJogo.ts:380-386` | `Team.situation` nunca sai de PLAYING. `atualizarTimes` escolhe o redimensionamento errado e jogadores trocam de time na fila sem motivo |
| 8 | `Timer.ts:34-57` | `start()`/`continue()` repetidos criam um 2º `setInterval` (toque duplo = relógio em dobro). `continue()` também reabre um timer ENDED |
| 9 | `GestorJogo.ts:607-694` | Partida com resultado aceita `start()` e gols. O placar muda e `result` fica velho |
| 10 | `app/(pelada)/partida.tsx:198-214` | Gol antes do apito: `marcarGol` vira no-op (`GestorJogo.ts:632`), mas a tela comemora "GOL 1×0" |
| 11 | `GestorJogo.ts:349-365` | Times com 0 jogadores ficam em `next` depois de redistribuir |
| 12 | `TeamBuilder/CreateTeamMixed.ts:15` | `shuffle` in-place em `jogo.players`, o que faz a ordem de inscrição se perder de vez |
| 13 | `app/(pelada)/index.tsx:690` | CTA "Iniciar partida" navega sem `setPlayingGame` e cai no EmptyState |
| 14 | `src/app-shell/soccerProvider.tsx:71,80` | `lerPeladaAtivaId()` fora do `try` e `.then` sem `.catch`. Se o storage falhar, a tela fica em branco para sempre |
| 15 | `soccerProvider.tsx:90-108`, `constants.ts:14` | Tick de 1 s com debounce de 500 ms: o grafo inteiro é serializado e gravado a cada segundo de partida |
| 16 | `app/dev.tsx`, `app.json:8` | Rota `/dev` existe em produção (deep link `myapp://dev`) e tem "Limpar storage". Scheme genérico do template |
| 17 | `app/peladas/[id].tsx:64-72` | Id inexistente deixa o spinner eterno |
| 18 | `src/infrastructure/storage/fotoJogador.ts:21` | `fotoUri` absoluto: no iOS o container muda a cada update e as fotos somem (provável) |

## P2 — baixo impacto / UX

- `soccerProvider.tsx:114-133`: o gestor descartado com timer STARTED mantém o `setInterval` vivo (vazamento).
- `AsyncStoragePeladaRepository.ts:78-87`: uma execução corrompida derruba a lista toda (falta `try/catch` por item).
- `storageKeys.ts:19,23`: `ATIVA_ID` começa com o prefixo legado e é lida como execução. Hoje só escapa por acaso.
- `GestorJogo.ts:774-785`: `definirProximaPartida()` sem resultado descarta o timer de uma partida em andamento.
- `GestorJogo.ts:769`: `reabrirPartida` depois de um fim natural dá um tempo extra cheio.
- `ConvitePelada.ts:58-63`: o convite mostra "0min" para tempos em segundos.
- `partida.tsx:262,367`, `resultado.tsx:78,94`: `router.replace("/resultado")` troca o grupo `(pelada)` inteiro, e o replace roda em dobro.
- `partida.tsx:269-296`: os avisos "Faltam 2 min / 30 s" não voltam no 2º tempo.
- `times.tsx:114-133`: `?scrollTo=fila` não é consumido e a tela pula sozinha.
- `times.tsx:344` × `regras.tsx:71`: o chip manda "mudar nas regras", mas lá a opção está bloqueada (beco sem saída).
- `peladas/[id].tsx:93-116`: a guarda `iniciando` é estado, não ref, então um duplo toque cria duas execuções (provável).
- `partida.tsx:364`: "Encerrar" não pede confirmação.
- A11y: `Stepper.tsx` (+/−) e `PlayerRow.tsx` estão sem role/label. Em `CenterDisc.tsx:117` o label diz "Pausar" durante o INTERVAL.
- Nome e cor custom dos times são ignorados em `resultado.tsx:178`, `RecentRow.tsx`, `MatchHistoryCard.tsx:74`, `MatchScoreboard.tsx:113` e `RelatorioExecucao.ts:51`.
- "Herdar jogadores" (`soccerProvider.tsx:409`) perde as fotos.

## Regras do projeto violadas

- `app/regras.tsx:76`: `gestor.name = …` muda o agregado direto no componente, sem `notify`.
- `app/(pelada)/times.tsx:194-224`: a regra de troca de jogadores mora na UI e deveria ser `gestor.trocarJogadoresPorId`.
- `soccerProvider.tsx:323-340` e `serializer.ts:354`: `gestor["notify"]()` fura o encapsulamento, e a foto é gravada duas vezes.
- `GestorJogo.ts:259-386`: mutadores públicos sem `notify()` (`tirarDaFila`, `redimensionarTimes`, `realocarTime`…). `playing` e `advantageToNext` são graváveis de fora.
- `.claude/rules/mobile.md` diz que um seletor mínimo evita re-render. **É falso**: `useGameSlice` compara só `version`, então todo consumidor re-renderiza a cada tick. Alinhar a regra ao ADR-0002.

## Refatorações (PRs separados)

1. **`GestorJogo` (897 linhas)**: extrair `FilaProximos` (rotação, redimensionar, realocar) e `PartidaAtual` (gols, timer, resultado). Unificar os 4 handlers de empate em 2 ("vantagem = interna ?? externa") mais um handler de empate sem vantagem e um fallback que lança erro.
2. **`times.tsx` (962 → ~350)**: `useTrocaJogadores`, `useAcoesDeTime`, `ProximaPartidaHeader`. Os subcomponentes vão para `src/shared/ui/times/`.
3. **`pelada-nova.tsx` + `pelada-editar/[id].tsx` (~1200 → ~800)**: `PeladaForm` + `usePeladaFormState`. `GlowCTA` está copiado em 3 telas.
4. **`index.tsx` / `partida.tsx`**: separar `GestaoHome`/`ExecucaoHome`, levar `decidirCta`/`textoStatus` para um módulo puro testado e criar `usePartidaFeedback`.
5. **`soccerProvider.tsx` (418)**: `useAutosaveExecucao`, CRUD de Pelada separado, `mutarPelada(id, fn)`.
6. **Código morto**: `RepositorioPeladaEmMemoria.ts`, `PeladaHeader.tsx`, o comentário obsoleto em `index.tsx:640` e os imports sem uso de `Match` nos handlers.

## Lacunas de teste

- `FinalResultProcessor` com empate sem vantagem, pelo fluxo real de `definirProximaPartida` (as specs atuais fazem `spyOn` + `result` manual, e foi por isso que o P0-1 passou).
- `currentTeam` depois de `tirarDoJogo`/troca, e remoção dupla. Fila sem time vazio.
- `Timer`: `start`/`continue` repetidos, `continue` após ENDED, restauração em INTERVAL/ENDED.
- `SoccerProvider` (nenhum spec): boot com falha de storage, debounce, troca de execução.
- Regressão de tela: fila atualizada depois de "mover para o fim".

## Ordem sugerida de ataque

1. **P0-1 + P0-6 + P1-7/11** (rotação da fila e integridade dos times: uma demanda de domínio, testes primeiro).
2. **P0-2 + P1-8/9/10** (ciclo de vida da partida/Timer).
3. **P0-3** (memos sobre arrays vivos, mais a correção da regra no `mobile.md`).
4. **P0-4** (`escolherOpcao` via `ConfirmAcaoHost`).
5. **P0-5 + P1-15** (relógio por `Date.now()` + `AppState` + autosave por evento).
6. **P1-14/16/17** (robustez do boot, rota dev, 404 de pelada).
7. Refatorações, uma por PR.
