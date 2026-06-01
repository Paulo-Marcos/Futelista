# Documentação do FuteLista

Esta pasta concentra toda a documentação **humana** do projeto.

> Documentação dirigida a agentes de IA fica em [CLAUDE.md](../CLAUDE.md), [AGENTS.md](../AGENTS.md) e [AI_NAVIGATION.md](../AI_NAVIGATION.md), na raiz do projeto.

## Para usuários

Tudo aqui usa o vocabulário do app (Pelada, Partida, Time, Jogador, Vantagem, Próximos).

- [primeiros-passos.md](usuario/primeiros-passos.md) — instalar, abrir e usar o app pela primeira vez.
- [fluxo-pelada.md](usuario/fluxo-pelada.md) — o fluxo completo: criar pelada → cadastrar jogadores → montar times → jogar partidas → atualizar próximos.
- [regras.md](usuario/regras.md) — modos de escolha de times, como funciona vantagem e empate.

## Para desenvolvedores

Doc técnica. Assume conhecimento de TypeScript, React Native e Expo.

- [instalacao.md](desenvolvedor/instalacao.md) — pré-requisitos, setup local, troubleshooting comum.
- [arquitetura.md](desenvolvedor/arquitetura.md) — camadas, dependências, princípios.
- [dominio.md](desenvolvedor/dominio.md) — entidades, agregado raiz, padrões aplicados (Factory + Strategy, Chain of Responsibility).
- [ui.md](desenvolvedor/ui.md) — rotas, provider, contexto, `useGameSlice` e fluxo de re-render.
- [testes.md](desenvolvedor/testes.md) — como rodar, como escrever, convenções.
- [build-release.md](desenvolvedor/build-release.md) — EAS Build, OTA, publicação.

## Decisões de arquitetura (ADRs)

Decisões com trade-off real ficam registradas em [adr/](adr/). Cada arquivo descreve contexto, decisão, alternativas e consequências. Veja [adr/README.md](adr/README.md) para o quando-criar e o formato.

## Convenções desta pasta

- **Português.** Domínio do app é em PT; documentação acompanha.
- **Sem duplicar `CLAUDE.md`.** Se uma regra mora lá, referencie em vez de copiar.
- **Diagramas em Mermaid** (` ```mermaid `): renderizam direto no GitHub e no VS Code.
- **Screenshots** ficam em [assets/screenshots/](assets/screenshots/) com nome estável (`pelada-criar.png`, não `IMG_1234.png`).

## Como contribuir com a doc

1. Verifique se o que vai documentar já está descrito (use Ctrl+F em [docs/README.md](README.md) e em [CLAUDE.md](../CLAUDE.md)).
2. Use o vocabulário do domínio. Sem sinônimo.
3. Documente o **porquê**, não só o **o quê**: leitor consegue ver o "o quê" no código.
4. Quando renomear/mudar comportamento de algo já documentado, atualize a doc **no mesmo commit**.
