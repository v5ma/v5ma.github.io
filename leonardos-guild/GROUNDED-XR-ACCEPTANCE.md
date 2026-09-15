# Grounded Actions XR acceptance supplement

The source refinement after initial commit 27dd29d542fcf163e68add8382c4e94c140aa971 centers the theatre on the initial viewer position and horizontal facing, rather than assuming that the room origin is the user's seat. Head motion does not continuously drag the theatre or move the saved player. A reference-space reset re-arms input and permits a fresh placement. Local reference space remains a fallback when local-floor is unavailable.

The in-headset game screen has an aiming reticle, and the side panel displays the actual ready/reserve ammunition values. Immediate ordinary game-camera updates requested by menu or room-transition handlers are kept separate from the headset camera. Exiting XR restores the selected ordinary graphics quality and size. Repeated sessions reuse the single game render target and bounded input-source slots.

Initial browser evidence at 27dd29d542fcf163e68add8382c4e94c140aa971 passed 18 Grounded Actions checks, 36 retained camera/character/controller checks and 26 software-XR checks, with no captured JavaScript or shader errors. The first run was 34939547005, with artifacts 10384703852, 10385525027 and 10385406709. These are initial evidence, not the acceptance receipt for the subsequent refinement.

The extended xr-browser.py tests exercise a non-origin seated viewer, tracked-trigger reticle, fallback reference space and repeated sessions in addition to the previous input/menu/tracking/exit checks. It preserves full-browser screenshots and passive framebuffer PNG captures from the actual local renderer. The hardware fixture supplies XR API data only; it does not substitute scene drawing, UI handlers, simulation, saves or outcomes. No source is rewritten during native acceptance.

The exact-source PR150 checks and independent publication receipt must pass for the final source before publication is claimed. Physical Quest 3 controller/hand behavior, subjective comfort, USB/Bluetooth Xbox behavior and target-device frame times remain open hardware gates. Read GROUNDED-ACTIONS.md for controls, retained saves/gameplay, roadmap scope and maintenance.
