import copy
import unittest
import numpy as np
from active_receiver_v4 import Learner, envelope, corrected_input, wire_action


class ActiveReceiverTests(unittest.TestCase):
    def test_exact_restoration_both_wirings(self):
        for context in (0, 1):
            for wiring in (0, 1):
                x = np.ones(10)
                x[6] = 2*context-1
                self.assertTrue(np.array_equal(corrected_input(x, wire_action(context, wiring), wiring), x))
                self.assertFalse(np.array_equal(corrected_input(x, wire_action(1-context, wiring), wiring), x))

    def test_signed_update_changes_one_action(self):
        agent = Learner()
        self.assertTrue(agent.receive(envelope(1, 0, 0, 2, 1.0)))
        self.assertEqual(agent.q[0, 2], 0.625)
        self.assertEqual(int(agent.accepted.sum()), 1)

    def test_replay_stale_phase_and_forgery_preserve_state(self):
        agent = Learner()
        original = envelope(1, 0, 0, 2, 1.0)
        self.assertTrue(agent.receive(original))
        forged = envelope(1, 999, 1, 1, 1.0)
        forged["signature"] = "fake"
        for bad in (original, envelope(0, 1, 0, 1, 1.0), forged):
            before = agent.digest()
            self.assertFalse(agent.receive(bad))
            self.assertEqual(before, agent.digest())
        self.assertTrue(agent.receive(envelope(1, 1, 0, 1, 0.0)))

    def test_unverified_negative_control_accepts_real_argument(self):
        agent = Learner()
        forged = envelope(1, 0, 0, 2, 1.0)
        forged["signature"] = "fake"
        self.assertFalse(agent.receive(forged))
        self.assertTrue(agent.receive(forged, authenticate=False))
        self.assertEqual(agent.q[0, 2], 0.625)

    def test_invalid_numbers_types_and_dimensions(self):
        agent = Learner()
        for field, value in (("reward", float("nan")), ("reward", float("inf")),
                             ("reward", -1), ("reward", True), ("context", 2),
                             ("action", -1), ("nonce", True), ("signature", 5)):
            bad = envelope(1, 0, 0, 0, 0.5)
            bad[field] = value
            before = agent.digest()
            self.assertFalse(agent.receive(bad, authenticate=False))
            self.assertEqual(before, agent.digest())

    def test_persistence_and_external_equivalence(self):
        one, two = Learner(), Learner()
        for t in range(30):
            context = t % 2
            a, b = one.choose(context), two.choose(context)
            self.assertEqual(a, b)
            message = envelope(1, t, context, a, float(a == context+1))
            self.assertTrue(one.receive(message))
            self.assertTrue(two.receive(copy.deepcopy(message)))
        self.assertEqual(one.digest(), two.digest())
        self.assertEqual(one.digest(), Learner.restore(one.state()).digest())


if __name__ == "__main__":
    unittest.main()
