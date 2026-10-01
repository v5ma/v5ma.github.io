# What the formal state means in the actual application

19 September 2026. Maps the exact accepted [reference controller](../../tools/embodied_reference.py); its bytes and all previous results remain unchanged. This is a same-agent source/runtime audit, not machine-checked implementation refinement.

## Complete state, not a display projection

The object has **18 fields**: ten fixed settings, one retained gain and seven temporary fields. The audit records their exact names in [the receipt](interface-audit-01/EXECUTION.json). Fixed templates/settings are part of the equal-controller premise even though they are not learned during these episodes.

| Mathematical object | Candidate implementation | Important distinction |
|---|---|---|
| Initial state and fixed functions | Complete object attributes plus the same class/functions and policy | Different learned gain, templates or policy can change responses to identical input |
| Sensory input `o` | Serialized `time`, `bands`, `samples`; each sample has signed range and captures | Truth labels and world-change schedules are not passed |
| Post-observation state `p` | Complete object snapshot after `observe` | The dictionary returned by `observe` is a summary, not all of `p` |
| Policy `π(p)` | `act()` | Replay verifies that it reads without mutating the object |
| Returned-evidence transition | `receive_body_return` with command and measured displacement | Mutates both gain and temporary relation/odometry |
| State summary | `state()` | Only five fields; omits sampling mode, full observation and clock/settings |
| Scoped reset | `clear_transient()` | Resets seven temporary fields, preserves ten settings and retained gain |

A constructed counterexample gives two objects identical `state()` summaries but different sampling modes and therefore different action dictionaries. This is a test of summary noninjectivity, not a claim that those two objects occurred in the original experiment. Treating the compact summary as a complete Lean state would therefore be an unjustified abstraction.

## Saved histories replayed with all fields

The audit runs no new environment. It feeds the two previously saved 24-step input histories into the unchanged accepted controller and checks all saved returned relations, actions and adaptation values. New snapshots record complete state before input, after observation and after body return. All fields match across the two worlds through time 8. The first complete post-observation difference is at time 9; action first differs at time 11, agreeing with the original causal test.

The new evidence strengthens the correspondence between the whole-state premise and this particular run. It does not prove general program semantics or infer a hidden world from the compact log. No original episode, plotted value or result count was changed.

## Reset correspondence and a noncommuting operation

Twelve controls cover four policies and three retained gain values. Each reset preserves the fixed/retained fields, restores the temporary fields to their declared cleared values, is idempotent, and preserves the immediate retained-only prediction `gain × command`.

Gain updating is independent of temporary episode state for a fixed policy/settings and the same body-return payload, so its **retained projection** commutes with the reset in these controls. However, the **whole** `receive_body_return` method does not commute: receiving after resetting adds measured or commanded displacement to odometry, while resetting after receiving clears that odometry. All twelve controls retain this distinction.

Consequently, M8's `updateLearned` corresponds only to the retained gain update, not to the entire returned-evidence method. The formal claim and the code would be mismatched if the latter were substituted silently. The tests also do not imply that a reset leaves future commands or subsequently acquired returns unchanged.

## Result and limitations

All **394/394** declared checks pass; 48 saved events replayed in 0.019 seconds at below-normal priority. Inputs, outputs, source and checker are hashed. [Complete snapshots](interface-audit-01/FULL-STATE-REPLAYS.json) and [reset controls](interface-audit-01/RESET-CONTROLS.json) remain available for review.

Exact equality here is equality of the Python values in these deterministic cases. Numerical-real refinement, alternative execution environments, randomized controllers, hostile side channels, native sensory physiology and the proposed SAN circuit are outside this result. Complete-state logging is a requirement for the next implementation, not evidence that the current comparator already implements the full theory.
