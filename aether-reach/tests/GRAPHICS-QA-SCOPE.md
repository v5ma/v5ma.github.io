# Graphics acceptance and slow-renderer watchdogs

The public game runs unchanged during native acceptance. A CPU-only software WebGL renderer is not a frame-rate benchmark for a physical desktop GPU or Quest 3.

The final art source at `f74a343baae8beca05bc9bdf9c8f4e12dbcfb2da` passed the matched Prismatic rendering, actual art/UI runtime, original expedition, arsenal, input and interface gates. The first flight watchdog expired after 150 wall seconds with a legitimate 70.7-metre glide still active just above Garden terrain. The recovery watchdog expired after 450 wall seconds with all six enemies defeated, full collector hull and only 40.27 of the required 48 simulation seconds elapsed. Neither snapshot showed a stopped simulation, exception, failed objective or rescue.

The test-only navigation watchdog is now 240 seconds and recovery watchdog 720 seconds. Each separately fails if observed simulation time stops advancing for 60 seconds. No in-game clock, actor state, damage, flight budget or completion condition is assigned or shortened. The normal 48-second mission and real landing, zero-rescue, enemy-clearance and one-time-reward assertions remain mandatory. Earlier failed attempts remain in Actions history.

Flight retains the normal desktop Prismatic setting. Full-resolution comparison and runtime checks independently exercise the expensive optics. Tactical runs use the actual user-facing Light setting, and long expedition/arsenal runs use Balanced. These distinctions must stay visible in release evidence. This test-budget correction changes no file in the declared 59-file runtime/art contract, and does not establish acceptable frame rate on real hardware.
