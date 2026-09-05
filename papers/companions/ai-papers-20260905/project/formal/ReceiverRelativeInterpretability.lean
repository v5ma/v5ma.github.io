import Std

/-!
Finite causal countermodels and a feedback-observer equivalence theorem.
These do not prove biological mechanisms, conscious access or a novel MI algorithm.
-/
namespace SAN.Interpretability

def mediated (_latent : Bool) (measured : Bool) : Bool := measured
def commonCause (latent : Bool) (_measured : Bool) : Bool := latent

/- On the observational support measured = latent, both mechanisms agree exactly. -/
theorem observational_equivalence :
    ∀ z : Bool, mediated z z = commonCause z z := by intro z; rfl

/- An intervention separates them. A perfect observation-only decoder cannot
   choose the correct causal mechanism from this observational support alone. -/
theorem intervention_separates :
    mediated false true ≠ commonCause false true := by decide

theorem observational_agreement_does_not_entail_causal_agreement :
    ¬ ((∀ z : Bool, mediated z z = commonCause z z) →
       (∀ z x : Bool, mediated z x = commonCause z x)) := by
  intro implication
  exact intervention_separates (implication observational_equivalence false true)

def receive (gate signal : Bool) : Bool := gate && signal

theorem closed_receiver_erases_signal :
    ∀ signal : Bool, receive false signal = false := by intro signal; rfl

theorem open_receiver_preserves_signal :
    ∀ signal : Bool, receive true signal = signal := by intro signal; rfl

/- A signal-only decoder cannot reproduce the outputs of both receiver contexts. -/
theorem no_universal_signal_only_decoder :
    ¬ ∃ decoder : Bool → Bool, ∀ gate signal : Bool,
      decoder signal = receive gate signal := by
  rintro ⟨decoder, correct⟩
  have closed := correct false true
  have opened := correct true true
  have impossible : (false : Bool) = true := closed.symm.trans opened
  cases impossible

/- A policy sees only the feedback transcript; it has no privileged hidden input.
   The environment may depend on the whole transcript and proposed action. -/
def interact {Feedback Action : Type}
    (policy : List Feedback → Action)
    (environment : List Feedback → Action → Feedback)
    (steps : Nat) (history : List Feedback) : List Feedback :=
  match steps with
  | 0 => history
  | n + 1 => interact policy environment n
      (history ++ [environment history (policy history)])

theorem identical_transcript_policies_have_identical_feedback
    {Feedback Action : Type}
    (inside outside : List Feedback → Action)
    (environment : List Feedback → Action → Feedback)
    (sameRule : ∀ history, inside history = outside history)
    (steps : Nat) (history : List Feedback) :
    interact inside environment steps history = interact outside environment steps history := by
  induction steps generalizing history with
  | zero => rfl
  | succ n ih =>
      simp only [interact, sameRule]
      exact ih _

/- Corrected context matters: these are possibility/countermodel results. They
   do not assert that every real model is context-gated or externally reproducible. -/
#print axioms observational_equivalence
#print axioms intervention_separates
#print axioms observational_agreement_does_not_entail_causal_agreement
#print axioms closed_receiver_erases_signal
#print axioms open_receiver_preserves_signal
#print axioms no_universal_signal_only_decoder
#print axioms identical_transcript_policies_have_identical_feedback
end SAN.Interpretability
