# Super Information Theory: The Coherence Conservation Law Unifying the Wave Function, Gravity, and Time (Version 81)

Micah Blumberg · Self Aware Networks Research Institute · ORCID [0009-0004-5175-9532](https://orcid.org/0009-0004-5175-9532) · https://selfawarenetworks.com

November 20, 2026 (Version 81 monograph updated November 19, 2026). Paper 115 in the author's public research library.

- [Master Monograph PDF (187 pages)](papers/sit81-master-monograph/Super_Information_Theory_81.pdf)
- [Publication Handoff](SIT81-MONOGRAPH-HANDOFF.md)
- [Source Manifest](SOURCE-MANIFEST.json)

## Reviewed Provenance

- **Reviewed source commit:** `dc949cbcf39d7527a922b10f15a91265d11ba243`
- **Primary PDF:** `Super_Information_Theory_81.pdf` (`187` pages, `1,511,428` bytes)
- **Primary PDF SHA-256:** `9c76d6116003810465887d51ab4ccf55bc505ffd20bc3de634f98adda9786ab0`
- **Assembled single-file TeX SHA-256:** `af4d2c7fd0df978c5a16e19918db40fde2a63dfeabf3f536d27d55e2cd88b496`
- **Verification suite:** `reviews/verify_sit81_math.py` (`20/20` passing symbolic and negative-control checks) and `reviews/verify_sit81_monograph.py` (`reviews/SIT81-MONOGRAPH-AUDIT-RECEIPT.json`, `reviews/SIT81-HYDROGEN-STYLE-RECEIPT.json`)

## Declared Scientific Status and Scope

This release is presented as a **working effective field theory (EFT) and mathematical research monograph / preprint** (not peer reviewed). Under its five-tier epistemic ledger (`QG49`), bounded machine-checked Lean 4.30 formal theorems, analytical derivations, the 20-check symbolic/numerical verification suite, conditional phenomenology, retired historical branches, and unsolved open problems (`OPEN-1` through `OPEN-6`) keep their distinct meanings. Passing twenty regression checks supports the specific mathematical calculations they test; it does not establish experimental confirmation of Super Information Theory or complete its foundational observational, microscopic, or quantum-gravity program.

Version 81 preserves explicit chronology after Version 79 (December 18, 2025, DOI `10.5281/zenodo.18133332`) and the July 2026 compact corrective Version 80 lineage (Paper 002, DOI `10.5281/zenodo.21693867`, July 29, 2026), explicitly separating the July conformal benchmark from the November 2026 multiplicative action `M_AUTH_SIT_EFT_v1`.

## Build and Verification Instructions

1. **Compile the 187-page PDF from LaTeX source (XeLaTeX + Times New Roman):**
   ```bash
   cd papers/sit81-master-monograph
   xelatex --interaction=nonstopmode Super_Information_Theory_81.tex
   xelatex --interaction=nonstopmode Super_Information_Theory_81.tex
   ```
   A byte-exact single-file mirror is also included at `papers/sit81-master-monograph/Super_Information_Theory_81_singlefile.tex` alongside the four vector figures in `papers/sit81-master-monograph/figures/`.
2. **Replay the 20-check symbolic mathematics verification suite (Python 3 + SymPy + NumPy):**
   ```bash
   python reviews/verify_sit81_math.py
   ```
   The corresponding committed receipts are stored in `reviews/SIT81-MATH-VERIFICATION-RECEIPT.json`, `reviews/SIT81-MONOGRAPH-AUDIT-RECEIPT.json`, and `reviews/SIT81-HYDROGEN-STYLE-RECEIPT.json`.

## Rights

Original manuscript prose, figures, documentation, and verification receipts are released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Original verification scripts are supplied for inspection and reproduction. Subsequent theoretical developments and corrections will appear in versioned follow-ups.
