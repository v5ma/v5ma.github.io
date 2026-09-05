import unittest
from fractions import Fraction
from run_context_provenance_v3 import passive_null, resolve_origins, score_bin


class ContextProvenanceTests(unittest.TestCase):
    def test_unknown_is_not_public(self):
        records = {"x": {"parents": ["A"], "lineage_known": False}}
        self.assertIsNone(resolve_origins("x", records, {"A"}))

    def test_unknown_ancestor_propagates(self):
        records = {"x": {"parents": ["A"], "lineage_known": False}, "y": {"parents": ["x"], "lineage_known": True}}
        self.assertIsNone(resolve_origins("y", records, {"A"}))
        self.assertEqual(resolve_origins("y", records, {"A"}, overrides={"x": {"A"}}), {"A"})

    def test_mixed_origins_preserved(self):
        records = {"x": {"parents": ["A", "B"], "lineage_known": True}, "y": {"parents": ["x", "B"], "lineage_known": True}}
        self.assertEqual(resolve_origins("y", records, {"A", "B"}), {"A", "B"})

    def test_cycles_rejected(self):
        records = {"x": {"parents": ["y"], "lineage_known": True}, "y": {"parents": ["x"], "lineage_known": True}}
        with self.assertRaises(ValueError):
            resolve_origins("x", records, {"A"})

    def test_passive_fixed_point_error_identity(self):
        rows = passive_null(20)
        self.assertEqual(len(rows), 42)
        self.assertTrue(all(r["control_action"] == "none" for r in rows))
        last = {r["arm"]: Fraction(r["state_rational"]) for r in rows if r["turn"] == 20}
        self.assertLess(abs(float(last["positive"] - last["negative"] - Fraction(15, 91))), 1e-10)

    def test_score_rounding(self):
        self.assertEqual([score_bin(x) for x in [-1, 4.9, 5, 95, 105]], [0, 0, 10, 100, 100])


if __name__ == "__main__":
    unittest.main()
