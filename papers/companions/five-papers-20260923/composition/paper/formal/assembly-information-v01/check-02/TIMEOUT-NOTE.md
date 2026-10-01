# Preserved incomplete compiler attempt

The runner exceeded its 55-second subprocess limit on 2026-09-08. No successful
compiler receipt or axiom audit was returned. The initial runner did not persist
partial output on timeout; this missing evidence is not reconstructed as a log.
The source and BEFORE.json identify the attempted bytes. The old runner is also
preserved here, with its hash matching BEFORE.json.

A subsequent filtered Windows process check found no Lean/Lake/Elan process.
The lease schedule still displayed this now-dead wrapper process (PID 11636).
That stale registration is not an active compiler or proof result. The next
normal invocation of the existing wrapper is responsible for reclaiming it.

The launch path resolved through a WinGet symlink to elan-init.exe. The next
attempt changes only the local execution environment to the already installed,
pinned Lean 4.30.0 bin directory; it also persists output while running and owns a
kill-on-close process job. This is an environment/runner correction, not an
unchanged speculative theorem retry. The specific cause of the timeout was not
established by the missing compiler output.
