# `docs/assets/`

Imagens, diagramas e outros recursos referenciados pela documentação.

## Subpastas

- **`screenshots/`** — capturas de tela do app, por tela. Nome estável (`pelada-criar.png`), **não** `IMG_1234.png`. Sugestão: tirar pelo simulador iOS em tamanho 6.5" (iPhone 14 Plus) para padronizar.
- **`diagrams/`** — diagramas que não dão pra fazer com Mermaid inline. Prefira `.mmd` (Mermaid source) ou `.svg`. Evite `.png` exportado — desatualiza e ninguém atualiza junto.

## Convenções

- **Versionar fonte, não export.** Se você gerou um SVG a partir de Figma, salve também o link/exportação. Se gerou de Mermaid, comite o `.mmd`.
- **Sem capturar dados sensíveis.** Use nomes fictícios nos screenshots (`Pelada Sábado`, `Jogador A`, `Jogador B`).
- **Tamanho razoável.** Otimize PNGs (TinyPNG, ImageOptim) antes de comitar — repos de doc engordam rápido com binário.
- **Atualize junto.** Mudou a tela? Tira o print novo no mesmo PR que mudou o código. Evite o "atualizo depois" que vira nunca.

## Como referenciar nas docs

```markdown
![Tela de criação de pelada](../assets/screenshots/pelada-criar.png)
```

Caminhos relativos a partir do `.md` que está usando.
