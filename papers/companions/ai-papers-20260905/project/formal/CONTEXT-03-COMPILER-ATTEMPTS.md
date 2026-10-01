# Preserved compiler attempts

The first two attempts checked the same source hash. Both failed because a Boolean conjunction proof invoked a nonexistent theorem name. Lean's partial processing reported admitted placeholders for the failed theorem and its dependent theorem; neither attempt is accepted evidence.

Attempt 1 also exposed a logging problem: a terminating wrapper exception discarded the pending PowerShell assignment, leaving only the exception message. The verifier was changed to accumulate output as it arrived. Attempt 2 preserves the full diagnostics and a copy of the failed source. The fix replaces the nonexistent helper invocation with exhaustive Boolean case analysis, without changing any theorem statement or assumption.

The verifier now snapshots each source before compiling. Only a later successful compiler exit, complete axiom output, unchanged source hash and no admitted axiom may be used for promotion. Previous receipts remain unchanged.

Attempt 3 could not acquire the shared compiler lease within ten seconds; it is a resource-coordination timeout, not a mathematical verdict. Attempt 4 acquired the lease and compiled all eleven statements with exit zero. Its receipt, source snapshot and complete axiom output are the accepted evidence. No other process or browser was stopped.
