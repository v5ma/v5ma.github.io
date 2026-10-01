"""Small exact checks; no model download, regex or corpus search."""
import json
import sys
import time
import unittest

sys.dont_write_bytecode = True
import episode_application as app


class EpisodeChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config = json.loads((app.HERE / "CONFIG.json").read_text("utf-8"))
        cls.book = app.Codebook(1903)
        cls.train, cls.dev, cls.test = app.split_states(1903, cls.config)
        cls.receiver = app.Receiver()
        cls.receiver.fit(app.calibration(cls.train, cls.book))

    def test_all_states_unique(self):
        self.assertEqual(len({app.state(i) for i in range(4096)}), 4096)

    def test_split_disjoint_and_complete(self):
        a, b, c = map(set, (self.train, self.dev, self.test))
        self.assertFalse(a & b or b & c or a & c)
        self.assertEqual(a | b | c, set(range(4096)))

    def test_training_marginal_coverage(self):
        for coord in range(6):
            self.assertEqual({app.state(i)[coord] for i in self.train}, set(range(4)))

    def test_calibration_acquires_all_codes(self):
        self.assertEqual(len(self.receiver.associations), 12)
        for coord in range(6):
            for value in range(4):
                for fine in (False, True):
                    symbol = self.book.encode(coord, fine, value)
                    self.assertEqual(self.receiver.decode(0, coord, fine, symbol).value, value if fine else value // 2)

    def test_unseen_symbol_is_not_guessed(self):
        with self.assertRaises(KeyError):
            self.receiver.decode(0, 0, True, -1)

    def test_conflicting_calibration_rejected(self):
        r = app.Receiver()
        with self.assertRaises(ValueError):
            r.fit([(0, True, 7, 1), (0, True, 7, 2)])

    def test_plan_count_budget_and_unique(self):
        p = app.plans()
        self.assertEqual(len(p), 250)
        self.assertEqual(len(set(p)), 250)
        self.assertTrue(all(x.operations() <= 6 for x in p))

    def test_memory_starts_empty(self):
        self.assertEqual(app.Memory().entries, {})

    def test_familiarization_is_observed_only(self):
        env = app.Environment((7, 4095), self.book)
        memory = app.familiarize(env, self.receiver)
        self.assertEqual(set(memory.entries), {(0, c) for c in range(6)})
        self.assertEqual([memory.entries[(0, c)].value for c in range(6)], list(app.state(7)))

    def test_coarse_observation_does_not_erase_fine_memory(self):
        m = app.Memory([app.Record(0, 2, True, 3)])
        m.add(app.Record(0, 2, False, 1))
        self.assertEqual(m.reference(2), app.Record(0, 2, True, 3))

    def test_action_changes_which_observation_arrives(self):
        env = app.Environment((0, 4), self.book)
        outputs = []
        for coord in (0, 1):
            assembly, _ = app.execute(app.Plan((coord,), "now", True), 1, app.Memory(), env.observe, self.receiver)
            outputs.append(next(iter(assembly.values())).value)
        self.assertEqual(outputs, [0, 1])

    def test_unobserved_world_change_cannot_change_returned_history(self):
        results = []
        # Only coordinate 5 changes; both agents query coordinate 0 only.
        for pair in ((0, 0), (0, 1024)):
            env = app.Environment(pair, self.book)
            results.append(app.execute(app.Plan((0,), "now", True), 1, app.Memory(), env.observe, self.receiver))
        self.assertEqual(results[0], results[1])

    def test_full_record_head_matches_separate_scorer(self):
        for number in (0, 1, 19, 98, 317, 1023, 2051, 4095):
            worlds = (app.state(number), app.state(4095 - number))
            assembly = {(t, c): app.Record(t, c, True, v) for t, world in enumerate(worlds) for c, v in enumerate(world)}
            for task in range(6):
                self.assertEqual(app.response(assembly, 1, task), app.target(worlds, 1, task))

    def test_fine_and_coarse_heads_are_different(self):
        assembly = {(1, 0): app.Record(1, 0, False, 1)}
        self.assertIsNone(app.retrieve_value(assembly, 1, 0, True))
        self.assertEqual(app.retrieve_value(assembly, 1, 0, False), 1)

    def test_binding_inverse_restores_exact_assembly(self):
        a = {(t, c): app.Record(t, c, True, (c + t) % 4) for t in (0, 1) for c in range(6)}
        self.assertEqual(app.perturb(a, "binding_inverse_rescue", 1), a)
        self.assertNotEqual(app.perturb(a, "binding_permuted", 1), a)
        self.assertEqual(sorted(r.value for r in a.values()), sorted(r.value for r in app.perturb(a, "binding_permuted", 1).values()))

    def test_assembly_coarsening_preserves_original_archive(self):
        m = app.Memory([app.Record(0, 0, True, 3)])
        b = app.perturb(dict(m.entries), "assembly_coarsened", 1)
        self.assertEqual(b[(0, 0)].value, 1)
        self.assertEqual(m.reference(0).value, 3)

    def test_horizon_removes_only_past_from_assembly(self):
        a = {(t, 0): app.Record(t, 0, True, t) for t in (0, 1)}
        self.assertEqual(set(app.perturb(a, "current_only_assembly", 1)), {(1, 0)})
        self.assertEqual(len(a), 2)

    def test_time_reverse_is_involution(self):
        a = {(t, 4): app.Record(t, 4, True, t + 1) for t in (0, 1)}
        b = app.perturb(a, "time_order_reversed", 1)
        self.assertEqual(app.perturb(b, "time_order_reversed", 1), a)
        self.assertEqual(app.response(a, 1, 5), 2)
        self.assertEqual(app.response(b, 1, 5), 0)

    def test_denied_sample_does_not_call_environment(self):
        def forbidden(*args):
            raise AssertionError("Environment should not be called")
        a, costs = app.execute(app.Plan((0,), "now", True), 1, app.Memory(), forbidden, self.receiver, deny_sampling=True)
        self.assertEqual(a, {})
        self.assertEqual(costs["samples"], 0)

    def test_controller_learns_without_world_at_choice(self):
        controller, n = app.fit_controller(app.episode_pairs(self.train, 2, 73), self.book, self.receiver, self.config, time.perf_counter() + 10)
        self.assertEqual(n, 10 * 250 * 2)
        self.assertTrue(controller.learned)
        first = controller.choose(1, 0)
        self.assertEqual(first, controller.choose(1, 0))
        self.assertEqual(set(vars(controller)), {"candidates", "learned"})

    def test_empty_assembly_never_receives_hidden_target(self):
        self.assertEqual([app.response({}, 1, q) for q in range(6)], [0] * 6)


if __name__ == "__main__":
    unittest.main()
