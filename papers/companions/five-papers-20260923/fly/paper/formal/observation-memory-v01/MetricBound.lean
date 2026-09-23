import Mathlib.Topology.MetricSpace.Defs

/- M7b. Metric assumptions only; no application or biological premises. -/
namespace SANFly

theorem half_separation {X : Type} [MetricSpace X] (x y reconstruction : X) :
    dist x y / 2 ≤ max (dist x reconstruction) (dist y reconstruction) := by
  have ht := dist_triangle x reconstruction y
  rw [dist_comm reconstruction y] at ht
  apply (div_le_iff₀ (zero_lt_two : (0 : ℝ) < 2)).2
  calc
    dist x y ≤ dist x reconstruction + dist y reconstruction := ht
    _ ≤ max (dist x reconstruction) (dist y reconstruction) +
        max (dist x reconstruction) (dist y reconstruction) :=
      add_le_add (le_max_left _ _) (le_max_right _ _)
    _ = max (dist x reconstruction) (dist y reconstruction) * 2 := (mul_two _).symm

#print axioms half_separation

end SANFly
