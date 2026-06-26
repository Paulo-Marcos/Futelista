#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida que a mensagem de commit comeca com um gitmoji ANTES do tipo.

Demanda D-029. Chamado pelo hook `.githooks/commit-msg` antes da validacao
de lock. Recebe como unico argumento o caminho do arquivo de mensagem ($1).

Regra: a primeira linha real (ignorando comentarios `#` e linhas vazias) deve
comecar com um emoji gitmoji, seguido de espaco e de um tipo Conventional
Commits. Caso contrario, sai com codigo != 0 e aborta o commit.

Excecoes (nao exigem emoji): linhas de merge/revert (`Merge `/`Revert `) e
commits de autofixup (`fixup!`/`squash!`/`amend!`).
"""

import sys

# Tipos Conventional Commits aceitos apos o gitmoji.
CONVENTIONAL_TYPES = (
    "feat", "fix", "refactor", "chore", "docs", "style",
    "test", "perf", "ci", "build", "revert", "merge",
)

# Prefixos isentos de exigir gitmoji.
EXEMPT_PREFIXES = ("Merge ", "Revert ", "fixup!", "squash!", "amend!")

# Caracteres unicode tratados como parte de um emoji gitmoji.
ZWJ = 0x200D            # zero-width joiner (sequencias de emoji)
VARIATION_SELECTOR = 0xFE0F


def is_emoji_char(ch):
    """True se `ch` esta numa faixa unicode tipica de emoji/simbolo."""
    cp = ord(ch)
    if cp in (ZWJ, VARIATION_SELECTOR):
        return True
    # Faixas principais de emoji e simbolos.
    if 0x1F300 <= cp <= 0x1FAFF:
        return True
    if 0x2600 <= cp <= 0x27BF:        # Misc symbols + Dingbats
        return True
    if 0x2190 <= cp <= 0x21FF:        # Setas (ex.: U+2934/U+2935 nao, mas 🔀 fora)
        return True
    if cp in (0x2B05, 0x2B06, 0x2B07, 0x2B1B, 0x2B1C, 0x2B50, 0x2B55):
        return True
    if 0x1F000 <= cp <= 0x1F2FF:      # mahjong, dominoes, enclosed
        return True
    if 0xE0020 <= cp <= 0xE007F:      # tags (bandeiras)
        return True
    if 0x1F1E6 <= cp <= 0x1F1FF:      # regional indicators (bandeiras)
        return True
    return False


def first_real_line(path):
    """Retorna a primeira linha nao-comentario e nao-vazia, ou None."""
    with open(path, "r", encoding="utf-8") as fh:
        for raw in fh:
            line = raw.rstrip("\n").rstrip("\r")
            stripped = line.strip()
            if not stripped:
                continue
            if stripped.startswith("#"):
                continue
            return line
    return None


def is_exempt(line):
    return any(line.startswith(prefix) for prefix in EXEMPT_PREFIXES)


def starts_with_gitmoji_then_type(line):
    """Valida: <emoji(s)> <espaco> <tipo conventional>."""
    if not line or not is_emoji_char(line[0]):
        return False
    # Consome um ou mais caracteres de emoji (sequencias ZWJ/variation).
    idx = 0
    while idx < len(line) and is_emoji_char(line[idx]):
        idx += 1
    # Precisa de ao menos um espaco apos o emoji.
    if idx >= len(line) or line[idx] != " ":
        return False
    rest = line[idx:].lstrip()
    # rest deve comecar com um tipo conventional seguido de `(`, `!` ou `:`.
    for t in CONVENTIONAL_TYPES:
        if rest.startswith(t):
            tail = rest[len(t):]
            if tail[:1] in ("(", "!", ":"):
                return True
    return False


def fail(message):
    sys.stderr.write(message)
    sys.exit(1)


def main(argv):
    if len(argv) < 2:
        fail("check-gitmoji: caminho da mensagem de commit nao informado.\n")
    path = argv[1]
    line = first_real_line(path)
    if line is None:
        # Mensagem vazia: deixa o git/outros hooks lidarem com isso.
        return 0
    if is_exempt(line):
        return 0
    if starts_with_gitmoji_then_type(line):
        return 0
    fail(
        "\n"
        "[commit-msg] Mensagem de commit REJEITADA: falta o gitmoji.\n"
        "\n"
        "  O gitmoji deve vir ANTES do tipo Conventional Commits.\n"
        "  Exemplo valido:  ✨ feat(D-123): adiciona X\n"
        "\n"
        "  Primeira linha recebida:\n"
        "    " + line + "\n"
        "\n"
        "  Formato esperado:  <gitmoji> tipo(escopo): descricao\n"
        "  Tipos: feat|fix|refactor|chore|docs|style|test|perf|ci|build|revert|merge\n"
        "  (excecoes sem emoji: 'Merge ...', 'Revert ...', 'fixup!/squash!/amend!').\n"
        "\n"
    )


if __name__ == "__main__":
    sys.exit(main(sys.argv))
