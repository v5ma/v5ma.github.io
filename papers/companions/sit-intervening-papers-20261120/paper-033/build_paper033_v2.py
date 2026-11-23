#!/usr/bin/env python3
"""Build upgraded Paper 033 v2 Markdown from immutable baseline donor and compile
Hydrogen house-style PDF via shared/build_paper.py.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "shared"))
import build_paper  # noqa: E402

DONOR = ROOT.parent / "78-paper-house-style-release-20260729" / "build" / "public-markdown" / "Z21231875.md"
OUT_DIR = ROOT / "paper-033"


def build_paper_033_v2() -> dict:
    md = DONOR.read_text(encoding="utf-8").replace("\r\n", "\n")

    assert "{\\small June 12, 2026\\par}" in md
    md = md.replace(
        "{\\small June 12, 2026\\par}",
        "{\\small November 20, 2026 (Version 2 Successor Candidate to DOI 10.5281/zenodo.21693908)\\par}",
        1,
    )

    old_scope = "**Prior public version:** Zenodo record 21231875, DOI 10.5281/zenodo.21231875"
    assert old_scope in md
    md = md.replace(
        old_scope,
        "**Prior public versions:** Version 1 (June 12, 2026, Zenodo DOI 10.5281/zenodo.21231875) and Version 2 public house-style release (July 29, 2026, Paper 033, Zenodo DOI 10.5281/zenodo.21693908, https://pub.svgn.io/papers/paper-33/). This November 20, 2026 successor candidate corrects the Theorem 6 schedule-divisibility summary and two fibre-multiplicity wording errors (Remark RD3.1 and Theorem 10 Step 3), proves two bounded new mathematical results (Theorems 12 and 13 on the SU(2) Weyl-conjugation gauge-quotient obstruction and finite measurement-resolution capacity bounds), and adds an explicit interface crosswalk to the November 2026 four-dimensional periodic SU(2) lattice model (Model L3 in the separate SIT Version 81 monograph series).",
        1,
    )

    old_13 = "exactly uniform readout fibres (multiplicity 1); and a constants table certifying infinite extension."
    assert old_13 in md
    md = md.replace(
        old_13,
        "exactly uniform readout fibres (equal orbit-level fibre cardinality `|T(P′, K₂)| = Σ_{k=0}^{min(K₂,|P′|)} C(|P′|, k)(f-1)^k` over every attained observable value, hence multiplicity ratio `m = 1`, not fibre cardinality `1`); and a constants table certifying infinite extension.",
        1,
    )

    # Fix Theorem 6 concluding sentence: require n_j <= n_{j+1} AND f_j | f_{j+1} (not merely nondecreasing)
    old_thm6_tail = "*Composites of (a) and (b) give the tower maps for any schedule `(n_j, f_j)` with both parameters nondecreasing: holonomy channels survive refinement.*"
    assert old_thm6_tail in md
    md = md.replace(
        old_thm6_tail,
        r"*Composites of (a) and (b) give the tower maps for any schedule $(n_j, f_j)$ satisfying $n_j \le n_{j+1}$ and $f_j \mid f_{j+1}$ (in particular for the powers-of-two schedule $f_j = 2^j$ of §6; mere monotonicity $f_j \le f_{j+1}$ without divisibility is insufficient because $\mu_2 \not\subset \mu_3$): holonomy channels survive refinement.*",
        1,
    )

    old_rd31 = "the toy result is that `Y_j` is large and each value has fibre multiplicity exactly 1 (Theorem 7(a))  -  not that the side conditions do work here."
    assert old_rd31 in md
    md = md.replace(
        old_rd31,
        "the toy result is that `Y_j` is large and every attained value has identical orbit-level fibre cardinality `|T(P′, K₂)|` so the multiplicity *ratio* between any two fibres is exactly `m = 1` (Theorem 7(a))  -  not that each fibre is a singleton of size `1` (nor that the side conditions do work here). **Correction note (November 2026):** Earlier editions inadvertently wrote \"fibre multiplicity exactly 1\" here and in Theorem 10 Step 3. In fact, on the `3 × 3` vertex box `Λ₃` (`|P₃| = 4` plaquettes) with `f = 2`, `|P_obs| = 1`, `K₁ = 1`, and `K₂ = 1`, the three unobserved plaquettes admit four distinct tails (`(1,1,1), (1,1,-1), (1,-1,1), (-1,1,1)`, or `000, 001, 010, 100` in additive `Z₂` notation), so each attained readout has orbit-level fibre cardinality `4` (and `4 × 2^8 = 1,024` edge configurations), while the ratio of fibre sizes is `4/4 = 1`. Because `C_j` counts unordered pairs of distinct attained readouts in `Y_j`, this correction does not affect Theorem 10.",
        1,
    )

    old_step3 = "each value is realized with fibre multiplicity exactly 1 at the orbit level (Theorem 7(a))."
    assert old_step3 in md
    md = md.replace(
        old_step3,
        "every attained value in `Y_j` is realized with the same orbit-level fibre cardinality `|T(P′, K₂)|` (multiplicity ratio `m = 1`, Theorem 7(a)), and `C_j` counts distinct attained readouts in `Y_j` directly without conflating fibre ratio with singleton cardinality.",
        1,
    )

    old_if7 = "| Thm 7 | Projection complexity (readout) | multiplicity `m = 1` exact; Hamming separation 1 |"
    assert old_if7 in md
    md = md.replace(
        old_if7,
        "| Thm 7 | Projection complexity (readout) | multiplicity ratio `m = 1` exact (uniform fibre cardinality `|T(P′, K₂)|`); Hamming separation 1 |",
        1,
    )

    new_sections = r"""
# 6.5 New bounded theorems: SU(2) gauge-quotient obstruction and finite measurement resolution (November 2026)

To connect the finite abelian toy construction cleanly to both non-abelian lattice extensions and operational measurement limits, we prove two new self-contained theorems. Both are verified independently by exact matrix arithmetic, enumeration, and counterexample checks in `verify_paper033_v2.py` (§9).

**Theorem 12 (Global SU(2) Weyl-conjugation quotient obstruction). [PROVED]** *Let `n ≥ 2` and `f ≥ 3`, and define the diagonal group embedding `ι_diag : μ_f ↪ SU(2)` by `ι_diag(z) = diag(z, z^{-1})`, extended edgewise to `Ω_f(Λ_n) → SU(2)^{E_n}`. Then:*

*(a) (Stage 1: Irreversible global gauge-orbit collapse.) Under the constant `SU(2)` gauge transformation `W = iσ₂ = [[0, 1], [-1, 0]] ∈ SU(2)` applied uniformly at every vertex `v ∈ V_n`, every link transforms as `W diag(z, z^{-1}) W^{-1} = diag(z^{-1}, z)`, sending the entire plaquette curvature tuple `σ = (σ_p)_{p ∈ P_n}` to its conjugate inverse `σ^{-1} = (σ_p^{-1})_{p ∈ P_n}`. Consequently, every non-self-conjugate abelian curvature tuple (`σ ≠ σ^{-1}`) represents two distinct `U(1)` gauge orbits by Lemma 1 that map into the **same** `SU(2)` gauge orbit. The number of global Weyl-quotient classes in `(μ_f)^{P_n}/Z₂` is strictly smaller than `f^{(n-1)²}`:*

`#orbits_{Weyl}(n, f) = r₂^{(n-1)²} + (f^{(n-1)²} - r₂^{(n-1)²})/2`, where `r₂ = 2` if `f` is even and `r₂ = 1` if `f` is odd. **[17]**

*(b) (Stage 2: Local single-plaquette Wilson-trace collapse.) For any single-plaquette `SU(2)` gauge-invariant trace readout `p ↦ (1/2) Re Tr(U_p) = Re(σ_p)`, conjugate roots `z` and `z^{-1}` are indistinguishable on every plaquette independently. Thus each plaquette takes at most `⌊f/2⌋ + 1` distinct trace values instead of `f`, reducing the distinct single-plaquette trace-readout count on `P_obs` from `f^{|P_obs|}` to `(⌊f/2⌋ + 1)^{|P_obs|}`.*

*Proof.* Direct matrix multiplication gives `W diag(z, z^{-1}) W^{-1} = [[0, 1], [-1, 0]] [[z, 0], [0, z^{-1}]] [[0, -1], [1, 0]] = diag(z^{-1}, z)`. Because `W` is constant across vertices, `W U_e W^{-1}` is a valid `SU(2)` gauge transformation on every oriented edge `e`, and the counterclockwise boundary product around every plaquette `p` conjugates to `W diag(σ_p, σ_p^{-1}) W^{-1} = diag(σ_p^{-1}, σ_p)`. A curvature tuple `σ ∈ (μ_f)^{P_n}` satisfies `σ = σ^{-1}` iff every coordinate satisfies `σ_p² = 1`, which has `r₂ = 2` solutions (`±1`) when `f` is even and `r₂ = 1` solution (`+1`) when `f` is odd; hence exactly `r₂^{(n-1)²}` tuples are fixed and the remaining tuples pair up into 2-element Weyl orbits, proving (17). For `f ≥ 3`, `r₂ < f`, so `#orbits_{Weyl} < f^{(n-1)²}`. Part (b) follows because `Re(e^{2πik/f}) = cos(2πk/f) = cos(2π(f-k)/f)` takes exactly `⌊f/2⌋ + 1` distinct values as `k` ranges over `{0, …, f-1}`. ∎

**Remark R12.1 (exact verification and the two-stage Wilson-loop recovery boundary).** For `n = 3` (`4` plaquettes), exact enumeration confirms that `U(1)` vs. global Weyl-quotient vs. single-plaquette `SU(2)` trace-tuple counts drop across two distinct stages: `(81, 41, 16)` at `f = 3`, `(256, 136, 81)` at `f = 4`, `(1296, 656, 256)` at `f = 6`, and `(4096, 2056, 625)` at `f = 8`, with `0.0` matrix conjugation error. Crucially, the two stages behave differently under gauge-invariant observables (`verify_paper033_v2.py` at `f = 4`): adding the five larger gauge-invariant multi-plaquette Wilson-loop traces (`2×1`, `1×2`, and `2×2` loops) to the four `1×1` plaquette traces yields **exact bijective recovery** of all `136` global Weyl-conjugation classes on the `2×2` plaquette grid (`136` signatures with exactly `1` Weyl orbit per signature), recovering the information lost in **Stage 2** (`136 → 81`). However, **no gauge-invariant observable whatsoever** (including all `15` possible multi-plaquette subset loops) can distinguish two configurations already related by a gauge transformation, so **Stage 1** (`256 → 136`) cannot be undone by Wilson loops or gauge choice alone. Accordingly, an adapter into `SU(2)` cannot restore the original `256` abelian labels inside pure gauge theory: it must either accept the `136`-class `Z₂`-quotiented orbit space `(μ_f)^{P_n}/Z₂` as its domain (redefining the target accordingly), or introduce explicitly specified matter or reference data and prove that the enlarged gauge-invariant relational observables distinguish the additional labels.

**Theorem 13 (Finite measurement-resolution ceiling and exact necessary vs. sufficient footprint scaling). [PROVED]** *Fix a deterministic binned phase readout `π_{obs}^{(B)} : Ω_f(Λ_n) → {0, …, B-1}^{P_obs}` that assigns each plaquette curvature `σ_p ∈ S¹` to one of `B ≥ 2` disjoint phase bins (angular resolution `Δθ = 2π/B`) on `m = |P_obs|` observed plaquettes.*

*(a) (Fixed-detector ceiling.) For every underlying phase alphabet size `f ≥ 2` and every lattice size `n`, the number of resolved single-shot observable patterns satisfies*

`|Y_{res}(m, B, f)| ≤ min(|Y_j|, B^m) ≤ B^m`, **[18]**

*and the resolved unordered pair count satisfies `C_j^{res} ≤ C(B^m, 2) = B^m(B^m - 1)/2 < B^{2m}/2`, strictly bounded independently of `f`. Under a fixed excitation budget `K₁` (with bin `0` containing `1`), the attained binned count is further capped at `Σ_{k=0}^{min(K₁,m)} C(m, k)(B-1)^k`. Consequently, on the Theorem 10 schedule (`n_j = ⌈2^{j/2}⌉ + 1`, `f_j = 2^j`, `N_j = n_j² → ∞`) with fixed `(m, B)`, superlinear abundance `C_j^{res} ≥ N_j^{1+γ}` fails for every stage `j` with `N_j^{1+γ} > C(B^m, 2)`.*

*(b) (Exact necessary capacity condition vs. closed-form sufficient condition under explicit full word realizability.) To sustain `C_j^{res} ≥ N_j^{1+γ}` at fixed phase resolution `B ≥ 2`, the **exact necessary capacity condition** is `C(B^{m_j}, 2) ≥ N_j^{1+γ}`, equivalently:*

`B^{m_j} ≥ (1 + √(1 + 8 N_j^{1+γ})) / 2`, i.e. `m_j ≥ ⌈log_B((1 + √(1 + 8 N_j^{1+γ})) / 2)⌉`. **[19a]**

*Conversely, suppose that (i) the excitation allowance grows as `K₁(j) = m_j`, (ii) the alphabet satisfies `f_j ≥ B`, and (iii) the binning map populates all `B` phase bins with elements of `μ_{f_j}` (with `1` in bin `0`) so that **all `B^{m_j}` binned words are attained** in the image of the admissible window (note that `K₁ = m_j` alone does not guarantee full word realizability for an arbitrary alphabet and binning). Under those full-word-realizability hypotheses, the simpler closed-form inequality*

`m_j ≥ ((1+γ) log₂ N_j + 2) / (2 log₂ B)` **[19b]**

*is a **sufficient** condition guaranteeing `C_j^{res} ≥ B^{2m_j}/4 ≥ N_j^{1+γ}`, but is **not necessary** in general. Equivalently, holding `m` fixed requires the deterministic bin count `B_j` to grow polynomially in `N_j`: `B_j ≥ ((1 + √(1 + 8 N_j^{1+γ}))/2)^{1/m}`.*

*Proof.* (a) The codomain `{0, …, B-1}^{P_obs}` has cardinality `B^m`, so any map into it has image size at most `B^m` regardless of `f`; under budget `K₁` at most `K₁` coordinates can exit bin `0`, leaving at most `B-1` excited bins per excited coordinate. Since `N_j^{1+γ} → ∞` while `C(B^m, 2)` is constant, superlinear pair abundance fails past a finite stage. (b) Since `C_j^{res} ≤ C(B^{m_j}, 2) = B^{m_j}(B^{m_j}-1)/2`, solving `M(M-1)/2 ≥ N_j^{1+γ}` for `M = B^{m_j} > 0` yields the exact necessary threshold (19a). Under full word realizability (hypotheses (i)--(iii)), `|Y_j^{res}| = B^{m_j} ≥ 2`, so `C_j^{res} = B^{m_j}(B^{m_j}-1)/2 ≥ B^{2m_j}/4`, and hence (19b) implies `C_j^{res} ≥ N_j^{1+γ}`. Non-necessity of (19b) is established by the concrete counterexample in Remark R13.1. ∎

**Remark R13.1 (exact numerical checks, necessity counterexample, and fixed-$K_1$ polynomial feasibility range).** First, under the fixed-budget, fixed-footprint regime $\gamma = 1$, $K_1 = 2$, $m = 4$, and $B = 8$, the binned window saturates at $323$ patterns ($52{,}003$ pairs) for all $j \ge 3$; at stage $j = 8$ ($N_8 = 289$, target $N_8^2 = 83{,}521$), exact Hamming pair count succeeds ($76{,}507{,}180{,}035 \ge 83{,}521$) whereas the fixed-$(4, 8)$ binned readout fails ($52{,}003 < 83{,}521$). Second, under the **growing-excitation logarithmic regime $K_1(j) = m_j$** (with full bin realizability), stage $j = 8$ ($N_8 = 289$, $B = 2$, $\gamma = 1$, target $83{,}521$) provides an exact counterexample proving (19b) is not necessary: $m = 8$ fails ($C(256, 2) = 32{,}640 < 83{,}521$), while **`m = 9` succeeds** ($2^9 = 512$ patterns, $C(512, 2) = 130{,}816 \ge 83{,}521$), matching exact necessary bound (19a) ($m_{\mathrm{nec}} = 9$), whereas sufficient bound (19b) gives $9.1749$ and demands $m \ge 10$ (`verify_paper033_v2.py`). Across stages $j = 4, 8, 12, 16$ ($N_j = 25, 289, 4{,}225, 66{,}049$, available plaquettes $16, 256, 4{,}096, 65{,}536$) with $K_1 = m_j$, exact necessary (19a) vs. simple sufficient (19b) footprints are $(6, 9, 13, 17)$ vs. $(6, 10, 14, 18)$ at $B = 2$, and $(2, 3, 5, 6)$ vs. $(2, 4, 5, 6)$ at $B = 8$. Third, **with fixed $K_1$, polynomial footprint growth recovers $N_j^{1+\gamma}$ asymptotically whenever $1 + \gamma < 2 K_1$** (which holds automatically under Theorem 10's prescribed choice $K_1 = \lceil(1+\gamma)/2\rceil + 1$, where $2 K_1 \ge 3 + \gamma > 1 + \gamma$): keeping $B = 2$ (bins separating $+1$ and $-1$) and **$K_1 = 2$ fixed** at $\gamma = 1$ ($1 + \gamma = 2 < 2 K_1 = 4$), $M(m) = 1 + m + \binom{m}{2}$ gives $82{,}621 < 83{,}521$ pairs at $m = 28$ while **$m = 29 \le 256$ succeeds** ($M = 436$, $\binom{436}{2} = 94{,}830 \ge 83{,}521$); asymptotically, $m = 2n \le (n-1)^2$ for all $n \ge 4$ yields $M(2n) = 2n^2 + n + 1$ and $\binom{M(2n)}{2} > N^2$. Conversely, because the box supplies only $(n_j - 1)^2 < N_j$ plaquettes and fixed-$(B, K_1)$ pair counts scale asymptotically as $\frac{(B-1)^{2 K_1}}{2(K_1!)^2}\,m_j^{2 K_1}$, fixed-$K_1$ recovery is **eventually (asymptotically) impossible whenever $1 + \gamma > 2 K_1$** (a large fixed alphabet $B$ may meet the target at early finite stages before the exponent dominates, and at boundary equality $1 + \gamma = 2 K_1$ asymptotic feasibility requires $(B-1)^{2 K_1}/(2(K_1!)^2) > 1$; for example, at $B = 2$, $K_1 = 2$, and $\gamma = 3$, even observing all $P = (n-1)^2 \le N - 1$ plaquettes gives $M = 1 + P(P+1)/2 < N^2/2$ for $N \ge 4$ and hence $\binom{M}{2} < N^4/8 < N^4$, failing for every $n \ge 2$, verified in `verify_paper033_v2.py`).

**Remark R13.2 (conditional operational remark for repeated noisy measurements).** Theorem 13 itself is purely deterministic. Connecting the bin count $B$ to $R$ repeated noisy phase measurements via an effective resolution scaling such as $B_{\mathrm{eff}}(R) = \lfloor 2\pi\sqrt{R}/(c\sigma_\phi)\rfloor$ (which would imply $R_j \propto B_j^2$ at fixed $m$) is an **additional conditional statistical model**, not an automatic consequence of Gaussian noise. In particular, if every repeated measurement shares a common Gaussian calibration error $Z$ with variance $\mathrm{Var}(Z) > 0$, averaging $R$ shots yields $\mathrm{Var}(\bar{\theta}_R) = \mathrm{Var}(Z) + \sigma_{\mathrm{indep}}^2/R \ge \mathrm{Var}(Z)$, which never improves as $1/\sqrt{R}$ (`verify_paper033_v2.py`). Translating shrinking sample-mean error into a uniform $m$-coordinate bin-classification guarantee requires declaring five conditions: (i) independent zero-mean per-shot phase errors, (ii) stable repeated preparation or measurement of the identical curvature phase across all $R$ shots, (iii) an explicit circular phase-unwrapping convention, (iv) a **strictly positive phase margin $\delta_{\mathrm{margin}} > 0$ separating every evaluated true phase from all bin boundaries** (or a discrete phase codebook placing all allowed phases strictly inside bin interiors), and (v) a declared target misclassification probability allocated across all $m$ observed coordinates (e.g. union bound $\delta/m$ per coordinate). For **continuous symmetric unwrapped errors** (ruling out probability atoms at zero, such as a symmetric discrete error on $\{-a, 0, +a\}$ with probabilities $(1/4, 1/2, 1/4)$, which gives strict one-sided crossing probability $1/4$ rather than $1/2$), a true phase lying on a decision boundary has probability $1/2$ of **crossing that boundary** for every finite $R \ge 1$ (note that crossing one unwrapped boundary is distinct from landing inside one particular finite-width adjacent bin of width $w$, whose Gaussian probability is $\Phi(w/s) - 1/2 < 1/2$ at finite standard deviation $s$). In the declared independent Gaussian unwrapped threshold model (`verify_paper033_v2.py`), the one-boundary crossing probability $p_R(d) = \Phi(-d\sqrt{R}/\sigma_\phi)$ stays pinned at $p_R(0) = 1/2$ for all $R \ge 1$ when $d = 0$, whereas a strictly positive margin $d = \delta_{\mathrm{margin}} > 0$ drives $p_R(d) \to 0$ rapidly as $R$ grows (e.g. at $d = \sigma_\phi = 0.05$: $p_1 = 0.1587$, $p_{10} = 7.83 \times 10^{-4}$, $p_{100} = 7.62 \times 10^{-24}$); the Gaussian threshold example therefore prevents a uniform small-error classification guarantee without a positive margin.

"""

    marker_sec7 = "# 7. What this does and does not establish"
    assert marker_sec7 in md
    md = md.replace(marker_sec7, new_sections + "\n" + marker_sec7, 1)

    crosswalk = r"""

## 7.1 Explicit interface crosswalk to the November 2026 4D periodic SU(2) lattice model

Paper 033 remains a finite, two-dimensional, abelian toy-model theorem; it must not be conflated with the November 2026 four-dimensional periodic `SU(2)` lattice gauge-matter model (Model L3 in the separate SIT Version 81 monograph and Companion Paper II series). The table below records exactly which structural differences separate the two models and which interface slots remain open.

| Structural dimension | Paper 033 (`M_toy`) | November 2026 Model L3 (SIT Version 81 series) | Bridge status |
|---|---|---|---|
| Gauge group | Finite cyclic subgroup `μ_f ≅ Z_f ⊂ U(1)` | Compact matrix group `G ⊂ U(n+1)` (`U(1)`, `SU(2)`, `SU(N)`) | Open; naive `z ↦ diag(z, z^{-1})` hits irreversible Theorem 12(a) Weyl gauge quotient |
| Lattice topology | Simply connected 2D open box `Λ_n ⊂ Z²` | Periodic 4D hypercubic torus `(Z/lZ)⁴` | Open; 4D Bianchi identities and non-trivial torus cycles break Lemma 1(iii) surjectivity |
| Field content | Pure link variables `ω ∈ (μ_f)^{E_n}` | Coupled links `U`, complex coherence multiplet `ψ`, real scalar `ρ_t` | Open; `M_toy` lacks dynamical `ψ` and `ρ_t` |
| Action | Static abelian Wilson sum `Σ (1 - Re σ_p)` | Unified 4-corner AM-GM coherence-gated Wilson + hopping + site potential | Separate; Model L3 proves coupled `2L_t` OS reflection positivity & classical `C⁴` continuum limit |
| Measure | Uniform finite counting measure | Bi-invariant Haar link measure `dμ_Haar(U_e)` + compact or Gaussian site priors | Separate; finite cardinality counts have no direct continuum Haar analogue |
| Readout | Exact Hamming-separated curvature tuple on `P_obs` | Gauge-invariant plaquette traces `Re Tr(U_p)`, Polyakov loops, time-slice correlators | Open; Theorem 13 shows fixed `(m, B)` caps patterns at `B^m`. At fixed `B`, recovery requires a growing detector footprint: logarithmic `m_j` under `K₁(j) = m_j` with full word realizability, or polynomial `m_j` with fixed `K₁` when `1 + γ < 2 K₁` (automatic under Theorem 10's `K₁`, eventually impossible when `1 + γ > 2 K₁`) |

"""
    marker_sec8 = "# 8. Open problems"
    assert marker_sec8 in md
    md = md.replace(marker_sec8, crosswalk + "\n" + marker_sec8, 1)

    old_lineage = "**Version lineage and source-faithful correction.**"
    assert old_lineage in md
    nov_replay = (
        "**November 2026 verification replay [COMPUTATIONALLY CHECKED].** The standalone Python verifier "
        "`verify_paper033_v2.py` (results recorded in `paper033_v2_verification_results.json`, 4/4 checks passing) "
        "independently enumerates all `2^{12} = 4,096` edge states on `Λ₃` (`f = 2`, `|P_obs| = 1`, `K₁ = K₂ = 1`), "
        "confirming orbit size `256`, fibre cardinality `4`, and multiplicity ratio `1.0`; verifies the Theorem 6 divisibility "
        "requirement ($\\mu_2 \\not\\subset \\mu_3$ negative control vs. $2^j \\mid 2^{j+1}$); verifies the `SU(2)` Weyl-conjugation identity and exact `136`-class "
        "rectangular Wilson-loop bijection at `f = 4` (`1` Weyl orbit per signature; `0` Stage-1 `256 → 136` separation) (Theorem 12); "
        "and verifies Theorem 13 & Remarks R13.1--R13.2 including `m = 9` vs. `10` at `N = 289, B = 2`, the fixed-`K₁ = 2` polynomial "
        "recovery at `m = 29` (`1 + γ < 2 K₁`) contrasted with universal failure at `B = 2, K₁ = 2, γ = 3` (`< N^4/8 < N^4`), "
        "and noisy-readout calculations (shared Gaussian calibration error, Gaussian one-boundary crossing probability $p_R(d) = \\Phi(-d\\sqrt{R}/\\sigma_\\phi)$ at $d = 0$ vs. $d > 0$, finite-width adjacent-bin probability $< 1/2$, and symmetric discrete atom-at-zero counterexample).\n\n"
    )
    md = md.replace(old_lineage, nov_replay + old_lineage, 1)

    md_path = OUT_DIR / "Paper-033-v2-Candidate.md"
    md_path.write_text(md, encoding="utf-8", newline="\n")

    audit = build_paper.build_house_style_pdf(
        markdown_path=md_path,
        out_dir=OUT_DIR,
        pdf_filename="Paper-033-Coherence-Tower-U1-Lattice-Toy-Model-v2.pdf",
        public_title="A Constructive Coherence-Tower Theorem for a U(1) Lattice Toy Model of Super Information Theory",
        extra_resource_dirs=[
            OUT_DIR / "assets",
            ROOT.parent / "78-paper-house-style-release-20260729" / "build" / "assets",
            ROOT.parent / "78-paper-house-style-release-20260729" / "build",
        ],
    )
    (OUT_DIR / "PAPER-033-BUILD-RECEIPT.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(audit, indent=2))
    return audit


if __name__ == "__main__":
    build_paper_033_v2()
