# FuteLista ⚽

App mobile para **organizar peladas de futebol**: cadastrar jogadores, montar times, gerenciar partidas, contar gols, controlar o cronômetro e atualizar a fila de "próximos" segundo o resultado (vitória, empate, vantagem).

> Pessoal, aberto a evolução. iOS, Android e Web (mesmo código).

---

## Stack

| Camada     | Tecnologia                                     |
| ---------- | ---------------------------------------------- |
| App        | [Expo](https://expo.dev) 51, React Native 0.74 |
| Roteamento | [Expo Router](https://docs.expo.dev/router) 3  |
| Linguagem  | TypeScript estrito                             |
| Testes     | Jest (preset `jest-expo`)                      |
| Lint       | ESLint (config Expo) + Prettier                |

## Como rodar

```bash
npm install
npm start            # escolhe iOS, Android, Web ou Expo Go
npm run android      # direto no emulador Android
npm run ios          # direto no simulador iOS
npm run web          # versão web
npm test             # testes em watch mode
```

Pré-requisitos completos em [docs/desenvolvedor/instalacao.md](docs/desenvolvedor/instalacao.md).

## Para quem é cada doc

- **Vai usar o app** → comece em [docs/usuario/primeiros-passos.md](docs/usuario/primeiros-passos.md).
- **Vai mexer no código** → comece em [docs/desenvolvedor/arquitetura.md](docs/desenvolvedor/arquitetura.md).
- **É um agente de IA** (Claude, Cursor, Copilot…) → leia [CLAUDE.md](CLAUDE.md) e [AGENTS.md](AGENTS.md) **antes** de editar qualquer arquivo.

Índice completo da documentação em [docs/README.md](docs/README.md). Decisões de arquitetura registradas em [docs/adr/](docs/adr/). Política de privacidade em [PRIVACY.md](PRIVACY.md).

## Vocabulário do domínio

O código e a UI usam **um vocabulário só**, em português. Se um termo aparecer aqui, é o termo certo em todo lugar:

| Termo         | Significado                                                                                |
| ------------- | ------------------------------------------------------------------------------------------ |
| **Pelada**    | A sessão inteira: lista de jogadores, regras, fila de times e histórico de partidas.       |
| **Partida**   | Um jogo entre dois times. Tem gols, vencedor (ou empate), tempo.                           |
| **Time**      | Grupo de N jogadores (`playersPerTeam`). Pode estar jogando, parado ou na fila.            |
| **Jogador**   | Pessoa cadastrada na pelada. Tem nome, gols, situação.                                     |
| **Próximos** | Fila dos times que ainda não jogaram (ou perderam e voltaram pro fim).                     |
| **Vantagem** | Direito do time campeão (ou que empatou em condição prévia) de seguir na próxima partida. |

Detalhes em [docs/usuario/regras.md](docs/usuario/regras.md) e [docs/desenvolvedor/dominio.md](docs/desenvolvedor/dominio.md).

## Estado do projeto

- ✅ **Domínio** (`src/domain/`): completo, puro, com ~20 specs Jest.
- 🚧 **UI** (`app/`, `components/`): em construção.
- ❌ **Persistência**: ainda não existe. Recarregar o app perde a pelada em andamento.
- ❌ **Lojas**: ainda não publicado.

Roteiro de refatoração em [COMMITS_PLAN.md](COMMITS_PLAN.md).

## Licença

[MIT](LICENSE). Pode usar, copiar, modificar e distribuir — mantendo o aviso de copyright e a nota de licença nos arquivos derivados.
