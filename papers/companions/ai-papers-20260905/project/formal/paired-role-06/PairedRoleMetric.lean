/- Finite evaluation kernel. No claim about neural understanding or SAN follows. -/
namespace PairedRoleMetric

inductive Choice where
  | a | b | other
  deriving DecidableEq

def hit (prediction target : Choice) : Nat := if prediction = target then 1 else 0

-- The first prompt requires a; its opposite-role prompt requires b.
def pairScore (first second : Choice) : Nat := hit first .a + hit second .b

theorem constant_named_score : pairScore .a .a = 1 ∧ pairScore .b .b = 1 := by
  decide

theorem same_choice_at_most_one (p : Choice) : pairScore p p ≤ 1 := by
  cases p <;> decide

theorem perfect_iff (p q : Choice) :
    pairScore p q = 2 ↔ p = .a ∧ q = .b := by
  cases p <;> cases q <;> decide

theorem different_choices_not_sufficient :
    Choice.b ≠ Choice.a ∧ pairScore .b .a = 0 := by
  decide

theorem accuracy_gain_without_pair_recovery :
    pairScore .a .a > pairScore .b .a ∧ pairScore .a .a < 2 := by
  decide

#print axioms constant_named_score
#print axioms same_choice_at_most_one
#print axioms perfect_iff
#print axioms different_choices_not_sufficient
#print axioms accuracy_gain_without_pair_recovery

end PairedRoleMetric
