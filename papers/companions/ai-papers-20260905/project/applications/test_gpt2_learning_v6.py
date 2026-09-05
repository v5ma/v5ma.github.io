import unittest
from gpt2_learning_v6 import Controller,envelope,digest,edit,np,constrain

class LearnedCorrectionTests(unittest.TestCase):
    def test_signed_feedback_changes_a_real_parameter(self):
        learner=Controller();message=envelope(learner,0,3,0,-1)
        self.assertTrue(learner.receive(message));self.assertEqual(learner.weights.flat[3],0.5)

    def test_signature_tamper_and_replay(self):
        learner=Controller();message=envelope(learner,0,3,0,-1)
        forged=dict(message,plus=1.0)
        self.assertFalse(learner.receive(forged));self.assertEqual(np.linalg.norm(learner.weights),0)
        self.assertTrue(learner.receive(message));before=digest(learner.weights)
        self.assertFalse(learner.receive(message));self.assertEqual(before,digest(learner.weights))

    def test_measurement_bound_to_parameter_source(self):
        learner=Controller();old=envelope(learner,2,3,0,-1)
        self.assertTrue(learner.receive(envelope(learner,0,4,0,-1)))
        self.assertFalse(learner.receive(old))

    def test_finite_coordinate_and_step_schema(self):
        for key,value in (("coordinate",20),("coordinate",True),("step",-1),("plus",float("nan")),("minus",float("inf"))):
            learner=Controller();message=envelope(learner,0,1,0,-1);message[key]=value
            self.assertFalse(learner.receive(message));self.assertEqual(np.linalg.norm(learner.weights),0)

    def test_equal_feedback_means_no_update(self):
        learner=Controller();self.assertTrue(learner.receive(envelope(learner,0,0,0,0)))
        self.assertEqual(np.linalg.norm(learner.weights),0)

    def test_signature_disabled_is_live_negative_control(self):
        learner=Controller(verify=False)
        self.assertTrue(learner.receive(envelope(learner,0,0,0,-1,sign=False)))
        self.assertEqual(learner.weights.flat[0],0.5)

    def test_parameter_and_edit_caps(self):
        self.assertAlmostEqual(float(np.linalg.norm(constrain(np.ones((4,5))*100))),4.0)
        basis=dict(R=np.eye(4,768),mean=np.zeros(768),scale=np.ones(4),cap=np.array(2.0))
        h=np.ones((1,1,768),dtype=np.float32)
        result,norm,capped=edit(h,np.ones((4,5))*100,basis)
        self.assertTrue(capped);self.assertLessEqual(norm,2.00001)
        zero,_,_=edit(h,np.zeros((4,5)),basis);np.testing.assert_array_equal(zero,h)

    def test_uncapped_reft_affine_identity(self):
        rng=np.random.default_rng(6)
        R=np.linalg.qr(rng.normal(size=(768,4)))[0].T
        B=rng.normal(size=(4,5))*.01;mu=rng.normal(size=768);s=np.arange(1,5)
        h=rng.normal(size=768)
        W=R+np.diag(s)@B[:,:4]@np.diag(1/s)@R
        b=s*B[:,4]-(W-R)@mu
        left=h+R.T@(s*(B@np.append(R@(h-mu)/s,1)))
        right=h+R.T@(W@h+b-R@h)
        np.testing.assert_allclose(left,right,rtol=0,atol=1e-12)

if __name__=="__main__":unittest.main()
