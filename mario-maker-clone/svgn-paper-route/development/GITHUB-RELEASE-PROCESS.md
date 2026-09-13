# Exact-source release process

This is the standing release process for Sky Cycle. It replaces the older repair-specific interpretation of this file. The current handoff is `RESUME-HERE.md`; the canonical long-range plan is `AAA-ROADMAP.md`.

## Definition of done

A prepared patch, local candidate, feature-branch commit, pull request, or successful unit test is not a completed Sky Cycle upgrade. When release access is available, an accepted upgrade is done only after it has been tested on an exact source SHA, reviewed, merged without discarding concurrent repository work, published by GitHub Pages, and verified against the public runtime. Do not end an upgrade with “implemented but not published,” “committed but not merged,” or “candidate ready” unless an external access failure genuinely prevents completion.

If repository or deployment access is temporarily unavailable, retry rather than silently redefining the release as complete. If it remains blocked, preserve the exact candidate SHA and state the block explicitly so the next session can resume publication without reconstructing the work.

## Branch and integration discipline

Runtime changes should begin on a scoped Sky Cycle feature branch from the current master. The repository contains many unrelated games under active development, so never reset master, force an old repository snapshot, or use a broad revert that would remove sibling-game work. Merge the reviewed expected head normally.

Keep integration bounded. New modules should own their own logic and tests where possible. Touch the legacy integration points only where necessary for campaign loading, rendering, controller focus, audio ownership, route registration, service-worker/release identity, or supported 2D fallback.

Do not renumber existing routes when appending a new destination. Do not clear or consolidate independent local-storage namespaces without an explicit, rollback-tested migration.

## Exact-source acceptance

Every release candidate should record its exact Git SHA before native/browser evidence is treated as accepted. Separate different evidence classes rather than presenting them as interchangeable:

- Pure rule, geometry, serialization and resource tests prove deterministic properties.
- Carried-state physics fixtures prove sampled reachability but are not complete native playthroughs.
- Isolated browser fixtures prove UI/state rules but are not the real game.
- Native browser acceptance should use the existing UI, controls, physics, authored finish path and save logic.
- Physical Xbox/mobile/native-WebGPU checks are their own qualification gates and must not be inferred from CI Gamepad samples or software rendering.

Native acceptance must not teleport the rider, directly assign score/win/progression state, suppress a failed assertion, or alter player state merely to obtain a passing result. If software-rendered CI requires a longer timeout or a more accurate input pulse, preserve the actual application assertion and document the harness change.

## Controller rule

The normal gameplay loop should be operable with an Xbox-style controller: start a route, move, jump/use the relevant action, pause, navigate route/journal/graphics/portal dialogs, adjust supported settings, dismiss confirmations, view results, retry/continue, and safely return to play. B/back should close only the top dialog and return to its parent state. A nested menu opened from a paused parent must not unexpectedly resume gameplay when closed.

Advanced editor Bezier manipulation remains an explicitly open controller-completion item until it is actually implemented. Do not accidentally advertise full editor controller support while that exception exists.

## Save/progression rule

Optional medals, seals, exploration stamps and career records should settle only after the original game accepts an unmodified authored-route finish, unless a versioned design explicitly defines a different settlement event. Editor copies, rejected wins, late-loaded observations, debug fixtures and duplicate win callbacks must not mint progression.

Storage failures should be visible to the player or test harness. Session-only success must not be described as durable local persistence. Existing unrelated storage sentinels should be checked when a release introduces a new save namespace.

## Visual and shader rule

Visual upgrades must preserve collision readability and should not silently change physics. Resource ownership and disposal paths need tests when new Three.js geometries/materials are introduced. Reduced-motion and the existing motion preference should freeze decorative animation where appropriate without freezing required mechanical state transitions.

The selected legacy `m.THREE` facade may not expose the complete pinned Three r177 namespace or TSL helpers. New node shaders should use the same vendored r177 module that the existing renderer uses, and tests should reproduce the facade boundary rather than assuming the full namespace is available everywhere.

A visually attractive screenshot is not sufficient acceptance for an unplayable route. Conversely, a playable route is not enough if the reviewed capture shows a broken camera, unreadable sign, HUD overlap, floating water, scene leak or other visible production defect. Review actual captures before merge.

## Evidence retention

Retain failed candidates and their artifacts. Record the candidate SHA, run/job/artifact IDs, failure reason, and the corrective change. Do not overwrite or relabel a failed run as a later passing commit.

Versioned verification receipts under `development/verification/` should contain the accepted runtime SHA, relevant run/job IDs, artifact IDs/digests, test counts, real-route results, known limitations, and publication proof. Keep generated screenshots/videos in workflow artifacts rather than bloating the application source tree unless there is a specific long-term evidence reason to commit them.

## Merge and publication

After exact-source acceptance and capture review, merge the expected feature head through a normal PR or equivalent fast-forward-safe integration. The merge itself is not proof of publication.

The GitHub Pages publisher may be superseded by a newer master commit because sibling games are being updated concurrently. Do not force an obsolete Pages deployment merely to make an older deployment job green. Instead, allow the newest combined master deployment to publish and then verify that the unchanged Sky Cycle runtime is present in that live deployment.

A separate read-only publication workflow should poll the version-owned runtime files and compare their SHA-256 hashes with the merged source. Only a successful public-file match establishes that the live link is serving the accepted release. The in-game version/build indicator and Check update button help distinguish a stale browser tab from the published version. Reload prompts must protect unsaved Workshop work.

## Documentation at every accepted release

Update these together when applicable:

- `release.json` and the in-game release/build identifier.
- The versioned release note, for example `TIDEGLASS-0.20.md`.
- The machine-readable receipt under `development/verification/`.
- `RESUME-HERE.md` with the new live state, integration traps discovered, and the next prioritized work.
- `AAA-ROADMAP.md` when milestone state or long-range priorities actually change.
- `development/README.md` if the current start-here pointers/version change materially.

Do not mark physical-controller, mobile-hardware, native-WebGPU, long-session performance, save-migration or human-playtest gates complete unless they were actually performed.

## Current release example

Tideglass Baths v0.20.0 is the current example of the intended process. Runtime candidate `9cb7afe8e82854be5681f29dabd41d59185dc41d` passed source/model/node-graph checks, native Tideglass acceptance and Sunrise regression. PR 143 merged it as `ccbec6ec6cd3dd0eb85d789482da75882e51af1b`. The verification receipt records a later successful read-only publication check in which all ten owned runtime files matched the accepted source on the public site. An earlier failed TSL integration candidate remains documented rather than erased.

## Rollback

Rollback should be scoped to the release's owned files/commit and preserve unrelated repository history and user save data. Never clear saved drafts or progression as a generic rollback method. When a newer combined master deployment supersedes an older one, verify the desired Sky Cycle runtime in the newer deployment before deciding a rollback is necessary.

This process exists to keep Sky Cycle continuously playable while upgrades become more ambitious: content, portal destinations, shaders, audio, controller coverage, editor completion and eventual hardware qualification should all move forward without sacrificing the live game or its accumulated player progress.
