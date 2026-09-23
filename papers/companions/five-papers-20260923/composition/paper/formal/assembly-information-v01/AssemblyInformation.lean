import Std

/-
NRCT mathematical supplement, 2026-09-08.
Only deterministic representation/readout statements and a finite toy decoder
are formalized. No neuron, experience, Python implementation, optimization
procedure, or biological measurement is defined here.
-/

set_option autoImplicit false
set_option maxHeartbeats 400000

namespace NRCT

universe u v w a l

def ImageOf {S : Type u} {Z : Type v} (r : S → Z) :=
  { z : Z // ∃ s : S, r s = z }

def observed {S : Type u} {Z : Type v} (r : S → Z) (s : S) : ImageOf r :=
  ⟨r s, s, rfl⟩

def FiberConstant {S : Type u} {Z : Type v} {A : Type a}
    (q : S → A) (r : S → Z) : Prop :=
  ∀ s t : S, r s = r t → q s = q t

def ExactOnImage {S : Type u} {Z : Type v} {A : Type a}
    (q : S → A) (r : S → Z) : Prop :=
  ∃ d : ImageOf r → A, ∀ s : S, d (observed r s) = q s

/-- Proposition 1, strengthened to arbitrary types, including empty S. -/
theorem exact_iff_fiber_constant {S : Type u} {Z : Type v} {A : Type a}
    (q : S → A) (r : S → Z) :
    ExactOnImage q r ↔ FiberConstant q r := by
  constructor
  · rintro ⟨d, hd⟩ s t h
    calc
      q s = d (observed r s) := (hd s).symm
      _ = d (observed r t) := congrArg d (Subtype.ext h)
      _ = q t := hd t
  · intro h
    classical
    let d : ImageOf r → A := fun z => q (Classical.choose z.property)
    refine ⟨d, ?_⟩
    intro s
    apply h
    exact Classical.choose_spec (observed r s).property

/-- One collision between differently labeled targets rules out every exact decoder. -/
theorem collision_prevents_exact {S : Type u} {Z : Type v} {A : Type a}
    (q : S → A) (r : S → Z) (s t : S)
    (same : r s = r t) (different : q s ≠ q t) :
    ¬ ExactOnImage q r := by
  intro h
  exact different ((exact_iff_fiber_constant q r).mp h s t same)

/-- A concrete decoder must err on at least one of such a pair. -/
theorem collision_forces_one_error {S : Type u} {Z : Type v} {A : Type a}
    (q : S → A) (r : S → Z) (d : Z → A) (s t : S)
    (same : r s = r t) (different : q s ≠ q t) :
    d (r s) ≠ q s ∨ d (r t) ≠ q t := by
  classical
  by_cases hs : d (r s) = q s
  · right
    intro ht
    exact different (hs.symm.trans ((congrArg d same).trans ht))
  · exact Or.inl hs

/-- Simulation lemma underlying Proposition 2. It is not a learned decoder claim. -/
theorem refinement_simulates {S : Type u} {F : Type v} {C : Type w} {A : Type a}
    (rf : S → F) (rc : S → C) (h : F → C)
    (coarsening : ∀ s : S, rc s = h (rf s)) (dc : C → A) :
    ∃ df : F → A, ∀ s : S, df (rf s) = dc (rc s) := by
  refine ⟨fun f => dc (h f), ?_⟩
  intro s
  exact congrArg dc (coarsening s).symm

/-- Risk is any common functional of predictions. Attainment is an explicit premise. -/
theorem refinement_risk_of_attained_minimum
    {S : Type u} {F : Type v} {C : Type w} {A : Type a} {L : Type l} [LE L]
    (rf : S → F) (rc : S → C) (h : F → C)
    (coarsening : ∀ s : S, rc s = h (rf s))
    (risk : (S → A) → L) (dfBest : F → A)
    (fineMinimum : ∀ df : F → A,
      risk (fun s => dfBest (rf s)) ≤ risk (fun s => df (rf s)))
    (dc : C → A) :
    risk (fun s => dfBest (rf s)) ≤ risk (fun s => dc (rc s)) := by
  have equalPredictions :
      (fun s => dc (h (rf s))) = (fun s => dc (rc s)) := by
    funext s
    exact congrArg dc (coarsening s).symm
  have result := fineMinimum (fun f => dc (h f))
  rw [equalPredictions] at result
  exact result

/-- An invertible recoding cannot change which state pairs are merged. -/
theorem left_inverse_preserves_fibers {S : Type u} {Z : Type v} {W : Type w}
    (r : S → Z) (encode : Z → W) (undo : W → Z)
    (leftInverse : ∀ z : Z, undo (encode z) = z) (s t : S) :
    encode (r s) = encode (r t) ↔ r s = r t := by
  constructor
  · intro h
    calc
      r s = undo (encode (r s)) := (leftInverse (r s)).symm
      _ = undo (encode (r t)) := congrArg undo h
      _ = r t := leftInverse (r t)
  · exact congrArg encode

theorem left_inverse_preserves_exact_access
    {S : Type u} {Z : Type v} {W : Type w} {A : Type a}
    (q : S → A) (r : S → Z) (encode : Z → W) (undo : W → Z)
    (leftInverse : ∀ z : Z, undo (encode z) = z) :
    ExactOnImage q (fun s => encode (r s)) ↔ ExactOnImage q r := by
  rw [exact_iff_fiber_constant, exact_iff_fiber_constant]
  constructor
  · intro h s t same
    exact h s t (congrArg encode same)
  · intro h s t same
    exact h s t ((left_inverse_preserves_fibers r encode undo leftInverse s t).mp same)

/-- Preserving every binary future query requires preserving every distinct state. -/
theorem all_binary_queries_iff_injective {S : Type u} {Z : Type v} (r : S → Z) :
    (∀ q : S → Bool, ExactOnImage q r) ↔
      (∀ s t : S, r s = r t → s = t) := by
  classical
  constructor
  · intro allQueries s t same
    apply Classical.byContradiction
    intro different
    let q : S → Bool := fun x => if x = s then false else true
    have targetSame := (exact_iff_fiber_constant q r).mp (allQueries q) s t same
    have reverseDifferent : t ≠ s := fun h => different h.symm
    have impossible : false = true := by simpa [q, reverseDifferent] using targetSame
    cases impossible
  · intro injective q
    apply (exact_iff_fiber_constant q r).mpr
    intro s t same
    exact congrArg q (injective s t same)

/-- Proposition 3: knowing x alone cannot recover independent y for every state. -/
theorem x_does_not_determine_y :
    ¬ ∃ d : Bool → Bool, ∀ s : Bool × Bool, d s.1 = s.2 := by
  rintro ⟨d, hd⟩
  have h0 := hd (false, false)
  have h1 := hd (false, true)
  have impossible : false = true := h0.symm.trans h1
  cases impossible

theorem y_does_not_determine_x :
    ¬ ∃ d : Bool → Bool, ∀ s : Bool × Bool, d s.2 = s.1 := by
  rintro ⟨d, hd⟩
  have h0 := hd (false, false)
  have h1 := hd (true, false)
  have impossible : false = true := h0.symm.trans h1
  cases impossible

/-- Fixed readout mismatch can occur without destroyed information. -/
theorem flipped_identity_readout_fails (b : Bool) : (!b) ≠ b := by
  cases b <;> decide

theorem inverse_readout_rescues (b : Bool) : !(!b) = b := by
  cases b <;> rfl

abbrev World := Bool × (Bool × Bool)

def task (g : Bool) (s : World) : Bool := if g then s.2.1 else s.1
def selective (g : Bool) (s : World) : Bool := task g s
def full (s : World) : World := s

/-- Proposition 4: one system stores only the target; another retains the full world. -/
theorem same_primary_behavior (g : Bool) (s : World) :
    selective g s = task g (full s) := rfl

theorem same_primary_sequences (trajectory : List (World × Bool)) :
    trajectory.map (fun p => selective p.2 p.1) =
      trajectory.map (fun p => task p.2 (full p.1)) := rfl

theorem selective_cannot_answer_z (g : Bool) :
    ¬ ∃ d : Bool → Bool, ∀ s : World, d (selective g s) = s.2.2 := by
  rintro ⟨d, hd⟩
  have h0 := hd (false, (false, false))
  have h1 := hd (false, (false, true))
  have same : selective g (false, (false, false)) =
      selective g (false, (false, true)) := by cases g <;> rfl
  have impossible : false = true := h0.symm.trans ((congrArg d same).trans h1)
  cases impossible

theorem full_can_answer_z :
    ∃ d : World → Bool, ∀ s : World, d (full s) = s.2.2 := by
  exact ⟨fun s => s.2.2, fun _ => rfl⟩

/- Exact 16-state coarse temporal-order calculation, manuscript Equation 10.
   Only values 0,1,2,3 occur in finePairs. Direction labels are 0=decrease,
   1=equal, 2=increase. Coarse bins are {0,1} and {2,3}.
   Counts are for all 16 equally weighted pairs, not held-out frequencies.
-/

def finePairs : List (Nat × Nat) :=
  (List.range 4).flatMap (fun old => (List.range 4).map (fun new => (old, new)))

def coarse (n : Nat) : Bool := decide (2 ≤ n)

def direction (old new : Nat) : Fin 3 :=
  if new < old then 0 else if new = old then 1 else 2

def countCorrect (decoder : (Bool × Bool) → Fin 3) : Nat :=
  (finePairs.filter (fun p =>
    decide (decoder (coarse p.1, coarse p.2) = direction p.1 p.2))).length

def coarseOrderDecoder (bins : Bool × Bool) : Fin 3 :=
  if bins.1 = bins.2 then 1 else if bins.2 then 2 else 0

def tableDecoder (a b c d : Fin 3) (bins : Bool × Bool) : Fin 3 :=
  if bins.1 then (if bins.2 then d else c) else (if bins.2 then b else a)

theorem sixteen_fine_pairs : finePairs.length = 16 := by decide

theorem coarse_order_attains_twelve : countCorrect coarseOrderDecoder = 12 := by decide

theorem every_table_at_most_twelve :
    ∀ a b c d : Fin 3, countCorrect (tableDecoder a b c d) ≤ 12 := by decide

theorem every_coarse_decoder_at_most_twelve (decoder : (Bool × Bool) → Fin 3) :
    countCorrect decoder ≤ 12 := by
  have ext : decoder = tableDecoder (decoder (false, false)) (decoder (false, true))
      (decoder (true, false)) (decoder (true, true)) := by
    funext bins
    rcases bins with ⟨x, y⟩
    cases x <;> cases y <;> rfl
  rw [ext]
  exact every_table_at_most_twelve _ _ _ _

-- Kernel-reported dependencies are part of the audit output.
#print axioms exact_iff_fiber_constant
#print axioms collision_prevents_exact
#print axioms collision_forces_one_error
#print axioms refinement_simulates
#print axioms refinement_risk_of_attained_minimum
#print axioms left_inverse_preserves_fibers
#print axioms left_inverse_preserves_exact_access
#print axioms all_binary_queries_iff_injective
#print axioms x_does_not_determine_y
#print axioms y_does_not_determine_x
#print axioms flipped_identity_readout_fails
#print axioms inverse_readout_rescues
#print axioms same_primary_behavior
#print axioms same_primary_sequences
#print axioms selective_cannot_answer_z
#print axioms full_can_answer_z
#print axioms sixteen_fine_pairs
#print axioms coarse_order_attains_twelve
#print axioms every_table_at_most_twelve
#print axioms every_coarse_decoder_at_most_twelve

end NRCT
