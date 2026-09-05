# Cloudview Studio

This is the separately verified art pass from PR #12, preserved alongside the independent Cloudview update that reached master while it was being developed. The main game remains unchanged apart from its Studio art navigation link. This entry is the same game and save format, not a mockup. Live art returns to the main version.

The Studio version provides gold track armor, original island cities, atmospheric scenery, red delivery targets, a helmeted motorcycle courier and its compact HUD. The original loop and flight rules are unchanged. The base URL reuses the existing pinned renderer and shared game assets without copying the entire repository.

The source manifest records hashes against immutable verified commit 9038b9df97f11de2da2339235216038b164546e0. Four owned runtime files are byte-identical; the UI only adds a return link, and the HTML only changes asset routing. That source passed 23 unit/data checks, 15 visual/editor checks and 35 full 3D input-replay checks in run 33935414614. The final Studio-path smoke test separately verifies the published routing, real 3D output, normal-input launch/catch/delivery, editable copies, and navigation back to the existing app.

Cloud and waterfall scenery use authored texture planes; the track, islands, city, targets and courier are geometry. This is an original stylized real-time interpretation, not pixel-for-pixel equality with the generated concept. Native WebGPU hardware, Safari and physical mobile performance are not asserted by software-rendered Chromium tests.

No existing live art, character orientation fix, theology work, dinosaur source or browser saves are replaced. The source branch and original test artifacts remain available.
