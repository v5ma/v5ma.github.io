# Route Entry v0.27

Build: `sky-cycle-route-entry-2026.09.20`. Read `verification/route-entry-0.27.json` for exact source, acceptance, merge and public verification. This note describes implementation; it does not establish that a candidate is live.

## Player experience and preserved identity

The player chooses the route and presentation together, rather than first discovering a small header XR control. Each of the eight original route cards has semantic sibling AR, VR and Screen buttons. The original card still offers its current-view action. Screen explicitly uses the existing supported 2D presentation; no different mode is silently selected when immersion fails. The last successfully used mode is an independent hint, not an automatic launch or a gameplay-control remap.

This implements the owner's route-card request within Milestones F/G: first-session clarity and controller/XR continuity. It follows the shared library's embodiment and transition requirements while keeping the separate `SKY-CYCLE-LEVEL-DESIGN.md` movement-first direction. The source review covered AGENTS.md, the studio manual, game recommendations, quality framework, industry notes and the Sky Cycle manual. The full canonical AAA roadmap remains in `AAA-ROADMAP.md`; no wider milestone is closed by the existence of these buttons.

Baseline master is `d539c8e6bdf16339df16d3c514df1a2f4043af15`; the published v0.26.2 runtime is `f279935ce328485d76f72442ad953aa1dfbacf3f`. Preserve its session-owned A/B/X/Y/trigger/grip menu handling, original riding mappings, fixed-world AR aperture and absent persistent controller-riding slab. All eight route IDs, authored builders, movement/throw physics, saves, rewards, remaps, soundtrack ownership and Workshop documents remain independent of this entry module.

## Entry and recovery contract

A requested immersive route starts only after the original XR owner has successfully acquired and configured that session. Rejection, cancellation and an unsupported mode leave the prior route unchanged. A session acquired after the launch was cancelled is closed without replacing the route. A request already pending cannot issue another competing launch. Stable route identity and Workshop protection are checked again after permission completes.

Switching between AR and VR deliberately ends the current session, preserves the current route, and offers a fresh user-activated entry. Choosing Screen from XR explicitly confirms leaving immersion. This is not a promise of cross-site seamless navigation or an in-place conversion of browser session types.

A WebGPU-to-WebGL handoff needs a reload. Its message explicitly says the reload ends the unfinished run while preserving saved progress; it does not claim that provisional simulation state survives a reload. The selected stable route and requested mode travel in transient URL parameters and require fresh confirmation after loading. Cancellation removes only those parameters. Active, testing or dirty Workshop state blocks replacement rather than silently losing a document.

Only `svgn.skycycle.launch.v1` stores the last successful mode. Failed writes produce a visible session-only hint and never clear or migrate other keys. The menu footer reads the actual loaded release identity rather than continuing to display the old v0.26.2 label.

## Additional accessibility pass

The recovered candidate marked unsupported mode buttons aria-disabled while also giving them an explanatory click handler. This made the explanation unreachable through the existing controller/XR disabled-control filter and normal browser activation. The corrected control remains a reachable help action with an explicit unavailable label. The entry policy still prevents requesting that unsupported mode and requires Screen to be selected separately.

Capability checks in progress are labelled checking, not prematurely unavailable. Four isolated tests execute the actual card-update function and verify accessible names, disabled-state removal, preference display and session-only disclosure. Substituting the old function causes three of the four to fail; the unrelated session-only case remains passing. This is a focused regression fixture, not a physical-controller test. A CSS-only follow-up was rejected before execution by a tool safety-status check and was not substituted through another write path; functional labels and the normal focus styling remain.

## Recovery evidence

Current tested source is `a2a3eeb06964c4e642a84cf826afe6c955efc99a`, containing the dynamic build label, delayed-permission cancellation journey, truthful reload message and reachable unavailable-mode explanations. Its scoped hosted run is `35556641185`. Read the receipt for the latest result; a queued job is not a pass.

Local Node checks passed 359 game rules and 12 original soundtrack tests against reconstructed source with the changed runtime/module and release blobs compared to GitHub. Six additional isolated session-policy checks cover delayed rejection, late cancelled approval, single successful commitment, a newly protected draft, reordered route indices and a repeated pending request. These are not native or physical acceptance. Local Chromium navigation was rejected by administrator policy before the game loaded, so it supplies no playthrough evidence.

Hosted acceptance must exercise AR and VR route-card entry, original controller movement, same-mode route choice, cancellation, mode switching, Screen return, denied and delayed permission, preference storage failure, reload hints and unsupported browsers. The existing all-button, Workspace, Portal Network and twelve-delivery journeys remain required. Actual screenshots and stereo framebuffer captures must be reviewed rather than inferred from a test count.

## Release and remaining work

PR 213 is the recovery integration. Normally merge only the accepted expected head, preserving concurrent sibling projects. Then independently compare all 37 owned public runtime files and replay both route-entry journeys against the public origin. No branch, merge, local test or version label substitutes for those checks.

No private WebXR hub source, assets, internal paths or attached multi-game brief is included. No walking or sphere portal is added to Sky Cycle. The pedestal/rotunda remains a separate proposed spatial interface, not something this release claims to implement by changing a menu texture.

Ground traps, low-ramp collision and longer aerial flow are not changed or qualified by this entry pass. Preserve the separate `sky-cycle/canal-choice-0.25` branch and reconcile its movement-first level work after this release. Physical Quest 3/Xbox, actual WebGPU handoff, passthrough ergonomics, headset readability and long-session comfort/performance remain open. Rollback only the owned entry/lifecycle integration and release files; never reset master or clear user storage.
