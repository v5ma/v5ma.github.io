import Std

/-
M7a: observation-history equivalence. M7b is in MetricBound.lean.
M8: explicit retained/episode-state reset contract.
The interfaces are mathematical assumptions, not a refinement of Python or
a description of measured fly physiology. No biological conclusion follows.
-/
namespace SANFly

structure Controller (S O P A B : Type) where
  observe : S → O → P
  policy : P → A
  advance : P → A → B → S

def stateAt {S O P A B : Type} (c : Controller S O P A B)
    (initial : S) (observations : Nat → O) (returns : Nat → B) : Nat → S
  | 0 => initial
  | t + 1 =>
      let p := c.observe (stateAt c initial observations returns t) (observations t)
      c.advance p (c.policy p) (returns t)

def postAt {S O P A B : Type} (c : Controller S O P A B)
    (initial : S) (observations : Nat → O) (returns : Nat → B) (t : Nat) : P :=
  c.observe (stateAt c initial observations returns t) (observations t)

def actionAt {S O P A B : Type} (c : Controller S O P A B)
    (initial : S) (observations : Nat → O) (returns : Nat → B) (t : Nat) : A :=
  c.policy (postAt c initial observations returns t)

theorem stateAt_eq_of_history {S O P A B : Type} (c : Controller S O P A B)
    (initialA initialB : S) (obsA obsB : Nat → O) (retA retB : Nat → B)
    (hinit : initialA = initialB) :
    ∀ n, (∀ t, t < n → obsA t = obsB t) →
      (∀ t, t < n → retA t = retB t) →
      stateAt c initialA obsA retA n = stateAt c initialB obsB retB n := by
  intro n
  induction n with
  | zero =>
      intro _ _
      exact hinit
  | succ n ih =>
      intro ho hb
      have hs := ih
        (fun t ht => ho t (Nat.lt_trans ht (Nat.lt_succ_self n)))
        (fun t ht => hb t (Nat.lt_trans ht (Nat.lt_succ_self n)))
      simp only [stateAt]
      rw [hs, ho n (Nat.lt_succ_self n), hb n (Nat.lt_succ_self n)]

theorem history_equivalence {S O P A B : Type} (c : Controller S O P A B)
    (initialA initialB : S) (obsA obsB : Nat → O) (retA retB : Nat → B)
    (hinit : initialA = initialB) (T : Nat)
    (ho : ∀ t, t < T → obsA t = obsB t)
    (hb : ∀ t, t < T → retA t = retB t) :
    ∀ t, t < T →
      postAt c initialA obsA retA t = postAt c initialB obsB retB t ∧
      actionAt c initialA obsA retA t = actionAt c initialB obsB retB t ∧
      stateAt c initialA obsA retA (t + 1) = stateAt c initialB obsB retB (t + 1) := by
  intro t ht
  have hs := stateAt_eq_of_history c initialA initialB obsA obsB retA retB hinit t
    (fun q hq => ho q (Nat.lt_trans hq ht))
    (fun q hq => hb q (Nat.lt_trans hq ht))
  have hp : postAt c initialA obsA retA t = postAt c initialB obsB retB t := by
    unfold postAt
    rw [hs, ho t ht]
  refine ⟨hp, ?_, ?_⟩
  · unfold actionAt
    rw [hp]
  · exact stateAt_eq_of_history c initialA initialB obsA obsB retA retB hinit (t + 1)
      (fun q hq => ho q (Nat.lt_of_le_of_lt (Nat.lt_succ_iff.mp hq) ht))
      (fun q hq => hb q (Nat.lt_of_le_of_lt (Nat.lt_succ_iff.mp hq) ht))

theorem decoded_state_eq {S O P A B Z : Type} (c : Controller S O P A B)
    (decode : S → Z) (initialA initialB : S)
    (obsA obsB : Nat → O) (retA retB : Nat → B)
    (hinit : initialA = initialB) (n : Nat)
    (ho : ∀ t, t < n → obsA t = obsB t)
    (hb : ∀ t, t < n → retA t = retB t) :
    decode (stateAt c initialA obsA retA n) =
      decode (stateAt c initialB obsB retB n) := by
  exact congrArg decode (stateAt_eq_of_history c initialA initialB obsA obsB retA retB hinit n ho hb)

/- The reset contract makes both storage ownership and its limitation explicit.
   A learned update below depends on retained state and the declared body return,
   not on transient episode state. Commutation requires precisely that form. -/
structure Memory (L E : Type) where
  learned : L
  episode : E

def resetEpisode {L E : Type} (cleared : E) (m : Memory L E) : Memory L E :=
  { learned := m.learned, episode := cleared }

def updateLearned {L E B : Type} (update : L → B → L) (bodyReturn : B)
    (m : Memory L E) : Memory L E :=
  { learned := update m.learned bodyReturn, episode := m.episode }

theorem reset_preserves_learned {L E : Type} (cleared : E) (m : Memory L E) :
    (resetEpisode cleared m).learned = m.learned := by
  rfl

theorem reset_is_idempotent {L E : Type} (cleared : E) (m : Memory L E) :
    resetEpisode cleared (resetEpisode cleared m) = resetEpisode cleared m := by
  rfl

theorem reset_update_commute {L E B : Type} (cleared : E) (m : Memory L E)
    (update : L → B → L) (bodyReturn : B) :
    resetEpisode cleared (updateLearned update bodyReturn m) =
      updateLearned update bodyReturn (resetEpisode cleared m) := by
  rfl

theorem reset_preserves_retained_prediction {L E C R : Type} (cleared : E)
    (m : Memory L E) (predict : L → C → R) (command : C) :
    predict (resetEpisode cleared m).learned command = predict m.learned command := by
  rfl

#print axioms stateAt_eq_of_history
#print axioms history_equivalence
#print axioms decoded_state_eq
#print axioms reset_preserves_learned
#print axioms reset_is_idempotent
#print axioms reset_update_commute
#print axioms reset_preserves_retained_prediction

end SANFly
