#!/usr/bin/env python3
"""Fail-closed verifier for a completed Comparison Wiki application-drift receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


SCRIPT_PATH = Path(__file__).resolve()
REPO_ROOT = SCRIPT_PATH.parents[2]
MANIFEST_PATH = REPO_ROOT / "production-canon" / "docs" / "comparison-wiki-method-lock-v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def nonempty(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def resolve_recorded_path(value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else REPO_ROOT / path


def parse_time(value: Any, field: str, errors: list[str]) -> datetime | None:
    if not nonempty(value):
        errors.append(f"missing timestamp: {field}")
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        errors.append(f"invalid ISO timestamp: {field}")
        return None


def verify_receipt(receipt_path: Path) -> int:
    errors: list[str] = []
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    receipt = json.loads(receipt_path.read_text(encoding="utf-8"))

    if receipt.get("validity_state") != "APPLICATION-DRIFT-VERIFIED":
        errors.append("validity_state is not APPLICATION-DRIFT-VERIFIED")

    scope = receipt.get("scope", {})
    if scope.get("method_manifest_sha256") != sha256(MANIFEST_PATH):
        errors.append("drift receipt method-manifest hash is missing or stale")
    preflight_path: Path | None = None
    for path_field, hash_field in (
        ("preflight_recall_receipt_path", "preflight_recall_receipt_sha256"),
        ("preflight_validation_path", "preflight_validation_sha256"),
    ):
        value = scope.get(path_field)
        expected_hash = scope.get(hash_field)
        if not nonempty(value) or not nonempty(expected_hash):
            errors.append(f"scope is missing {path_field} or {hash_field}")
            continue
        path = resolve_recorded_path(value)
        if not path.is_file():
            errors.append(f"recorded preflight path does not exist: {path_field}")
            continue
        if sha256(path) != expected_hash:
            errors.append(f"recorded preflight path hash is stale: {path_field}")
        if path_field == "preflight_recall_receipt_path":
            preflight_path = path
        else:
            validation = json.loads(path.read_text(encoding="utf-8"))
            if validation.get("status") != "PASS":
                errors.append("preflight-recall validation did not pass")
            if preflight_path and validation.get("receipt_sha256") != sha256(preflight_path):
                errors.append("preflight-recall validation does not bind the recorded receipt")
            if validation.get("method_manifest_sha256") != sha256(MANIFEST_PATH):
                errors.append("preflight-recall validation used a different method manifest")
    batch_started = parse_time(scope.get("batch_work_started_at"), "batch_work_started_at", errors)
    if preflight_path:
        preflight = json.loads(preflight_path.read_text(encoding="utf-8"))
        if preflight.get("validity_state") != "PREFLIGHT-RECALL-VERIFIED":
            errors.append("referenced preflight-recall receipt is not verified")
        preflight_completed = parse_time(
            preflight.get("scope", {}).get("preflight_completed_at"),
            "referenced preflight_completed_at",
            errors,
        )
        if preflight_completed and batch_started and batch_started < preflight_completed:
            errors.append("batch_work_started_at precedes preflight_completed_at")
    for path_field, hash_field in (
        ("active_goal_path", "active_goal_sha256"),
        ("full_checklist_path", "full_checklist_sha256"),
    ):
        value = scope.get(path_field)
        expected_hash = scope.get(hash_field)
        if not nonempty(value) or not nonempty(expected_hash):
            errors.append(f"scope is missing {path_field} or {hash_field}")
            continue
        path = resolve_recorded_path(value)
        if not path.is_file():
            errors.append(f"recorded path does not exist: {path_field}")
        elif sha256(path) != expected_hash:
            errors.append(f"recorded path hash is stale: {path_field}")

    output_paths = scope.get("frozen_output_paths")
    output_hashes = scope.get("frozen_output_sha256")
    if not isinstance(output_paths, list) or not output_paths:
        errors.append("frozen_output_paths is empty")
    if not isinstance(output_hashes, dict):
        errors.append("frozen_output_sha256 is not an object")
    elif isinstance(output_paths, list):
        for value in output_paths:
            expected_hash = output_hashes.get(value)
            path = resolve_recorded_path(value) if isinstance(value, str) else None
            if path is None or not path.is_file() or not nonempty(expected_hash):
                errors.append(f"frozen output is missing or unhashed: {value}")
            elif sha256(path) != expected_hash:
                errors.append(f"frozen output hash is stale: {value}")

    checks = receipt.get("required_checks", [])
    actual_ids = [item.get("id") for item in checks]
    expected_ids = manifest["required_drift_check_ids"]
    if actual_ids != expected_ids:
        errors.append("application-drift check IDs or order do not match the method manifest")
    for item in checks:
        if item.get("state") != "pass":
            errors.append(f"application-drift check did not pass: {item.get('id')}")
        evidence = item.get("evidence")
        if not isinstance(evidence, list) or not evidence:
            errors.append(f"application-drift check has no evidence: {item.get('id')}")

    proof = receipt.get("proof_summary", {})
    for field in manifest["application_drift_exact_zero_fields"]:
        if proof.get(field) != 0:
            errors.append(f"application-drift proof field must equal zero: {field}")
    for field in ("post_task_goal_reread_count", "post_task_drift_pass_count"):
        value = proof.get(field)
        if not isinstance(value, int) or value < 1:
            errors.append(f"application-drift proof field must be at least one: {field}")

    certifications = receipt.get("certifications", {})
    for role in manifest["required_certifications"]:
        certification = certifications.get(role, {})
        if certification.get("all_required_checks_pass") is not True:
            errors.append(f"{role} application-drift certification did not pass")
        for field in ("certifier", "certified_at"):
            if not nonempty(certification.get(field)):
                errors.append(f"{role} application-drift certification is missing {field}")

    authorization = receipt.get("authorization", {})
    if authorization.get("rival_win_authorized") is not False:
        errors.append("application-drift receipt does not hard-disable rival wins")
    if authorization.get("rival_award_authorized") is not False:
        errors.append("application-drift receipt does not hard-disable rival awards")

    status = "PASS" if not errors else "FAIL"
    result = {
        "schema": "comparison-application-drift-receipt-validation-v1",
        "status": status,
        "receipt_path": str(receipt_path),
        "receipt_sha256": sha256(receipt_path),
        "method_manifest_path": str(MANIFEST_PATH),
        "method_manifest_sha256": sha256(MANIFEST_PATH),
        "required_check_count": len(expected_ids),
        "errors": errors,
    }
    sys.stdout.write(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    return 0 if not errors else 1


def self_test() -> int:
    assert nonempty("proof")
    assert not nonempty("")
    assert len(sha256(MANIFEST_PATH)) == 64
    print("PASS: comparison application-drift verifier self-test")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    verify = sub.add_parser("verify")
    verify.add_argument("--receipt", required=True)
    sub.add_parser("self-test")
    args = parser.parse_args()
    if args.command == "self-test":
        return self_test()
    return verify_receipt(Path(args.receipt).resolve())


if __name__ == "__main__":
    raise SystemExit(main())
