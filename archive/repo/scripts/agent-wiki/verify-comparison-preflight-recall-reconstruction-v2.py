#!/usr/bin/env python3
"""Fail-closed verifier for the Comparison Wiki V2 recall-reconstruction addendum."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


SCRIPT_PATH = Path(__file__).resolve()
REPO_ROOT = SCRIPT_PATH.parents[2]
V1_VERIFIER = SCRIPT_PATH.with_name("verify-comparison-preflight-recall-receipt.py")

BOOTLOADER_SEQUENCE = (
    "freeze",
    "route",
    "recover",
    "translate",
    "triangulate",
    "expand",
    "adjudicate",
    "project",
    "certify",
)

COMPLETION_GATE_CHAIN = (
    "preflight-recall",
    "method-compliance",
    "independent-review",
    "meta-audit",
    "post-task-application-drift",
)

RECONSTRUCTION_FIELDS = (
    "semantic_discovery_boundary",
    "four_lens_allocation",
    "before_after_zero_rival_rule",
    "lossless_partial_equivalence_and_open_unknown_rule",
    "paired_output_contract",
)

REGRESSION_FIELDS = ("miller", "hawkins", "george")

PROHIBITED_FIELDS = (
    "rival_win_count",
    "rival_award_count",
    "candidate_count_used_as_ceiling_count",
    "predecessor_floor_count",
    "automated_no_fit_veto_count",
    "ontology_exclusion_count",
    "cross_context_exclusion_count",
    "unknown_as_absence_count",
    "broad_search_authorized_count",
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def nonempty(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def resolve_path(value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else REPO_ROOT / path


def verify_hashed_path(record: dict[str, Any], path_field: str, hash_field: str, label: str, errors: list[str]) -> Path | None:
    value = record.get(path_field)
    expected = record.get(hash_field)
    if not nonempty(value) or not nonempty(expected):
        errors.append(f"{label} is missing path or sha256")
        return None
    path = resolve_path(value)
    if not path.is_file():
        errors.append(f"{label} path does not exist: {value}")
        return None
    if sha256(path) != expected:
        errors.append(f"{label} hash is missing or stale: {value}")
        return None
    return path


def parse_time(value: Any, label: str, errors: list[str]) -> datetime | None:
    if not nonempty(value):
        errors.append(f"missing timestamp: {label}")
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        errors.append(f"invalid ISO timestamp: {label}")
        return None


def verify_v1_receipt(receipt_path: Path, errors: list[str]) -> None:
    if not V1_VERIFIER.is_file():
        errors.append("V1 preflight verifier is missing")
        return
    result = subprocess.run(
        [sys.executable, str(V1_VERIFIER), "verify", "--receipt", str(receipt_path)],
        capture_output=True,
        text=True,
        check=False,
    )
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError:
        errors.append("V1 preflight verifier did not return JSON")
        return
    if result.returncode != 0 or payload.get("status") != "PASS":
        detail = "; ".join(payload.get("errors", [])) or "unknown V1 validation failure"
        errors.append(f"bound V1 preflight receipt does not currently pass: {detail}")


def verify_addendum(addendum_path: Path) -> int:
    errors: list[str] = []
    addendum = json.loads(addendum_path.read_text(encoding="utf-8"))

    if addendum.get("schema") != "comparison-preflight-recall-reconstruction-v2":
        errors.append("unexpected addendum schema")
    if addendum.get("validity_state") != "PREFLIGHT-RECONSTRUCTION-VERIFIED":
        errors.append("validity_state is not PREFLIGHT-RECONSTRUCTION-VERIFIED")

    scope = addendum.get("scope", {})
    for field in ("program_id", "batch_id", "worker_id", "bounded_batch_statement"):
        if not nonempty(scope.get(field)):
            errors.append(f"scope is missing {field}")
    started = parse_time(scope.get("reconstruction_started_at"), "reconstruction_started_at", errors)
    completed = parse_time(scope.get("reconstruction_completed_at"), "reconstruction_completed_at", errors)
    if started and completed and completed < started:
        errors.append("reconstruction_completed_at precedes reconstruction_started_at")

    bound = addendum.get("bound_v1_preflight", {})
    receipt_path = verify_hashed_path(bound, "receipt_path", "receipt_sha256", "bound V1 receipt", errors)
    validation_path = verify_hashed_path(bound, "validation_path", "validation_sha256", "bound V1 validation", errors)
    if bound.get("validation_status") != "PASS":
        errors.append("bound V1 validation_status is not PASS")
    if receipt_path:
        verify_v1_receipt(receipt_path, errors)
    if validation_path:
        try:
            validation = json.loads(validation_path.read_text(encoding="utf-8"))
            if validation.get("status") != "PASS":
                errors.append("bound V1 validation artifact does not report PASS")
            if receipt_path and validation.get("receipt_sha256") != sha256(receipt_path):
                errors.append("bound V1 validation artifact does not bind the current receipt hash")
        except json.JSONDecodeError:
            errors.append("bound V1 validation artifact is not valid JSON")

    bootloader = addendum.get("bootloader_document", {})
    verify_hashed_path(bootloader, "path", "sha256", "bootloader document", errors)
    if bootloader.get("loaded") is not True:
        errors.append("bootloader document was not marked loaded")

    reconstruction = addendum.get("recall_reconstruction", {})
    if tuple(reconstruction.get("bootloader_sequence", ())) != BOOTLOADER_SEQUENCE:
        errors.append("bootloader sequence is incomplete or reordered")
    if tuple(reconstruction.get("completion_gate_chain", ())) != COMPLETION_GATE_CHAIN:
        errors.append("completion-gate chain is incomplete or reordered")
    for field in RECONSTRUCTION_FIELDS:
        if not nonempty(reconstruction.get(field)):
            errors.append(f"recall reconstruction is missing {field}")
    lessons = reconstruction.get("regression_lessons", {})
    for field in REGRESSION_FIELDS:
        if not nonempty(lessons.get(field)):
            errors.append(f"recall reconstruction is missing {field} regression lesson")
    if reconstruction.get("name_control") != "George is the surname; Dileep is the given name.":
        errors.append("Dileep George name control is incorrect")

    prohibited = addendum.get("prohibited_counts", {})
    for field in PROHIBITED_FIELDS:
        if prohibited.get(field) != 0:
            errors.append(f"prohibited field must equal zero: {field}")

    certification = addendum.get("certification", {})
    if not nonempty(certification.get("worker")):
        errors.append("worker certification is missing")
    certified = parse_time(certification.get("certified_at"), "certified_at", errors)
    if certification.get("all_reconstruction_fields_complete") is not True:
        errors.append("worker did not certify all reconstruction fields complete")

    authorization = addendum.get("authorization", {})
    authorized = parse_time(
        authorization.get("batch_execution_authorized_at"),
        "batch_execution_authorized_at",
        errors,
    )
    if completed and certified and certified < completed:
        errors.append("certified_at precedes reconstruction_completed_at")
    if certified and authorized and authorized < certified:
        errors.append("batch_execution_authorized_at precedes certified_at")
    if authorization.get("batch_execution_authorized") is not True:
        errors.append("batch execution is not authorized")
    for field in (
        "governed_fanin_authorized",
        "public_projection_authorized",
        "rival_win_authorized",
        "rival_award_authorized",
        "broad_search_authorized",
    ):
        if authorization.get(field) is not False:
            errors.append(f"addendum must keep {field} false")

    status = "PASS" if not errors else "FAIL"
    payload = {
        "schema": "comparison-preflight-recall-reconstruction-validation-v2",
        "status": status,
        "addendum_path": str(addendum_path),
        "addendum_sha256": sha256(addendum_path),
        "bound_v1_receipt_path": str(receipt_path) if receipt_path else None,
        "required_reconstruction_field_count": len(RECONSTRUCTION_FIELDS) + len(REGRESSION_FIELDS),
        "errors": errors,
    }
    sys.stdout.write(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    return 0 if not errors else 1


def self_test() -> int:
    assert nonempty("proof")
    assert not nonempty("")
    assert len(BOOTLOADER_SEQUENCE) == 9
    assert len(COMPLETION_GATE_CHAIN) == 5
    assert len(hashlib.sha256(b"test").hexdigest()) == 64
    print("PASS: comparison preflight recall-reconstruction V2 verifier self-test")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    verify = sub.add_parser("verify")
    verify.add_argument("--addendum", required=True)
    sub.add_parser("self-test")
    args = parser.parse_args()
    if args.command == "self-test":
        return self_test()
    return verify_addendum(Path(args.addendum).resolve())


if __name__ == "__main__":
    raise SystemExit(main())
