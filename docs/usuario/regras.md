# Regras da pelada

As regras que você escolhe no início da pelada controlam **tamanho dos times, tempo das partidas, modo de escolha** e **como o app resolve empates**.

Tudo aqui é configurável por pelada (não há "modo padrão eterno"). Os defaults abaixo são o que o app oferece se você não mexer.

---

## Quadro resumo

| Regra              | Tipo          | Default     | Limite                       |
| ------------------ | ------------- | ----------- | ---------------------------- |
| Jogadores por time | inteiro       | 4           | ≥ 1                          |
| Tempo da partida   | `HH:MM:SS`   | `00:10:00` | ≥ 30 segundos                |
| Número de tempos   | inteiro       | 1           | ≥ 1                          |
| Gols-limite        | inteiro       | 2           | ≥ 1                          |
| Modo de escolha    | enum          | `BY_ORDER` | um dos 3 valores válidos    |

Definidas em [src/domain/Rules.ts](../../src/domain/Rules.ts) e validadas no construtor (lançam erro em português se você passar valor inválido).

## Jogadores por time

Define **N**, quantos jogadores cada time tem. O app monta times de N pessoas até acabar a lista.

Se sobrar gente (lista não é múltipla de N), o **último time fica parcial**. Esse time só completa quando alguém entrar via fila ou ao redimensionar.

## Tempo e número de tempos

- `timeMatch` é o tempo de **cada** tempo, no formato `HH:MM:SS`.
- `numberTimes` é quantos tempos a partida tem.
- Total da partida = `timeMatch × numberTimes`.

Exemplo: `00:07:00` com `numberTimes = 2` → 14 minutos no total, dividido em dois tempos de 7 min com intervalo entre eles.

O `Timer` passa por `INTERVAL` entre um tempo e outro (você precisa reiniciar para o próximo tempo começar).

## Gols-limite

Encerra a partida **antes do tempo** se algum time atingir esse número de gols. Útil pra peladas que querem rotatividade alta.

Default `2` = "primeiro time a fazer 2 gols ganha". Coloque `99` se quiser que tempo seja o único critério.

## Modos de escolha de times

Definidos no enum `ChoosingTeams` em [src/domain/Rules.ts](../../src/domain/Rules.ts):

### `BY_ORDER` — por ordem de chegada (padrão)

Time 1 = primeiros N jogadores da lista. Time 2 = próximos N. E assim por diante.

**Quando usar:** quando os jogadores chegam na ordem em que querem jogar e ninguém quer "sortear".

### `BY_ORDER_MIXING_TOP_TWO_TEAMS` — embaralha só os dois primeiros

Os dois primeiros times (que vão jogar a abertura) são embaralhados entre si. Do terceiro em diante, mantém a ordem de chegada.

**Quando usar:** quando você quer abrir a pelada equilibrada, mas o resto pode seguir a ordem.

### `BY_MIXING_TEAMS` — embaralha tudo

Lista inteira de jogadores é embaralhada antes de fazer os times.

**Quando usar:** pelada com perfil técnico muito desigual em que você quer variar quem joga com quem.

Cada modo é uma **strategy** em [src/domain/TeamBuilder](../../src/domain/TeamBuilder), criada por uma **factory**. Adicionar um quarto modo significa: criar uma nova strategy, registrar na factory, escrever spec.

## Vantagem e empate

A **vantagem** é o que o app usa para decidir desempate sem discussão.

### Quando um time ganha vantagem

- **Venceu a partida** → ganha vantagem para a próxima.
- **Empatou tendo vantagem** → mantém a vantagem.

### Quando um time perde vantagem

- **Foi derrotado** → perde (e vai pro fim da fila).
- **Empatou sem vantagem** → adversário com vantagem segue; ele cai.

### Quando ninguém tinha vantagem e empatou

Caso especial: dois times empataram e nenhum dos dois tinha vantagem. O app trata isso como **vantagem externa** — quem decide é alguém de fora (você toca em qual time deve seguir). Esse é o handler `WithDrawAndExternalAdvantageAndNotTwoTeams` na cadeia.

### A cadeia completa

Implementada em [src/domain/FinalResult/FinalResult.processor.ts](../../src/domain/FinalResult/FinalResult.processor.ts) como **Chain of Responsibility**. Cada handler testa uma condição; o primeiro que casa decide.

Ordem dos handlers:

1. `WithVictory` — houve vencedor. Aplica regra padrão de vitória.
2. `WithDrawAndAdvantageAndTwoTeams` — empate, vantagem existe, fila cheia (≥ 2 times esperando).
3. `WithDrawAndAdvantageAndNotTwoTeams` — empate, vantagem existe, fila parcial.
4. `WithDrawAndExternalAdvantageAndNotTwoTeams` — empate, ninguém tinha vantagem.

Por que cadeia e não `if/else`? Porque cada condição é **fechada e ortogonal**: dá pra adicionar uma quinta regra (ex.: empate em final de pelada) sem reescrever as quatro existentes.

## Validação na criação

Se você tentar criar uma pelada com regras inválidas, o app lança erro **em português** com mensagem específica:

- `"Limite mínimo de jogadores por time é 1."`
- `"Limite mínimo de tempo é 30 segundos."`
- `"Limite mínimo de tempos é 1."`
- `"Limite mínimo de gols é 1."`
- `"Tipo de escolha inválida"`

Essas mensagens são parte do contrato — alterar exige atualizar testes em `Rules.spec.ts`.

## Próximo passo

→ Ver o fluxo dessas regras em ação: [fluxo-pelada.md](fluxo-pelada.md).
→ Implementação técnica: [docs/desenvolvedor/dominio.md](../desenvolvedor/dominio.md).
