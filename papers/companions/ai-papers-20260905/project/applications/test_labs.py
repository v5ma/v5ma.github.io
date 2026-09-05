import itertools
import unittest
import numpy as np
from commitment_lab import CommitmentStore, Proposal, Update, delegate, sign_update, run_condition
from causal_lab import Network, sigmoid, worlds


class CommitmentTests(unittest.TestCase):
    def test_forgery_and_replay_rejected(self):
        s=CommitmentStore(); scope=frozenset({("A","export")})
        self.assertFalse(s.accept(Update(0,scope,"forged")))
        self.assertTrue(s.accept(sign_update(0,scope)))
        self.assertFalse(s.accept(sign_update(0,scope)))

    def test_signed_body_cannot_be_changed(self):
        good=sign_update(0,frozenset({("A","export")}))
        altered=Update(0,frozenset({("B","export")}),good.signature)
        self.assertFalse(CommitmentStore().accept(altered))

    def test_revocation_rejects_old_proposal(self):
        s=CommitmentStore(); a=frozenset({("A","export")})
        s.accept(sign_update(0,a)); p=Proposal(0,("A","export"),a)
        self.assertTrue(s.commit(p)); s.accept(sign_update(1,frozenset()))
        self.assertFalse(s.commit(p))

    def test_stale_proposal_rejected_even_if_scope_unchanged(self):
        s=CommitmentStore(); a=frozenset({("A","export")})
        s.accept(sign_update(0,a)); s.accept(sign_update(1,a))
        self.assertFalse(s.commit(Proposal(0,("A","export"),a)))

    def test_all_finite_delegation_masks(self):
        universe=frozenset((str(i),"export") for i in range(4))
        masks=[frozenset(a for i,a in enumerate(sorted(universe)) if n>>i&1) for n in range(16)]
        for root,a,b in itertools.product(masks,repeat=3):
            self.assertLessEqual(delegate(delegate(root,a),b),root)

    def test_trivial_safety_and_real_use_are_separate(self):
        deny,_=run_condition(17,32,4,"deny_all")
        safe,_=run_condition(17,32,4,"propagated_gate")
        final,_=run_condition(17,32,4,"final_gate")
        bad,_=run_condition(17,32,4,"text_only")
        self.assertEqual(deny["useful_executions"],0)
        self.assertGreater(safe["useful_executions"],0)
        self.assertEqual(safe["unauthorized_executions"],0)
        self.assertEqual(final["unauthorized_executions"],0)
        self.assertGreater(bad["unauthorized_executions"],0)


class CausalTests(unittest.TestCase):
    def test_world_target_binding(self):
        x,y,g=worlds()
        self.assertEqual(x.shape,(256,8))
        self.assertEqual(int(y.sum()),32)
        self.assertEqual(set(g),{-1.0,1.0})

    def test_jacobian_matches_numerical_derivative(self):
        net=Network(7); h=np.random.default_rng(8).normal(size=(5,24))*.1
        grad=net.gradient(h)
        for j in range(24):
            d=np.zeros_like(h);d[:,j]=1e-5
            measured=(net.tail(h+d)-net.tail(h-d))/(2e-5)
            np.testing.assert_allclose(measured,grad[:,j],atol=1e-8,rtol=1e-6)

    def test_route_lesion_removes_only_unit_influence(self):
        net=Network(9); h=np.zeros((1,24));d=h.copy();d[0,3]=.8
        w=net.p["w2"].copy();w[3]=0
        np.testing.assert_allclose(net.tail(h+d,w),net.tail(h,w),atol=1e-12)
        self.assertGreater(abs(float(net.tail(h+d)[0]-net.tail(h)[0])),1e-5)

    def test_training_reduces_loss(self):
        net=Network(11);x,y,_=worlds();x=np.column_stack((x,np.zeros((256,2))))
        def loss():
            p=sigmoid(net.tail(net.hidden(x)))
            return float((-y*np.log(p)-(1-y)*np.log(1-p)).mean())
        initial=loss(); net.train(x,y,100,.015,10)
        self.assertLess(loss(),initial*.8)


if __name__=="__main__":
    unittest.main()
