# 0004 — Pelada (tipo) separada de Execução (sessão)

**Status:** aceito
**Data:** 2026-06-25

## Contexto

Até este ponto o domínio tinha **um** agregado raiz: o `GestorJogo`. Ele
carregava simultaneamente duas responsabilidades que, no começo, pareciam a
mesma coisa:

1. **O cadastro** — "Fute CEF", joga quartas 21:00 na quadra do CEF, 5×5, 10
   minutos por partida. Isso é estável, muda raramente e é o que o usuário vê
   numa lista de "minhas peladas".
2. **A sessão jogada** — os jogadores que chegaram **hoje**, os times montados
   **hoje**, as partidas, os gols, o cronômetro, a fila de `next`. Isso nasce
   e morre num dia.

Enquanto o app só gerenciava "a pelada de agora", colapsar as duas coisas num
objeto só funcionava. Mas surgiram requisitos que não cabem nesse modelo:

- **Histórico**: o usuário quer reabrir a pelada da semana passada e jogar de
  novo "a mesma pelada", com o mesmo nome e as mesmas regras default, mas com
  os jogadores e o placar daquele dia preservados.
- **Agregados cross-sessão**: artilheiros e maiores sequências de vitória
  somados ao longo de **várias** sessões da mesma pelada-tipo.
- **Convite e relatório**: o convite ("⚽ Fute CEF · quartas 21:00") é
  propriedade do **tipo**; o relatório ("🏆 partidas, artilheiros do dia") é
  propriedade de **uma execução**.

Com um agregado só, "nome/dia/hora/local/regras default" e "jogadores/placar/
cronômetro de hoje" viviam no mesmo objeto mutável. Não havia como ter o
cadastro sem instanciar uma sessão inteira, nem como listar sessões de um mesmo
cadastro. A fronteira do agregado raiz precisava mudar — e isso é uma decisão
de desenho com trade-off, não estava registrada em lugar nenhum.

## Decisão

**Separar o cadastro da sessão em dois agregados distintos**, ligados por um id
fraco, e tratar as regras como **valor copiado** na transição entre eles.

- [`Pelada`](../../src/domain/Pelada.ts) — o **tipo** cadastrado: `id` estável,
  `nome`, `regras` (default), agenda decorativa (`dia`/`hora`/`local`),
  `observacoes` e soft delete (`arquivadaEm`). É um Aggregate Root pequeno, sem
  jogadores, sem partidas, sem cronômetro. Editá-lo (`renomear`,
  `atualizarRegras`, `arquivar`) **não** toca em nenhuma sessão.
- [`GestorJogo`](../../src/domain/GestorJogo.ts) — a **execução** (uma sessão
  jogada num dia): jogadores, times (`next`), `playing`, `matches`, `Timer`,
  `advantageToNext`, e um `status` próprio de ciclo de vida
  (`CREATED → ATIVA → FINALIZADA`). Continua sendo o agregado raiz da **partida**
  e o external store do React ([ADR-0002](0002-reatividade-external-store.md)).

A ligação é um **id fraco**, não uma referência de objeto: `GestorJogo.peladaId?`
guarda o `Pelada.id` de origem (e é **opcional** — execuções avulsas, criadas
antes do conceito de tipo ou sem associar a um cadastro, têm `peladaId`
`undefined`). As **regras viajam por valor**: ao iniciar uma execução a partir
de uma `Pelada`, o `Rules` é copiado para dentro do `GestorJogo`. Mudar as
regras default do tipo depois (`Pelada.atualizarRegras`) afeta só as **próximas**
execuções; sessões já criadas mantêm as regras com que nasceram.

Sobre essa fronteira surgiram três operações puras, cada uma do lado certo:

- [`AgregadosPelada`](../../src/domain/AgregadosPelada.ts) — consolida
  artilheiros e sequências de vitória **cross-execução** (recebe `GestorJogo[]`
  da mesma pelada-tipo). Como cada execução tem seus próprios `Player` com `id`
  novo, a identidade entre sessões é o **nome normalizado** (trim + lower-case)
  — trade-off assumido: renomear quebra o agregado, homônimos colapsam.
- [`ConvitePelada`](../../src/domain/ConvitePelada.ts) — gera o texto de convite
  a partir de **uma `Pelada`** (nome, agenda, regras). É propriedade do tipo.
- [`RelatorioExecucao`](../../src/domain/RelatorioExecucao.ts) — gera o texto de
  relatório a partir de **um `GestorJogo`** (partidas, artilheiros e vitórias do
  dia). É propriedade da sessão; aqui a identidade do jogador é o `Player.id`,
  porque tudo vive dentro de uma execução só.

## Alternativas consideradas

### A. Dois agregados (Pelada-tipo × Execução), ligados por id fraco (escolhida)

**Prós**

- Cada agregado tem **uma** razão para mudar: editar o cadastro não mexe em
  sessão; jogar uma sessão não mexe no cadastro (SRP no nível do agregado).
- Histórico natural: N execuções apontam para a mesma `Pelada` via `peladaId`,
  sem duplicar nome/regras nem amarrar referências de objeto.
- Agregados cross-sessão (`AgregadosPelada`) ficam triviais — é só passar a lista
  de `GestorJogo` daquela pelada-tipo.
- Convite (tipo) e relatório (sessão) caem em arquivos diferentes, cada um
  recebendo exatamente o agregado de que precisa.
- `peladaId` opcional mantém **retrocompatibilidade**: execuções avulsas antigas
  continuam válidas sem migração.

**Contras**

- A consolidação cross-execução depende de **identidade por nome** (não há id de
  jogador estável entre sessões). Renomear quebra o agregado; homônimos colapsam.
- Duas fontes da verdade para "as regras": o default no `Pelada` e a cópia em
  cada `GestorJogo`. Quem lê precisa saber que regras **viajam por valor** e que
  o tipo não é autoridade retroativa sobre sessões já criadas.
- O vínculo é um id fraco, então o domínio não impede, sozinho, um `peladaId`
  apontar para uma `Pelada` que não existe mais (integridade fica com a camada
  de persistência — ver [ADR de persistência, D-008](README.md)).

### B. Manter um agregado só (`GestorJogo` faz tudo)

**Prós**

- Zero conceito novo — um objeto, um lugar.
- Sem id fraco, sem cópia de regras, sem decidir "de que lado" cada operação fica.

**Contras**

- "Cadastro" e "sessão de hoje" mudam por motivos diferentes e em ritmos
  diferentes — juntá-los viola SRP e incha o agregado.
- Não há como listar/representar o **tipo** sem instanciar uma sessão inteira
  (jogadores, timer, matches) que ninguém vai usar.
- Histórico vira gambiarra: ou se duplica nome/regras em cada sessão, ou se
  inventa um campo "sou um template, me ignore".
- Agregados cross-sessão não têm sobre o que iterar — não existe a noção de
  "todas as execuções desta pelada".

### C. Uma `Pelada` que **contém** a lista de execuções (composição forte)

**Prós**

- Navegação direta: `pelada.execucoes` devolve o histórico sem um índice
  externo.
- Integridade referencial natural — não há id fraco para ficar pendurado.

**Contras**

- O agregado raiz vira gigante: carregar o cadastro arrasta **todas** as sessões
  (jogadores, partidas, timers) para a memória — caro e desnecessário na tela de
  lista de peladas.
- A fronteira de transação fica errada: encerrar a partida de hoje não deveria
  exigir travar o agregado inteiro com todo o histórico.
- Atrita com persistência incremental (D-008): salvar uma execução passaria a
  reescrever o documento da pelada inteira.

## Consequências

### Boas

- A pergunta "isto é do cadastro ou da sessão?" tem resposta clara, e ela
  determina o **arquivo**: `Pelada`/`ConvitePelada` para o tipo, `GestorJogo`/
  `RelatorioExecucao` para a sessão, `AgregadosPelada` para o que cruza sessões.
- `GestorJogo` continua sendo o external store reativo ([ADR-0002](0002-reatividade-external-store.md))
  **sem mudança** — a separação não tocou no contrato `subscribe`/`version`.
- Execuções avulsas (`peladaId` `undefined`) seguem funcionando — a evolução foi
  aditiva, sem migração forçada de dados existentes.
- O ciclo de vida da sessão (`CREATED → ATIVA → FINALIZADA`) é local ao
  `GestorJogo`; arquivar/desarquivar o **tipo** é local à `Pelada`. Um não
  interfere no outro.

### Ruins (ou trade-offs)

- **Identidade de jogador entre execuções é por nome normalizado**, não por id.
  É a única chave estável disponível hoje; o preço é renome quebrar o agregado e
  homônimos colapsarem. Está documentado no cabeçalho de `AgregadosPelada` e
  aceito conscientemente para não inventar identidade global agora.
- **Regras existem em dois lugares** (default no tipo + cópia por sessão). É
  intencional (snapshot por valor), mas exige que todo consumidor entenda que o
  tipo **não** é autoridade retroativa. Mal-entendido aqui vira bug sutil
  ("mudei as regras e a pelada de hoje não atualizou").
- O id fraco `peladaId` empurra a integridade referencial para a camada de
  persistência — o domínio puro, sozinho, não garante que ele aponte para uma
  `Pelada` viva.

### Neutras

- `AgregadosPelada`, `ConvitePelada` e `RelatorioExecucao` são **funções puras**
  sobre os agregados, não métodos dentro deles. Mantêm os agregados enxutos e
  são testáveis isoladamente (cada uma tem seu `*.spec.ts` co-localizado).
- A decisão **não** define como Pelada e execuções são gravadas/carregadas —
  isso é assunto do ADR de persistência (D-008 / ADR-0003), que se apoia nesta
  fronteira.

## Referências

- [src/domain/Pelada.ts](../../src/domain/Pelada.ts) — o tipo cadastrado.
- [src/domain/GestorJogo.ts](../../src/domain/GestorJogo.ts) → `peladaId`,
  `PeladaStatus`, `iniciar`/`finalizar` — a execução/sessão.
- [src/domain/AgregadosPelada.ts](../../src/domain/AgregadosPelada.ts) —
  consolidação cross-execução (identidade por nome).
- [src/domain/ConvitePelada.ts](../../src/domain/ConvitePelada.ts) — convite
  derivado do tipo.
- [src/domain/RelatorioExecucao.ts](../../src/domain/RelatorioExecucao.ts) —
  relatório derivado de uma execução (identidade por `Player.id`).
- [ADR-0002 — Reatividade via External Store no GestorJogo](0002-reatividade-external-store.md).
