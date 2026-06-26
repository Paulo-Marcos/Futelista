# 0003 — Persistência local via Ports & Adapters

**Status:** aceito
**Data:** 2026-06-25

## Contexto

O FuteLista precisa **persistir** o estado entre sessões: os tipos de
Pelada cadastrados (nome + regras) e as execuções jogadas (o agregado
`GestorJogo` com jogadores, times, partidas, gols, fila de próximos).
Sem isso, fechar o app perde tudo.

Mas o domínio é **puro** por decisão de arquitetura — `src/domain/` não
importa `react`, `react-native`, `expo-*` nem `AsyncStorage` (ver
[.claude/rules/domain.md](../../.claude/rules/domain.md)). Persistência é
I/O; colocar `AsyncStorage.setItem` dentro do `GestorJogo` quebraria essa
pureza, acoplaria o coração da pelada a um backend específico do React
Native e tornaria os ~20 specs do domínio dependentes de mock de I/O.

Some-se a isso uma dificuldade concreta: o grafo do domínio é **cíclico**
(`Player ↔ Team ↔ Match`) e algumas classes têm efeitos colaterais no
construtor (`Match`, `Timer`). Serializar e reidratar esse grafo não é um
`JSON.stringify` ingênuo — exige uma estratégia própria (persistir por id,
religar referências em dois passes). Essa lógica precisa morar em algum
lugar que **não** seja o domínio.

A pergunta foi: onde colocar a persistência sem contaminar o domínio, e
como permitir trocar o backend (produção vs. teste) sem reescrever quem
consome?

## Decisão

Adotar **Ports & Adapters** (Hexagonal / Dependency Inversion) para a
persistência:

1. O **domínio define a porta** — a interface
   [`RepositorioPelada`](../../src/domain/ports/RepositorioPelada.ts) em
   `src/domain/ports/`. Ela declara o contrato (`carregar`, `salvar`,
   `listarPeladas`, `exportarBackup`, …) com assinaturas **assíncronas**
   (`Promise<…>`) para comportar adapters de I/O sem quebra de contrato.
   O domínio depende só dessa abstração, nunca de uma implementação.

2. Os **adapters ficam na infraestrutura** — `src/infrastructure/storage/`
   implementa a porta. A camada **conhece** o domínio; o domínio **não**
   conhece a camada. A dependência cruza num único sentido (para dentro).

   - [`AsyncStoragePeladaRepository`](../../src/infrastructure/storage/AsyncStoragePeladaRepository.ts)
     — produção (iOS/Android/Web persistente) sobre
     `@react-native-async-storage/async-storage`.
   - [`RepositorioPeladaEmMemoria`](../../src/infrastructure/storage/RepositorioPeladaEmMemoria.ts)
     — `Map` em memória para testes e `__DEV__`.

3. A **serialização do grafo** é responsabilidade da infraestrutura, não
   do domínio:
   - [`serializer.ts`](../../src/infrastructure/storage/serializer.ts) —
     `GestorJogo` → JSON e de volta, em dois passes (instanciar por id;
     religar referências), com `Object.create` para classes de construtor
     com efeito colateral. Carrega `PAYLOAD_VERSION` e migra payloads
     antigos com defaults conservadores.
   - [`peladaSerializer.ts`](../../src/infrastructure/storage/peladaSerializer.ts)
     — `Pelada` (tipo) → JSON. Simples, sem grafo.

4. As **chaves do AsyncStorage** têm fonte única em
   [`storageKeys.ts`](../../src/infrastructure/storage/storageKeys.ts)
   (namespace `futelista:`), e o **backup JSON**
   ([`backup.ts`](../../src/infrastructure/storage/backup.ts)) exporta tudo
   sob o namespace sem entender o schema interno.

5. A **injeção** acontece na cola React: o
   [`soccerProvider.tsx`](../../src/app-shell/soccerProvider.tsx) recebe um
   `repositorio?: RepositorioPelada` opcional e usa
   `new AsyncStoragePeladaRepository()` como default. Testes passam o
   adapter em memória. Quem consome só enxerga a porta.

## Alternativas consideradas

### A. Porta no domínio + adapters na infraestrutura (escolhida)

**Prós**
- Domínio continua **puro** — `src/domain/` não toca `AsyncStorage`. A
  regra de pureza ([.claude/rules/domain.md](../../.claude/rules/domain.md))
  fica intacta.
- Backend trocável sem mexer em quem consome: produção usa AsyncStorage,
  teste usa o adapter em memória, só mudando a injeção no provider.
- Specs do domínio não precisam de mock de I/O — o adapter em memória é um
  fake nomeado, não um stub inline.
- A complexidade de serializar o grafo cíclico fica isolada num único
  lugar (`serializer.ts`), longe das entidades.

**Contras**
- Mais arquivos e uma indireção (interface + 2 implementações +
  serializers) para um app pessoal — é mais cerimônia que persistir direto.
- Manter dois adapters em sincronia com a porta dá trabalho: toda método
  novo na interface precisa ser implementado nos dois.

### B. Persistir direto no domínio (`GestorJogo` chama AsyncStorage)

**Prós**
- Menos código — sem porta, sem adapter, sem injeção.

**Contras**
- Quebra a pureza do domínio: acopla o agregado raiz ao
  `@react-native-async-storage` e ao React Native.
- Os ~20 specs do domínio passariam a depender de mock de I/O.
- Impossível trocar backend (ex.: SQLite, nuvem) sem reescrever o domínio.

### C. Serviço de persistência na camada React (hook/provider faz I/O)

**Prós**
- Domínio segue puro.
- Sem interface formal — menos arquivos que a opção A.

**Contras**
- Espalha leitura/escrita e serialização pela cola React; o grafo cíclico
  seria reidratado dentro de um hook.
- Sem contrato explícito, cada tela tende a falar com o storage do seu
  jeito — sem o ponto único que a porta dá.
- Troca de backend vira refactor de UI, não de uma implementação isolada.

### D. ORM / camada de dados pesada (WatermelonDB, Realm, SQLite + ORM)

**Prós**
- Consultas e índices nativos; escala para muitos registros.
- Migrações estruturadas de schema.

**Contras**
- Dependência grande e modelo de dados próprio para um app **pessoal**
  (uma pelada, dezenas de execuções) — abstração futura, fere o "não
  invente abstrações para o futuro" do [CLAUDE.md](../../CLAUDE.md).
- Duplicaria o modelo: entidades de domínio **e** entidades do ORM.
- AsyncStorage chave-valor atende de sobra o volume atual.

## Consequências

### Boas
- Domínio testável e puro: o adapter em memória cobre os fluxos de
  persistência sem tocar disco; o domínio nunca importa I/O.
- Ponto único de troca de backend — se um dia entrar SQLite ou sync em
  nuvem, é um **novo adapter** implementando `RepositorioPelada`, sem
  alterar domínio nem telas.
- Evolução de payload controlada: `PAYLOAD_VERSION` + `migrarPayload`
  deixam saves antigos carregarem com defaults conservadores; backup JSON
  sobrevive a campos novos sem migração própria.
- Chaves e namespace centralizados em `storageKeys.ts` — renomear um
  prefixo é edição num único lugar.

### Ruins (ou trade-offs)
- Toda mudança no contrato precisa ser refletida nos **dois** adapters —
  esquecer um quebra produção ou teste de forma assimétrica.
- A reidratação do grafo cíclico em `serializer.ts` é a parte mais
  intrincada da camada (dois passes, `Object.create`, cura de ids
  pendurados); concentra o risco de bug de persistência.
- `listarPeladas`/agregados cross-execução reidratam execuções inteiras —
  custo proporcional ao número de execuções. OK para o volume de uma
  pelada pessoal; seria gargalo num backend relacional indexado.

### Neutras
- `RepositorioPeladaEmMemoria.exportarBackup()` devolve um payload v1
  vazio só para honrar o contrato — backup real só faz sentido no adapter
  AsyncStorage.
- O prefixo legado `futelista:pelada:` continua sendo **lido** para não
  perder saves anteriores ao conceito de "tipo de Pelada"; escrita nova
  usa `futelista:execucao:`. A migração é silenciosa, na próxima escrita.

## Referências

- [src/domain/ports/RepositorioPelada.ts](../../src/domain/ports/RepositorioPelada.ts) — a porta.
- [src/infrastructure/storage/](../../src/infrastructure/storage/) — adapters, serializers, chaves e backup ([README](../../src/infrastructure/storage/README.md)).
- [src/app-shell/soccerProvider.tsx](../../src/app-shell/soccerProvider.tsx) — injeção do adapter via Context.
- [.claude/rules/domain.md](../../.claude/rules/domain.md) — regra de pureza do domínio que motiva a porta.
- [ADR-0002](0002-reatividade-external-store.md) — o `GestorJogo` como external store; este ADR cobre como esse agregado é persistido.
- [docs/diagnostico/diagnostico-2026-06-24.md](../diagnostico/diagnostico-2026-06-24.md) — diagnóstico (proposal-architect #1) que apontou a decisão sem registro.
