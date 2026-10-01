import unittest
from gpt2_adapter_v5 import Decoder, np
from gpt2_receiver_v5 import scaled, mediated

class GPT2Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.decoder = Decoder(max_seconds=30)
        cls.ids = cls.decoder.ids("When John and Mary went to the store, John gave a book to")
        cls.clean = cls.decoder.prompt(cls.ids)

    def test_saved_development_baseline_has_native_recipient(self):
        token = int(np.argmax(self.clean["logits"]))
        self.assertEqual(self.decoder.tokenizer.decode([token]), " Mary")

    def test_noop_and_self_replacement_are_identical(self):
        for alias in ("r7", "r8", "a9"):
            output = self.decoder.step(self.ids[-1], self.clean["before"], {alias: self.clean["hooks"][alias]})
            np.testing.assert_array_equal(output["logits"], self.clean["logits"])

    def test_intervention_reaches_actual_graph_tensor(self):
        change = self.clean["hooks"]["r8"] + np.float32(0.125)
        output = self.decoder.step(self.ids[-1], self.clean["before"], {"r8": change})
        np.testing.assert_array_equal(output["post"]["r8"], change)

    def test_wrong_hook_and_shape_rejected(self):
        with self.assertRaises(AssertionError):
            self.decoder.step(self.ids[-1], self.clean["before"], {"missing": np.zeros((1,1,768))})
        with self.assertRaises(AssertionError):
            self.decoder.step(self.ids[-1], self.clean["before"], {"r8": np.zeros((768,))})

    def test_norm_matched_control_and_degenerate_failure(self):
        vector = np.arange(768, dtype=np.float32).reshape(1,1,768)
        self.assertAlmostEqual(float(np.linalg.norm(scaled(vector, 2.0))), 2.0, places=5)
        with self.assertRaises(ValueError):
            scaled(np.zeros_like(vector), 2.0)

    def test_actual_update_interface_rejects_forgery_and_replay(self):
        row = dict(family="fixture", split="test", giver="John", arm="test",
                   expected="Mary", other="John", recipient="John")
        events = mediated(row)
        self.assertEqual([e["update_accepted"] for e in events], [1,1,0,1,0])
        self.assertEqual([e["executed"] for e in events], [1,0,0,0,0])
        self.assertEqual(sum(e["unauthorized_execution"] for e in events), 0)

    def test_cache_reset_is_context_change_not_weight_learning(self):
        reset = self.decoder.step(self.ids[-1], self.decoder.empty())
        self.assertGreater(float(np.max(np.abs(reset["logits"]-self.clean["logits"]))), 1)
        repeat = self.decoder.step(self.ids[-1], self.clean["before"])
        np.testing.assert_array_equal(repeat["logits"], self.clean["logits"])

if __name__ == "__main__":
    unittest.main()
