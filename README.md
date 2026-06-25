# FuteLista ⚽

[![CI](https://github.com/Paulo-Marcos/Futelista/actions/workflows/ci.yml/badge.svg)](https://github.com/Paulo-Marcos/Futelista/actions/workflows/ci.yml)
[![web ao vivo](https://img.shields.io/badge/web-ao%20vivo-brightgreen)](https://futelista.expo.app)
[![licença MIT](https://img.shields.io/badge/licença-MIT-blue)](LICENSE)

**Organize a pelada do fim de semana sem caderninho.** O FuteLista cuida dos jogadores, dos times, do placar, do cronômetro e da fila de quem entra — seguindo as regras de vitória, empate e vantagem que todo mundo já conhece da quadra.

> 🌐 **Experimente agora, sem instalar nada:** **[futelista.expo.app](https://futelista.expo.app)** — roda em iOS, Android e Web com o mesmo código.

## O que dá pra fazer

- ⚽ **Cadastrar os jogadores** da pelada (com foto opcional).
- 🧩 **Montar os times** em 3 modos: por ordem de chegada, embaralhando os 2 primeiros, ou embaralhando todos.
- ⏱️ **Tocar a partida** com cronômetro, marcação de gols e substituições.
- 🔁 **Fila automática de "próximos"**: ao fim de cada jogo, quem perde sai e quem vence segue com vantagem — empate e vantagem tratados conforme as regras da pelada.
- 📜 **Histórico e artilharia**: partidas passadas, sequências de vitória e os goleadores.
- 📤 **Compartilhar a pelada** por convite/link.
- 🗂️ **Várias peladas** salvas no próprio aparelho — não se perde ao fechar o app.

## Como usar

- 👉 **Primeira vez?** Comece em [Primeiros passos](docs/usuario/primeiros-passos.md).
- 🔄 **O fluxo completo** (criar pelada → cadastrar jogadores → montar times → jogar → atualizar próximos): [fluxo-pelada.md](docs/usuario/fluxo-pelada.md).
- 📐 **As regras** (modos de time, vantagem, empate): [regras.md](docs/usuario/regras.md).

---

## Para desenvolvedores

### Como rodar

```bash
npm install
npm start            # escolhe iOS, Android, Web ou Expo Go
npm run android      # direto no emulador Android
npm run ios          # direto no simulador iOS
npm run web          # versão web
npm test             # testes em watch mode
```

Pré-requisitos completos em [docs/desenvolvedor/instalacao.md](docs/desenvolvedor/instalacao.md).
Fluxo de trabalho do dia a dia (commit → push → deploy → release) em [docs/desenvolvedor/fluxo-de-trabalho.md](docs/desenvolvedor/fluxo-de-trabalho.md).

### Stack

| Camada     | Tecnologia                                     |
| ---------- | ---------------------------------------------- |
| App        | [Expo](https://expo.dev) 54, React Native 0.81 |
| Roteamento | [Expo Router](https://docs.expo.dev/router) 6  |
| Linguagem  | TypeScript estrito                             |
| Testes     | Jest (preset `jest-expo`)                      |
| Lint       | ESLint (config Expo) + Prettier                |
| CI/Deploy  | GitHub Actions + EAS (Build/Hosting)           |

### Onde achar cada coisa

- **Vai mexer no código** → comece em [arquitetura.md](docs/desenvolvedor/arquitetura.md).
- **É um agente de IA** (Claude, Cursor, Copilot…) → leia [CLAUDE.md](CLAUDE.md) e [AGENTS.md](AGENTS.md) **antes** de editar qualquer arquivo.
- Índice completo da documentação em [docs/README.md](docs/README.md). Decisões de arquitetura em [docs/adr/](docs/adr/). Política de privacidade em [PRIVACY.md](PRIVACY.md).

### Vocabulário do domínio

O código e a UI usam **um vocabulário só**, em português. Se um termo aparece aqui, é o termo certo em todo lugar:

| Termo         | Significado                                                                                |
| ------------- | ------------------------------------------------------------------------------------------ |
| **Pelada**    | A sessão inteira: lista de jogadores, regras, fila de times e histórico de partidas.       |
| **Partida**   | Um jogo entre dois times. Tem gols, vencedor (ou empate), tempo.                           |
| **Time**      | Grupo de N jogadores (`playersPerTeam`). Pode estar jogando, parado ou na fila.            |
| **Jogador**   | Pessoa cadastrada na pelada. Tem nome, gols, situação.                                      |
| **Próximos**  | Fila dos times que ainda não jogaram (ou perderam e voltaram pro fim).                      |
| **Vantagem**  | Direito do time campeão (ou que empatou em condição prévia) de seguir na próxima partida.   |

Detalhes em [docs/usuario/regras.md](docs/usuario/regras.md) e [docs/desenvolvedor/dominio.md](docs/desenvolvedor/dominio.md).

### Estado do projeto

- ✅ **Domínio** (`src/domain/`): completo e puro, coberto por **540 testes** Jest.
- ✅ **UI** (`app/`): navegável — jogadores, times, partida, placar, histórico, configurações, onboarding.
- ✅ **Persistência**: local via AsyncStorage — a pelada **não** se perde ao recarregar.
- ✅ **Web**: publicada em [futelista.expo.app](https://futelista.expo.app) via EAS Hosting.
- ✅ **CI**: tipos + lint + testes a cada push/PR.
- ❌ **Lojas (iOS/Android)**: ainda não publicado.

## Licença

[MIT](LICENSE). Pode usar, copiar, modificar e distribuir — mantendo o aviso de copyright e a nota de licença nos arquivos derivados.
