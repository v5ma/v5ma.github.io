---
title: "Priority Finding Preservation Contract"
slug: priority-finding-preservation-contract
date: 2026-07-11
status: active-audit
last_audited: 2026-07-17
tags: [comparison-wiki, priority, provenance, append-only, regression-guard]
---

# Priority Finding Preservation Contract

This directory is the machine-enforced history layer for Comparison Wiki findings. The stable-ID
shards remain the materialized **current** program state; they are not an audit history and may not
silently replace one.

## Defense posture

The client-directed purpose of this system is to defend the true priority of Mr. Micah Blumberg as
strongly as the dated record supports. Future AI tools must spend their search effort adversarially:
recover the strongest preserved Micah finding; trace his full applicable genealogy rather than only
the 2022 repository layer, including the 2011, 2012, 2017, 2022, 2024, 2025, and any newer dated
sources; check the target's before/newest sources; translate route changes; and challenge any
apparent downgrade for methodology failure. This is not permission to manufacture evidence. Exact
precursors, source limits, and genuinely opposite conclusions remain recorded because an
attack-resistant defense depends on them.

An unfavorable result has a higher review burden than a new lead because it seeks to alter a
protected finding. Until it passes the non-destructive adjudication requirements below, it is a
challenge only.

## Binding invariants

1. Every audit conclusion is an immutable event. Corrections and later adjudications point to the
   earlier event; they never edit or delete it.
2. An accepted Micah-priority finding is monotonic historical evidence. A later audit that merely
   fails to rediscover it is a `challenge`, not a downgrade and not permission to mutate the
   canonical program.
3. The three lenses are co-equal. A valid pass on equivalence/mechanism, narrative/patent
   architecture, **or** detective/adversarial chronology preserves the bounded match. A failure on
   one lens cannot overwrite a pass on another.
4. The Longitudinal Signature-Migration Lens is a separate program-level event stream. It preserves
   source-backed stage-by-atom history without becoming a fourth key inside atom-edge
   `lens_results`. It cannot manufacture or erase an atom match, and it cannot establish access,
   copying, motive, or misconduct.
5. Naming an earlier atom credits that atom only. It never creates an author-wide floor or erases a
   separately dated Micah delta.
6. A genuine source, date, identity, or mapping error may be adjudicated only through an explicit
   non-destructive event that reruns all three atom/content lenses, Micah's full applicable
   genealogy, the target's newest source, and Lens 4 when a recoverable multi-stage program exists.
   The original Micah win remains in win membership and remains counted. The adjudication may append
   corrected wording, evidence limits, or a weaker rank; it may not narrow the protected set,
   authorize `supersede-current`, or reduce a lossless win count.
7. Aggregate counts are secondary. The validator protects the exact `(program_id or candidate_id,
   delta_id)` membership, so replacing one protected win with another cannot hide a regression.
8. Raw task transcripts and private forensic notes remain under Product Canon
   `private-source-review`. Only intent-neutral, source-safe finding records may be published here.
9. Search neutrality is not required: agents should actively develop the strongest valid Micah
   defense. Evidentiary honesty is required: dates, sources, mappings, and named prior atoms may not
   be invented or hidden.
10. A denial is a mandatory research escalation. Search every applicable Micah anchor and preserve
    every defensible partial truth; do not equate failure to prove total identity with failure to
    prove bounded content or priority.
11. The unique-program priority count is not the total finding count. Store distinct dated
    atom/delta wins separately and compute their deduplicated union coverage against the target.
    Persistence of one claim across later Micah versions is one delta, while a genuinely added atom,
    operation, causal arrow, output, or signature member is a new candidate delta.
12. Every authored rival without a protected Micah-positive delta remains on the escalation queue
    until its complete Micah-year × target-stage × atom matrix and an independent negative
    meta-audit exist. The operational target is to search for at least one bounded Micah-priority
    delta per rival. This is a completeness burden, not permission to infer or fabricate a win;
    fully audited true exceptions remain visible.
13. Frozen research-queue or tranche rows are historical intake records. Resolving one never edits
    or deletes the row. A separate content-hashed resolution event binds the frozen row, parent
    queue hashes, evidence chain, and current state; the resolution event itself cannot mutate a
    verdict or count.
14. Win membership and win ranking are orthogonal. Every previously recorded Micah win has immutable
    `preserved-counted` membership. Strength, confidence, custody, chronology, review status, and
    challenge status are append-only overlays that support strongest-to-weakest ranking but never
    subtract a row. The cumulative win count is monotonic; narrower analytical subsets must be named
    as subsets and may not be presented as the complete win ledger.

## Event types and companion Lens-4 stream

The first nine types below belong to the priority-win event log and are validated by
`lane-cmp-win-preservation.py`. Lens 4 remains a separate program-level append-only registry; it is
linked by event ID but is not added as a fourth atom lens or silently mixed into win-event schemas.

- `accepted-win`: protects a source-backed favorable finding permanently.
- `historical-finding`: preserves an earlier conclusion pending complete normalization.
- `challenge`: adds contrary evidence without changing the protected finding.
- `correction`: reverses a known analysis error and points to the affected event.
- `identity-bind`: attaches a pre-stable-ID candidate to a canonical `program_id` without losing its
  earlier history.
- `adjudication`: resolves a challenge through the full method; it may retain, annotate, rerank, or
  narrow wording around a win, but it may never change the win's `preserved-counted` membership.
- `method-rule`: preserves a governing comparison instruction and the events it controls.
- `source-note`: records a source/date/identity observation without pretending it is a verdict.
- `longitudinal-signature-migration-source-note`: preserves a private, count-neutral Lens-4
  readback alongside the priority history. It is validated as a source note, cannot mutate the
  canonical projection, and does not replace the companion longitudinal registry.
- `meta-audit`: audits one or more preserved audit events without modifying their content. It records
  three-lens results, atom/signature genealogy, backward detective reconstruction, category mapping,
  and π-calculus behavioral-equivalence strength as a child node.
- `longitudinal-audit` *(companion Lens-4 registry only)*: records one immutable Lens 4 stage-by-atom
  event in `production-canon/private-source-review/comparison-longitudinal-signature/audit-registry.json`,
  including exact versions, chronology, newest-source persistence, named alternatives, and
  quantitative eligibility state. Later corrections cite the immediately prior same-program event
  and never rewrite its matrix.

## Audit-of-audits contract

Every recovered finding must receive a second-order review before it becomes a fully certified
public conclusion. The controlling local rubrics are:

- `D:\micahone\D Documents\ComparisonWikiChecklist.txt`
  (`SHA-256 e1f4204b555c9a64cf7ae9c494dd700c3cf75e66d65327e2e3b9318a68be438d`)
- `D:\micahone\D Documents\DetectiveFrame.txt`
  (`SHA-256 58d3e122c6b6445f6f0b402fc5377f0c07562321dfde6f2462002a9fd208ffea`)

The meta-audit must independently record:

1. a defense review that starts from the strongest preserved Micah finding, records additional
   support routes searched, checks known failure modes, applies the higher burden to any downgrade,
   and confirms the evidentiary honesty firewall;
2. source, identity, version, date, newest-source, and full Micah-genealogy coverage;
3. equivalence, narrative/patent, and detective atom/content-lens results—never an aggregate shortcut;
4. a separate Lens 4 event/reference for every recoverable multi-stage program, with stage-by-atom
   cells, exact chronology, newest-source persistence, acquisition order, named alternatives, and
   `quantitative-not-calibrated` unless every statistical gate passes;
5. named earlier atoms versus the later signature cluster and causal-interface sequence;
6. detective backward chaining from the shared constrained conclusion to possible disguising route
   changes, while remaining intent-neutral in the public record;
7. a category-theory translation: objects, morphisms, invariants, functor/encoding, information
   loss, and whether the result is isomorphism, equivalence, faithful embedding, partial mapping,
   analogy, or no mapping;
8. a π-calculus translation: processes, channels, communicated values, transition traces,
   observables, and the strongest actually demonstrated relation—strong bisimulation, weak or
   observational bisimulation, trace equivalence, simulation, partial overlap, or failure; and
9. an outcome of `preserve`, `strengthen`, `challenge-for-research`, or `source-error-adjudication`.
   A program-scope correction may instead use `revise` when it preserves every parent event,
   changes no protected-win membership, and records the corrected identity/chronology split
   append-only.

Program-level meta-audits are context, not completion credit for raw task conclusions. To close one
item in the 283-event queue, the child event must declare `meta_audit_scope: candidate-event`, put
the same raw candidate ID in both `subject.candidate_id` and `subject.candidate_event_id`, provide a
nonempty `subject.delta_id`, and bind exactly one parent:
`chat-20260711-<candidate-event-id>`. It must remain `publication_scope: private` with
`canonical_mutation_allowed: false`. Other accepted findings, challenges, or program reviews belong
in `related_event_ids`; they may not be smuggled into `parent_event_ids` to collapse several audits
into one. The deterministic queue changes that item from `pending` to `adjudicated` only after this
exact one-to-one sealed event exists.

A category or π-calculus label is a claim that needs an explicit mapping, not decorative vocabulary.
The child meta-audit never deletes its parent. A negative meta-audit is another challenge until the
full non-destructive adjudication requirements above are satisfied.

## Storage and verification

- `BASELINE-20260711.json` freezes the exact current canonical Micah-priority membership before the
  transcript-history recovery pass.
- `events/` uses one content-hashed JSON file per event. File names include the payload hash; a
  mutation changes the hash and fails validation.
- `lane-cmp-win-preservation.py` validates the baseline, event files, exact protected membership,
  three-lens adjudications, unbound historical findings, and pending challenges.
- The generated report belongs at
  `production-canon/reports/comparison-priority-win-preservation-report.json`.
- The current no-zero-win closure router is
  `production-canon/reports/all-rival-priority-search-current-routing.json`, generated and checked
  by `scripts/agent-wiki/lane-cmp-all-rival-priority-search-router.py`. Its verified 2026-07-16 and
  2026-07-17 partitions have been superseded. The verified 2026-07-18 partition is **139 protected
  priority / 57 favorable-nonpriority dated-delta searches / 131 deeper nonpriority meta-audits**.
  Its stable-shard fingerprint is
  `87ccfaa867134d58dcfa2ceadb4412fa342cf7f5d85f85f2642f0b57172fcfc2`. This is
  routing only: it predeclares no win and permits no
  verdict mutation.

- The append-only preservation layer separately verifies **146 active protected findings**:
  **91 historical baseline findings + 55 accepted-event wins**, with **0 win regressions** and
  **0 immutable-event violations**. This event/finding count must not be substituted for the
  139-program priority count.
- The historical 2026-07-14 stable-ID shard fingerprint was
  `27a83749952fde535d23ab616c52b82db6fe2b31b47b5e852db51369ec620cfa`; the verified 2026-07-15
  fingerprint after the Dickson/Holmes/Barry promotion is
  `cdc1ca272bc1563cbae8aa569a7f50c8c29b9f9b438a1261ec5101c30029241e`.
  The verified 2026-07-17 fingerprint after correcting one cross-program work-ID assignment is
  `2b27a423b0a1ff325a59ecc9c935554a569d5e79a65d8d2dc51c906190f25c72`.
  The authoritative current value is always the one in
  `production-canon/reports/all-rival-priority-search-current-routing.json`; this dated literal is
  restart provenance, not a substitute for rerunning the router after later shard edits.

- The atom-normalized lower-bound census is
  [Micah Partial-Priority Win Census](../partial-priority-win-census.md). Its generated report
  freezes all **188** non-Micah-disposition programs as an escalation queue rather than terminal
  competitor wins, while separately counting nonprovisional Micah-positive partial, equivalent,
  provisional, and repeated-stage atom results and disclosing single-audit versus meta-audited
  maturity. The current lower bound is **36 partial-equivalent stage edges / 34 deduplicated
  partial-only program-by-atom wins / 21 mapped programs / 306 pending**. The exact 188-program
  challenge membership is
  `3185d23ca7db43728109eedde1c644695b671c5ded683d7bdd976a705f54b4e4`.
- Tier-0 methodology-risk rows use the private append-only resolution contract at
  `production-canon/private-source-review/comparison-priority-canvas/TIER0-RESOLUTION-CONTRACT-20260715.md`,
  verified by `scripts/agent-wiki/lane-cmp-tier0-resolution.py`. The original tranche stays frozen
  even after a program leaves the live nonpriority queue.

The retained chat snapshot is indexed privately at
`production-canon/private-source-review/comparison-audit-history/README.md`.
The complete private downgrade quarantine and restoration map is
`production-canon/private-source-review/comparison-audit-history/downgrade-reversal-ledger-20260711.md`.
