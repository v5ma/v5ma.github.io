# Formal claims and accepted certificates

The shared accepted count is **31 statements across four Lean source files**. It is not a count of independent discoveries or a proof of SAN, consciousness, general learning or all application code. No new compilation was performed for public packaging.

| Source | Accepted statements | Accepted evidence |
|---|---:|---|
| [CoreAlignment.lean](CoreAlignment.lean) | 8 | [Receipt](verification-dev-01/RECEIPT.json), [axioms](verification-dev-01/CoreAlignment.lean.log), [claim signatures](CLAIM-SIGNATURES.json) |
| [ReceiverRelativeInterpretability.lean](ReceiverRelativeInterpretability.lean) | 7 | [Receipt](verification-dev-01/RECEIPT.json), [axioms](verification-dev-01/ReceiverRelativeInterpretability.lean.log) |
| [PassiveFeedbackAndScope.lean](PassiveFeedbackAndScope.lean) | 11 | [Accepted attempt 04](verification-context-03-attempt-04/RECEIPT.json), [signatures](CLAIM-SIGNATURES-CONTEXT-03.json) |
| [PairedRoleMetric.lean](paired-role-06/PairedRoleMetric.lean) | 5 | [Accepted receipt](paired-role-06/verification-attempt-01/RECEIPT.json), [scope](paired-role-06/claim-signature.md), [finite executable bridge](paired-role-06/EXECUTABLE-BRIDGE.json) |

These accepted runs used Lean 4.30.0 and reported no admitted proofs. Two initial alignment statements use propositional extensionality; the remaining thirteen initial statements have no axioms. The passive rational results use standard Mathlib extensionality, choice and quotient soundness; the observation impossibility has no axioms; the ancestry statements use extensionality and quotient soundness. The five paired-role statements are axiom-free.

[Failed compiler attempts](CONTEXT-03-COMPILER-ATTEMPTS.md) remain preserved. Their errors and temporary admitted-placeholder diagnostic output are **not** accepted certificates. Only the accepted receipts above support the reported count.

[Learned-cache-repair obligations](LEARNED-CACHE-REPAIR-OBLIGATIONS-10.md) and the [fit-equation audit](../reviews/qwen35-learning-10/FIT-EQUATION-AUDIT.json) are additional prose mathematics and numerical evidence, not extra compiled statements. Finite executable correspondence tests are not a Lean-verified refinement of Python or ONNX. Compiler/Mathlib dependencies, fresh governed compilation and independent formal review remain separate; see the [reproduction guide](../../REPRODUCIBILITY.md).
