# Prism Current 0.10.1 / XR menu recovery

This repair responds to the owner's blocked-start report in AR. The previous Start handler incorrectly assumed that the headset's live inputSources collection had Array.filter. The older emulator used a normal array and missed that failure. Source lists are now converted explicitly, and regression testing uses a native-shaped iterable with no array convenience methods.

Point at a menu button and squeeze the trigger to select it. A visible dot marks the ray intersection, and the button highlights. Picking uses the actual rendered panel and the same rectangles used to draw its buttons, not separately positioned invisible targets.

Either XR thumbstick moves the highlighted selection. A/X confirms without requiring a ray. B/Y directly starts or resumes the selected chapter from a menu; during a battle, B/Y pauses. Native primary events and polled triggers are deduplicated. A trigger used to resume must be released before it can fire a laser.

The menu remains operable with one controller or temporarily missing grip poses. Starting combat still requires both tracked controllers and provides an explicit message when either is unavailable. Reopening the menu places it in front of the current view without moving the gameplay camera. Hand-pinch menu interaction and transparent AR remain supported.

The combat core, art, soundtrack, desktop/Xbox mappings, existing records and retained rhythm/water modes are unchanged. The app snapshot adds only the new release identifier and read-only XR UI diagnostics. Updated script URLs prevent the previous XR module from being reused under the same cache version.

Read XR_MENU_HOTFIX.md for the diagnosis, strict device-shaped test coverage and evidence boundaries. The repair must pass source and deployed-file checks separately. The owner's physical Quest retest remains necessary; an emulated renderer test is not hardware acceptance. Previous release notes are preserved at RELEASE_NOTES-v0100.md.
