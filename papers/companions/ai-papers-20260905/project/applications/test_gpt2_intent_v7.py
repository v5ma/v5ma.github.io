import unittest
from gpt2_intent_v7 import np, reflection, select, authority, outcome, ARMS
from gpt2_learning_v6 import edit

class IntentControls(unittest.TestCase):
    def setUp(self):
        rng = np.random.default_rng(7)
        q, _ = np.linalg.qr(rng.normal(size=(768, 4)))
        self.basis = {'R': q.T, 'mean': rng.normal(size=768), 'scale': np.arange(1., 5.), 'cap': np.array(10000.)}
        self.h = rng.normal(size=(1, 1, 768)).astype(np.float32)
        self.case = {'id': 'unit', 'family': 'unit', 'giver': 'A', 'recipient': 'B', 'color': 'red', 'query': 'recipient'}

    def test_double_reflection(self):
        value, _, _ = reflection(self.h, self.basis)
        twice, _, _ = reflection(value, self.basis)
        np.testing.assert_allclose(twice, self.h, atol=1e-6)

    def test_orthogonal_complement(self):
        value, _, _ = reflection(self.h, self.basis)
        delta = (value-self.h).reshape(768)
        projected = self.basis['R'].T @ (self.basis['R'] @ delta)
        np.testing.assert_allclose(projected, delta, atol=1e-6)

    def test_known_affine_special_case(self):
        B = np.zeros((4,5)); B[:,:4] = -2*np.eye(4)
        value, _, _ = edit(self.h, B, self.basis)
        reflected, _, _ = reflection(self.h, self.basis)
        np.testing.assert_allclose(value, reflected, atol=1e-6)

    def test_cap_breaks_involution(self):
        basis = {'R': np.eye(768)[:4], 'mean': np.zeros(768), 'cap': np.array(1.)}
        h = np.zeros((1,1,768), dtype=np.float32); h[0,0,0] = 10
        value, _, capped = reflection(h, basis, True)
        twice, _, _ = reflection(value, basis, True)
        self.assertEqual(capped, 1)
        self.assertEqual(float(twice[0,0,0]), 8.)

    def test_intent_aware_keep_and_swap(self):
        for arm in ('d6_internal', 'd6_task', 'd6_yoked', 'd6_ridge', 'reflection', 'reflection_capped'):
            self.assertEqual(select(arm, 'keep'), 'none')
            self.assertEqual(select(arm, 'swap'), arm)
            self.assertEqual(select(arm, 'none'), 'none')

    def test_intent_controls_are_distinct(self):
        self.assertEqual(select('intent_blind_reflection', 'keep'), 'reflection')
        self.assertEqual(select('wrong_intent_reflection', 'keep'), 'reflection')
        self.assertEqual(select('wrong_intent_reflection', 'swap'), 'none')
        self.assertEqual(select('revoked_reflection', 'swap'), 'none')

    def test_actual_authority_transitions(self):
        for intent in ('keep', 'swap'):
            operation, revoked, rows = authority(self.case, intent)
            self.assertEqual(operation, intent); self.assertEqual(revoked, 'none')
            self.assertEqual([r['accepted'] for r in rows], [1,0,1,0])
            self.assertEqual([r['store_revision'] for r in rows], [1,1,2,2])

    def test_role_and_intent_targets(self):
        row = {'id': 'unit/none', 'word_a': 'A', 'word_b': 'B', 'word_a_id': 1, 'word_b_id': 2,
               'top_id': 1, 'top_text': ' A', 'word_a_probability': .6, 'word_b_probability': .2,
               'word_a_logit': 3., 'word_b_logit': 2., 'edit_norm': 0., 'capped': 0}
        keep = outcome(self.case, 'keep', 'no_edit', row)
        swap = outcome(self.case, 'swap', 'no_edit', row)
        self.assertEqual((keep['correct'], swap['correct']), (0,1))
        self.assertEqual((keep['prohibited_proposal'], swap['useful_execution']), (1,1))
        self.assertEqual(keep['unauthorized_execution'] + swap['unauthorized_execution'], 0)

    def test_color_is_not_an_action_or_swapped_target(self):
        case = {**self.case, 'query': 'color'}
        row = {'id': 'unit/none', 'word_a': 'red', 'word_b': 'blue', 'word_a_id': 3, 'word_b_id': 4,
               'top_id': 3, 'top_text': ' red', 'word_a_probability': .8, 'word_b_probability': .1,
               'word_a_logit': 4., 'word_b_logit': 1., 'edit_norm': 2., 'capped': 0}
        for intent in ('keep', 'swap'):
            result = outcome(case, intent, 'reflection', row)
            self.assertEqual(result['expected'], 'red')
            self.assertEqual(result['correct'], 1)
            self.assertEqual(result['useful_execution'], 0)

if __name__ == '__main__':
    unittest.main()
