# Paired-role metric: finite proof boundary

The targets for a paired family are distinct: the first prompt requires identity a and the opposite-role prompt requires identity b. A constant named output therefore gets exactly one answer right. More correct individual outputs need not mean the relation was restored. Conversely, getting both members right does establish correctness on that pair, but not general understanding beyond it.

[PairedRoleMetric.lean](PairedRoleMetric.lean) formalizes five elementary statements, including the counterexample (b,a) -> (a,a): aggregate score rises from zero to one while the intended distinction is still lost. [Compiler receipt](verification-attempt-01/RECEIPT.json) and axiom output are required before treating these as checked. The [typed signature](claim-signature.json) remains yellow at the integrated scientific-claim level because independent review and a formal Python refinement are absent.

The diagnostic is post-hoc. It supplements, and does not silently replace, the frozen Draft 6 endpoints. Its value is an explicit reporting guard and a prospective test requirement; these are not new deep mathematical results or proofs about consciousness. Identical invalid outputs are not counted as identical named-output collapse: mapping them to `other` is valid only for correctness.

[Nine-case executable bridge](executable-bridge.py) exhausts the finite truth table and checks the held-out paired CSV against the summary. That is a tested correspondence, not a compiler-proved refinement. Original model and experimental data remain unchanged.
