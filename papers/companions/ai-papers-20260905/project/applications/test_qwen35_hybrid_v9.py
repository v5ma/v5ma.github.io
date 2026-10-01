import unittest
from qwen35_hybrid_v9 import (ARMS, group, groups_for, mix, score, select_authorized)
from qwen35_adapter_v9 import STATE_NAMES
from commitment_lab import CommitmentStore, Update, sign_update

class HybridTests(unittest.TestCase):
    def test_every_state_assigned_one_group(self):
        self.assertEqual({g: sum(group(n) == g for n in STATE_NAMES) for g in ('conv', 'recurrent', 'kv')},
                         {'conv': 18, 'recurrent': 18, 'kv': 12})

    def test_every_arm_retains_or_replaces_exact_objects(self):
        original = {n: object() for n in STATE_NAMES}; donor = {n: object() for n in STATE_NAMES}
        for arm in ARMS:
            selected = mix(original, donor, arm)
            for n in STATE_NAMES:
                self.assertIs(selected[n], donor[n] if group(n) in groups_for(arm) else original[n])

    def test_kv_restoration_is_not_complete_restoration(self):
        original = {n: object() for n in STATE_NAMES}; donor = {n: object() for n in STATE_NAMES}
        partial = mix(original, donor, 'conv_recurrent_donor')
        for n in STATE_NAMES:
            self.assertIs(partial[n], original[n] if group(n) == 'kv' else donor[n])

    def test_prespecified_casefold_and_preserved_exact_case(self):
        self.assertEqual(score('Green', 'green'), {'correct': True, 'exact_case_correct': False})
        self.assertFalse(score('Green.', 'green')['correct'])
        self.assertFalse(score('not green', 'green')['correct'])
        self.assertFalse(score('Emma or Liam', 'Emma')['correct'])

    def test_authority_rejects_forgery_and_replay_without_relabeling_state(self):
        store = CommitmentStore(); original = {n: object() for n in STATE_NAMES}
        donor = {n: object() for n in STATE_NAMES}; obj = 'case'
        self.assertTrue(store.accept(sign_update(1, frozenset({(obj, 'swap')}))))
        self.assertTrue(store.accept(sign_update(2, frozenset({(obj, 'stop_future_edits')}))))
        self.assertFalse(store.accept(Update(3, frozenset({(obj, 'restore_all')}), 'forged')))
        self.assertEqual(select_authorized(store, obj, original, donor)[1], 'full_donor')
        self.assertTrue(store.accept(sign_update(3, frozenset({(obj, 'restore_kv')}))))
        self.assertEqual(select_authorized(store, obj, original, donor)[1], 'conv_recurrent_donor')
        self.assertTrue(store.accept(sign_update(4, frozenset({(obj, 'restore_all')}))))
        self.assertFalse(store.accept(sign_update(2, frozenset({(obj, 'stop_future_edits')}))))
        self.assertEqual(select_authorized(store, obj, original, donor)[1], 'original')

    def test_wrong_object_scope_rejected(self):
        store = CommitmentStore()
        self.assertTrue(store.accept(sign_update(1, frozenset({('other', 'swap')}))))
        with self.assertRaises(AssertionError):
            select_authorized(store, 'case', {}, {})

if __name__ == '__main__':
    unittest.main()
