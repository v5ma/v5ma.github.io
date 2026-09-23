# Rainward / Currentworks Living Garden

Build: rainward-currentworks-garden-20260922. This pass applies the owner's public Prism Current environment library to the existing Conservatory, alongside the planned archive maintenance return. The seven-expedition Rainward game, Reclaimed Places and original characters remain. Source inspection started at master c31dd6c56a101aec7c8a890768ae1f845494b294; the first durable planning checkpoint was c441dd8efd06d2fcb6e52b65c57f3cd6cf6547fa.

## Playable scope

Choose The Drowned Conservatory - LIVING GARDEN in the ordinary chapter selector. Three existing shallow pools use Currentworks Water 0.1.0, with restrained lagoon waves, depth shading and visual survivor wakes. Their footprints, depths and wading rules do not change. Five seeded alder/willow trees grow from existing solid planter positions instead of the old decorative tree cards. There is no new invisible tree collider or randomly obstructed doorway.

Recovering the existing archive catalogue also opens the north maintenance shutter. From the archive shelter, this optional return reaches the service court and colonnade before the sluice. Enemies can use it. The original entrances, wheel puzzle, lens, core, seed task, reward quantities and shelter saves remain. The journal explains the connection and records its earned state.

The normal settings panel includes Currentworks garden water and trees. Disable it to restore the old pool/tree presentation without changing the level geometry or progress. The existing Reduced Graphics setting selects Light water and capped tree detail; Reduced Motion freezes decorative wind and flattens water displacement. Quest views receive the same Light budget. No new input map, mandatory overlay, soundtrack or second renderer is added.

## Integration boundaries

vendor/currentworks contains four byte-identical upstream files plus source-lock.json and PROVENANCE.md. Water and Trees take Rainward's existing Three r177 namespace. Upstream used r184; compatibility is independently checked, not assumed and not addressed by replacing Rainward's engine. No runtime network import or sibling-source mutation occurs.

The adapter owns its graphics only. It takes the paused game clock and read-only survivor observations. The original simulation owns collision, enemy sight, water rules, rewards and saves. Water foam/wakes are not fluid physics or additional concealment. The module's analytic reflection/refraction is not a reflected scene, room camera or ocean simulation. Trees are stylized seeded geometry, not photorealistic foliage.

Loading prepares tree detail buffers and both used water meshes before entering play. Temporary 24-pixel targets are disposed immediately and renderer state is restored. Failed preparation retains the legacy environment. A replaced/disposed scene cannot reappear when asynchronous preparation completes. Pause, visibility/session changes and changed chapter selection prevent automatic entry into play after loading. Cosmetic settings reuse the existing settings store, not campaign keys.

Water clipping follows its displaced vertex position. Tree wind remains on standard material hooks, which Reduced Graphics must not replace with a hook-free Lambert material. The same new root participates in the existing waist-AR and centered portal adapters. Host world coordinates select one tree detail level for both eyes; the diorama transform is not treated as simulation space.

## Evidence and preservation

See evidence/currentworks-20260922 for exact-source evidence as it becomes available. Model/Three-object fixtures, the continuous living-enemy model mission, normal-input HTTP/WebGL missions, synthetic tracked XR eye attachments, served-file comparison and physical-device review are different evidence classes. A queued workflow is not a pass. Keep failed attempts and actual source hashes.

The original motion audit is unchanged. Its one intentionally revised protected runtime, scene.mjs, is repinned in render-revision.json. The existing district revision remains. All character, animation, controller/XR-input, combat, resource and licensed asset bytes retain their prior contracts. This bounded Conservatory geometry change is not a full seven-chapter redesign or a claim of AAA completion.

Fire 0.1.3, Toon and Cloudlets are not installed in this pass. Volumetric fire needs a useful atmosphere/gameplay role, separate renderer preparation and XR cost review. Toon/Cloudlets must not silently replace Rainward's desired character or environment style. Existing Natatorium water is retained rather than overwritten by a shallow-garden adapter.

## Continuing from another chat

Read this file, FUTURE-DIRECTION.md, DEVELOPMENT-HANDOFF.md, the current master and the latest evidence before editing. Reconcile concurrent work and write directly to master without force, unnecessary PRs or new temporary workflows. Update these notes at meaningful implementation and verification checkpoints.

Next review: actual Conservatory arrival/pool/maintenance views, alternate-route comprehension, matched collision silhouettes and graphics toggling on a real Quest. Extend to another chapter only after that bounded result. Interior audio, stronger enemy tactics, weapon handling, remaining traversal contacts and the other chapter briefs remain separate roadmap work. Physical Quest/Xbox, sustained frame-time/thermal performance and human art/pacing approval remain open.
