# Política de Privacidade — FuteLista

**Última atualização:** 25/06/2026

Este documento descreve o que o FuteLista coleta, o que faz com os dados e quais são os direitos de quem usa o app.

> Para publicação nas lojas (App Store e Play Store), é **obrigatório** ter uma política de privacidade publicada em URL acessível. Este arquivo é a fonte. Quando o app for ao ar, o conteúdo daqui deve ser publicado também numa página web (ex.: GitHub Pages do repositório).

---

## Quem é responsável

- **Mantenedor:** Paulo (`paulolinhodboa@gmail.com`).
- **Natureza do app:** pessoal, sem fins comerciais até esta versão.

## Dados que o app coleta

Hoje, **o FuteLista não coleta nem transmite nenhum dado pessoal**. Especificamente:

- ❌ Não há login.
- ❌ Não há servidor próprio.
- ❌ Não há analytics (Google Analytics, Firebase, Sentry, Amplitude, etc.).
- ❌ Não há crash reporting remoto.
- ❌ Não há acesso a contatos, fotos, localização, microfone ou câmera.
- ❌ Não há publicidade nem rastreamento de terceiros.

### Dados que ficam no dispositivo

Os dados que você insere — **nomes de jogadores**, regras da pelada, partidas em andamento — são **persistidos localmente no próprio aparelho**, via `AsyncStorage`. Eles **continuam disponíveis depois de fechar e reabrir o app** e ficam **exclusivamente no dispositivo**: nada é enviado para nenhum servidor.

Esses dados permanecem no aparelho até que você os apague pelo próprio app ou desinstale o FuteLista.

## Permissões do dispositivo

O FuteLista **não solicita** nenhuma permissão sensível do sistema operacional (notificação, localização, contatos, fotos, etc.).

Se isso mudar em alguma versão futura (ex.: para som de cronômetro em segundo plano), esta política será atualizada **antes** da release que ativa a permissão.

## Dados de menores

O FuteLista **não é direcionado a crianças menores de 13 anos**. Como o app não coleta dados pessoais, não há tratamento específico para essa faixa etária além da regra geral: nenhum dado é coletado de **ninguém**.

## Bibliotecas de terceiros

O app usa frameworks e bibliotecas de código aberto:

- **Expo / EAS** (Expo SDK 54) — quando você atualiza o app via EAS Update (OTA), o Expo registra a **identificação do dispositivo de forma anônima** para entregar o pacote correto. Política da Expo: <https://expo.dev/privacy>.
- **React Native, React** — bibliotecas de UI; não coletam dados.

Nenhuma dessas bibliotecas é configurada para enviar telemetria adicional.

## Compartilhamento com terceiros

Como nenhum dado é coletado, **nada é compartilhado**.

## Seus direitos

Como o FuteLista não tem servidor nem banco de dados próprio:

- **Acesso:** os dados estão no seu próprio aparelho — você já tem acesso pelo app.
- **Exclusão:** apague os dados pelo próprio app ou desinstale o FuteLista; tudo vai junto.
- **Portabilidade:** o app permite exportar seus dados como um backup em JSON, gerado localmente no aparelho.

Se em alguma versão futura o app passar a usar backend, esta política será atualizada e usuários serão notificados na primeira abertura após a mudança.

## Mudanças nesta política

Atualizações desta política são registradas:

- **Nesta seção** com data e resumo.
- Em [`CHANGELOG.md`](CHANGELOG.md) na linha da versão que introduziu a mudança.

### Histórico de versões

- **25/06/2026** — Atualizado para refletir a persistência local via `AsyncStorage` entregue na versão 1.0.0: os dados da pelada agora ficam armazenados no dispositivo (não são mais descartados ao fechar o app) e continuam sem qualquer envio a servidor. Corrigida a versão do Expo SDK (54).
- **31/05/2026** — Primeira versão. App em desenvolvimento, sem coleta de dados.

## Contato

Dúvidas sobre privacidade, abra uma issue no repositório ou envie e-mail para `paulolinhodboa@gmail.com`.
