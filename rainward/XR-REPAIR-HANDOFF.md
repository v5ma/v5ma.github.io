# Rainward XR repair checkpoint / 2026-09-18

Resume from master 9c26bd8c1487df75d54a290f1043131c3a8da805. Its latest Rainward change is c0367e5e785ff3c44b807b81597d5d16400aafac; Freefield v0.16.0 was published through PR183. The user reports physical Quest failures despite prior simulated-device checks. Those checks are not evidence that their reported failures do not exist.

Repair scope: an obvious reserved face-button menu gesture plus existing recovery access; readable interaction and complete paginated puzzle text inside VR; a recognizable firearm with a consistent muzzle/aim/projectile axis; scope lifecycle across chapter changes; real first-person AR and AR/VR portal rendering; fast running as the default without fatigue. Preserve all chapter IDs, save keys, rewards, optional legacy layouts, sibling work and licenses.

Recovery found two rendered weapon-study images from the interrupted attempt but no surviving repair source directory. Do not claim unsaved earlier code was committed. Current branch is fix/rainward-xr-recovery-20260918. Commit bounded source changes and tests here as they are completed, then use the established PR/Pages/public-byte process.

Evidence boundaries: synthetic XR session/button/pose tests and render fixtures are software checks. Physical Quest controller axes, compositor behavior, readability and comfort need the user's device retest. Do not label failed or incomplete modes verified. Record observed defects, actual fixes, test results and public status here as work proceeds.
