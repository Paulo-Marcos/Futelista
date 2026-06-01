# Política de Privacidade — FuteLista

**Última atualização:** 31/05/2026

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

Os dados que você insere — **nomes de jogadores**, regras da pelada, partidas em andamento — ficam **apenas na memória do app** enquanto ele está aberto. Atualmente, **não há persistência**: ao fechar o app, esses dados são descartados.

Quando a persistência local entrar (planejada via `AsyncStorage` ou similar), os dados continuarão **exclusivamente no dispositivo**, sem envio para nenhum servidor.

## Permissões do dispositivo

O FuteLista **não solicita** nenhuma permissão sensível do sistema operacional (notificação, localização, contatos, fotos, etc.).

Se isso mudar em alguma versão futura (ex.: para som de cronômetro em segundo plano), esta política será atualizada **antes** da release que ativa a permissão.

## Dados de menores

O FuteLista **não é direcionado a crianças menores de 13 anos**. Como o app não coleta dados pessoais, não há tratamento específico para essa faixa etária além da regra geral: nenhum dado é coletado de **ninguém**.

## Bibliotecas de terceiros

O app usa frameworks e bibliotecas de código aberto:

- **Expo / EAS** (Expo SDK 51) — quando você atualiza o app via EAS Update (OTA), o Expo registra a **identificação do dispositivo de forma anônima** para entregar o pacote correto. Política da Expo: <https://expo.dev/privacy>.
- **React Native, React** — bibliotecas de UI; não coletam dados.

Nenhuma dessas bibliotecas é configurada para enviar telemetria adicional.

## Compartilhamento com terceiros

Como nenhum dado é coletado, **nada é compartilhado**.

## Seus direitos

Como o FuteLista não tem servidor nem banco de dados próprio:

- **Acesso:** os dados estão no seu próprio aparelho — você já tem acesso pelo app.
- **Exclusão:** desinstale o app. Tudo vai junto.
- **Portabilidade:** quando a persistência local existir, será possível exportar (planejado).

Se em alguma versão futura o app passar a usar backend, esta política será atualizada e usuários serão notificados na primeira abertura após a mudança.

## Mudanças nesta política

Atualizações desta política são registradas:

- **Nesta seção** com data e resumo.
- Em [`CHANGELOG.md`](CHANGELOG.md) na linha da versão que introduziu a mudança.

### Histórico de versões

- **31/05/2026** — Primeira versão. App em desenvolvimento, sem coleta de dados.

## Contato

Dúvidas sobre privacidade, abra uma issue no repositório ou envie e-mail para `paulolinhodboa@gmail.com`.
