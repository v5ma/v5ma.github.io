# Public Release Provenance and Byte-for-Byte Fidelity Note

- **Author release authorization date:** 2026-11-22 (22 November 2026)
- **Audited private source commit:** `2a9743a6256219aabc412d3c9edabccfac62f912` (branch `research/sit-intervening-papers-upgrade-20261119`)
- **Scope:** Eleven upgraded Super Information Theory (SIT) papers (`002`, `003`, `007`, `014`, `028`, `033`, `034`, `048`, `055`, `062`, `063`; 182 US Letter pages total) published as new versions of their existing records while preserving all July 29, 2026 editions and concept DOIs intact.
- **Companion monograph:** Super Information Theory: Version 81 (Paper 115, DOI `10.5281/zenodo.24406082`).

## Why Internal Pre-Release Wording Remains Verbatim Inside the PDFs

Every published PDF in this eleven-paper release is reproduced **byte-for-byte** from the externally reviewed and audited commit `2a9743a6256219aabc412d3c9edabccfac62f912` without recompilation. Preserving exact PDF byte identity and SHA-256 digests maintains an unbroken, independently verifiable cryptographic link between the audited review commit and the public records on Zenodo, OSF, public GitHub, and `pub.svgn.io`.

Because the PDFs were frozen at final review sign-off and not recompiled after author authorization, internal subtitle labels or release-status notices inside the PDFs (such as "Successor Candidate", "private review candidate", or "public upload on hold awaiting author authorization") reflect the pre-release audit state at commit `2a9743a6256219aabc412d3c9edabccfac62f912`. Author release authorization was granted on November 22, 2026; these records are now publicly released under CC BY 4.0.

## Declared Scientific Scope

All eleven papers are working research preprints (not peer reviewed). The ten mandatory Python verification scripts (`REQUIRED_VERIFIERS` in `shared/verify_portfolio_pass2.py`, with Paper 028 documented as an index-only governance and translation guide) verify the specific algebraic identities, conservation equations, dimensional controls, lattice bounds, and numerical calculations declared within each individual model. Passing automated verification checks supports the tested calculations within each paper's explicitly stated assumptions and limitations; it does not claim that Super Information Theory has been experimentally established.

## Reproducing Verification Non-Destructively

```bash
python shared/verify_portfolio_pass2.py --execute-verifiers
python shared/verify_portfolio_pass2.py
```

## Frozen PDF Cryptographic Roster (All 11 Papers)

| Paper | Version | Concept DOI | Exact Reviewed PDF Filename | Pages | Bytes | SHA-256 |
|---|---|---|---|---:|---:|---|
| 002 | v2.0 | `10.5281/zenodo.16922511` | `Paper-002-Super-Information-Theory-Overview-v2.pdf` | 29 | 280531 | `42e5cee0f1d022ef6833f0ecfdbd711c1aaf6522f71f42f679df799adef56357` |
| 003 | v4.0 | `10.5281/zenodo.21231154` | `Paper-003-Level-0-SIT-Condensate-Source-Contract-v4.pdf` | 12 | 177473 | `fb6489d914dbda024cb2437d19ed51aca2945c649d59fdbd9d2fc213ea0d584b` |
| 007 | v2.0 | `10.5281/zenodo.16922501` | `Paper-007-Super-Dark-Time-v2.pdf` | 24 | 250471 | `a975dc0cf2a2a24571001f63b46c4f04d3608b6f7af76358f5691f6c91364deb` |
| 014 | v3.0 | `10.5281/zenodo.21231162` | `Paper-014-BEC-Coherence-Gravity-Test-Design-v3.pdf` | 13 | 188749 | `1b2be34117b2e020018cc43eff3184c09faa09fd4505cbd5d6c5092a58f423ff` |
| 028 | v2.0 | `10.5281/zenodo.21231164` | `Paper-028-Cross-Disciplinary-SIT-Translation-Guide-v2.pdf` | 13 | 187982 | `3534bb36bb3458e88e6c1a72012d5fb2f4ff93595fa3f53f7f62fb5aa5117744` |
| 033 | v2.0 | `10.5281/zenodo.21231874` | `Paper-033-Coherence-Tower-U1-Lattice-Toy-Model-v2.pdf` | 20 | 558776 | `64819db0c3bead5c5aa1a9fbfdf3684acddeb94942fc79f92a42b10c94fb7f76` |
| 034 | v2.0 | `10.5281/zenodo.21231145` | `Paper-034-SuperTimePosition-Gravitational-Phase-Lock-v2.pdf` | 11 | 164786 | `a9d5e1fb6821c7759813f21df80db3f09ece5880a4933ac6c16dfef82e7b9bb3` |
| 048 | v2.0 | `10.5281/zenodo.21683861` | `Paper-048-Causal-Fermion-Systems-and-SIT-v2.pdf` | 18 | 193847 | `6622c8fb16c3aa687ea5962e401b7c23ab8694fb42262a93c964b32100250424` |
| 055 | v2.0 | `10.5281/zenodo.21683886` | `Paper-055-QGTCD-Constraints-Note-v2.pdf` | 16 | 203474 | `f8a8282eb2b17fb2ad3950e42e46887be26cbc3a3d5bb25ecd7c9941b559319d` |
| 062 | v2.0 | `10.5281/zenodo.21683906` | `Paper-062-Quantum-Entropic-Force-QGTCD-SIT-v2.pdf` | 16 | 199752 | `de904d939fb01a4397cd130970e31395a35304617b668e946d9d78a19a602c0b` |
| 063 | v2.0 | `10.5281/zenodo.21683910` | `Paper-063-Harpers-Beyond-Square-Root-Conjecture-and-SIT-v2.pdf` | 10 | 169075 | `5ebb186957de36dba9ebf177486df63326a4c66c009db1dc34f0bb742d529b8f` |
