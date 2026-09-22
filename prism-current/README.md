# Prism Current / Friendly Current 0.12.2

The owner's latest playtest sets the priority: a readable, forgiving first game rather than constant maximum pressure. The main index.html remains the full River Prism game, now with Easy, Normal, Hard and Ultra Hard, explicit health feedback, healing cases, slower fruit-throwing enemies and finale-only bosses. The existing Water, Fire, Trees and shaped shoreline remain. No private hub, travel portal or sibling-game work is included.

## Start and choose your pace

Easy is the first-play default, including when old River scores exist. A valid saved difficulty preference is restored. In the screen Rotunda choose the displayed difficulty button below the chapter entry choices. In XR choose Difficulty on the Battle page. The four options are individual scene buttons; the accessible text controls have the same four choices. F2 toggles that semantic alternative. Select difficulty before starting. A paused run keeps the difficulty and record identity it started with; return to chapter selection to change it.

Easy has fewer approaching objects, longer enemy passes, slower incoming items, generous hit sizes and more healing cases. Normal increases activity but preserves forgiving fruit cuts. Hard and Ultra Hard use denser waves, faster throws, fewer supplies and directed fruit cuts. Either saber can cut in every mode; Easy and Normal accept any cut direction. This is not automatic play: move the actual blade through the target, aim lasers, block hazards and defeat the final boss. Cruise remains an optional no-health-loss setting with separate records, not a substitute for the four difficulty profiles.

Ducks, toy boats, propeller planes and fighter ships repeatedly throw fruit and purple blocks. They linger for 22 to 28 musical beats rather than the earlier 9 to 10 beats. The soundtrack speed is unchanged. Purple blocks can be cut, shot or shielded. There are no spawned invulnerable red missiles. Easy and Normal contain no spiked explosive bombs; Hard and Ultra Hard retain visibly spiked bombs that should be shot or shielded rather than slashed.

## Health and final encounters

A persistent stage-anchored HEALTH gauge below the action shows the actual number out of 100 and a thick fill bar. The controller/floor display also labels health explicitly. Low health and real damage/healing changes are named, without a full-view flashing effect. The gauge stows for the paused menu; it is not attached to the headset or pasted over the browser window.

Mint supply cases marked with a plus symbol restore health when cut, shot or touched. Each case works only once and cannot raise health above 100. Easy supplies five cases restoring up to 30 each; Normal three at up to 25; Hard two at up to 20; Ultra Hard one at up to 15. Missing one does not damage you. Health changes come from the simulation, not from drawing the HUD. The status textures are updated only when their contents change and are first uploaded during loading before audio.

Neither boss is present at chapter start. Admiral Quack or the mothership arrives at beat 152, about 69 seconds into the existing 89-second song. After a four-beat entrance the core opens. The duck flagship has a crown, paddle wheels and twin fruit mortars. Defeating the boss and finishing the track are still required to clear the chapter.

## Controls, graphics and progress

Keep the established controller mappings: tracked saber swings, trigger lasers, grip shields and B/Y pause/resume. The Rotunda supports ray/trigger, thumbstick/A-X and hand-pinch menu input. Combat requires tracked controllers, not hand-only gestures. Direct B/Y start/resume in 0.12.2 no longer disappears when pressed immediately after another menu action; pointer duplicate protection and safety checks remain.

The adjustable scene pedestal, saved AR water opacity, quiet/quality settings, standard-controller and mouse controls, real session exit and same-mode paused recovery remain. Water 0.1.0, Fire 0.1.3 and Trees 0.1.3 are reusable modules under modules/environment. Trees and solid banks remain hidden in AR and Mothership. No new music or replacement demo is introduced.

Previous River records remain untouched under prism-current.river.records.v1. New records use prism-current.river.pacing.records.v1, separated by chapter, input mode, difficulty and Arcade/Cruise. Old results are not relabeled as Easy or Ultra Hard. Classic rhythm, all five songs, lessons, Practice Lab and Floodgate Recovery remain at rhythm.html and water-mission/index.html with their old saves. Unfinished battles remain in memory across matching XR exit/re-entry, not across closing the page.

## Verification and continuation

PLAYABILITY-CHECKPOINT.md and qa/friendly-current-public.json record the exact saved/runtime and public evidence. FRIENDLY-CURRENT.md explains the balance choices. PLAYABILITY-RECOVERY.md, PLAYABILITY-XR-VERIFICATION.md and PLAYABILITY-DIRECT-RESUME.md preserve the revealed failures and focused repairs. Source/public input tests and actual physical Quest playtests are separate; successful automated completion is not proof that the difficulty is enjoyable.

Blade-color switching, color-match bonuses, richer boss phases and a gameplay explosion-radius display remain separate unfinished work. The latest easier-mode request takes precedence over adding more scenic cost. Read AGENTS.md and AAA_CHECKLIST.md, reconcile fresh master and save focused changes directly without PRs, staging branches or overwriting other games.
