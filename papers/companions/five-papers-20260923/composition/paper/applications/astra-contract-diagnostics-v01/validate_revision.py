"""Fixed-file revision preservation and replay checks; no source modifications."""
from pathlib import Path
import hashlib
import json
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    output = HERE / "VALIDATION-01.json"
    if output.exists():
        raise SystemExit("Refusing to replace existing validation")
    old_path = ROOT / "drafts/FINAL-DRAFT-PRIVATE-HIGHER-TIER-REVIEW-20260923.md"
    new_path = ROOT / "drafts/REVISION-01-ASTRA-20260923.md"
    old = old_path.read_text(encoding="utf-8-sig")
    new = new_path.read_text(encoding="utf-8-sig")
    before = json.loads((HERE / "RESULT-01.json").read_text(encoding="utf-8"))
    replay = json.loads((HERE / "RESULT-02.json").read_text(encoding="utf-8"))
    for key in ("seconds",):
        before.pop(key)
        replay.pop(key)
    checks = {}
    checks["deterministic_replay_without_elapsed_seconds"] = before == replay
    checks["all_read_originals_still_match"] = all(sha(ROOT / name) == expected
                                                   for name, expected in before["original_file_hashes"].items())
    old_blocks = [block.strip() for block in old.split("\n\n") if block.strip()]
    changed = [block for block in old_blocks if block not in new]
    intended = (
        "September 23, 2026. Private final draft",
        "Eight supplied task IDs address",
        "The mixed-minus-single query-two accuracy contrast",
    )
    checks["only_three_explained_old_blocks_replaced"] = len(changed) == 3 and all(
        sum(block.startswith(prefix) for block in changed) == 1 for prefix in intended)
    old_figures = [line for line in old.splitlines() if line.startswith("![Figure ")]
    new_figures = [line for line in new.splitlines() if line.startswith("![Figure ")]
    checks["all_thirteen_figure_lines_identical"] = old_figures == new_figures and len(old_figures) == 13
    checks["original_analytic_section_unchanged"] = old.split("## 4.", 1)[1].split("## 5.", 1)[0] == new.split("## 4.", 1)[1].split("## 5.", 1)[0]
    old_refs = old.split("## References", 1)[1].strip().splitlines()
    new_refs = new.split("## References", 1)[1].strip().splitlines()
    checks["old_28_references_retained_in_order"] = new_refs[:28] == old_refs and len(old_refs) == 28
    checks["two_primary_references_added"] = len(new_refs) == 30
    checks["prospective_test_explicitly_unrun"] = "None of the targets above has been tested in the present paper." in new
    checks["bias_corrected_zero_role_fold_present"] = "(a_g-a_0)P_j" in new and "b'_j=b_j+a_0P_j" in new
    new_link_targets = (
        HERE / "PROTOCOL-ADDENDUM.md", HERE / "check_contracts.py", HERE / "RESULT-01.json",
        ROOT / "reviews/ASTRA-REVISION-01-20260923.md",
    )
    checks["new_supporting_routes_exist"] = all(path.is_file() for path in new_link_targets)
    result = {"complete": all(checks.values()), "checks": checks,
              "old_sha256": sha(old_path), "new_sha256": sha(new_path),
              "old_blocks": len(old_blocks), "verbatim_old_blocks_retained": len(old_blocks) - len(changed),
              "replaced_old_block_prefixes": [block[:100] for block in changed],
              "all_read_originals_checked": len(before["original_file_hashes"]),
              "scope": "Preservation and bounded regression checks; no new scientific result or PDF build."}
    with output.open("x", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2, allow_nan=False)
        handle.write("\n")
    print(json.dumps(result, indent=2))
    if not result["complete"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
