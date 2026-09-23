# Infinite Liquid Glass / inspected reference and proposed kit work

Review date: 2026-09-22. This is a reference/adoption note, not an installed glass module or a claim that the linked effect is visible in Prism.

Requested demonstration: https://infinite-liquid-glass.shader.se/?v=2 . Its retrievable page still exposes only a loading shell. This time an author-written technical breakdown was found: Filip Kantedal, Shader Development Studio, Building an Infinite Liquid Glass Grid with Three.js, WebGPU, and TSL, Codrops, September 8, 2026.

https://tympanus.net/codrops/2026/09/08/building-an-infinite-liquid-glass-grid-with-three-js-webgpu-and-tsl/

## What the author actually describes

The original carousel uses subdivided planes, rounded-rectangle distance fields, computed bevel normals, displaced samples of each card's own video, environment-map reflection and edge highlights. It uses React Three Fiber, WebGPU and TSL; the author describes the material path as one pass without a scene-copy target. The finite card pool wraps on a sphere. A separately linked later jelly variant adds GPU cloth constraints and replaces DOM labels with in-scene text. Do not assume the user's exact v=2 URL is that later implementation.

The distinguishing opportunity is own-content distortion, not arbitrary scene or passthrough refraction. This is not an ocean simulation. No author claim here establishes physical Quest performance, complete XR input support or compatibility with Prism's current WebGL renderer.

## Reuse and licensing boundary

No first-party downloadable repository/package for the complete linked experiment was established in this review. Codrops says its downloadable demos are generally MIT unless otherwise specified, but that does not by itself establish permissions for an independently hosted studio site, its video assets or every embedded dependency. Keep attribution and verify the actual distributed source/asset license before copying. No external implementation, video, environment map or font is imported by this checkpoint.

https://tympanus.net/codrops/licensing/

## Proposed Currentworks adaptation, not implemented

An independently authored GlassCard material could take the host's texture and expose bounded corner radius, bevel, tint, distortion and dispersion. Favor a small WebGL-compatible material on existing FlexSurface geometry rather than moving the whole game to WebGPU. Keep the center text readable, confine stronger distortion to the artwork/rim, and use the per-eye draw matrices. Do not pretend this refracts the real room.

A separate optional spring controller could animate a card only when not selected, with host-driven time, reduced-motion behavior and explicit reset/disposal. Deforming or refracting interactive content requires matching displayed hit regions and stable pointer ownership. Never move a Start/Resume target underneath a held ray. A carousel should have deliberate controller navigation rather than depend on desktop dragging. These names are candidate design pieces, not new registry entries.

First use should be an optional chapter-art or reward card, not the numeric health display, required controls, or a new permanent floating dashboard. Test bright/dark room contrast, both eyes, correct alpha, pause, input cancellation and named-device performance before enabling it widely. Existing playability and frame-pause failures remain open.

## Pending game upgrade recovered alongside this note

The earlier AR Field Guide commit 0a8829a9c46ae2dc196661bf7e676daefd67d8ef was stored but its master update was rejected because concurrent work advanced the branch. It was not published by that failed update. Recovery rebases only the prepared Prism subtree and the one Prism verifier file onto the newly read master. Newer Neighborhood workflow edits are explicitly preserved. The actual game change uses existing FlexSurface for three noninteractive object guides, with full source/public tests separate from this glass reference. Read ../../AR-FIELD-GUIDE.md and the current workflow results; source presence is not physical-device approval.
