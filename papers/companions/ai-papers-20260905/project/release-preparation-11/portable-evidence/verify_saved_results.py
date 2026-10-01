"""Read-only saved-answer audit. Standard library only; no model or network access."""
import argparse
import copy
import hashlib
import json
from pathlib import Path

ARMS = {
    "learned": ("original", "linear_ridge", "rbf_ridge", "yoked_ridge", "slot_swap", "oracle_kv", "full_donor", "text_instruction"),
    "transfer": ("original", "full_donor", "conv_donor", "recurrent_donor", "kv_donor", "conv_recurrent_donor"),
}
QUERIES = ("giver", "recipient", "color")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def normalized(text):
    require(isinstance(text, str), "Answer/target must be text")
    return text.strip().casefold()


def safe_path(root, name):
    require(isinstance(name, str) and name and "\\" not in name and ":" not in name,
            "Only portable relative paths are allowed")
    relative = Path(name)
    require(not relative.is_absolute() and ".." not in relative.parts, "Path leaves bundle")
    resolved = (root / relative).resolve()
    require(resolved.is_relative_to(root.resolve()), "Resolved path leaves bundle")
    return resolved


def load_bundle(root):
    manifest_path = root / "MANIFEST.json"
    manifest_bytes = manifest_path.read_bytes()
    require(len(manifest_bytes) < 200000, "Oversized manifest")
    manifest = json.loads(manifest_bytes)
    require(manifest["schema"] == "san-saved-evidence/v1", "Unknown manifest schema")
    files = manifest["files"]
    require(len(files) < 100, "File ceiling exceeded")
    names = [entry["path"] for entry in files]
    require(len(names) == len(set(names)), "Duplicate manifest path")
    records = {}
    for entry in files:
        require(0 <= entry["bytes"] <= 2000000, "Per-file size ceiling exceeded")
        target = safe_path(root, entry["path"])
        require(target.stat().st_size == entry["bytes"], "File size mismatch: " + entry["path"])
        body = target.read_bytes()
        require(hashlib.sha256(body).hexdigest() == entry["sha256"], "File hash mismatch: " + entry["path"])
        if entry["path"].endswith(".json"):
            records[entry["path"]] = json.loads(body)
    require(sum(f["bytes"] for f in files) < 10000000, "Bundle size ceiling exceeded")
    return manifest, records


def validate_study(study, cases, answers, metrics, declared_groups):
    arms = ARMS[study]
    require(len(cases) == 16, "Expected exactly 16 cases per study")
    by_id = {c["id"]: c for c in cases}
    require(len(by_id) == 16, "Duplicate case identity")
    for case in cases:
        other = by_id.get(case["opposite"])
        require(other is not None and other["opposite"] == case["id"], "Opposite case identity is invalid")
        require(case["giver"] == other["recipient"] and case["recipient"] == other["giver"], "Opposite roles do not exchange")
        require(case["giver"] != case["recipient"], "Two distinct roles are required")
        require(case["family"] == other["family"] and case["color"] == other["color"], "Opposite group mismatch")
        require({case["direction"], other["direction"]} == {0, 1}, "Direction pair mismatch")
    expected_keys = {(c["id"], arm, q) for c in cases for arm in arms for q in QUERIES}
    keys = [(a["case"], a["arm"], a["query"]) for a in answers]
    require(len(keys) == len(set(keys)), "Duplicate saved answer key")
    require(set(keys) == expected_keys, "Missing or unexpected saved answer")
    checked = {}
    same_name_counts = {arm: 0 for arm in arms}
    for a in answers:
        c = by_id[a["case"]]
        require(a["family"] == c["family"] and a["color"] == c["color"], "Saved answer metadata mismatch")
        original = c[a["query"]]
        swapped = c[{"giver": "recipient", "recipient": "giver", "color": "color"}[a["query"]]]
        require(a["original_target"] == original and a["swapped_target"] == swapped, "Target does not follow the case's requested operation")
        for field, target in [("original_score", original), ("swapped_score", swapped)]:
            require(a[field]["correct"] == (normalized(a["answer"]) == normalized(target)), "Saved correctness flag disagrees with whole-answer scoring")
            require(a[field]["exact_case_correct"] == (a["answer"].strip() == target.strip()), "Exact-case flag disagrees")
        ids = a["generated_ids"]
        require(0 < len(ids) <= 4 and all(type(i) is int and 0 <= i < 248320 for i in ids), "Generated-token shape mismatch")
        require(a["stopped_on_eos"] == (ids[-1] in (248044, 248046)), "EOS metadata mismatch")
        checked[(a["case"], a["arm"], a["query"])] = a
    metric_keys = [(m["arm"], m["query"]) for m in metrics]
    require(len(metric_keys) == len(set(metric_keys)) and set(metric_keys) == {(a, q) for a in arms for q in QUERIES}, "Metric key coverage mismatch")
    for metric in metrics:
        subset = [a for a in answers if a["arm"] == metric["arm"] and a["query"] == metric["query"]]
        require(metric["n"] == 16, "Metric denominator mismatch")
        require(metric["swapped_correct"] == sum(a["swapped_score"]["correct"] for a in subset), "Reversal metric mismatch")
        require(metric["original_correct"] == sum(a["original_score"]["correct"] for a in subset), "Original metric mismatch")
    groups = sorted({(c["family"], c["color"]) for c in cases})
    require(len(groups) == 8, "Expected eight opposite-direction groups")
    group_keys = [(g["arm"], g["family"], g["color"]) for g in declared_groups]
    require(len(group_keys) == len(set(group_keys)) and set(group_keys) == {(a, f, c) for a in arms for f, c in groups}, "Group key coverage mismatch")
    for group in declared_groups:
        subset = [a for a in answers if a["arm"] == group["arm"] and a["family"] == group["family"] and a["color"] == group["color"]]
        require(len(subset) == 6, "Group must contain exactly six answers")
        for goal in ("swapped", "original"):
            require(group["all_six_" + goal] == all(a[goal + "_score"]["correct"] for a in subset), "Complete-group score mismatch")
    table = []
    for arm in arms:
        roles_correct = []
        for c in cases:
            giver, recipient = [checked[(c["id"], arm, q)] for q in QUERIES[:2]]
            roles_correct.append(giver["swapped_score"]["correct"] and recipient["swapped_score"]["correct"])
            same_name_counts[arm] += normalized(giver["answer"]) == normalized(recipient["answer"])
        row = {"arm": arm}
        for q in QUERIES:
            row[q] = sum(checked[(c["id"], arm, q)]["swapped_score"]["correct"] for c in cases)
        row["complete_groups"] = sum(g["all_six_swapped"] for g in declared_groups if g["arm"] == arm)
        row["both_roles_correct_stories"] = sum(roles_correct)
        row["same_name_stories"] = same_name_counts[arm]
        table.append(row)
    ordinary = sum(a["original_score"]["correct"] for a in answers if a["arm"] == "original")
    return {"study": study, "cases": 16, "saved_answers": len(answers), "ordinary_correct": ordinary,
            "ordinary_denominator": 48, "groups_per_arm": 8, "table": table}


def read_study(records, study):
    prefix = "data/" + study + "/"
    return (records[prefix + "cases.json"],
            [a for i in range(16) for a in records[prefix + "answers-" + str(i).zfill(2) + ".json"]],
            records[prefix + "metrics.json"], records[prefix + "groups.json"])


def rejection_tests(records):
    """Small in-memory corruption tests; original files are never mutated."""
    original = read_study(records, "learned")
    mutations = [
        ("duplicate_answer", lambda d: d[1].__setitem__(1, copy.deepcopy(d[1][0]))),
        ("missing_answer", lambda d: d[1].pop()),
        ("wrong_correctness_flag", lambda d: d[1][0]["swapped_score"].__setitem__("correct", True)),
        ("wrong_target", lambda d: d[1][0].__setitem__("swapped_target", "Unrelated")),
        ("changed_answer", lambda d: d[1][0].__setitem__("answer", "Unrelated")),
        ("wrong_denominator", lambda d: d[2][0].__setitem__("n", 15)),
        ("wrong_aggregate", lambda d: d[2][0].__setitem__("swapped_correct", 16)),
        ("wrong_group_success", lambda d: d[3][0].__setitem__("all_six_swapped", True)),
        ("missing_group", lambda d: d[3].pop()),
        ("wrong_family", lambda d: d[1][0].__setitem__("family", "wrong")),
        ("broken_opposite", lambda d: d[0][0].__setitem__("opposite", d[0][0]["id"])),
        ("wrong_eos_flag", lambda d: d[1][0].__setitem__("stopped_on_eos", False)),
    ]
    passed = []
    for name, mutate in mutations:
        changed = copy.deepcopy(original)
        mutate(changed)
        try:
            validate_study("learned", *changed)
        except ValueError:
            passed.append(name)
        else:
            raise ValueError("Corruption was not rejected: " + name)
    for unsafe in ("../outside.json", "D:/outside.json", "a\\b.json"):
        try:
            safe_path(Path(__file__).resolve().parent, unsafe)
        except ValueError:
            passed.append("reject_path_" + str(len(passed)))
        else:
            raise ValueError("Unsafe path was accepted")
    return passed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="Also test in-memory corruption rejection")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    manifest, records = load_bundle(root)
    studies = [validate_study(s, *read_study(records, s)) for s in ("learned", "transfer")]
    tests = rejection_tests(records) if args.self_test else []
    result = {"status": "PASS", "scope": "Saved-byte and whole-answer arithmetic audit, not native inference or independent review",
              "files_verified": len(manifest["files"]), "saved_answers_checked": sum(s["saved_answers"] for s in studies),
              "new_model_runs": 0, "new_lean_statements": 0, "corruption_rejection_tests": tests, "studies": studies}
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
