# Rail grip and Bezier editor release

The public branch started with only a truncated transfer fragment. This release is recovered against the exact live baseline 0a9c9cf8b12232b6f69b00342ab8fb75570017ff. Prior inline results are not reused as native evidence. Complete committed source, native acceptance artifacts and deployed hash comparisons are separate gates.

The editor selects newly placed parts and clears paint mode when a track is selected from the list. A selection has draggable rotation and resize controls; Shift snaps angles or locks resize proportions. Numeric transforms remain available. Independent cubic anchors support corner, smooth and symmetric tangents, Alt-drag breaks alignment, and segment subdivision uses de Casteljau. Explicit conversion of a polyline preserves straight segments; the separately named Fit fewer handles command is an approximation and is undoable. Fifth/eighth/quarter/half/three-quarter arcs expose radii and sweep. The cb authoring extension coexists with native ct points and legacy ca handles. Invalid or stale handles cannot override the collision points.

Swept contact checks both physical faces of open rails. Underside clearance includes the road thickness. Incoming signed tangential velocity is retained, including reverse travel. Precision mode requires a real crossing. Forgiving mode uses a small speed-dependent near-contact allowance capped at 9 world pixels. It is not a long-range pull. A solid obstacle blocks a catch; slow overhead riding drops after a short grace period rather than hanging indefinitely. Nitro accelerates along the current rail or flight direction and is consumed from actual pickups.

The Rail Grip Yard is an editable practice document available inside the Workshop. It illustrates an ordinary jump, a collected nitro boost, a top catch, an underside catch and a return to the top face. The road is a safe fallback and the finish is not delivery-gated. The electric unicycle is the default rendered vehicle; the bike remains a setting. These are visual options sharing the current vehicle physics, not new balance profiles.

The existing hangar, level library and community/cloud shelf are preserved. This release does not create multiplayer services, paid memberships, coupon entitlements, authentication, private saves or database schema changes. Never describe the existing public cloud shelf as a private member-account system. Those tasks require separate source recovery and security review.

## GitHub and deployment gates

Normal acceptance is read-only. It tests the exact committed head, records that SHA and a runtime file manifest, preserves failure artifacts, and checks editor authoring, ordinary-input 3D grip play, road completion and expert regression independently. A one-time guarded recovery may materialize the complete package on the feature branch, but the package, partial fragments and write-enabled preparation workflow must be absent from the release tree.

Merge only the checked head, without resetting master or discarding concurrent changes. The existing GitHub Pages publication source is retained. After publication, compare the public entry and every release file byte-for-byte with the checkout, then retain the receipt. The app shows version 0.11.0 and can check the same-origin release manifest; reloading never silently discards an unsaved Workshop draft. Service-worker errors no longer substitute an HTML page for missing JavaScript assets.

The authored-flow layout proposal in PR28 is not included here. It must be integrated separately on top of the repaired editor/physics, then have its old reachability results invalidated and recomputed under the new movement model. Other applications and account configuration remain out of scope.

Native Chromium software WebGL is functional evidence, not a physical-phone, native WebGPU or frame-rate certification. The release does not claim every existing optional track is reachable with both modes.
