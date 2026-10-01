import unittest
from gpt2_continuation_v8 import np, restore, cache_hash, target, select_resume, suffix
from commitment_lab import CommitmentStore, Update, sign_update

class ContinuationTests(unittest.TestCase):
    def setUp(self):
        self.base=[np.zeros((1,12,2,64),dtype=np.float32) for _ in range(24)]
        self.edited=[v.copy() for v in self.base]
        for i in range(18,24):self.edited[i][:,:,-1,:]=i+1
        self.case={'giver':'William','recipient':'Elizabeth','color':'red'}

    def test_upper_restore_matches_base(self):
        self.assertEqual(cache_hash(restore(self.edited,self.base,True)),cache_hash(self.base))

    def test_lower_restore_is_negative_control(self):
        self.assertEqual(cache_hash(restore(self.edited,self.base,False)),cache_hash(self.edited))

    def test_original_inputs_not_mutated(self):
        before=(cache_hash(self.base),cache_hash(self.edited))
        restore(self.edited,self.base,True);restore(self.edited,self.base,False)
        self.assertEqual(before,(cache_hash(self.base),cache_hash(self.edited)))

    def test_cache_digest_binds_position(self):
        reordered=[v[:,:,::-1,:].copy() for v in self.edited]
        self.assertNotEqual(cache_hash(reordered),cache_hash(self.edited))

    def test_role_targets_are_opposite(self):
        self.assertEqual(target(self.case,'initial_recipient',True),'William')
        self.assertEqual(target(self.case,'later_giver',True),'Elizabeth')
        self.assertEqual(target(self.case,'initial_recipient',False),'Elizabeth')
        self.assertEqual(target(self.case,'later_giver',False),'William')

    def test_color_unaffected_target(self):
        for swapped in (False,True):self.assertEqual(target(self.case,'later_color',swapped),'red')

    def test_stop_is_not_restore(self):
        store=CommitmentStore()
        self.assertTrue(store.accept(sign_update(2,frozenset({('c','stop_future_edits')}))))
        chosen,label=select_resume(store,'c',self.edited,self.base)
        self.assertIs(chosen,self.edited);self.assertEqual(label,'edited_no_new_patch')
        self.assertTrue(store.accept(sign_update(3,frozenset({('c','restore_original')}))))
        chosen,label=select_resume(store,'c',self.edited,self.base)
        self.assertIs(chosen,self.base);self.assertEqual(label,'original')

    def test_forgery_and_replay_preserve_current_request(self):
        store=CommitmentStore();stop=sign_update(2,frozenset({('c','stop_future_edits')}))
        self.assertTrue(store.accept(stop))
        self.assertFalse(store.accept(Update(3,frozenset({('c','restore_original')}),'forged')))
        self.assertEqual(select_resume(store,'c',self.edited,self.base)[1],'edited_no_new_patch')
        self.assertTrue(store.accept(sign_update(3,frozenset({('c','restore_original')}))))
        self.assertFalse(store.accept(stop));self.assertEqual(select_resume(store,'c',self.edited,self.base)[1],'original')

    def test_missing_resume_authority_rejected(self):
        with self.assertRaises(ValueError):select_resume(CommitmentStore(),'c',self.edited,self.base)

    def test_suffix_has_no_patch_argument(self):
        class Instrument:
            def __init__(self):self.calls=[]
            def step(inner,token,cache):
                inner.calls.append(token)
                return {'cache':[np.concatenate((v,np.zeros((1,12,1,64),dtype=np.float32)),axis=2) for v in cache]}
        decoder=Instrument();before=cache_hash(self.edited)
        result=suffix(decoder,self.edited,[4,5,6])
        self.assertEqual(decoder.calls,[4,5,6]);self.assertEqual(before,cache_hash(self.edited))
        self.assertEqual(result['cache'][0].shape[2],5)

if __name__=='__main__':unittest.main()
