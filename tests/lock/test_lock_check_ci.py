"""Regressao do Lock Check do CI (D-053).

O CI passava `git diff --name-only` ao `check-lock.py ci`; sem a coluna de
status, todo arquivo virava `modify` e um teste NOVO reprovava a trava
`testes-sao-contrato`. Estes testes fixam o contrato: o checker recebe linhas
`--name-status` e o workflow as gera.
"""

from __future__ import annotations

import argparse
import contextlib
import importlib.util
import io
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CHECK_LOCK = REPO_ROOT / "core" / "lock" / "check-lock.py"
WORKFLOW = REPO_ROOT / ".github" / "workflows" / "lock-check.yml"

NEW_SPEC = "src/shared/ui/__tests__/ConfirmAcaoHost-test.tsx"
EXISTING_SPEC = "src/domain/Player.spec.ts"


def _load_check_lock():
    spec = importlib.util.spec_from_file_location("check_lock", CHECK_LOCK)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


check_lock = _load_check_lock()


def run_ci(changed_files: str, messages: str = "chore: qualquer") -> int:
    with tempfile.TemporaryDirectory() as tmp:
        files = Path(tmp) / "changed-files"
        msgs = Path(tmp) / "commit-messages"
        files.write_text(changed_files, encoding="utf-8")
        msgs.write_text(messages, encoding="utf-8")
        args = argparse.Namespace(files=str(files), messages=str(msgs))
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            return check_lock.cmd_ci(args)


class CmdCiNameStatusTest(unittest.TestCase):
    def test_teste_novo_passa(self):
        self.assertEqual(run_ci(f"A\t{NEW_SPEC}\n"), 0)

    def test_teste_existente_alterado_bloqueia(self):
        self.assertEqual(run_ci(f"M\t{EXISTING_SPEC}\n"), 1)

    def test_teste_existente_apagado_bloqueia(self):
        self.assertEqual(run_ci(f"D\t{EXISTING_SPEC}\n"), 1)

    def test_teste_existente_renomeado_bloqueia(self):
        self.assertEqual(run_ci(f"R100\t{EXISTING_SPEC}\tsrc/domain/Jogador.spec.ts\n"), 1)

    def test_teste_alterado_com_unlock_passa(self):
        msg = "fix: x\n\n[unlock:testes-sao-contrato] motivo: regra mudou"
        self.assertEqual(run_ci(f"M\t{EXISTING_SPEC}\n", msg), 0)


class WorkflowDiffTest(unittest.TestCase):
    def test_workflow_gera_name_status_com_delete(self):
        workflow = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("git diff --name-status --diff-filter=ACMRD", workflow)
        self.assertNotIn("--name-only", workflow)


if __name__ == "__main__":
    unittest.main()
