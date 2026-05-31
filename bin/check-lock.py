#!/usr/bin/env python3
"""
check-lock.py - Valida e gerencia travas de edicao em features/registry.yaml.

Travas: arquivos listados nao podem ser editados sem [unlock:<feature-id>]
no commit message. Funciona em qualquer agente de IA (filesystem + git +
Python).

Uso:
    python bin/check-lock.py list
    python bin/check-lock.py check <arquivo>...
    python bin/check-lock.py lock <feature-id> --description "..." <arquivo>...
    python bin/check-lock.py unlock <feature-id>
    python bin/check-lock.py audit
    python bin/check-lock.py hook <commit-msg-file>             # git hook
    python bin/check-lock.py ci --files F --messages M          # CI

Veja features/README.md para o protocolo completo.

Requer Python 3.8+ e PyYAML (`pip install pyyaml`).
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.stderr.write("Erro: PyYAML nao instalado. Rode: pip install pyyaml\n")
    sys.exit(2)


REPO_ROOT = Path(__file__).resolve().parent.parent
REGISTRY = REPO_ROOT / "features" / "registry.yaml"
UNLOCK_RE = re.compile(r"\[unlock:([a-z0-9_\-]+)\]", re.IGNORECASE)

REGISTRY_HEADER = (
    "# Veja features/README.md para o protocolo e formato.\n"
    "# Edicao via CLI (recomendado): python bin/check-lock.py lock|unlock\n"
    "# Ou edite manualmente preservando o schema abaixo.\n"
    "\n"
)


# ----- registry I/O --------------------------------------------------------

def _norm(path: str) -> str:
    return path.replace("\\", "/").lstrip("./").strip()


def _load_data() -> dict:
    if not REGISTRY.exists():
        return {"version": 1, "locks": []}
    data = yaml.safe_load(REGISTRY.read_text(encoding="utf-8")) or {}
    data.setdefault("version", 1)
    if not data.get("locks"):
        data["locks"] = []
    return data


def _load_locks() -> list[dict]:
    return _load_data().get("locks", []) or []


def _save_locks(locks: list[dict]) -> None:
    data = {"version": 1, "locks": locks}
    body = yaml.safe_dump(
        data,
        sort_keys=False,
        allow_unicode=True,
        default_flow_style=False,
    )
    REGISTRY.write_text(REGISTRY_HEADER + body, encoding="utf-8")


def _lock_of(file_path: str, locks: list[dict]) -> dict | None:
    target = _norm(file_path)
    for lock in locks:
        for f in lock.get("files", []) or []:
            if _norm(f) == target:
                return lock
    return None


def _blocked(files: list[str]) -> list[tuple[str, dict]]:
    locks = _load_locks()
    out: list[tuple[str, dict]] = []
    for f in files:
        lock = _lock_of(f, locks)
        if lock is not None:
            out.append((f, lock))
    return out


def _filter_unlocked(blocked: list[tuple[str, dict]], msg: str) -> list[tuple[str, dict]]:
    unlocked = {m.group(1).lower() for m in UNLOCK_RE.finditer(msg)}
    return [(p, lk) for p, lk in blocked if lk["id"].lower() not in unlocked]


def _print_block(blocked: list[tuple[str, dict]], stream) -> None:
    print("Arquivos travados em features/registry.yaml:\n", file=stream)
    for path, lock in blocked:
        print(f"  - {path}  (feature: {lock['id']})", file=stream)
    ids = sorted({lk["id"] for _, lk in blocked})
    print(
        "\nPara desbloquear, peca autorizacao ao dono e inclua na mensagem do commit:",
        file=stream,
    )
    for fid in ids:
        print(f"  [unlock:{fid}] motivo: <razao>", file=stream)


# ----- subcommands ---------------------------------------------------------

def cmd_list(_args: argparse.Namespace) -> int:
    locks = _load_locks()
    if not locks:
        print("Nenhuma trava ativa.")
        return 0
    print(f"{len(locks)} feature(s) travada(s):\n")
    for lock in locks:
        desc = lock.get("description", "")
        suffix = f" - {desc}" if desc else ""
        print(f"* {lock['id']}{suffix}")
        for f in lock.get("files", []) or []:
            print(f"    {f}")
    return 0


def cmd_check(args: argparse.Namespace) -> int:
    blocked = _blocked(args.files)
    if not blocked:
        print(f"OK: {len(args.files)} arquivo(s), nenhum travado.")
        return 0
    _print_block(blocked, sys.stderr)
    return 1


def cmd_lock(args: argparse.Namespace) -> int:
    locks = _load_locks()
    if any(lk.get("id") == args.id for lk in locks):
        print(f"Erro: feature '{args.id}' ja existe no registry.", file=sys.stderr)
        return 1
    for f in args.files:
        if not (REPO_ROOT / f).exists():
            print(f"Aviso: arquivo nao encontrado no repo: {f}", file=sys.stderr)
    new_lock: dict = {
        "id": args.id,
        "description": args.description or "",
        "locked_at": date.today().isoformat(),
        "files": [_norm(f) for f in args.files],
    }
    locks.append(new_lock)
    _save_locks(locks)
    print(f"Trava criada: {args.id}  ({len(args.files)} arquivo(s))")
    return 0


def cmd_unlock(args: argparse.Namespace) -> int:
    locks = _load_locks()
    remaining = [lk for lk in locks if lk.get("id") != args.id]
    if len(remaining) == len(locks):
        print(f"Erro: feature '{args.id}' nao encontrada no registry.", file=sys.stderr)
        return 1
    _save_locks(remaining)
    print(f"Trava removida: {args.id}")
    return 0


def cmd_audit(_args: argparse.Namespace) -> int:
    try:
        log = subprocess.check_output(
            [
                "git", "log",
                "--fixed-strings", "--grep", "[unlock:",
                "--pretty=format:%h|%ad|%s",
                "--date=short",
            ],
            text=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Erro ao consultar git log.", file=sys.stderr)
        return 1
    if not log.strip():
        print("Nenhum desbloqueio registrado no historico.")
        return 0
    print("Desbloqueios registrados:\n")
    for line in log.strip().splitlines():
        parts = line.split("|", 2)
        if len(parts) == 3:
            sha, dt, subj = parts
            print(f"  {dt}  {sha}  {subj}")
    return 0


def cmd_hook(args: argparse.Namespace) -> int:
    msg = Path(args.msg_file).read_text(encoding="utf-8")
    try:
        staged = subprocess.check_output(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
            text=True,
        ).splitlines()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return 0

    staged_files = [s for s in staged if s.strip()]
    blocked = _blocked(staged_files)
    if not blocked:
        return 0

    still = _filter_unlocked(blocked, msg)
    if not still:
        return 0

    print("\nCOMMIT BLOQUEADO - features travadas:\n", file=sys.stderr)
    _print_block(still, sys.stderr)
    print(
        "\nEdite a mensagem (git commit --amend) ou refaca o commit com as marcas acima.",
        file=sys.stderr,
    )
    return 1


def cmd_ci(args: argparse.Namespace) -> int:
    files = [
        line.strip()
        for line in Path(args.files).read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    msg_path = Path(args.messages)
    msg = msg_path.read_text(encoding="utf-8") if msg_path.exists() else ""

    blocked = _blocked(files)
    if not blocked:
        print(f"OK: {len(files)} arquivo(s) modificado(s), nenhum travado.")
        return 0

    still = _filter_unlocked(blocked, msg)
    if not still:
        print("OK: arquivos travados foram desbloqueados via [unlock:...] nos commits.")
        return 0

    print(
        "\nFALHA - PR modifica arquivos travados sem [unlock:<feature-id>]:\n",
        file=sys.stderr,
    )
    _print_block(still, sys.stderr)
    return 1


# ----- entry point ---------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validador e gerenciador de travas de edicao.")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("list", help="Lista travas ativas").set_defaults(func=cmd_list)

    p_check = sub.add_parser("check", help="Checa arquivos pontuais")
    p_check.add_argument("files", nargs="+")
    p_check.set_defaults(func=cmd_check)

    p_lock = sub.add_parser("lock", help="Adiciona trava a uma feature")
    p_lock.add_argument("id", help="Identificador da feature (kebab-case)")
    p_lock.add_argument("--description", "-d", default="", help="Descricao curta")
    p_lock.add_argument("files", nargs="+", help="Arquivos a travar (paths relativos ao repo)")
    p_lock.set_defaults(func=cmd_lock)

    p_unlock = sub.add_parser("unlock", help="Remove trava de uma feature (permanente)")
    p_unlock.add_argument("id", help="Identificador da feature")
    p_unlock.set_defaults(func=cmd_unlock)

    sub.add_parser("audit", help="Lista desbloqueios temporarios no git log").set_defaults(func=cmd_audit)

    p_hook = sub.add_parser("hook", help="Modo git commit-msg")
    p_hook.add_argument("msg_file")
    p_hook.set_defaults(func=cmd_hook)

    p_ci = sub.add_parser("ci", help="Modo CI (le arquivos+mensagens de arquivos)")
    p_ci.add_argument("--files", required=True)
    p_ci.add_argument("--messages", required=True)
    p_ci.set_defaults(func=cmd_ci)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
