#!/usr/bin/env python3
"""Build upgraded Paper 014 v3 Markdown from immutable July 2026 baseline donor
and compile Hydrogen house-style PDF via shared/build_paper.py.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "shared"))
import build_paper  # noqa: E402

DONOR = ROOT.parent / "78-paper-house-style-release-20260729" / "build" / "public-markdown" / "Z21231163.md"
OUT_DIR = ROOT / "paper-014"


def build_paper_014_v3() -> dict:
    md = DONOR.read_text(encoding="utf-8").replace("\r\n", "\n")

    assert "{\\small July 2026\\par}" in md
    md = md.replace(
        "{\\small July 2026\\par}",
        "{\\small November 20, 2026 (Version 3 Calibrated Apparatus and Identifiability Candidate to DOI 10.5281/zenodo.21693886)\\par}",
        1,
    )

    new_sec = r"""
# 10.5 Synthetic $^{87}\mathrm{Rb}$ Apparatus Instantiation, Multivariable EIV Attenuation, and Declared Source-Mass Sensitivity (November 2026)

To move Paper 014 beyond uniform-sphere software fixtures into an explicit conditional apparatus calculation, the standalone verification suite `verify_paper014_v3.py` (results locked in `paper014_v3_verification_results.json`, 2/2 suites passing) instantiates two concrete cold-atom configurations with declared pulse sequences, nuisance models, measurement-error hierarchies, and Fisher-information identifiability analyses. **Epistemic status:** All Fisher-information and attenuation numbers below are **synthetic conditional design calculations** evaluated under explicitly assigned noise and nuisance assumptions; no empirical laboratory calibration records are claimed.

## Configuration A: Dual-arm $^{87}\mathrm{Rb}$ Raman Mach--Zehnder free-fall interferometer

We specify a standard $^{87}\mathrm{Rb}$ D2 Raman Mach--Zehnder interferometer ($\pi/2 - T - \pi - T - \pi/2$ pulse sequence, $\lambda = 780.241\,\mathrm{nm}$, effective wavevector $k_{\mathrm{eff}} = 4\pi/\lambda = 1.6106 \times 10^7\,\mathrm{m}^{-1}$, interrogation time $T = 0.25\,\mathrm{s}$, total drop $2T = 0.50\,\mathrm{s}$) in Earth gravity ($g = 9.80665\,\mathrm{m/s}^2$, vertical gravity gradient $\Gamma_{zz} = 3.086 \times 10^{-6}\,\mathrm{s}^{-2}$). The differential acceleration phase sensitivity is $S_\eta = k_{\mathrm{eff}} g T^2 = 9.8715 \times 10^6\,\mathrm{rad}$ per unit $\eta_0$. We assign a per-shot combined quantum-projection and Raman laser phase noise of $\sigma_\phi = 3.0\,\mathrm{mrad}$ across a fixed experimental budget of $M_{\mathrm{tot}} = 2{,}000$ total shots.

Crucially, the observation model includes the dominant temperature-coupled and position-coupled ordinary systematics:

\[
\phi_i = S_\eta \eta_0 f_{c,i}
+ \alpha_{\mathrm{wf}} \frac{T_i}{R_{\mathrm{wf},i}}
+ \alpha_{\mathrm{grad}}\,\delta z_i
+ c_0
+ \varepsilon_i,
\]

where the wavefront-curvature phase $\Delta\phi_{\mathrm{wf}} \approx k_{\mathrm{eff}} (k_B T / m_{\mathrm{Rb}}) T^2 / R_{\mathrm{wf}}$ reaches **$38.52\,\mathrm{mrad}$** for a $200\,\mathrm{nK}$ cloud at $R_{\mathrm{wf}} = 500\,\mathrm{m}$ ($12.8\times$ larger than single-shot phase noise) and varies strongly with cloud temperature $T_i$, which is anti-correlated with condensate fraction $f_{c,i}$ along any single-trap evaporative cooling ramp ($T_i \approx T_c(1 - f_{c,i})^{1/3}$).

Comparing three synthetic run-allocation designs at identical total shot budget ($M_{\mathrm{tot}} = 2{,}000$) yields a sharp identifiability hierarchy:

| Design (synthetic, $M = 2{,}000$ shots, $\sigma_\phi = 3\,\mathrm{mrad}$) | Collinearity ($R^2$) | $\mathrm{VIF}(\eta_0)$ | Conditional $1\sigma$ reach $\sigma(\eta_0)$ | Multivariable EIV attenuation (arm-level $\sigma_{f_c}=0.03$) |
|---|---|---|---|---|
| (i) Binary BEC ($f_c = 0.85$) vs. thermal ($f_c = 0$) | Rank $2 < 3$ | $\infty$ | Unbounded | Non-identifiable |
| (ii) 5-level $f_c$ ramp only ($T_c = 226\,\mathrm{nK}$, $R_{\mathrm{wf}} = 500\,\mathrm{m}$) | $R^2 = 0.98434$ | $63.84$ | $1.78 \times 10^{-10}$ | **$0.61914$ ($38.09\%$ bias!)** |
| (iii) 10-arm orthogonalized ($T_c \in \{226, 340\}\,\mathrm{nK}$, $R_{\mathrm{wf}} \in \{500, 250\}\,\mathrm{m}$, $\delta z = \pm 10\,\mu\mathrm{m}$) | $R^2 = 0.20052$ | $1.251$ | $2.49 \times 10^{-11}$ | **$0.98809$ ($1.19\%$ bias)** |

The $7.14\times$ Fisher-information sensitivity gain matches $\sqrt{63.84 / 1.251} = 7.144$ exactly under the declared noise and nuisance model.

## Multivariable errors-in-variables (EIV) attenuation and measurement-error hierarchy

When nuisance regressors are strongly correlated with $f_c$, the single-predictor OLS attenuation formula $\mathrm{Var}(f_c)/(\mathrm{Var}(f_c) + \sigma_{f_c}^2)$ is **not valid** as a substitute for the nuisance-adjusted multivariable EIV calculation. For $\mathrm{Var}(f_c) = 0.0934$ and $\sigma_{f_c} = 0.03$, that single-predictor-only illustration gives $0.990456$ ($0.954\%$ bias), which severely understates the true population attenuation whenever $\mathrm{VIF} \gg 1$.

For independent classical error $\sigma_{f_c}$ in $f_c$ with exact nuisance regressors $\mathbf{Z}$, the Frisch--Waugh residual variance $\mathrm{Var}(f_{c,\mathrm{res}}) = \mathrm{Var}(f_c)/\mathrm{VIF}$ governs OLS attenuation identically to the full population normal-equation matrix $\bigl[(\Sigma_{XX} + \Sigma_{EE})^{-1}\Sigma_{XX}\bigr]_{00}$ (verified to discrepancy $< 2 \times 10^{-15}$ in `verify_paper014_v3.py`):

\[
\lambda_{\mathrm{EIV,multivar}} = \frac{\mathrm{Var}(f_{c,\mathrm{res}})}{\mathrm{Var}(f_{c,\mathrm{res}}) + \sigma_{f_c}^2}.
\]

In collinear Design (ii) ($\mathrm{VIF} = 63.838$), $\mathrm{Var}(f_{c,\mathrm{res}}) = 0.001463082$, so $\sigma_{f_c} = 0.03$ produces population attenuation **$0.619141$ ($38.09\%$ downward bias)** --- nearly $40\times$ larger than the naive single-predictor bias! By contrast, orthogonalized Design (iii) ($\mathrm{VIF} = 1.251$) increases $\mathrm{Var}(f_{c,\mathrm{res}})$ to $0.074671$, reducing the same arm-level $\sigma_{f_c} = 0.03$ attenuation bias to **$1.19\%$** ($\lambda_{\mathrm{EIV}} = 0.988091$).

Crucially, the actual attenuation in a laboratory realization depends on the **measurement-error hierarchy** and sampling model, which must be declared explicitly alongside the estimator:

1. **Independent per-shot classical error ($\sigma_{\mathrm{shot}} = 0.03$) in shot-level OLS:** enters directly at variance $0.03^2$, giving population attenuation $0.619141$ ($38.09\%$ downward bias) in Design (ii) and $0.988091$ ($1.19\%$) in Design (iii).
2. **Independent per-shot classical error averaged into arm means ($\sigma_{\mathrm{arm,mean}} = 0.03/\sqrt{M_{\mathrm{arm}}}$):** averages down across $M_{\mathrm{arm}} = 400$ shots/arm in Design (ii) (reducing population attenuation bias to $0.154\%$) and $M_{\mathrm{arm}} = 200$ shots/arm in Design (iii) ($0.006\%$).
3. **Arm-level error in estimating realized arm means ($\sigma_{\mathrm{arm}} = 0.03$) vs. physical preparation scatter:** classical error in estimating an arm's actual realized mean condensate fraction does *not* average down with repeated shots under a fixed arm-calibration estimate, giving population attenuation $0.619141$ ($38.09\%$) in Design (ii) versus $0.988091$ ($1.19\%$) in Design (iii) under the random-arm classical sampling model. Physical preparation scatter around an assigned nominal setpoint is a distinct statistical structure (Berkson-type / hierarchical random-effect variation rather than pure classical measurement error), and for any single fixed finite set of noisy arm means, repeating shots within those same arms does not force the realized finite-sample bias to equal one universal population attenuation number.
4. **Common session-wide additive offsets versus classical within-observation correlated errors and calibration drifts:** shared calibration uncertainties must not be lumped together, because their statistical effects differ sharply. Under OLS with a fitted intercept ($y = \beta_f f + \beta_z z + b$), a **common session-wide additive offset** shifting every $f_i \mapsto f_i + c$ and $z_i \mapsto z_i + d$ leaves **both slopes strictly invariant** and shifts only the intercept to $b - \beta_f c - \beta_z d$ (verified on Design (ii)'s five-level grid in `verify_paper014_v3.py`: true $(\beta_f, \beta_z, b) = (2, 3, 5)$ shifted by $(c, d) = (0.03, 0.01)$ yields exact slopes $(2, 3)$ and shifted intercept $4.91$, with zero slope attenuation). By contrast, a shared **multiplicative** calibration scale error, a drifting or arm-dependent calibration error, or **classical within-observation correlated $(f_c, T)$ measurement error** does affect slope extraction. In the stated classical within-observation correlated-error illustration ($\sigma_{f_c} = 0.03$, $\sigma_T = 5\,\mathrm{nK}$ at $R_{\mathrm{wf}} = 500\,\mathrm{m}$, within-observation correlation $\rho = -0.7$), the Design (ii) normal-equation diagonal shifts to $0.8844$ with wavefront cross-contamination into $\hat{\eta}_0$; note that a within-observation error covariance matrix $\Sigma_{EE}$ alone does not specify between-observation correlations, which require their own hierarchical calibration model. Therefore multivariable errors-in-variables / Deming / SIMEX or hierarchical Bayesian estimation matched to the actual experimental calibration hierarchy is mandatory.

Note that Configuration A tests the phenomenological `M_LEVEL0_CONDENSATE` coupling defined in Paper 003 v4; it is **not** an automatic test of unchanged `M_NOV2026_AUTH_EFT_V1`, whose matter portal is blind to condensate fraction at $O(1)$ rest-mass order.

## Configuration B: Declared dilute $^{87}\mathrm{Rb}$ BEC source-mass configuration

A second concrete benchmark asks whether a declared isolated laboratory BEC of $N_{\mathrm{src}} = 10^7$ $^{87}\mathrm{Rb}$ atoms ($M_{\mathrm{src}} = 1.443 \times 10^{-18}\,\mathrm{kg}$) acting as the *source mass* at separation $d = 2.0\,\mathrm{mm}$ can produce a detectable gravitational-strength signal in the stated Raman interferometer ($k_{\mathrm{eff}} = 1.6106 \times 10^7\,\mathrm{m}^{-1}$, $T = 0.25\,\mathrm{s}$, $\sigma_\phi = 3\,\mathrm{mrad}$, $M_{\mathrm{tot}} = 2{,}000$ shots). The Newtonian source acceleration and resulting gravitational-strength interferometer phase are (`verify_paper014_v3.py`):

\[
g_N^{\mathrm{BEC}}(2\,\mathrm{mm}) = \frac{G M_{\mathrm{src}}}{d^2} = 2.408 \times 10^{-23}\,\mathrm{m/s}^2, \qquad
\phi_N^{\mathrm{BEC}} = k_{\mathrm{eff}}\,g_N^{\mathrm{BEC}}\,T^2 = 2.424 \times 10^{-17}\,\mathrm{rad}.
\]

Against the stated $2{,}000$-shot mean phase uncertainty $\sigma_{\bar{\phi}} = \sigma_\phi/\sqrt{2000} = 6.708 \times 10^{-5}\,\mathrm{rad}$ (before additional design or systematic penalties), a $1\sigma$ detection in this declared Raman configuration would require an enhancement factor $\alpha_{\min} = \sigma_{\bar{\phi}}/\phi_N^{\mathrm{BEC}} = 2.77 \times 10^{12}$ (or $4.15 \times 10^{10}$ even against an aggressive $10^{-12}\,\mathrm{m/s}^2$ acceleration floor).

**Scoped negative verdict (avoiding model overextension):** This establishes conclusively that **the declared $10^7$-atom, $2\,\mathrm{mm}$ BEC source configuration cannot detect a gravitational-strength ($\alpha \sim 1$) signal under its stated timing and phase-noise assumptions**. Comparing $\alpha_{\min} \sim 4 \times 10^{10}\text{--}3 \times 10^{12}$ against published millimeter-scale torsion-balance exclusion curves applies **strictly to a separately assumed universal mass-coupled Yukawa model**; as Section 6 already explains, published universal-Yukawa torsion bounds do *not* automatically constrain a condensate-selective coupling without an explicit material-charge, screening, geometry, and likelihood translation, nor does this single declared parameter point mathematically exclude every conceivable alternative BEC source geometry or higher-mass/closer-range apparatus. Within the stated parameters, however, using the BEC as a differential test probe in a macroscopic gravitational field (Configuration A) remains dramatically more sensitive than using this dilute $10^7$-atom cloud as a $2\,\mathrm{mm}$ source mass.

"""

    marker_sec11 = "# 11. Relationship to SIT and the Earlier Pitch"
    assert marker_sec11 in md
    md = md.replace(marker_sec11, new_sec + "\n" + marker_sec11, 1)

    rel_idx = md.index("# Release Boundary")
    new_rel = (
        "# Version Lineage and Release Status\n\n"
        "Version 2 was publicly deposited on July 29, 2026 as Paper 014 (Zenodo DOI 10.5281/zenodo.21693886, "
        "https://pub.svgn.io/papers/paper-14/). This November 20, 2026 Version 3 candidate preserves the July design "
        "architecture intact and adds the synthetic $^{87}\\mathrm{Rb}$ Raman Mach--Zehnder identifiability model, "
        "nuisance-adjusted multivariable EIV attenuation analysis and measurement-error hierarchy, and the scoped "
        "negative gravitational-strength sensitivity calculation for the declared $10^7$-atom BEC source configuration "
        "(verified in `verify_paper014_v3.py`). It remains a private review candidate awaiting explicit author release authorization.\n"
    )
    md = md[:rel_idx] + new_rel

    md_path = OUT_DIR / "Paper-014-v3-Candidate.md"
    md_path.write_text(md, encoding="utf-8", newline="\n")

    audit = build_paper.build_house_style_pdf(
        markdown_path=md_path,
        out_dir=OUT_DIR,
        pdf_filename="Paper-014-BEC-Coherence-Gravity-Test-Design-v3.pdf",
        public_title="Designing a Coherence-Gravity Test with Bose-Einstein Condensates",
    )
    (OUT_DIR / "PAPER-014-BUILD-RECEIPT.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(audit, indent=2))
    return audit


if __name__ == "__main__":
    build_paper_014_v3()
