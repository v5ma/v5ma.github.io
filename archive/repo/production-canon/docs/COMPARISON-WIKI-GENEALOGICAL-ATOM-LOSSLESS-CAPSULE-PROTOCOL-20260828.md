# Comparison Wiki Genealogical Atom Lossless Capsule Protocol

Status: active worker protocol; independent review remains required  
Date: 2026-08-28  
Applies to: SAN, SIT, SDT, QGTCD, and related Comparison Wiki atom registers and comparison cards  
Governance effect: zero by itself; this protocol does not add, remove, rerank, certify, or publish a win

## Purpose

A short comparison atom is a retrieval aid, not a license to simplify Micah's work into a weaker claim. Every atom used for fast semantic comparison must remain a lossless pointer into its dated formulation genealogy. The Book Atlas is a second representation of the same source family and is used to expose omissions, paraphrase drift, and later refinements. It is not substituted for the dated primary evidence.

The protocol distinguishes:

1. an early conceptual ancestor;
2. a bridge formulation in which more of the operation is joined;
3. the first currently verified mature terminology;
4. later restatements, formalizations, and extensions;
5. the current Book representation; and
6. the smallest invariant proposition that survives all of those formulations.

These stages must not be collapsed into one date or one quotation.

## Mandatory card projection

Every capsule projected into the Comparison Wiki must follow the
[Comparison Wiki Presentation Requirements](COMPARISON-WIKI-PRESENTATION-REQUIREMENTS.md).
The main side-by-side card uses the strongest mature source-bound Micah
formulation that still predates the exact target document/version. The earliest
verified ancestor remains visibly labeled as the lineage anchor, and every
distinct intervening pre-target formulation remains available through a
chronological formulation control. Later clarity never erases early lineage;
early lineage never forces the least mature wording to carry the whole public
comparison.

## Required lossless capsule

Each governed quick-comparison atom must provide the following fields before it can be called source-ready:

| Field | Requirement |
| --- | --- |
| `atom_id` | Stable Comparison Wiki atom identifier. |
| `minimum_invariant_proposition` | The smallest accurate claim shared by the cited Micah formulations. It must retain the decisive carrier, variable, relation, transformation, and output. |
| `operational_ito` | Explicit input, transformation, and output. Context and receiver state must be included when they change the operation. |
| `required_semantic_components` | Components whose omission would materially weaken or invert the claim. |
| `formulation_genealogy` | Ordered dated stages, each with a stage role, exact source, exact wording or a bounded verbatim anchor, locator, source hash, and custody/date class. |
| `date_boundaries` | Owner-created date, immutable public fixation date, provider publication date, and review date kept separate where applicable. |
| `first_verified_ancestor` | Earliest bounded evidence for a genuine ancestor, without backdating later terminology or the complete mature operation. |
| `first_verified_joined_operation` | Earliest bounded stage that joins the components needed for the compared operation. |
| `first_verified_mature_terminology` | Earliest bounded source currently verified to use the mature term. This is not inferred from a later filename, title, or Book gloss. |
| `later_restatements_and_extensions` | Later wording that clarifies, formalizes, generalizes, or extends the operation. Later clarity must not be described as the origin of already documented substance. |
| `book_atlas_crosswalk` | Candidate Book Atlas atom IDs, propositions, review states, source routes, and current Book passages. |
| `comparison_aliases` | Alternative wording, ontological metaphors, application contexts, and functional translations that may retrieve the same or partially equivalent atom. |
| `categorically_adjacent_priors` | Earlier adjacent work, what it genuinely contributes, and the non-equivalent SAN/SIT delta. |
| `forbidden_compressions` | Explicit descriptions that would strawman, narrow, backdate, or otherwise distort the source family. |
| `review_state` | Worker review, independent review, meta-audit, governance, and publication states kept separate. |

## Source and chronology rules

- Primary dated sources establish history. The Book Atlas, current Book prose, source ledgers, and comparison registers route and cross-check the evidence; they do not manufacture an earlier date.
- A source may carry more than one date. An owner-created date must not be presented as an immutable public date. A later public Git fixation must remain visible beside the owner date.
- Historical conceptual ancestry, first joined mechanism, and first mature name are separate milestones.
- A later paper or transcript can be a clearer restatement or a genuine extension without becoming the origin of components already present in earlier sources.
- A mature term must not be projected backward onto an ancestor that lacks the term or lacks the joined mature operation.
- A failed keyword lookup is not evidence of absence. Source recovery must use exact routes, known aliases, source ledgers, and bounded genealogy checks.
- The current Book formulation is a readback target: the short atom must not contradict it or silently discard a component that the primary sources and Book both preserve.

## Anti-strawman reconstruction gate

Before an atom is compared with a target theory, the worker must ask:

1. What is the strongest source-faithful statement Micah actually made?
2. Which variables, carriers, relations, contexts, and consequences make that statement nontrivial?
3. Did the short atom replace a signed, relational, receiver-dependent, or multi-context operation with a single carrier or metaphor?
4. Did it confuse a role with a fixed physical band, scale, substrate, or application domain?
5. Did it use later polished wording as though the earlier source lacked the same operational substance?
6. Did it hide a distinct SAN/SIT delta merely because an older source is categorically adjacent?

If any answer exposes lost substance, the comparison pauses at `ATOM-RECONSTRUCTION-REQUIRED`. The atom is repaired before similarity scoring, chronology assignment, or win projection.

## Mandatory validation failures

A capsule fails when any applicable condition is true:

- a carrier alternative documented by the source family is omitted;
- a signed or bidirectional difference is reduced to excitation-only or inhibition-only wording;
- the tonic, expected, maintained, or receiver-relative reference state is removed;
- a receiver consequence is reduced to mere co-occurrence;
- a cross-context formulation is rejected only because its application context changed among neuroscience, BCI, AI, physics, or polymath synthesis;
- a mature term is backdated to an earlier conceptual ancestor;
- an earlier partial formulation is hidden because a later formulation is more polished;
- a later synthesis is treated as the origin of earlier documented substance;
- an owner date is displayed as though it were an independently fixed public date;
- the Book Atlas proposition conflicts with the primary passage and the conflict is not surfaced;
- the current Book passage cannot be routed and the atom is nevertheless called lossless;
- a prior is credited without preserving SAN/SIT's later non-equivalent delta;
- “different ontology,” “different metaphor,” “different field,” or a small mechanism difference is used as an automatic no-match rule instead of scoring partial equivalence after translation;
- the atom has no exact source hash and locator;
- worker reconstruction is presented as independent certification.

## Book Atlas cross-reference procedure

For each atom:

1. Resolve the current Book Atlas authority and freeze the relevant ledger file hashes.
2. Match by stable atom IDs and source IDs first. Use semantic retrieval only to propose additional routes.
3. Read every directly linked Atlas proposition and its review state.
4. Follow the linked primary source routes and verify the bounded passages independently.
5. Read the current Book passage that owns the mechanism or concept.
6. Build an atom-by-year ladder that preserves ancestor, bridge, mature-name, and later-extension roles.
7. Compare the minimum invariant proposition against every stage. Record both what survives and what is added later.
8. Record forbidden compressions discovered by the cross-reference.
9. Validate that all required semantic components occur in the capsule, even when synonyms or different ontological metaphors are used.
10. Keep Book Atlas acceptance status visible. `PRIMARY_REVIEW_GATES_OPEN` means candidate readback, not canonical acceptance or independent certification.

## Comparison use

The capsule supplies a reusable source-faithful Micah side for future comparisons. It does not pre-decide the target side. Each target comparison must still:

- translate both sides into explicit operations;
- measure full or partial equivalence by function, mathematics, operation, behavior, and description;
- preserve differences as scored residuals rather than automatic exclusions;
- credit genuinely earlier target work;
- state SAN/SIT's non-equivalent later innovation when the target is earlier;
- state Micah's earlier priority and the degree of later target similarity when Micah is earlier; and
- avoid claims about access, dependence, intent, misconduct, plagiarism, or legal liability unless separately established by an appropriate process.

## Coverage and governance boundary

This protocol can be applied incrementally. One passing capsule does not certify every stored atom, every comparison, or the neuroscience/physics program. Counts, ranks, public projections, and the protected global floor remain unchanged until their separate governed gates are satisfied.
