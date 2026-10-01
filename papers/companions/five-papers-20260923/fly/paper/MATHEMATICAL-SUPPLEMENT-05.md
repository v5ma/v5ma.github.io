# M8: scoped reset and retained readout

19 September 2026. An elementary state-ownership contract, not novel general mathematics or a biological memory theorem. Formal artifacts are indexed in [the observation/memory proof leaf](formal/observation-memory-v01/README.md). M7 and its application remain unchanged in their original files.

## State and operations

Let the complete declared memory be a pair \(m=(\ell,e)\), where \(\ell\) is retained learned state and \(e\) is temporary episode state. This partition must be justified by the implementation; it does not follow from calling a variable “memory.” For a specified cleared episode state \(e_0\), define

\[
R_{e_0}(\ell,e)=(\ell,e_0).
\]

For an update \(u:L\times B\to L\) and an explicitly supplied body return \(b\), define

\[
C_{u,b}(\ell,e)=(u(\ell,b),e).
\]

The update's independence from episode state is an assumption of this particular operation. It is not a claim about every controller or all synaptic learning. The same \(b\) must be used on both sides of the identity below; in a real closed loop, a reset may change an action and therefore change the later return.

## Four contract properties

1. **Retention:** \(\operatorname{learned}(R_{e_0}(m))=\ell\).
2. **Idempotence:** \(R_{e_0}(R_{e_0}(m))=R_{e_0}(m)\).
3. **Conditional commutation:** \(R_{e_0}(C_{u,b}(m))=C_{u,b}(R_{e_0}(m))\).
4. **Retained-only readout:** for any declared \(f:L\times C\to Y\),
   \(f(\operatorname{learned}(R_{e_0}(m)),c)=f(\ell,c)\).

All four follow by substituting the definitions. Lean checks the general typed equalities, not merely one numerical example. In the reference controller, a calibrated return prediction \(f(g,c)=gc\) is a retained-only readout. A policy that also uses a remembered target position is not such a readout: the theorem does not say that clearing episode state preserves navigation behavior.

## Why the assumptions matter

An operation that replaces both \(\ell\) and \(e\) is not \(R_{e_0}\). It can erase calibration while still being called “reset” in software. An update \(u(\ell,e,b)=\ell+e+b\) can fail to commute with clearing \(e\), even if it preserves the episode field itself. A predictor that depends on both learned gain and transient position need not be invariant either. The proof leaf's separate challenge audit includes these counterexamples.

The existing application already tests retained calibration, reversion to the original gain and independently specified correct/incorrect rescue. Those saved results are engineering evidence for that implementation. The theorem supplies a precise contract against which the code can be read; it does not prove that the Python object has no other retained state, that floating-point arithmetic refines real arithmetic exactly, or that a fly has this state partition.

## Use in the proposed SAN construction

The state-partition requirement is useful before joining receiving dynamics, temporary routes and durable plasticity. Every proposed reset must name what changes and what persists. Deleting a current rendering is not automatically erasing learned receiver organization. Conversely, preserving one gain parameter does not demonstrate preserved content, later learning, metaplasticity or experience. Those remain separate implementation and experimental questions.

The formal observation-history results cover arbitrary declared controller state, including a correctly registered retained/temporary partition. M8 does not introduce a biological clock, oscillation or learning rule. It specifies how to avoid accidentally destroying the learned component while testing a temporary-state intervention.
