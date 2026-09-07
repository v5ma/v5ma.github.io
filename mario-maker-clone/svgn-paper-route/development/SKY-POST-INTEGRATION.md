# Runtime integration boundaries

The original campaign controller captured a frozen registry when the DOM initialized. A route module loaded later could update Workshop and renderer builders while the actual Play button still loaded the older document. The controller now reads the current registry through a small read-only facade, so Play, Retry and the route menu agree with the same builder used for editable copies. This changes neither player state nor route physics and does not rewrite a loaded user draft.

Native dialogs also own their Escape and Tab behavior. The game-level keyboard handler now leaves an open dialog alone instead of preventing its Escape default or trapping focus in a hidden underlying pause panel. Opening the Passport pauses through the existing controller; closing it respects the prior pause state. These boundaries are checked by native UI input as well as a small source contract.

The release manifest now includes twenty-nine owned runtime files, including the campaign controller, so public verification cannot report a release while the browser is still served a stale controller. No temporary transport files, source-rewriting acceptance step, account changes or silent saved-level migrations are introduced.
