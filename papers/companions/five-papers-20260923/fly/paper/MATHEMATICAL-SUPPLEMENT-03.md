# M6: finite settling of the published component's within-event activity graph

19 September 2026. Elementary analytic verification lemma, not a novel general theorem, a Lean certificate, or a result establishing the full SAN architecture.

## Claim and assumptions

Hold the sensory drive and all weights fixed during one activity calculation. Let a directed acyclic graph specify the only dependencies in

\[
F_i(x)=f_i\!\left(u_i+b_i+\sum_{j\in\operatorname{pa}(i)}w_{ji}x_j\right)-b_i.
\]

Each \(f_i\) is a fixed, single-valued function on the required inputs. There are no self-edges, recurrent activity cycles, evolving inputs, or weight changes during this calculation. Let \(d_i\) be the length in edges of the longest path ending at vertex \(i\), and \(L=\max_i d_i\).

**Proposition.** There is exactly one fixed point \(x^*\). For every initial state \(x^{(0)}\), the synchronous iteration \(x^{(k+1)}=F(x^{(k)})\) satisfies \(x_i^{(k)}=x_i^*\) whenever \(k\geq d_i+1\). Thus the whole state equals \(x^*\) after at most \(L+1\) iterations in exact arithmetic. No small-gain or contractivity assumption is needed under these acyclicity assumptions.

**Proof.** For a vertex with no parents, the formula is independent of the initial state and fixes its value on the first application. Evaluate the remaining vertices in a topological order; their already determined parents uniquely determine their values. This constructs a fixed point and proves uniqueness. For the iteration bound, induct on path depth. Every parent of a depth-\(d\) vertex has depth at most \(d-1\), so its value is fixed by iteration \(d\). The next application therefore fixes the child at iteration \(d+1\). Further iterations retain all these values. ∎

## Exact scope in the Huang–Luo component

The downloaded two- and three-module parameter masks allow activity edges from the γ1 MBON to the α2/α3 MBONs, and from MBONs to DANs. No activity edge returns from a DAN to an MBON in this algebraic solve. A valid order is γ1 MBON, α2 MBON, α3 MBON, then the three DANs. The longest permitted path has two edges; three synchronous steps suffice. The source performs ten. The apparent difference between its untransposed initial solve and transposed subsequent updates therefore need not change the final fixed point for this particular graph. This does **not** authorize silently changing the source algorithm; the adaptation retains it and compares the result with a separately evaluated topological solution.

The whole learning model is still temporally recurrent: current DAN and MBON activity updates KC→MBON weights, adaptation persists, and later presentations meet altered state. The proposition applies only to the fixed-weight, within-event activity subproblem. It neither identifies membrane time constants nor proves that three biological time steps suffice. It does not apply to an arbitrary connectome, PWD circuit or future SAN recurrent extension.

## Executed witnesses and limits

The [model replay](application/memory-component-v0/results-01/EXECUTION.json) contains 714 event states over fourteen small runs. The ten-update solver and direct topological calculation agreed exactly at the stored floating-point precision for their activity outputs, with zero stored fixed-point residual. A [separate scalar implementation](application/memory-component-v0/results-01/SEPARATE-CHECKS.json), also recalculating adaptation and learning, agreed within 2.842170943040401e-14 across stored state values. That comparison uses state-specific native units; the declared tolerance was 1e-10.

These witnesses exercise the implementation under the declared parameters and protocols. They are not a computer-checked universal proof or independent human review. Native MATLAB replay and a Lean formalization remain unperformed. The graph assumptions must be rechecked if any edge is added.

[Pinned source and limitations](research/MEMORY-COMPONENT-SOURCE-AUDIT-20260919.md) · [Application packet](application/memory-component-v0/README.md)
