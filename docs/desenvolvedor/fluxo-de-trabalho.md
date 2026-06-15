# Fluxo de trabalho — "fiz uma alteração, e agora?"

Este guia responde, na prática, o que fazer depois de mexer no código: quando
commitar, quando dar push, quando re-publicar a web, quando gerar um APK novo e
quando "cortar" uma versão (release por tag).

Detalhes profundos de build/loja ficam em [build-release.md](build-release.md). Aqui é o **dia a dia**.

---

## O modelo mental: 5 camadas

Pensar em camadas evita confusão. Cada uma é independente:

| Camada | O que é | Como se atualiza |
| --- | --- | --- |
| **1. Local** | Seu código no PC | editar arquivos |
| **2. Histórico (git)** | Fotos do projeto no seu PC | `git commit` |
| **3. GitHub** | Cópia na nuvem + CI | `git push` |
| **4. Web no ar** | <https://futelista.expo.app> | `npm run deploy:web` |
| **5. App nativo** | APK Android / app nas lojas | `eas build` (+ `eas submit`) |

Ponto-chave: **uma camada não atualiza a outra sozinha.** Dar `push` **não** re-publica a web nem gera APK. Cada coisa é um passo explícito (veja a tabela de decisão abaixo).

## Conceitos em 1 linha

- **commit** = salvar um ponto no histórico, no seu PC. De graça, offline.
- **push** = enviar os commits acumulados pro GitHub (backup + dispara o CI).
- **CI** = robô do GitHub que roda `tsc` + lint + testes a cada push. Verde = nada quebrou.
- **deploy web** = gerar o site e publicar na EAS Hosting.
- **build (APK)** = compilar o app nativo na nuvem do EAS.
- **release por tag** = carimbar uma versão (`v1.2.0`) com nota do que mudou.

---

## A rotina do dia a dia

Toda vez que você mexe no código:

```powershell
# 1. (opcional, recomendado) confira localmente antes de subir
npx tsc --noEmit          # tipos
npm run lint:ci           # lint + formatação
npx jest --ci             # testes uma vez

# 2. salve no histórico (uma unidade lógica por commit)
git add -A
git commit -m "feat(times): permite renomear time"

# 3. envie pro GitHub (backup + o CI confere tudo)
git push origin main
```

Depois do push, o CI roda sozinho. Se ficar **vermelho**, abra a aba **Actions**
do repositório, veja qual passo falhou e corrija antes de seguir. Verde = pode
tocar o barco.

> Não precisa pushar a cada commit, mas **não acumule por dias**: sem push você
> fica sem backup e sem o CI te protegendo. Regra de ouro: pelo menos um push no
> fim de cada sessão.

## Tabela de decisão — o que fazer depois de mudar...

| Você mudou… | Commit + push | Re-deploy web | Gerar APK novo | Tag/Release |
| --- | :---: | :---: | :---: | :---: |
| Lógica / tela / texto (JS/TS) | ✅ sempre | se quiser no ar | se testers precisam ver | só se marcar versão |
| Dependência nativa (`expo-*`, `react-native-*`) | ✅ | ✅ | ✅ **obrigatório** | conforme |
| `app.json` (ícone, splash, permissões, versão) | ✅ | ✅ | ✅ **obrigatório** | conforme |
| Documentação / README | ✅ | ❌ | ❌ | ❌ |
| Fechou um conjunto que vira "versão nova" | ✅ | ✅ | ✅ | ✅ **tag + release** |

A regra por trás da tabela: a **web** sempre reflete o que você publicar com
`deploy:web`; o **APK** é uma foto congelada — quem instalou só vê novidade se
você **gerar e distribuir um APK novo** (ou, no futuro, configurar OTA/EAS Update).

---

## Receitas

### Re-publicar a web

```powershell
npm run deploy:web
```

Faz `expo export` + `eas deploy --prod` e atualiza <https://futelista.expo.app>.
Use sempre que quiser que o link público reflita as últimas mudanças.

### Gerar um APK novo (testers)

```powershell
eas build -p android --profile preview
```

Sai um link de instalação (compila na nuvem, ~10–20 min). Mande pros testers.
Necessário sempre que mudar dependência nativa, `app.json`, **ou** quando quiser
que quem tem o APK veja as novidades de JS.

### Cortar uma versão (release por tag)

Quando um conjunto de mudanças vira "uma versão":

```powershell
# 1. atualize a versão em app.json e package.json (ex.: 1.0.0 -> 1.1.0) seguindo SemVer
# 2. mova o que mudou de "[Não lançado]" para uma seção nova no CHANGELOG.md
git add -A; git commit -m "chore(release): v1.1.0"
git push origin main

# 3. crie e envie a tag
git tag -a v1.1.0 -m "v1.1.0"
git push origin v1.1.0

# 4. crie o GitHub Release a partir da tag (com gh autenticado):
gh release create v1.1.0 --title "v1.1.0" --notes-file CHANGELOG.md
# (ou no site: Releases -> Draft new release -> escolher a tag)
```

**SemVer** (`MAJOR.MINOR.PATCH`): `PATCH` = bugfix/texto; `MINOR` = recurso novo
sem quebrar; `MAJOR` = mudança incompatível (ex.: muda o formato de save).

---

## Versão curta (cola na parede)

1. Mexeu no código → `tsc` + `lint` + `jest` → **commit** → **push** (CI confere).
2. Quer no ar pra todo mundo testar na web → **`npm run deploy:web`**.
3. Testers no celular precisam ver → **`eas build -p android --profile preview`**.
4. Fechou uma versão → bump em `app.json`/`package.json` + CHANGELOG → **tag + release**.

→ [Voltar ao índice da doc](../README.md)
