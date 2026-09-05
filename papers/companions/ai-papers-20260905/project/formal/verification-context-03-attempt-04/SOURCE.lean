import Mathlib.Data.Rat.Defs
import Mathlib.Tactic

/-!
Constructive identification boundaries for the two-paper development applications.
No mathematical novelty, biological efficacy, or implementation refinement is claimed.
The rational receiver is a deliberately passive null: it has no policy-selection input.
-/
namespace SAN.PassiveFeedback

def receiver (feedback : ℚ) : ℚ := 3 / 5 + (3 / 10) * feedback
def positiveStep (state : ℚ) : ℚ := receiver state
def negativeStep (state : ℚ) : ℚ := receiver (1 - state)

def iterate (step : ℚ → ℚ) : ℕ → ℚ → ℚ
  | 0, initial => initial
  | n + 1, initial => step (iterate step n initial)

theorem positive_fixed_point : positiveStep (6 / 7) = 6 / 7 := by
  norm_num [positiveStep, receiver]

theorem negative_fixed_point : negativeStep (9 / 13) = 9 / 13 := by
  norm_num [negativeStep, receiver]

theorem nonzero_fixed_point_separation :
    (6 / 7 : ℚ) - 9 / 13 = 15 / 91 ∧ (15 / 91 : ℚ) > 0 := by
  norm_num

theorem affine_error_iteration
    (step : ℚ → ℚ) (star slope : ℚ)
    (affineError : ∀ x, step x - star = slope * (x - star))
    (n : ℕ) (initial : ℚ) :
    iterate step n initial - star = slope ^ n * (initial - star) := by
  induction n with
  | zero => simp [iterate]
  | succ n ih =>
      rw [iterate, affineError, ih, pow_succ]
      ring

theorem positive_error_at_any_horizon (n : ℕ) (initial : ℚ) :
    iterate positiveStep n initial - 6 / 7 =
      (3 / 10 : ℚ) ^ n * (initial - 6 / 7) := by
  apply affine_error_iteration
  intro x
  dsimp [positiveStep, receiver]
  ring

theorem negative_error_at_any_horizon (n : ℕ) (initial : ℚ) :
    iterate negativeStep n initial - 9 / 13 =
      (-3 / 10 : ℚ) ^ n * (initial - 9 / 13) := by
  apply affine_error_iteration
  intro x
  dsimp [negativeStep, receiver]
  ring

theorem receiver_preserves_bounded_range (q : ℚ) (lower : 0 ≤ q) (upper : q ≤ 1) :
    (3 / 5 : ℚ) ≤ receiver q ∧ receiver q ≤ 9 / 10 := by
  dsimp [receiver]
  constructor <;> linarith

/- Visible output is fixed independently of the receiver state. This does not
   model voluntary control or deny its possibility in a different architecture. -/
def visible (_state : ℚ) : Bool := false

theorem separated_hidden_states_with_identical_output :
    visible (6 / 7) = visible (9 / 13) ∧ (6 / 7 : ℚ) ≠ 9 / 13 := by
  constructor
  · rfl
  · norm_num

#print axioms positive_fixed_point
#print axioms negative_fixed_point
#print axioms nonzero_fixed_point_separation
#print axioms affine_error_iteration
#print axioms positive_error_at_any_horizon
#print axioms negative_error_at_any_horizon
#print axioms receiver_preserves_bounded_range
#print axioms separated_hidden_states_with_identical_output
end SAN.PassiveFeedback

namespace SAN.ScopeEvidence

/- Missing origin cannot be recovered by a deterministic function of identical
   observations, irrespective of that function's computational sophistication. -/
theorem indistinguishable_origins_prevent_exact_permission
    {World Evidence : Type} (observe : World → Evidence) (allowed : World → Bool)
    (privateCopy publicCopy : World)
    (sameEvidence : observe privateCopy = observe publicCopy)
    (differentPermission : allowed privateCopy ≠ allowed publicCopy) :
    ¬ ∃ decidePermission : Evidence → Bool,
      ∀ w, decidePermission (observe w) = allowed w := by
  rintro ⟨decidePermission, correct⟩
  apply differentPermission
  calc
    allowed privateCopy = decidePermission (observe privateCopy) := (correct privateCopy).symm
    _ = decidePermission (observe publicCopy) := congrArg decidePermission sameEvidence
    _ = allowed publicCopy := correct publicCopy

inductive Artifact (Root : Type) where
  | source : Root → Artifact Root
  | combine : Artifact Root → Artifact Root → Artifact Root

def origins {Root : Type} : Artifact Root → List Root
  | .source root => [root]
  | .combine left right => origins left ++ origins right

def permit {Root : Type} (authority : Root → Bool) : Artifact Root → Bool
  | .source root => authority root
  | .combine left right => permit authority left && permit authority right

theorem derivative_permission_requires_every_origin
    {Root : Type} (authority : Root → Bool) (artifact : Artifact Root) :
    permit authority artifact = true →
      ∀ root ∈ origins artifact, authority root = true := by
  induction artifact with
  | source r => simp [permit, origins]
  | combine left right ihl ihr =>
      intro allowed root present
      have both : permit authority left = true ∧ permit authority right = true := by
        cases hl : permit authority left <;> cases hr : permit authority right <;>
          simp_all [permit]
      have parts : root ∈ origins left ∨ root ∈ origins right := List.mem_append.mp present
      cases parts with
      | inl found => exact ihl both.1 root found
      | inr found => exact ihr both.2 root found

theorem revoked_origin_blocks_every_derived_artifact
    {Root : Type} (authority : Root → Bool) (artifact : Artifact Root) (root : Root)
    (present : root ∈ origins artifact) (revoked : authority root = false) :
    permit authority artifact ≠ true := by
  intro accepted
  have allowed := derivative_permission_requires_every_origin authority artifact accepted root present
  rw [revoked] at allowed
  cases allowed

/- The tree is an abstract complete ancestry expression. Unknown edges, signatures,
   cyclic graphs and Python-to-Lean correspondence require separate checks. -/
#print axioms indistinguishable_origins_prevent_exact_permission
#print axioms derivative_permission_requires_every_origin
#print axioms revoked_origin_blocks_every_derived_artifact
end SAN.ScopeEvidence
