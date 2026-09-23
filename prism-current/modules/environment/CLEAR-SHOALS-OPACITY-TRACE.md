# Clear Shoals opacity investigation

Runtime a3cd5dbac40d330371f78bccd842c91a061fc889 was deployed successfully by Pages run35900176762. The aggregate public verifier also matched its expected files. This is not full native acceptance: the new source Clear Shoals test passed its real-WebGL visual-change assertion, then failed the proposed whole-frame 0.8 alpha bound. No shader/script error was captured. Actual base/updated rendered images show the optical change.

Source run35900178623, job107314573137, artifact10768604259 was downloaded and SHA-256 verified as33fe1e7c97adf2ce77d1bdebeb2dcd08654aaf38a9e9ffee538f745bd1fca9c2. It retains the failure. The object suite passed19 and the model suite passed431. No physical Quest claim.

This checkpoint adds measurements before the same original alpha assertion: base versus updated framebuffer maxima and locations, material side/depth settings, and separately labeled FrontSide/overhead fixture probes. It also saves the actual transparent canvas output. All test-only material/camera changes are restored before the assertion. No production code, assertion, resolution, gameplay state or safeguard changes. The first trace did not retain the raw maximum value, so diagnose it rather than guess whether the optics, existing projected wave overlap, or compositing caused the result.
