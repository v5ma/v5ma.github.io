#!/usr/bin/env python3
"""Build upgraded Paper 063 v2 Markdown from immutable baseline donor and compile
Hydrogen house-style PDF via shared/build_paper.py.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "shared"))
import build_paper  # noqa: E402

DONOR = ROOT.parent / "78-paper-house-style-release-20260729" / "build" / "public-markdown" / "NP21.md"
OUT_DIR = ROOT / "paper-063"


def build_paper_063_v2() -> dict:
    md = DONOR.read_text(encoding="utf-8").replace("\r\n", "\n")

    assert "{\\small July 27, 2026\\par}" in md
    md = md.replace(
        "{\\small July 27, 2026\\par}",
        "{\\small November 20, 2026 (Version 2 Formal-Language and Distinctiveness-Control Revision to DOI 10.5281/zenodo.21693947)\\par}",
        1,
    )

    old_abs_tail = (
        "approximate orthogonality; cancellation; operational equivalence; causal interface sequence;\n"
        "chronology; partial priority\n\n"
        "MICHAHABSTRACTCLOSEMARKER\n\n"
        "\\noindent\\textbf{Keywords:} Super Information Theory; QGTCD; Harper's conjecture; random multiplicative functions;"
    )
    assert old_abs_tail in md
    md = md.replace(
        old_abs_tail,
        "MICHAHABSTRACTCLOSEMARKER\n\n"
        "\\noindent\\textbf{Keywords:} Super Information Theory; QGTCD; Harper's conjecture; random multiplicative functions; "
        "approximate orthogonality; cancellation; operational equivalence; causal interface sequence; chronology; partial priority",
        1,
    )

    old_abs_phrase = "and explicit\ncategory / process translations, the audit recovers"
    assert old_abs_phrase in md
    md = md.replace(
        old_abs_phrase,
        "and a proposed schematic categorical and process representation of a bounded analogy "
        "(evaluated against four ordinary null baselines), the audit recovers",
        1,
    )

    sec6_start = md.index("# 6. Category-theory and process-equivalence translations")
    sec7_start = md.index("# 7. Why the archival probability calculation fails closed")
    new_sec6 = r"""# 6. Proposed schematic categorical and process representations (revised formal status)

**Revision note (November 20, 2026).** The July 2026 edition described Sections 6.1 and 6.2 as demonstrating a "partial structure-preserving map on a selected subcategory" and "partial trace equivalence under a restricted observable projection." A post-publication formal audit noted that the inspected text displays coarse object correspondences and informal sequential processes without supplying complete category definitions (explicit hom-sets, identity laws, and associative domain-level composition) or complete labeled transition systems with proved preservation theorems. This revision adjusts that formal language so every mathematical status is stated accurately: only the trivial four-stage sequential skeleton is formally isomorphic, while the domain-level correspondence is presented strictly as a **proposed schematic categorical and process representation of a bounded analogy**. This revision does not independently re-adjudicate the complete historical priority dossier of Sections 2--4.

## 6.1 Schematic categorical representation (and exact trivial-skeleton boundary)

At the purely combinatorial skeleton level, let $\mathcal{P}_4$ be the finite linear preorder category with four objects $\{0, 1, 2, 3\}$ and a unique morphism $i \to j$ whenever $i \le j$ (4 objects and 10 morphisms total, satisfying identity and associative composition identically). Any four-stage sequential workflow maps onto $\mathcal{P}_4$ by sending its four labeled stages to $0 \to 1 \to 2 \to 3$.

For the domain-level analogy, write $\mathcal{S}_M = (S_M, R_M, D_M, O_M)$ for the schematic Micah-side stages (local state, expected/symmetric reference, difference or drift, and aggregate output) and $\mathcal{S}_W = (S_W, R_W, \Delta_W, O_W)$ for the schematic Wang--Xu stages (character/RMF state, conditioning regime, moment difference/error, and family bound), with stage-by-stage pairing

\[
F(S_M)=S_W,
\quad F(R_M)=R_W,
\quad F(D_M)=\Delta_W,
\quad F(O_M)=O_W.
\tag{10}
\]

| Schematic element | Micah side | Target side | Formal status |
|---|---|---|---|
| Stage label | current / local state | character or RMF family state | schematic role pairing only |
| Directed step | compare / cancel / bias | condition / average / bound | preserves $\mathcal{P}_4$ linear order only |
| Composition | state -> difference -> update | family -> moment error -> bound | schematic four-stage CIS order |
| Coarse invariant | zero versus nonzero aggregate residue | controlled cancellation / error | restricted binary-flag analogy |
| Lost information | neural / physical substrate and direction | arithmetic definitions and theorem hypotheses | substantial on both sides; no domain functor proved |

Because domain-level morphisms, hom-sets, and functorial composition equations ($F(g \circ f) = F(g) \circ F(f)$ on actual mathematical operators) are not constructed between the neural/stochastic domain and the analytic-number-theory domain, Equation (10) is **not** a proved functor on a domain-level subcategory. Its exact mathematical status is a **proposed schematic categorical representation of a bounded four-stage analogy** (trivially isomorphic only after collapsing both sides to the four-object preorder $\mathcal{P}_4$).

## 6.2 Schematic process representation

Write the Micah workflow schematically as

\[
P_M = \textsf{receive}(S)\,;\,\textsf{compare}(S,\widehat S)\,;\,
\textsf{emit}(D)\,;\,\textsf{update}(O),
\tag{11}
\]

and the target workflow schematically as

\[
P_W = \textsf{sample}(\chi)\,;\,\textsf{condition}(R)\,;\,
\textsf{compareMoments}(\chi,f)\,;\,\textsf{emitBound}(\varepsilon).
\tag{12}
\]

Equations (11) and (12) are informal sequential pseudocode, not full labeled transition systems with operational semantics, state invariants, and proved trace-language inclusion. Only after erasing all domain transitions and collapsing each workflow to the three-field summary tuple $(\text{regime}, \text{residual\_nonzero}, \text{aggregate\_changed}) \in \{(\text{symmetric}, \text{false}, \text{false}),\, (\text{asymmetric}, \text{true}, \text{true})\}$ do the two summary tuples match. Accordingly, Equations (11)--(12) represent a **proposed schematic process representation of a bounded analogy**, not a proved partial trace equivalence theorem, strong bisimulation, weak bisimulation, or functional isomorphism.

## 6.3 Distinctiveness control against four ordinary null baselines

To test how distinctive the coarse four-stage Causal Interface Sequence (Equation 8) and the exact zero/nonzero three-field summary trace really are, the standalone script `verify_paper063_v2.py` evaluates four standard mathematical and engineering baselines that predate both corpora and share no domain-specific machinery with either Micah's SIT/QGTCD equations or Wang--Xu's random multiplicative functions. For the 1D random walk, the exact zero/nonzero trace classification is evaluated on **exact analytical population expectations** ($\mathbb{E}[\Delta X] = 0$ at $p = 1/2$ vs. $\mathbb{E}[\Delta X] = 1/10$ at $p = 11/20$), cleanly separated from the finite-sample Monte Carlo realization ($N = 4{,}000$, sample mean $-0.0095$ within $3\,\mathrm{SE}$ where $\mathrm{SE} = 0.01581$, which is a tolerance-checked empirical draw rather than an exact zero):

| Null baseline | Exact symmetric-regime check | Exact broken-symmetry check | Matches exact 4-stage CIS & summary trace? | Contains A07--A11 or A13? |
|---|---|---|---|---|
| 1D random walk (population law, $p=1/2$ vs. $11/20$) | Exact $\mathbb{E}[\Delta X] = 0$ (MC $N=4000$: $-0.0095 \pm 0.0158$) | Exact $\mathbb{E}[\Delta X] = +1/10$ (MC: $+0.0905$) | **Yes** | No |
| Scalar Kalman prediction-error filter ($K=0.25$) | Max innovation $0.0$ | Initial innovation $1.0$, updated state $1.0000$ | **Yes** | No |
| Difference coding / DPCM (constant vs. step) | Max difference $0.0$ | Residual $\ell_1 = 1.0$, exact reconstruction error $0.0$ | **Yes** | No |
| Regular perturbation $H(\varepsilon)=I+\varepsilon\sigma_x$ | Eigenvalue splitting $0.0$ | Splitting $2\varepsilon = 0.2$ at $\varepsilon = 0.1$ | **Yes** | No |

All four ordinary baselines (**4/4**, or 100% of tested null controls) instantiate the exact same four-stage preorder $\mathcal{P}_4$ and exact binary zero/nonzero summary trace, while containing zero domain-specific atoms from either Wang--Xu (A07--A11) or Micah's SIT/QGTCD corpus (A13). This quantitative control establishes an important methodological boundary: passing the coarse four-stage schematic chain has **low discriminative specificity on its own**. Any defensible priority finding rests strictly on the specific dated historical texts audited in Sections 2--4 rather than on the presence of a generic four-stage cancellation-to-residual diagram.

"""
    md = md[:sec6_start] + new_sec6 + md[sec7_start:]

    old_dm = (
        "Public\ndeposit remains a separate author / repository release. External analytic-number-theory, probability,\n"
        "and source review remains invited, but no unresolved external review is represented as substantive\n"
        "local manuscript work."
    )
    assert old_dm in md
    md = md.replace(
        old_dm,
        "**Version lineage and release status (updated November 20, 2026):** The July 27, 2026 edition was publicly deposited "
        "on July 29, 2026 as Paper 063 (Zenodo DOI 10.5281/zenodo.21693947, https://pub.svgn.io/papers/paper-63/). "
        "This November 20, 2026 successor candidate preserves that historical record, adjusts the formal language of Sections 6.1--6.2 "
        "to accurately state schematic analogy status, evaluates the four-baseline distinctiveness control in Section 6.3 "
        "using exact analytical population expectations separated from finite-sample Monte Carlo checks "
        "(verified in `verify_paper063_v2.py` / `paper063_v2_verification_results.json`), and updates chronology alignment "
        "with the SIT portfolio dictionary (Paper 028). External analytic-number-theory, probability, and source review remain invited.",
        1,
    )

    md_path = OUT_DIR / "Paper-063-v2-Candidate.md"
    md_path.write_text(md, encoding="utf-8", newline="\n")

    audit = build_paper.build_house_style_pdf(
        markdown_path=md_path,
        out_dir=OUT_DIR,
        pdf_filename="Paper-063-Harpers-Beyond-Square-Root-Conjecture-and-SIT-v2.pdf",
        public_title="Physics in Review: Harper's Beyond Square-Root Conjecture and Super Information Theory",
    )
    (OUT_DIR / "PAPER-063-BUILD-RECEIPT.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(audit, indent=2))
    return audit


if __name__ == "__main__":
    build_paper_063_v2()
