# Build e release

Como gerar binários instaláveis (iOS/Android) e publicar nas lojas usando o **EAS** (Expo Application Services).

> ⚠️ O FuteLista ainda **não foi publicado**. Esta doc é o roteiro de quando for. Os comandos abaixo são padrão Expo 51 / EAS — adapte conforme o estado do projeto na hora do release.

---

## Visão rápida

| Etapa                | Ferramenta                  | Quando                                |
| -------------------- | --------------------------- | ------------------------------------- |
| Dev local            | `expo start`                | Dia a dia.                            |
| Build de dev nativo  | `eas build --profile development` | Testar APIs nativas fora do Expo Go. |
| Preview interno      | `eas build --profile preview` | Compartilhar com testers (TestFlight, APK). |
| Build de produção    | `eas build --profile production` | Antes de subir para App Store / Play Store. |
| Submit nas lojas     | `eas submit`                | Enviar binário gerado para revisão.   |
| OTA Update           | `eas update`                | Patch de JS/asset sem nova build.     |

## Pré-requisitos

1. **Conta Expo** com EAS habilitado: <https://expo.dev>.
2. **EAS CLI** instalado globalmente:

   ```bash
   npm install -g eas-cli
   eas login
   ```

3. **Apple Developer Program** (US$ 99/ano) — para iOS na App Store.
4. **Google Play Console** (US$ 25 one-time) — para Android na Play Store.

> Para apenas testar internamente (APK Android, TestFlight iOS), o EAS Build sozinho basta. As taxas das lojas só entram quando for publicar.

## Configuração inicial (uma vez)

```bash
cd FuteLista/FuteLista
eas build:configure
```

Isso cria/edita `eas.json` na raiz com perfis padrão (`development`, `preview`, `production`). Revise antes de comitar.

Exemplo mínimo de `eas.json` (você adapta):

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Build de desenvolvimento (com módulos nativos)

Use quando precisar de algo que o Expo Go não suporta (push notification customizada, módulo nativo próprio, etc.):

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

Resultado: um APK / IPA com **dev client**. Você instala no dispositivo e roda `npm start --dev-client`.

## Preview interno

Build assinada que você compartilha com testers sem subir nas lojas:

```bash
eas build --profile preview --platform all
```

- **iOS**: gera IPA. Distribua via TestFlight (`eas submit`) ou link direto interno.
- **Android**: gera APK. Mande o link para instalar direto.

## Build de produção

```bash
eas build --profile production --platform all
```

Antes de rodar, **revise**:

1. `app.json` → `expo.version` (visível para o usuário, ex.: `1.0.0`).
2. `app.json` → `expo.ios.buildNumber` e `expo.android.versionCode` (interno, deve **incrementar** sempre).
3. Ícones e splash atualizados em `assets/images/`.
4. [CHANGELOG.md](../../CHANGELOG.md) com a versão nova.
5. Testes verdes (`npx jest`).

Se `eas.json` tem `"autoIncrement": true`, o build number/versionCode incrementa sozinho — você só precisa cuidar da `version` semântica.

## Submit nas lojas

Depois da build de produção pronta:

```bash
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

Na primeira vez, o CLI vai pedir credenciais (Apple ID + senha de app, Service Account JSON do Google Play). Guarde em local seguro — **não** comite.

### iOS — App Store

1. Build sobe para o App Store Connect.
2. Você cria a versão lá, anexa o build, preenche metadata (descrição, screenshots, palavras-chave).
3. Envia para revisão. Tempo médio: 24–48h.
4. Quando aprovado, pode liberar manual ou automaticamente.

### Android — Play Store

1. Build sobe para Play Console.
2. Você cria release em `Internal testing` → `Closed testing` → `Production` (escala gradual).
3. Preenche metadata.
4. Revisão automática (rápida) + manual em casos sensíveis.

## OTA (Over The Air) Update

Para mudanças **apenas em JS/asset** (não em código nativo), você pode publicar sem nova build:

```bash
eas update --channel production --message "Corrige label do botão Iniciar"
```

Limitações importantes:

- Não funciona se mudou dependência nativa (`expo-*` ou `react-native-*` com módulo nativo).
- Não funciona se mudou `app.json` em campos que afetam o binário (permissões, ícones, plugins).
- Usuário precisa abrir o app uma vez para baixar a update; na próxima abertura ela aplica.

Verificar saúde de um update: skill Expo `@expo:eas-update-insights`.

## Versionamento

Siga **SemVer** em `app.json`/`package.json`:

- `MAJOR.MINOR.PATCH`
- **MAJOR** muda fluxo de pelada incompatível (ex.: muda enum, formato de persistência).
- **MINOR** adiciona tela ou regra nova sem quebrar nada.
- **PATCH** bugfix ou texto.

`buildNumber`/`versionCode` é **monotônico crescente** — independente de SemVer. Cada build pra loja precisa de um número novo, mesmo que `version` repita.

## Checklist antes do release

- [ ] `npx jest` verde.
- [ ] `npm run lint` sem erro.
- [ ] `app.json` com `version` atualizada.
- [ ] `CHANGELOG.md` com a entrada da nova versão.
- [ ] Testar **manualmente** no iOS e Android (preview build).
- [ ] Screenshots/metadata atualizados em App Store Connect / Play Console (se mudou UI).
- [ ] `features/registry.yaml` revisado (nenhum lock pendurado bloqueando o release).
- [ ] Tag git: `git tag v1.2.3 && git push --tags`.

## Próximo passo

→ [Volta ao índice](../README.md).
→ Considerar [`expo:expo-deployment`](https://docs.expo.dev/distribution/introduction/) para detalhes oficiais.
