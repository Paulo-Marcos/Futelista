# Instalação e setup local

Como deixar o FuteLista rodando na sua máquina, em qual plataforma, e o que fazer quando dá ruim.

---

## Pré-requisitos

| Ferramenta             | Versão recomendada | Por quê                            |
| ---------------------- | ------------------ | ---------------------------------- |
| Node.js                | 20 LTS             | Compatível com Expo 51             |
| npm                    | 10+                | Gerenciador padrão do projeto      |
| Git                    | qualquer recente   | Hooks de lock (`commit-msg`)       |
| Python                 | 3.10+              | Script `bin/check-lock.py`         |
| Expo Go (app no celular) | mais recente     | Modo de execução mais rápido       |

Para emuladores (opcional):

- **iOS** → Xcode (apenas macOS) + Simulator.
- **Android** → Android Studio + um AVD.

## Instalação

A pasta git é `FuteLista/FuteLista/` (note o aninhamento — o `package.json` fica no subdiretório, não na raiz `FuteLista/`).

```bash
cd FuteLista/FuteLista
npm install
git config core.hooksPath .githooks   # ativa o hook de validação de lock
```

## Comandos

| Comando            | O que faz                                                |
| ------------------ | -------------------------------------------------------- |
| `npm start`        | Sobe o Metro bundler e mostra QR + menu de plataformas   |
| `npm run android`  | Tenta abrir num emulador/dispositivo Android conectado   |
| `npm run ios`      | Tenta abrir no Simulator (macOS)                         |
| `npm run web`      | Versão web em `http://localhost:8081`                    |
| `npm test`         | Jest em watch mode                                       |
| `npx jest`         | Jest uma vez (uso em CI ou pre-commit)                   |
| `npm run lint`     | ESLint                                                   |

## Rodando no celular (jeito mais rápido)

1. Instale o **Expo Go** ([iOS](https://apps.apple.com/app/expo-go/id982107779) ou [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)).
2. `npm start` no terminal.
3. Mesma rede Wi-Fi: aponte a câmera para o QR que aparece.
4. Conexão lenta? Pressione `s` no terminal pra alternar entre LAN e Tunnel.

## Rodando no simulador iOS (macOS)

```bash
npm run ios
```

Se for a primeira vez, o comando abre o Simulator vazio e instala o Expo Go nele automaticamente.

## Rodando no emulador Android

1. Abra o Android Studio → AVD Manager → inicie um device.
2. `npm run android`.

Se reclamar de `adb` não encontrado: adicione `$ANDROID_HOME/platform-tools` ao PATH.

## Rodando no navegador

```bash
npm run web
```

Útil pra iteração rápida em telas que não dependem de API nativa. Componentes RN nativos (ex.: `Animated` em driver nativo, `react-native-reanimated`) podem ter comportamento ligeiramente diferente — sempre verifique no iOS/Android antes de fechar UI.

## Lock de funcionalidades

Esse repo tem um **lock por arquivo**: arquivos listados em [features/registry.yaml](../../features/registry.yaml) não podem ser editados por agentes de IA (nem por você, sem marca explícita no commit).

```bash
python bin/check-lock.py list                       # lista travas ativas
python bin/check-lock.py check src/domain/Player.ts # checa um arquivo
```

Detalhes em [features/README.md](../../features/README.md) e [CLAUDE.md → Protocolo de Alteração](../../CLAUDE.md#protocolo-de-alteração-lock-de-funcionalidades).

## Problemas comuns

### `npm install` quebra em `react-native-reanimated`

Geralmente é cache do Metro. Limpe e reinstale:

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Metro mostra "Unable to resolve module"

```bash
npx expo start -c   # força reset do cache do Metro
```

### Tela branca no Expo Go

1. Confere se está na **mesma rede Wi-Fi** que o computador.
2. Pressione `r` no terminal pra forçar reload.
3. Se persistir: `npx expo start --tunnel`.

### Erro de casing de import em CI Linux

Windows e macOS são case-insensitive, Linux **não**. `import { Player } from './player'` passa local e quebra na CI.

**Solução:** use sempre o casing exato do arquivo (`./Player`). Veja [.claude/rules/domain.md](../../.claude/rules/domain.md#casing-de-imports).

### Erro `uuid.v4 is not a function` ao rodar

Falta o polyfill. O domínio sempre faz `import 'react-native-get-random-values';` **antes** de `import * as uuid from 'uuid';`. Se for adicionar arquivo novo que usa uuid, mantenha a ordem.

## Próximo passo

→ [Arquitetura](arquitetura.md) — entender camadas antes de mexer.
→ [Domínio](dominio.md) — referência das entidades.
