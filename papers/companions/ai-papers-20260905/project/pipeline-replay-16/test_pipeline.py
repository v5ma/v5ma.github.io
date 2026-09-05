"""Small controller checks, with no model imports, inference or file writes."""

import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import pipeline as p


class RecipeTests(unittest.TestCase):
    def test_exact_step_count(self):
        self.assertEqual(len(p.recipe()), 49)
        self.assertEqual([s["step"] for s in p.recipe()], list(range(49)))

    def test_exact_native_scope(self):
        self.assertEqual(sum(s["kind"] in ("train", "test", "native_audit") for s in p.recipe()), 44)

    def test_six_training_batches(self):
        self.assertEqual([s["index"] for s in p.recipe() if s["kind"] == "train"], list(range(6)))

    def test_sixteen_test_cases(self):
        self.assertEqual([s["index"] for s in p.recipe() if s["kind"] == "test"], list(range(16)))

    def test_auditor_covers_each_training_and_test_batch(self):
        for split, count in (("train", 6), ("test", 16)):
            self.assertEqual([s["index"] for s in p.recipe() if s["kind"] == "native_audit" and s["split"] == split], list(range(count)))

    def test_research_fit_once_before_tests(self):
        fit = [s["step"] for s in p.recipe() if s["kind"] == "fit"]
        self.assertEqual(len(fit), 1)
        self.assertLess(max(s["step"] for s in p.recipe() if s["kind"] == "train"), fit[0])
        self.assertLess(fit[0], min(s["step"] for s in p.recipe() if s["kind"] == "test"))

    def test_trace_after_all_tests(self):
        self.assertGreater(next(s["step"] for s in p.recipe() if s["kind"] == "trace"),
                           max(s["step"] for s in p.recipe() if s["kind"] == "test"))

    def test_explicit_execution_required_before_path_access(self):
        with self.assertRaises(ValueError):
            p.run_step("must-not-open", 0, False)

    def test_bad_step_index_rejected(self):
        for value in (-1, 49, True, 0.0):
            with self.assertRaises(ValueError):
                p.run_step(Path(__file__).parent, value, True)


class ComparisonTests(unittest.TestCase):
    def test_identical_record(self):
        p.same_except({"answer": "A", "resource": 1}, {"answer": "A", "resource": 1})

    def test_only_named_resource_variance_allowed(self):
        p.same_except({"answer": "A", "resource": 2}, {"answer": "A", "resource": 1}, {"resource"})

    def test_answer_change_rejected(self):
        with self.assertRaises(ValueError):
            p.same_except({"answer": "B", "resource": 2}, {"answer": "A", "resource": 1}, {"resource"})

    def test_count_change_rejected(self):
        with self.assertRaises(ValueError):
            p.same_except({"count": 15, "resource": 2}, {"count": 16, "resource": 1}, {"resource"})

    def test_extra_field_rejected(self):
        with self.assertRaises(ValueError):
            p.same_except({"count": 16, "extra": True}, {"count": 16}, {"extra"})

    def test_missing_field_rejected(self):
        with self.assertRaises(ValueError):
            p.same_except({"count": 16}, {"count": 16, "resource": 1}, {"resource"})

    def test_new_fit_ancestry_required(self):
        receipt = {"fit_receipt_sha256": "old-fit", "files": {}, "resource": {}}
        with patch.object(p, "checked_receipt", return_value=receipt), patch.object(p.h, "load", return_value=receipt), \
             patch.object(p.h, "digest", return_value="new-fit"), patch.object(Path, "is_file", return_value=True):
            with self.assertRaises(ValueError):
                p.outputs_ok(Path(__file__).parent.resolve(), {"kind": "test", "output": "results/fake"})


class ReceiptGuards(unittest.TestCase):
    def baseline(self):
        return {"files": {}, "resource": {"numerical_threads": 1, "elapsed_seconds": 1.0,
                "peak_commit_bytes": 1000000, "initial": {"available_ram_bytes": 9000000000}}}

    def validate(self, value):
        with patch.object(p.h, "load", return_value=value):
            return p.checked_receipt(Path(__file__).parent.resolve(), "results/fake")

    def test_valid_resource_record(self):
        self.assertEqual(self.validate(self.baseline()), self.baseline())

    def test_multiple_numerical_threads_rejected(self):
        value = self.baseline(); value["resource"]["numerical_threads"] = 2
        with self.assertRaises(ValueError):
            self.validate(value)

    def test_elapsed_bound_rejected(self):
        value = self.baseline(); value["resource"]["elapsed_seconds"] = 75
        with self.assertRaises(ValueError):
            self.validate(value)

    def test_negative_elapsed_rejected(self):
        value = self.baseline(); value["resource"]["elapsed_seconds"] = -1
        with self.assertRaises(ValueError):
            self.validate(value)

    def test_memory_bound_rejected(self):
        value = self.baseline(); value["resource"]["peak_commit_bytes"] = 5500000000
        with self.assertRaises(ValueError):
            self.validate(value)

    def test_free_ram_bound_rejected(self):
        value = self.baseline(); value["resource"]["initial"]["available_ram_bytes"] = 7999999999
        with self.assertRaises(ValueError):
            self.validate(value)

    def test_nested_output_path_rejected(self):
        value = self.baseline(); value["files"] = {"nested/file.json": "digest"}
        with self.assertRaises(ValueError):
            self.validate(value)


def run_tests():
    loader = unittest.TestLoader()
    suite = unittest.TestSuite(loader.loadTestsFromTestCase(cls) for cls in (RecipeTests, ComparisonTests, ReceiptGuards))
    result = unittest.TestResult(); suite.run(result)
    record = {"tests": result.testsRun, "passed": result.testsRun-len(result.failures)-len(result.errors),
              "failures": [{"test": str(t), "details": e} for t,e in result.failures],
              "errors": [{"test": str(t), "details": e} for t,e in result.errors],
              "scope": "Controller/receipt guards, not scientific experiments", "model_calls": 0}
    return result.wasSuccessful(), record


if __name__ == "__main__":
    ok, record = run_tests()
    print(json.dumps(record, indent=2))
    raise SystemExit(0 if ok else 1)
