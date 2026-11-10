# Additive discovery, recovered 2026-11-10

Integrated against master 55d9c8a21edea31231981e3cd06a8b33b2346409. This package indexes 619 canonical registered content pages and has four curated routes, including the new Paul–James evidence study. Metadata only: no archived conversation transcript content is read or reproduced. Counts distinguish archived discussions, navigation and studies; labels do not certify editorial review.

Copy this folder only into theology-wiki/discover/. Run `python theology-wiki/discover/build.py` after article builders and static-path registry updates. Run `node --test theology-wiki/discover/test.cjs`. For this isolated package, pass --root to build and WIKI_ROOT to tests. Keep discover/index.html OUT of connections/static-paths.json: indexing its entire catalogue would generate false all-site semantic connections.

Recommended outer integration, not performed here: add Find a study links in supported connections directory builder, reader additive integration and Latest navigation. Reader input may link to discover/index.html?q=ENCODED_QUERY rather than silently replace the existing search. Build this after static registry generation, before final publication-byte manifests. Do not overwrite unrelated readers or article bodies.

Browser CI: serve the built artifact and run DISCOVERY_URL=http://127.0.0.1:PORT/theology-wiki/discover/index.html python theology-wiki/discover/browser_test.py. No browser pass claimed in recovery environment; static tests, syntax and deterministic rebuild are checked. No GitHub writes performed.

Four reading routes: Pilate/authority/canon; prophecy/patterns/current power; purpose/evidence/Latest/connections; and Paul–James/early creeds/Eusebius–Bauer. The companion study and route ship together.
