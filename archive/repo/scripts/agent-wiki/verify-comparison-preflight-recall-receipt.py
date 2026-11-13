#!/usr/bin/env python3
"""Fail-closed verifier for a Comparison Wiki preflight-recall receipt."""

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

REQUIRED_DOCUMENT_ROLES = (
    "active_goal",
    "concise_standing_goal",
    "method_lock",
    "preflight_recall_checklist",
    "method_manifest",
    "semantic_stack_manual",
    "genealogical_atom_protocol",
    "book_atlas_route",
    "presentation_requirements",
    "miller_regression",
    "hawkins_regression",
    "george_regression",
    "application_drift_checklist",
)

REQUIRED_TOOLS = (
    "Jigsaw",
    "TurboVec",
    "Operational-Equivalence Census",
    "Fit-Pattern Census",
    "Major Cluster Signature Census",
    "JigsawRank",
)

REQUIRED_REGRESSION_GUARDS = (
    "miller_one_or_zero_compression_recalled",
    "hawkins_leaf_atom_and_missing_delta_recalled",
    "george_methods_undercoverage_recalled",
    "representative_set_is_not_ceiling",
    "automated_no_fit_is_non_veto",
    "before_after_zero_rival_rule_recalled",
)

REQUIRED_OUTPUT_GUARDS = (
    "exhaustive_dossier_required",
    "human_flashcards_required",
    "strongest_one_or_two_sentences_per_side",
    "earliest_lineage_anchor_visible",
    "strongest_mature_pre_target_formulation_visible",
    "intervening_formulations_reachable",
    "eighth_grade_plain_language_required",
    "card_expands_to_source_bound_dossier",
    "card_count_is_not_evidence_denominator",
)

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


def verify_hashed_record(record: dict[str, Any], label: str, errors: list[str]) -> None:
    value = record.get("path")
    expected_hash = record.get("sha256")
    if not nonempty(value) or not nonempty(expected_hash):
        errors.append(f"{label} is missing path or sha256")
        return
    path = resolve_recorded_path(value)
    if not path.is_file():
        errors.append(f"{label} path does not exist: {value}")
    elif sha256(path) != expected_hash:
        errors.append(f"{label} hash is missing or stale: {value}")


def verify_receipt(receipt_path: Path) -> int:
    errors: list[str] = []
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    receipt = json.loads(receipt_path.read_text(encoding="utf-8"))

    if receipt.get("validity_state") != "PREFLIGHT-RECALL-VERIFIED":
        errors.append("validity_state is not PREFLIGHT-RECALL-VERIFIED")

    scope = receipt.get("scope", {})
    for field in ("program_id", "batch_id", "worker_id", "bounded_batch_statement", "scope_lens"):
        if not nonempty(scope.get(field)):
            errors.append(f"scope is missing {field}")
    if scope.get("method_manifest_sha256") != sha256(MANIFEST_PATH):
        errors.append("preflight receipt method-manifest hash is missing or stale")
    fixed_manifest = {
        "path": scope.get("fixed_input_manifest_path"),
        "sha256": scope.get("fixed_input_manifest_sha256"),
    }
    verify_hashed_record(fixed_manifest, "fixed input manifest", errors)

    started = parse_time(scope.get("preflight_started_at"), "preflight_started_at", errors)
    completed = parse_time(scope.get("preflight_completed_at"), "preflight_completed_at", errors)
    authorization = receipt.get("authorization", {})
    authorized = parse_time(
        authorization.get("batch_execution_authorized_at"),
        "batch_execution_authorized_at",
        errors,
    )
    if started and completed and completed < started:
        errors.append("preflight_completed_at precedes preflight_started_at")
    if completed and authorized and authorized < completed:
        errors.append("batch_execution_authorized_at precedes preflight_completed_at")

    documents = receipt.get("required_documents", [])
    actual_roles = tuple(item.get("role") for item in documents)
    if actual_roles != REQUIRED_DOCUMENT_ROLES:
        errors.append("required document roles or order do not match the preflight contract")
    for item in documents:
        role = item.get("role", "unknown")
        if item.get("loaded") is not True:
            errors.append(f"required document was not loaded: {role}")
        if not nonempty(item.get("recalled_rule")):
            errors.append(f"required document has no recalled rule: {role}")
        verify_hashed_record(item, f"required document {role}", errors)

    stack = receipt.get("semantic_discovery_stack", [])
    actual_tools = tuple(item.get("tool") for item in stack)
    if actual_tools != REQUIRED_TOOLS:
        errors.append("semantic-discovery tool names or order do not match the preflight contract")
    for item in stack:
        tool = item.get("tool", "unknown")
        verify_hashed_record(
            {"path": item.get("route_path"), "sha256": item.get("route_sha256")},
            f"semantic route {tool}",
            errors,
        )
        if item.get("status") not in ("AVAILABLE", "UNAVAILABLE-OPEN-CELLS"):
            errors.append(f"semantic route has invalid status: {tool}")
        if not nonempty(item.get("bounded_input_receipt")):
            errors.append(f"semantic route lacks a bounded input or unavailability receipt: {tool}")

    regressions = receipt.get("regression_guard_summary", {})
    for field in REQUIRED_REGRESSION_GUARDS:
        if regressions.get(field) is not True:
            errors.append(f"regression guard did not pass: {field}")

    denominators = receipt.get("frozen_denominators", {})
    denominator_fields = (
        "parent_win_id_count",
        "micah_stage_count",
        "micah_atom_count",
        "target_document_version_count",
        "seed_target_atom_count",
        "initial_matrix_cell_count",
    )
    for field in denominator_fields:
        value = denominators.get(field)
        if not isinstance(value, int) or value < 0:
            errors.append(f"frozen denominator must be a nonnegative integer: {field}")
    atom_count = denominators.get("micah_atom_count")
    document_count = denominators.get("target_document_version_count")
    target_atom_count = denominators.get("seed_target_atom_count")
    matrix_count = denominators.get("initial_matrix_cell_count")
    if all(isinstance(value, int) for value in (atom_count, document_count, target_atom_count, matrix_count)):
        if matrix_count != atom_count * document_count * target_atom_count:
            errors.append("initial_matrix_cell_count does not equal micah_atom_count x target_document_version_count x seed_target_atom_count")
    author_counts = denominators.get("listed_author_count_by_document")
    if not isinstance(author_counts, dict) or len(author_counts) != document_count:
        errors.append("listed_author_count_by_document does not cover the frozen target-document denominator")
    elif any(not isinstance(value, int) or value < 1 for value in author_counts.values()):
        errors.append("every frozen target document must have at least one listed author")
    if denominators.get("append_only_discovery_allowed") is not True:
        errors.append("append-only discovery is not enabled")

    output_contract = receipt.get("paired_output_contract", {})
    for field in REQUIRED_OUTPUT_GUARDS:
        if output_contract.get(field) is not True:
            errors.append(f"paired output guard did not pass: {field}")

    checks = receipt.get("required_checks", [])
    actual_ids = [item.get("id") for item in checks]
    expected_ids = manifest.get("required_preflight_check_ids", [])
    if actual_ids != expected_ids:
        errors.append("preflight check IDs or order do not match the method manifest")
    for item in checks:
        if item.get("state") != "pass":
            errors.append(f"preflight check did not pass: {item.get('id')}")
        evidence = item.get("evidence")
        if not isinstance(evidence, list) or not evidence:
            errors.append(f"preflight check has no evidence: {item.get('id')}")

    prohibited = receipt.get("prohibited_counts", {})
    for field in manifest.get("preflight_exact_zero_fields", []):
        if prohibited.get(field) != 0:
            errors.append(f"preflight prohibited field must equal zero: {field}")

    certification = receipt.get("certification", {})
    if not nonempty(certification.get("worker")):
        errors.append("preflight worker certification is missing worker")
    if not nonempty(certification.get("certified_at")):
        errors.append("preflight worker certification is missing certified_at")
    if certification.get("all_required_checks_pass") is not True:
        errors.append("preflight worker certification did not pass")

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
            errors.append(f"preflight must keep {field} false")

    status = "PASS" if not errors else "FAIL"
    result = {
        "schema": "comparison-preflight-recall-receipt-validation-v1",
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
    assert len(hashlib.sha256(b"test").hexdigest()) == 64
    print("PASS: comparison preflight-recall verifier self-test")
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
