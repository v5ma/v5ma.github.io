# Structural equivalence authorial supplement

The October 26, 2026 explanation preserves Micah Blumberg's definitions, affirmative account, and four applications. It separates the author's characterization from the specific limits of the publicly inspectable examples. It does not reproduce a private patent draft or link private conversations.

Canonical prose is `article.md`. `build.cjs` produces the complete static `index.html`, pins source and output hashes in `build-report.json`, and adds an idempotent prominent navigation strip to both reader entry points. The normal Theology builder invokes this scoped builder. Earlier article bodies, original source chats, and the existing global search/listening indexes are unchanged; this is a linked supplementary study, not a newly indexed principal article or recording.

Build: `node theology-wiki/structural-equivalence/build.cjs`.

Test: `node --test theology-wiki/structural-equivalence/test.cjs`.

The page requires no JavaScript, accounts, external fonts, analytics, or runtime AI. All prose, citations, section navigation, and return links work as ordinary HTML. Publication is verified separately through the configured deployment and actual public content; a passing local test is not a deployment receipt or independent validation of the method.
