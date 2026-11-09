# Jesus, resurrection and empire

Published November 9, 2026. Four connected inquiries extend the existing Theology Wiki: purpose and comparative method; argument development; early creeds and angel narratives; first-century imperial pressure and Pilate.

The canonical source for this additive section is `sources/*.md`. `manifest.json` supplies titles, navigation and summaries. These are edited chapters, not private-conversation transcripts. One short authorial statement of purpose is explicitly quoted. No new private third-party correspondence or identifying material is included.

The inquiry preserves the ambitious question about recovering an unorthodox interpretation, while distinguishing textual observations, historical hypotheses, theology and alternative readings. Bibliographic and access notes are part of each chapter. Earlier studies and archival transcripts remain unchanged.

Build and validate from the repository root:

```
node theology-wiki/jesus-resurrection-empire-20261109/build.cjs
node theology-wiki/jesus-resurrection-empire-20261109/build.cjs --check
node --test theology-wiki/jesus-resurrection-empire-20261109/test.cjs
python theology-wiki/jesus-resurrection-empire-20261109/browser-test.py
node theology-wiki/latest/build.cjs --check
node --test theology-wiki/latest/test.cjs
```

The deterministic builder reuses the existing supplemental Markdown renderer. It generates complete static pages, a local full-text search index and content hashes. Search covers the chapters in this section only; main-reader search and listening are not regenerated. All chapter content and navigation remain available without JavaScript. Browser checks use installed Playwright and Chromium, serve the repository locally, and cover desktop/mobile, search, filtering, clearing, history and no-JavaScript reading.

The release adds four entries to Latest without changing earlier release entries. Public verification must compare hosted bytes against the actual published commit before reporting the release live. Passing software checks establishes navigation and publication integrity, not the truth of a historical reconstruction.

## Nag Hammadi and crucifixion extension

Five further studies, published November 9, 2026, extend the four original inquiries to nine chapters. They compare NHC VII,3 and NHC I,3, canonical ransom and victory language, institutional coercion and manuscript survival. Canonical source is still `sources/*.md`; `manifest.json` records eleven verified main-reader routes used by real wikilinks. The source distinguishes observations, historical hypotheses, constructive applications and competing views. All four earlier chapters retain their original prose and gain a short reciprocal-links section. The purpose reading map and Latest expose the new studies. The section’s search covers all nine chapters; the main reader index is not rebuilt.

Tests additionally check resolved wikilinks, citation anchors, preserved earlier prose, reciprocal connections and interpretation boundaries. `prior-source-hashes.json` fixes the four original article bodies so additive connections cannot silently replace them. The five new pages are edited research, not a verbatim publication of a private conversation.

## Mandaean origins, Constantine and Dead Sea Scrolls extension

Three further source-linked studies bring the series to twelve chapters. Each original chapter gains a bounded reciprocal connection while retaining every prior paragraph and wikilink. `origins-prior-source-hashes.json` protects the nine chapter bodies as published at f851922; the earlier four-chapter preservation receipt also remains enforced. The new sources distinguish Mandaean tradition and competing origin hypotheses, stages of fourth-century consolidation, Jewish textual plurality, and direct versus comparative connections.

The section search, navigation, reading map and Latest are rebuilt. Main-reader content, original conversations and narration assets remain unchanged. Tests cover all twelve chapters, bibliography anchors, real wikilinks, preserved text and new historical interpretation boundaries.

## Eusebius and Walter Bauer extension

The thirteenth chapter compares the apostolic-continuity narrative with Bauer’s 1934 regional thesis, the 1971 English translation, scholarly precursors and criticism, and the limits of source survival. Six earlier chapters receive a reciprocal connection. Every previous source body is preserved after removing only the new, clearly titled bridge; `eusebius-prior-source-hashes.json` records the twelve source hashes at f3afe118. The earlier preservation checks remain enforced.

The series navigation and full-text search, Latest and purpose reading map include the chapter. Main-reader content, original conversations, public corpus snapshots and narration assets remain unchanged. The page uses numbered citations with explicit source-access notes and distinguishes an ancient classification, a modern reconstruction and a theological judgment.


## Canon boundaries and Pilate reception extension

Two source-linked studies extend the series to fifteen chapters. The scrolls/canon comparison distinguishes Jewish scriptural authority, Eusebius’s actual Christian categories, Josephus’s twenty-two books, textual plurality, inherited concepts and specific evidence for imperial influence. The Pilate reception study compares Philo, Josephus, canonical narratives, the Gospel of Peter, Tertullian, Eusebius and Ethiopian commemoration. These are edited research chapters, not published private correspondence or a video transcript.

Six earlier chapters gain bounded reciprocal bridges. `canon-pilate-prior-source-hashes.json` preserves the thirteen source bodies at 9ac775c911adef6a9e0e7b3855dddbe9f4ff3879; every older preservation receipt remains enforced. Section search, navigation, Latest and the purpose reading map include the new chapters. Original conversations, main-reader search, recordings, corpus snapshots and all other article bodies remain unchanged. The existing deployment workflow is unchanged. Passing content and browser checks is distinct from verified public deployment.
