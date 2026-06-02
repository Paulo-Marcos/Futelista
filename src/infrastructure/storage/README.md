# `src/infrastructure/storage` — persistência

Adapters que implementam [`RepositorioPelada`](../../domain/ports/RepositorioPelada.ts), a porta de persistência declarada pelo domínio.

A camada **conhece** o domínio (importa `GameManager`, `Pelada`, etc.) — o domínio **não** conhece esta camada. Toda dependência cruza num único sentido.

## Adapters

| Arquivo | Backend | Quando usar |
|---|---|---|
| [`AsyncStoragePeladaRepository.ts`](AsyncStoragePeladaRepository.ts) | `@react-native-async-storage/async-storage` | Produção (iOS/Android/Web persistente) |
| [`RepositorioPeladaEmMemoria.ts`](RepositorioPeladaEmMemoria.ts) | `Map` em memória | Testes e `__DEV__` |

## Serializadores

| Arquivo | Responsabilidade |
|---|---|
| [`serializer.ts`](serializer.ts) | Converte `GameManager` → JSON e reidrata (grafo cíclico Player↔Team↔Match). |
| [`peladaSerializer.ts`](peladaSerializer.ts) | Converte `Pelada` (tipo cadastrado) → JSON. Simples — sem grafo. |

A reidratação acontece em dois passes: (1) instanciar objetos vazios em `Map`s indexados por id; (2) religar referências usando os `Map`s como tabela de lookup. Para classes cujo construtor tem efeitos colaterais (`Match`, `Timer`), usamos `Object.create` para evitar disparar os efeitos novamente.

## Chaves no AsyncStorage

Fonte única em [`storageKeys.ts`](storageKeys.ts):

```
futelista:execucao:<id>       ← execução (GameManager) — escrita atual
futelista:pelada:<id>         ← execução legada (somente leitura, migra na próxima escrita)
futelista:peladaTipo:<id>     ← tipo de Pelada cadastrado
futelista:pelada:ativa-id     ← slot do id da execução ativa (apenas leitor: src/app-shell/peladaAtiva.ts)
```

Mudar o namespace (`futelista:`) ou qualquer prefixo é uma edição em **um único lugar**.

## Versionamento de payload

`serializer.ts` carrega o constante `PAYLOAD_VERSION` (atual: **3**). Toda escrita usa essa versão. Na leitura, `migrarPayload` preenche defaults conservadores para payloads anteriores; payloads de versão **maior** que `PAYLOAD_VERSION` são rejeitados com erro.

Histórico:
- **v1**: payload inicial (pré-conceito de tipo de Pelada).
- **v2**: ganha `status`/`createdAt`/`startedAt`/`endedAt` no nível da Pelada (lifecycle).
- **v3**: ganha `peladaId` (relação execução → tipo cadastrado).

Quando adicionar um campo novo:
1. Subir `PAYLOAD_VERSION`.
2. Adicionar default conservador em `migrarPayload` para versões anteriores.
3. Cobrir o caminho na spec.

## Política de erro

- **Falha de I/O** (AsyncStorage indisponível): propaga ao chamador. O provider em `src/app-shell/soccerProvider.tsx` captura e loga com `console.warn`.
- **Item corrompido** em `listar()`: descartado silenciosamente. Não derruba a listagem inteira por causa de uma chave problemática.
- **Payload mais novo que o conhecido**: erro explícito — sinal de downgrade do app.
