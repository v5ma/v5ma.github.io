import Std

/-!
Bounded model of authority-preserving composition, not a theorem of ethical alignment.
All consequential actions must pass this reference monitor. Authentication, atomicity,
correct action identifiers and the meaning of an allowed action are assumptions.
-/
namespace SAN.CoreAlignment

abbrev Policy (Action : Type) := Action → Prop

def descend {Action : Type} (root : Policy Action) : List (Policy Action) → Policy Action
  | [] => root
  | requested :: tail => descend (fun a => root a ∧ requested a) tail

theorem arbitrary_depth_attenuation {Action : Type} (root : Policy Action)
    (path : List (Policy Action)) (a : Action)
    (h : descend root path a) : root a := by
  induction path generalizing root with
  | nil => exact h
  | cons requested tail ih =>
      exact (ih (fun x => root x ∧ requested x) h).1

structure State (Action : Type) where
  revision : Nat
  allow : Policy Action

def MayCommit {Action : Type} (s : State Action) (revision : Nat)
    (delegated : Policy Action) (a : Action) : Prop :=
  revision = s.revision ∧ s.allow a ∧ delegated a

theorem commit_preserves_current_authority {Action : Type} (s : State Action)
    (revision : Nat) (delegated : Policy Action) (a : Action)
    (h : MayCommit s revision delegated a) : s.allow a := h.2.1

theorem revoked_action_cannot_commit {Action : Type} (s : State Action)
    (revision : Nat) (delegated : Policy Action) (a : Action) (revoked : ¬s.allow a) :
    ¬MayCommit s revision delegated a := by
  intro h
  exact revoked h.2.1

theorem stale_revision_cannot_commit {Action : Type} (s : State Action)
    (revision : Nat) (delegated : Policy Action) (a : Action)
    (stale : revision ≠ s.revision) : ¬MayCommit s revision delegated a := by
  intro h
  exact stale h.1

def update {Action : Type} (s proposed : State Action) (authenticated : Bool) : State Action :=
  if authenticated = true ∧ s.revision < proposed.revision then proposed else s

theorem untrusted_update_is_identity {Action : Type} (s proposed : State Action) :
    update s proposed false = s := by simp [update]

def untrustedSequence {Action : Type} (s : State Action) : List (State Action) → State Action
  | [] => s
  | p :: ps => untrustedSequence (update s p false) ps

theorem arbitrary_untrusted_sequence_preserves_state {Action : Type}
    (s : State Action) (messages : List (State Action)) :
    untrustedSequence s messages = s := by
  induction messages with
  | nil => rfl
  | cons p ps ih => simpa [untrustedSequence, untrusted_update_is_identity] using ih

/- The proposer can be any function of any learned internal state. The result does
   not depend on its capacity, training algorithm or whether its intent is benign. -/
theorem arbitrary_proposer_composition {Action Internal : Type}
    (propose : Internal → Nat × Action) (internal : Internal) (s : State Action)
    (cachedRoot : Policy Action) (path : List (Policy Action))
    (h : MayCommit s (propose internal).1 (descend cachedRoot path) (propose internal).2) :
    s.allow (propose internal).2 ∧ cachedRoot (propose internal).2 := by
  exact ⟨h.2.1, arbitrary_depth_attenuation cachedRoot path (propose internal).2 h.2.2⟩

/- Local permission labels require a sound map back to the action namespace.
   This is an explicit obligation, not a proof that natural language has been understood. -/
theorem sound_translation_preserves_authority {Local Root : Type}
    (meaning : Local → Root) (localPermit : Local → Prop) (rootPermit : Root → Prop)
    (sound : ∀ x, localPermit x → rootPermit (meaning x))
    (x : Local) (allowed : localPermit x) : rootPermit (meaning x) := sound x allowed

#print axioms arbitrary_depth_attenuation
#print axioms commit_preserves_current_authority
#print axioms revoked_action_cannot_commit
#print axioms stale_revision_cannot_commit
#print axioms untrusted_update_is_identity
#print axioms arbitrary_untrusted_sequence_preserves_state
#print axioms arbitrary_proposer_composition
#print axioms sound_translation_preserves_authority
end SAN.CoreAlignment
