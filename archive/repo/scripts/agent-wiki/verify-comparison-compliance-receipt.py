#!/usr/bin/env python3
"""Fail-closed verifier for a completed Comparison Wiki compliance receipt."""

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
    manifest_sha = sha256(MANIFEST_PATH)

    if receipt.get("validity_state") != "METHOD-COMPLIANCE-VERIFIED":
        errors.append("validity_state is not METHOD-COMPLIANCE-VERIFIED")
    if receipt.get("scope", {}).get("method_manifest_sha256") != manifest_sha:
        errors.append("receipt method-manifest hash is missing or stale")

    preflight_pointer = receipt.get("preflight_recall_receipt", {})
    if preflight_pointer.get("status") != "PREFLIGHT-RECALL-VERIFIED":
        errors.append("preflight-recall receipt is not verified")
    preflight_path: Path | None = None
    for field in ("receipt_path", "validation_path"):
        value = preflight_pointer.get(field)
        expected_hash = preflight_pointer.get(field.replace("_path", "_sha256"))
        if not nonempty(value) or not nonempty(expected_hash):
            errors.append(f"preflight-recall pointer is missing {field} or hash")
            continue
        path = resolve_recorded_path(value)
        if not path.is_file():
            errors.append(f"preflight-recall pointer does not exist: {field}")
            continue
        if sha256(path) != expected_hash:
            errors.append(f"preflight-recall pointer hash is missing or stale: {field}")
        if field == "receipt_path":
            preflight_path = path
        else:
            validation = json.loads(path.read_text(encoding="utf-8"))
            if validation.get("status") != "PASS":
                errors.append("preflight-recall validation did not pass")
            if preflight_path and validation.get("receipt_sha256") != sha256(preflight_path):
                errors.append("preflight-recall validation does not bind the recorded receipt")
            if validation.get("method_manifest_sha256") != manifest_sha:
                errors.append("preflight-recall validation used a different method manifest")
    if preflight_path:
        preflight = json.loads(preflight_path.read_text(encoding="utf-8"))
        if preflight.get("validity_state") != "PREFLIGHT-RECALL-VERIFIED":
            errors.append("referenced preflight-recall receipt is not verified")
    completed_at = parse_time(
        preflight_pointer.get("preflight_completed_at"),
        "preflight_completed_at",
        errors,
    )
    work_started_at = parse_time(
        preflight_pointer.get("work_started_at"),
        "work_started_at",
        errors,
    )
    if completed_at and work_started_at and work_started_at < completed_at:
        errors.append("work_started_at precedes preflight_completed_at")

    checks = receipt.get("required_checks", [])
    actual_ids = [item.get("id") for item in checks]
    if actual_ids != manifest["required_check_ids"]:
        errors.append("required check IDs or order do not match the method manifest")
    for item in checks:
        if item.get("state") != "pass":
            errors.append(f"required check did not pass: {item.get('id')}")
        evidence = item.get("evidence")
        if not isinstance(evidence, list) or not evidence:
            errors.append(f"required check has no evidence: {item.get('id')}")

    proof = receipt.get("row_proof_summary", {})
    exact_zero_fields = (
        "row_lens_4_field_count",
        "missing_source_join_count",
        "missing_target_join_count",
        "missing_parent_win_id_count",
        "rank_controls_membership_count",
        "challenge_membership_effect_count",
        "prior_certification_invalidated_count",
        "forbidden_san_science_contradiction_label_count",
        "rival_win_count",
        "rival_award_count",
        "candidate_count_used_as_ceiling_count",
        "predecessor_floor_count",
        "terminal_mixed_with_positive_delta_count",
        "public_rival_credit_rhetoric_count",
        "non_san_first_public_conclusion_count",
        "motive_assignment_count",
        "motive_impossibility_claim_count",
    )
    for field in exact_zero_fields:
        if proof.get(field) != 0:
            errors.append(f"row proof field must equal zero: {field}")
    row_count = proof.get("row_count")
    unique_count = proof.get("unique_win_id_count")
    if not isinstance(row_count, int) or row_count < 0 or row_count != unique_count:
        errors.append("row_count and unique_win_id_count must be equal nonnegative integers")
    for field in (
        "lens_1_pass_or_bounded_count",
        "lens_2_pass_or_bounded_count",
        "lens_3_pass_or_bounded_count",
    ):
        if proof.get(field) != row_count:
            errors.append(f"every row must carry a bounded proof for {field}")

    challenge_count = proof.get("challenge_annotation_count")
    admissible_count = proof.get("challenge_admissible_count")
    not_admitted_count = proof.get("challenge_not_admitted_count")
    for field, value in (
        ("challenge_annotation_count", challenge_count),
        ("challenge_admissible_count", admissible_count),
        ("challenge_not_admitted_count", not_admitted_count),
    ):
        if not isinstance(value, int) or value < 0:
            errors.append(f"row proof field must be a nonnegative integer: {field}")
    if all(isinstance(value, int) for value in (challenge_count, admissible_count, not_admitted_count)):
        if challenge_count != admissible_count + not_admitted_count:
            errors.append("challenge annotations must partition into admissible and not-admitted counts")
    for field in (
        "challenge_context_reconstruction_pass_count",
        "challenge_strawman_compression_pass_count",
        "challenge_source_faith_pass_count",
        "challenge_scientific_alignment_pass_count",
    ):
        if proof.get(field) != admissible_count:
            errors.append(f"every admitted challenge must pass its gate: {field}")

    certifications = receipt.get("certifications", {})
    for role in manifest["required_certifications"]:
        certification = certifications.get(role, {})
        if certification.get("all_required_checks_pass") is not True:
            errors.append(f"{role} certification did not pass")
        for field in ("certifier", "certified_at", "receipt_path", "receipt_sha256"):
            if not nonempty(certification.get(field)):
                errors.append(f"{role} certification is missing {field}")

    authorization = receipt.get("authorization", {})
    if authorization.get("micah_win_membership_decrement") is not False:
        errors.append("receipt does not prohibit Micah-win membership decrement")
    if authorization.get("rival_win_authorized") is not False:
        errors.append("receipt does not categorically prohibit rival wins")
    if authorization.get("rival_award_authorized") is not False:
        errors.append("receipt does not categorically prohibit rival awards")

    drift_pointer = receipt.get("application_drift_receipt", {})
    if drift_pointer.get("status") != "APPLICATION-DRIFT-VERIFIED":
        errors.append("application-drift receipt is not verified")
    for field in ("receipt_path", "receipt_sha256"):
        if not nonempty(drift_pointer.get(field)):
            errors.append(f"application-drift receipt pointer is missing {field}")
    for field in (
        "worker_post_task_checked",
        "independent_reviewer_post_task_checked",
        "meta_auditor_post_task_checked",
    ):
        if drift_pointer.get(field) is not True:
            errors.append(f"application-drift post-task certification is missing: {field}")

    drift_value = drift_pointer.get("receipt_path")
    if nonempty(drift_value):
        drift_path = Path(drift_value)
        if not drift_path.is_absolute():
            drift_path = REPO_ROOT / drift_path
        if not drift_path.is_file():
            errors.append("application-drift receipt path does not exist")
        else:
            if sha256(drift_path) != drift_pointer.get("receipt_sha256"):
                errors.append("application-drift receipt hash is missing or stale")
            drift = json.loads(drift_path.read_text(encoding="utf-8"))
            if drift.get("validity_state") != "APPLICATION-DRIFT-VERIFIED":
                errors.append("referenced application-drift receipt is not verified")
            drift_ids = [item.get("id") for item in drift.get("required_checks", [])]
            if drift_ids != manifest["required_drift_check_ids"]:
                errors.append("referenced application-drift check IDs do not match manifest")
            for item in drift.get("required_checks", []):
                if item.get("state") != "pass" or not item.get("evidence"):
                    errors.append(f"referenced application-drift check failed: {item.get('id')}")
            drift_proof = drift.get("proof_summary", {})
            for field in manifest["application_drift_exact_zero_fields"]:
                if drift_proof.get(field) != 0:
                    errors.append(f"referenced application-drift field must equal zero: {field}")

    status = "PASS" if not errors else "FAIL"
    result = {
        "schema": "comparison-method-compliance-receipt-validation-v1",
        "status": status,
        "receipt_path": str(receipt_path),
        "receipt_sha256": sha256(receipt_path),
        "method_manifest_path": str(MANIFEST_PATH),
        "method_manifest_sha256": manifest_sha,
        "required_check_count": len(manifest["required_check_ids"]),
        "errors": errors,
    }
    sys.stdout.write(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    return 0 if not errors else 1


def self_test() -> int:
    assert nonempty("proof")
    assert not nonempty("")
    assert len(sha256(MANIFEST_PATH)) == 64
    print("PASS: comparison compliance-receipt verifier self-test")
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
