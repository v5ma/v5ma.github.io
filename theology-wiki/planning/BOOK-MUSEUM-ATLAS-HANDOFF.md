# Shared foundations for the book, wiki and future museum

This handoff belongs to the source-atlas edition, `2026.09.05-atlas-1`. It changes curation and evidence records only. The XR implementation is owned by the separate development thread. No files in that implementation, the games, the shared SAN shell or the public project homepage are part of this change.

## What the three formats share

The book supplies a deliberate sequence of questions. The wiki preserves branches, full arguments, sources and challenge history. A museum trail supplies a spatially usable sequence without becoming a substitute account. All three should use the same stable source IDs and full article routes.

`data/source-atlas.json` is the complete first catalogue, including records, typed relationships, chronology intervals, selected challenge records and trails. `data/museum-manifest.json` is a smaller content handoff. It pins the exact atlas bytes by SHA-256. A consumer resolves the relative atlas path against the manifest location, checks its hash, and then resolves records by ID. This is a versioned snapshot, not a promise that every future schema will be compatible.

An exhibit stop contains a short label, record IDs, full argument URL, source-record URLs and any challenge URLs. The label is an introduction, never a replacement for the deeper argument. Changing a hypothesis's meaning requires a new version or record, not silently editing an old museum caption into a different claim. The renderer must visibly preserve source kind and hypothesis/lead status; proximity between objects is not evidence of descent.

## Scope and rights

The first atlas has 29 records, not 29 newly discovered ancient works. Work entries, translations, material-witness descriptions, a quoted fragment, modern scholarship, hypotheses and unfinished research leads are distinct kinds. A repeated URL does not create another independent witness. The full 354-chat corpus contains much more material than this first catalogue represents.

Every stop has an empty `assetIds` list. This is intentional. External images, manuscript scans and translated full texts are not licensed by the presence of a citation. Existing museum pictures in the wiki have their own provenance records and are contextual illustrations, not images of every source in the atlas. A future asset needs the correct object identity, creator/institution credit, explicit reuse basis, file hash and an accessible description before inclusion. This handoff adds no 3D models, runtime scripts, voices or reconstructions of a historical person's appearance.

## Argument fidelity is a publication requirement

The earlier-Teacher theory must retain its proposed founder, successors, descendants or repeated names, sayings transmission and relocated biography. An institutional separation/reunion proposal must not be restated as thematic resemblance alone. A source distinction may test part of the argument, but must not silently replace its strongest version with the least controversial component.

The famine record demonstrates why source rereading matters. The original author already rejected biological selection of firstborns and proposed later narration as a separate process. The appropriate open task is evidence for that proposed transformation, not the discovery that age and birth order are different variables. No medical claim is validated by this editorial recovery.

Challenge outcomes are typed in prose: a qualification recovered, a restatement mismatch, a narrow inference distinguished from a broader study, and favorable AI arithmetic requiring repair. None is represented as an AI certifying a historical identification. Selected excerpts retain speakers and hashes; the complete original turn is always accessible, including quoted material inside an author turn.

## The chapter route strengthened in this pass

The existing chapter route `catastrophe-memory` now includes the full Exodus-to-Temple interval study. It follows the earlier-Exodus argument into multiple ancient counts and explicit modern-anchor experiments. The `thomas` route now includes the manuscript/movement comparison and the completed first Melchizedek study. There remain seventeen proposed chapter routes in five movements, not seventeen approved chapters.

The three trails are `departure-and-sanctuary`, `teacher-and-carriers`, and `inheritance-and-repair`. Their eleven stops connect objects or passages to the questions that make them significant. The final trail includes clearly labeled unfinished Sibylline, Johannine and later Jewish mystical dossiers. It does not claim that those requested comparisons have already been completed.

## Work that remains shared with the roadmap

The existing `dossier-coverage` and `egypt-ethiopia` tasks advance to Draft with bounded evidence. The larger institutional-carrier claim remains open. Exact critical-edition citations, the full Daniel/Teacher calculation, the Sibylline/Johannine comparison and the history-versus-counterfactual Kabbalah question need further passage-level work. The author-review gates remain unpassed.

The nine-sheet planning workbook is refreshed from the current plan and coverage, preserving 942 formulas. The downloaded copy does not write to GitHub. A personal board move does not update public approval. The repository plan remains the shared baseline. The manifest identifies its inputs and actual workbook hash; its formula-error check is separate from scholarly assessment.

## Integration tests for the separate XR consumer

A consumer should reject unknown record IDs or an atlas hash mismatch rather than silently substitute generic content. It should offer the full argument and source links from every stop, retain date basis and unknown dates, keep hypotheses distinct from material witnesses, and display an accessible non-spatial alternative. It should never equate a discovery location with a composition location or present an interval calculation as an excavated date. None of these instructions authorizes changes to the other thread's XR runtime in this edition.
