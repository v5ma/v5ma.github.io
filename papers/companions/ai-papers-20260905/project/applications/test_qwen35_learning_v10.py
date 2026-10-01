"""Fast construction tests; no model inference and no scientific acceptance claim."""
import unittest
import inspect
from qwen35_learning_v10 import (np, MODEL, Tokenizer, json, PROTOCOL, KV, WINDOW,
    build_cases, extract, replace_window, squared_distances, fit_arrays, predict_window)
from qwen35_adapter_v9 import empty_state, STATE_NAMES, state_digest

class LearningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.protocol = json.loads(PROTOCOL.read_text())
        cls.tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))

    def test_fixed_splits_and_counts(self):
        train = build_cases(self.protocol, 'train', self.tokenizer)
        test = build_cases(self.protocol, 'test', self.tokenizer)
        self.assertEqual((len(train), len(test)), (24, 16))
        self.assertTrue(set(n for c in train for n in c['names']).isdisjoint(n for c in test for n in c['names']))

    def test_same_query_free_prefix_and_role_positions(self):
        for split in ('train', 'test'):
            cases = build_cases(self.protocol, split, self.tokenizer)
            lookup = {c['id']: c for c in cases}
            for c in cases:
                self.assertEqual(c['branches'], lookup[c['opposite']]['branches'])
                self.assertEqual(len(c['prefix_ids'])-c['window_start'], WINDOW)
                self.assertEqual(c['name_positions'][1]-c['name_positions'][0], 6)

    def test_slot_roundtrip_and_unmodified_state(self):
        original = empty_state()
        for name in KV:
            original[name] = np.arange(1*2*14*256, dtype=np.float32).reshape(1,2,14,256)
        before = state_digest(original)
        window = extract(original, 5)
        self.assertEqual(window.shape, (12,9,512))
        restored = replace_window(original, 5, window)
        self.assertEqual(state_digest(restored), before)
        changed = replace_window(original, 5, window+1)
        self.assertEqual(state_digest(original), before)
        for name in STATE_NAMES:
            if name in KV:
                self.assertTrue(np.array_equal(changed[name][:,:,:5], original[name][:,:,:5]))
            else:
                self.assertIs(changed[name], original[name])

    def test_kernel_distance(self):
        a = np.asarray([[1.,2.,3.],[4.,5.,6.]])
        dist = squared_distances(a,a)
        self.assertTrue(np.allclose(dist, [[0,9],[9,0]]))

    def test_policy_receives_no_donor_case_query_or_target(self):
        self.assertEqual(list(inspect.signature(predict_window).parameters), ['model','window','arm'])

    def test_two_kernels_and_label_control(self):
        rng = np.random.Generator(np.random.PCG64(7))
        raw = rng.normal(size=(4,12,9,512)).astype(np.float32)
        model, stats = fit_arrays(raw, [1,0,3,2], [2,0,1,3])
        self.assertLess(stats['raw_mean_delta_norm'], 1e-10)
        for arm in ('linear_ridge','rbf_ridge','yoked_ridge'):
            prediction, detail = predict_window(model, raw[0], arm)
            self.assertEqual(prediction.shape, raw[0].shape)
            self.assertTrue(np.isfinite(prediction).all())
            self.assertGreater(detail['cap_multiplier'],0)
        linear,_ = predict_window(model,raw[0],'linear_ridge')
        rbf,_ = predict_window(model,raw[0],'rbf_ridge')
        self.assertLess(float(np.mean((linear-raw[1])**2)),0.001)
        self.assertLess(float(np.mean((rbf-raw[1])**2)),0.001)

    def test_cap_applies_to_all_learners(self):
        rng = np.random.Generator(np.random.PCG64(8))
        raw = rng.normal(size=(4,12,9,512)).astype(np.float32)
        model,_ = fit_arrays(raw,[1,0,3,2],[2,0,1,3])
        model['cap'] = np.asarray(0.1)
        for arm in ('linear_ridge','rbf_ridge','yoked_ridge'):
            predicted, detail = predict_window(model,raw[0],arm)
            self.assertLess(detail['cap_multiplier'],1)
            scale = np.repeat(model['scales'],9*512)
            norm = np.linalg.norm((predicted.reshape(-1)-raw[0].reshape(-1))/scale)
            self.assertLess(abs(float(norm)-0.1),1e-4)

    def test_protocol_adequacy_and_output_rules_predeclared(self):
        self.assertEqual(self.protocol['evaluation']['primary_answers'],384)
        self.assertIn('14/16',self.protocol['evaluation']['baseline_gate'])
        self.assertIn('casefold',self.protocol['evaluation']['primary_scoring'])

if __name__ == '__main__':
    unittest.main()
