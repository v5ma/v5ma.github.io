\begin{center}

{\LARGE\bfseries Designing a Coherence-Gravity Test with Bose-Einstein Condensates\par}

\vspace{0.35em}

{\large\itshape Identifiability, Measurement Error, Constraint Translation, and Go/No-Go Criteria\par}

\vspace{0.8em}

{\small\textbf{Author: Micah Blumberg}\par}

{\small Self Aware Networks Research Institute\par}

{\small\url{https://selfawarenetworks.com}\par}

{\small November 20, 2026 (Version 3 Calibrated Apparatus and Identifiability Candidate to DOI 10.5281/zenodo.21693886)\par}

\end{center}

\vspace{0.65em}

MICHAHABSTRACTOPENMARKER

A Bose-Einstein condensate and a thermal cloud can contain the same isotope and nearly the same
number of atoms while differing strongly in condensate fraction, spatial coherence, density
profile, interaction energy, temperature, expansion, and preparation history. That combination
makes a condensed-versus-thermal comparison scientifically attractive and causally difficult. This
paper turns an earlier collaboration pitch into a quantitative experimental-design framework. The
tested hypothesis is explicit: the Penrose-Onsager condensate density sources a neutral scalar
through a dimension-four phenomenological operator. Inside a weak-field, linear, unscreened
benchmark, that operator produces a differential acceleration proportional to the measured
condensate-fraction contrast and an idealized interferometer phase proportional to the same
contrast. The paper's new contribution is the identification architecture around that formula. It
replaces a binary BEC / thermal label with a multi-level measured condensate fraction; derives the
bias in a naive two-state contrast; incorporates measurement error in condensate fraction; defines
a randomized blocked estimand and conditional sensitivity formula; specifies matched nuisance and
negative-control families; and states a likelihood-based route from scalar models to existing
constraints. The design is useful whether the hypothesis survives or fails. It yields a publishable
go/no-go result when ordinary variables cannot be separated, when screening or prior constraints
remove the accessible region, when the apparatus cannot reach the conditional effect, or when a
preregistered measurement supports the null. It reports no measured anomaly and no
constraint-cleared nonzero parameter point.

MICHAHABSTRACTCLOSEMARKER

# Scope and evidence boundary

selfawarenetworks.com  
**Continues:** https://doi.org/10.5281/zenodo.21231163  
**Concept DOI:** https://doi.org/10.5281/zenodo.21231162



# Reader Orientation: What Must Be Separated Before "Coherence" Can Be Tested

Imagine cooling two rubidium-87 clouds in the same apparatus. One cloud contains a large condensed
component; the other is mostly thermal. A naive question asks whether gravity treats the two clouds
differently. The real problem is harder: cooling through the transition changes several physical
properties at once. If the measured phase changes, the cause could be condensate fraction, but it
could also be temperature, density, mean-field interaction, cloud size, release velocity, magnetic
response, optical sampling, or detection bias.

Established physics already explains why many of those ordinary changes matter. Interactions in a
BEC produce nonlinear phase evolution and phase diffusion [8]. BEC interferometers can measure
inertial and differential forces, including in microgravity [4,9]. Atom interferometers have also
constrained screened scalar-force models using controlled source masses [10-12]. None of those
results establishes a new gravitational charge carried by condensate density.

The proposed operation can therefore be understood before it is named:

1. prepare many runs spanning several condensate fractions rather than only two labels;
2. reconstruct the condensate fraction and mode independently for every run;
3. measure ordinary state variables that change with the preparation;
4. predict how a declared condensate-dependent source would alter acceleration or phase;
5. randomize, blind, and fit the condensate-dependent term jointly with ordinary alternatives; and
6. require the result to follow the predicted sign, source geometry, range, and state dependence.

This is a **coherence-gravity test** only in its historical and motivating sense. The actual
measured input is the Penrose-Onsager condensate fraction and density. The name summarizes a
specific testable chain; it does not substitute the word *coherence* for an observable.

# 1. Research Question and Scope

The bounded question is:

> After controlling and measuring ordinary changes caused by preparation, is there a reproducible
> differential acceleration or interferometer-phase component that follows condensate fraction in
> the way predicted by one declared condensate-source operator?

The same-isotope design preserves the best feature of the original proposal. It removes
composition as the intended treatment contrast and focuses the experiment on preparation state.
It does not remove all ordinary differences between the preparations. Those remaining differences
are the central identification problem of this paper.

The paper has four positive outputs:

- a complete conditional map from condensate reconstruction to an instrument-native outcome;
- an estimand that can be identified only under stated experimental conditions;
- a constraint and sensitivity translation that cannot be confused with a measured bound; and
- explicit continuation and retirement criteria.

Clock, SuperTimePosition, space-platform, and gravitational-phase-lock experiments remain separate
future protocol families. They are preserved from the original program but are not pooled into this
paper's primary endpoint.

# 2. Condensate Reconstruction and the Declared Source Hypothesis

The condensate is defined operationally through the largest eigenpair of the one-body density
matrix [5]:

\[
\int \rho_1(\mathbf x,\mathbf x')\phi_0(\mathbf x')\,d^3x'
=N_0\phi_0(\mathbf x),\qquad
\int |\phi_0(\mathbf x)|^2\,d^3x=1,\qquad
n_0(\mathbf x)=N_0|\phi_0(\mathbf x)|^2,\qquad
f_0=\frac{N_0}{N}.
\tag{1}
\]

Here \(N_0\) is the condensate occupation, \(\phi_0\) is the normalized condensate mode,
\(n_0\) is its number-density field, and \(f_0\) is condensate fraction. The scalar amplitude
\(\sigma\) is not identified with \(f_0\), visibility, purity, or coherence length.

The inherited Level 0 model [16] adds the phenomenological operator

\[
\mathcal L_Q=-\frac{g_Qm_a}{M_{\rm Pl}}\,\sigma n_0 ,
\tag{2}
\]

where \(m_a\) is atomic mass and \(g_Q\) is a dimensionless coupling. In four-dimensional natural
units, \([\sigma]=1\) and \([n_0]=3\), so the operator has mass dimension four. This dimensional
consistency does not supply a microscopic derivation. A complete source theory would still need
the condensate current, stress tensor, exchange with the noncondensed fraction, trapping terms, and
backreaction.

The bounded static linear equation is

\[
(\nabla^2-m_\sigma^2)\sigma
=\frac{\beta_\sigma\rho+g_Qm_an_0}{M_{\rm Pl}} .
\tag{3}
\]

For a preparation with condensate fraction \(f_0\), the effective test-cloud scalar coupling in
this benchmark is

\[
\beta_{\rm cloud}(f_0)=\beta_\sigma+g_Qf_0 .
\tag{4}
\]

Using \(M_{\rm Pl}^{-2}=8\pi G\), a source with effective scalar coupling \(\beta_S\), and a
point-source Yukawa response \(Y(x)=(1+x)e^{-x}\), the matched-preparation differential response is

\[
\eta_Q
=\frac{a_1-a_2}{a_N}
=2\beta_Sg_Q(f_{0,1}-f_{0,2})Y(x),
\qquad x=m_\sigma r .
\tag{5}
\]

For a linear, unscreened, uniform spherical source of radius \(R\) observed at height \(h\), define
\(z=m_\sigma R\) and \(y=m_\sigma h\). The exact exterior response is

\[
Y_{\rm sphere}(z,y)
=\frac{3(1+z+y)}{2z^3}
\left[(z-1)e^{-y}+(z+1)e^{-2z-y}\right].
\tag{6}
\]

An idealized light-pulse interferometer maps the response to phase as

\[
\Delta\phi_Q=k_{\rm eff}g\,\eta_QT^2 .
\tag{7}
\]

Equations (1)-(7) form a software-checkable conditional chain. They do not establish that
Equation (2) exists in nature, that a source is unscreened, or that any nonzero coupling survives
existing data.

# 3. Why a Binary BEC / Thermal Contrast Does Not Identify the Coupling

Let \(A\) denote the preparation label, \(f_0\) the true condensate fraction, \(\mathbf C\) a vector
of ordinary state and apparatus variables, and \(Y\) the measured phase or acceleration outcome.
Suppose the local response can be written as

\[
Y=\alpha+\gamma_Q f_0+\vec{\delta}^{\mathsf T}\mathbf C+\varepsilon .
\tag{8}
\]

The difference between average BEC-labeled and thermal-labeled runs is then

\[
\Delta_A
=E[Y\mid A=1]-E[Y\mid A=0]
=\gamma_Q\Delta_A f_0
+\vec{\delta}^{\mathsf T}\Delta_A\mathbf C
+\Delta_AE[\varepsilon\mid A] .
\tag{9}
\]

The first term is the desired condensate-dependent component. The second collects temperature,
density, interaction energy, expansion, spatial sampling, magnetic response, and other ordinary
changes. The third captures unmodeled preparation and selection effects. A binary contrast alone
cannot determine which term produced the difference.

Randomizing the order of two preparation labels protects against drift but does not independently
randomize condensate fraction, temperature, density, and interaction energy. Identification
therefore requires variation that changes these quantities in partially independent directions.
The minimum design uses at least three prespecified condensate-fraction levels and dedicated
control families:

| Control family | Intended variation | Intended near-match | Question answered |
| --- | --- | --- | --- |
| Condensate ladder | \(f_0\) across a broad range | isotope, apparatus, block, geometry | Does outcome track measured \(f_0\)? |
| Thermal nuisance control | temperature and thermal fraction | \(f_0\) as closely as feasible | Can thermal changes imitate the slope? |
| Density / interaction control | density and mean-field energy | \(f_0\) and temperature | Can interactions imitate the slope? |
| Expansion / optical control | cloud size and release history | reconstructed \(f_0\) | Can beam sampling or launch history imitate it? |
| Source-geometry control | source position or geometry | atomic preparation | Does a residual follow the predicted field geometry? |
| Null channel | instrument channel insensitive to proposed coupling | drift sensitivity | Does the effect occur where it should not? |

If the apparatus cannot produce sufficient independent variation, the design is not identifiable.
That is a substantive result and a reason to retire or redesign the route.

# 4. Condensate-Fraction Measurement Error

The theory uses the true \(f_0\), but the experiment reconstructs an estimate. Write

\[
\widetilde f_{0,br}=f_{0,br}+u_{br},
\qquad E[u_{br}\mid f_{0,br},\mathbf C_{br}]=0 ,
\tag{10}
\]

where \(b\) indexes randomized apparatus blocks and \(r\) indexes runs. In the simplest independent
classical-error case, regressing \(Y\) on \(\widetilde f_0\) attenuates the slope by the reliability
ratio

\[
\lambda_f
=\frac{\operatorname{Var}(f_0)}
{\operatorname{Var}(f_0)+\operatorname{Var}(u)},
\qquad E[\widehat\gamma_{\rm naive}]\approx\lambda_f\gamma_Q .
\tag{11}
\]

The correction is not to divide blindly by an estimated \(\lambda_f\). The analysis should fit a
latent-\(f_0\) or errors-in-variables model using calibration data, repeated reconstructions, or a
validated image-to-condensate measurement likelihood:

\[
p(Y,\widetilde f_0\mid\theta)
=\int p(Y\mid f_0,\mathbf C,\theta)
p(\widetilde f_0\mid f_0,\mathbf C,\theta)
p(f_0\mid\mathbf C,\theta)\,df_0 .
\tag{12}
\]

This matters twice. Measurement error can hide a real state dependence by attenuation, and
preparation-dependent reconstruction error can create a false state dependence. The image
processing version, thresholds, exclusions, and uncertainty model must therefore be frozen before
the outcome labels are opened.

# 5. Blocked Estimand and Conditional Sensitivity

A preregistered linear working model can take the form

\[
Y_{br}
=\alpha_b+\gamma f_{0,br}
+\vec{\delta}^{\mathsf T}\mathbf C_{br}
+\vec{\zeta}^{\mathsf T}
\left(f_{0,br}\mathbf C_{br}\right)
+\epsilon_{br}.
\tag{13}
\]

\(\alpha_b\) absorbs block-specific common shifts. The nuisance vector should include, at minimum,
atom number, temperature, density profile, interaction-energy proxy, center of mass, cloud shape,
release velocity, magnetic state, field gradients, laser intensity, wavefront sampling, vibration,
gravity gradient, Coriolis terms, detection quality, and run order. Nonlinear or hierarchical
extensions may be prespecified, but a flexible model chosen after outcome inspection cannot define
the confirmatory result.

The idealized physical slope predicted by Equations (5)-(7) is

\[
\gamma_Q(\theta)
=2k_{\rm eff}gT^2\beta_Sg_QY_{\rm source}(m_\sigma,\mathcal G),
\tag{14}
\]

where \(\mathcal G\) denotes source geometry and \(Y_{\rm source}\) is the justified point,
uniform-sphere, layered-source, or numerically screened response. In the homoscedastic
single-regressor limit, the slope uncertainty scales as

\[
\operatorname{SE}(\widehat\gamma)
\approx
\frac{\sigma_Y}
{\sqrt{\sum_{i=1}^{n}(f_{0,i}-\bar f_0)^2}} .
\tag{15}
\]

Equation (15) makes a design principle explicit: precision depends not only on run count but on the
spread of independently measured condensate fractions. Repeating nearly identical \(f_0\) values
cannot identify a state-response slope efficiently.

For a prespecified two-sided threshold \(z_\star\), a conditional minimum detectable coupling
product is

\[
|\beta_Sg_Q|_{\min}
=\frac{z_\star\,\operatorname{SE}(\widehat\gamma)}
{2k_{\rm eff}gT^2|Y_{\rm source}|}.
\tag{16}
\]

This is a design equation, not a reported limit. It becomes an experimental sensitivity only after
\(\sigma_Y\), covariance, \(f_0\) reconstruction error, transfer functions, missingness, and
screening are calibrated from the selected apparatus.

# 6. Translating Existing Constraints

Equivalence-principle and fifth-force experiments establish a demanding comparison environment
[1-3,6,7,10-12]. They do not directly report a bound on \(g_Q\), because they generally vary
composition, internal state, distance, or source geometry rather than Penrose-Onsager condensate
fraction. A valid translation begins with one shared parameter vector

\[
\theta
=\{m_\sigma,g_Q,\beta_S,\beta_\sigma,
\text{screening parameters},\text{source parameters},
\text{apparatus nuisances}\}.
\tag{17}
\]

Each experiment \(j\) needs its own forward map \(M_j(\theta,\nu_j)\), nuisance vector \(\nu_j\),
and reported-data likelihood. The combined constraint is

\[
\mathcal L_{\rm joint}(\theta)
=\prod_j\int
\mathcal L_j\!\left(D_j\mid M_j(\theta,\nu_j)\right)
\pi_j(\nu_j)\,d\nu_j .
\tag{18}
\]

Only after those maps are derived may one define an allowed set, for example

\[
\mathcal A_\alpha
=\left\{\theta:
-2\log\frac{\mathcal L_{\rm prof}(\theta)}
{\mathcal L_{\rm prof}(\widehat\theta)}
\le q_\alpha\right\}.
\tag{19}
\]

The exact threshold and construction must match the chosen frequentist or Bayesian procedure.
Importing a published acceleration sensitivity as though it directly constrained \(g_Q\) would
skip the source charge, screening, geometry, and observable maps.

Atom-interferometric searches for chameleon and symmetron forces demonstrate why the full
translation matters. Hamilton et al., Jaffe et al., and Sabulsky et al. modeled the source,
vacuum geometry, screening assumptions, atomic probe, and measured acceleration before drawing
model-specific exclusions [10-12]. The condensate-source hypothesis needs the same level of
specificity. If the resulting \(\mathcal A_\alpha\) has no overlap with the apparatus-reachable
region, the BEC route should be closed before experimental outreach.

# 7. Apparatus and Run Contract

The protocol retains one isotope and one apparatus while deliberately varying measured condensate
fraction. Each block randomizes preparation order and includes calibration or reference runs.
Blinding protects the mapping from preparation labels to the outcome-analysis team until data
quality, exclusions, and preprocessing are frozen.

The primary outcome should be one instrument-native differential phase or acceleration statistic.
Secondary channels may diagnose ordinary mechanisms but must not replace the primary endpoint
after inspection.

| Domain | Required measurement or control | Failure if absent |
| --- | --- | --- |
| Atomic state | isotope, hyperfine state, atom number, condensate fraction | intended treatment undefined |
| Thermodynamics | temperature, thermal fraction, density, interaction proxy | BEC label confounded |
| Kinematics | center of mass, launch, release, velocity, expansion | acceleration / phase mimic unresolved |
| Optical system | intensity, detuning, wavefront, AC-Stark contribution | state-dependent optical bias unresolved |
| Magnetic system | field and gradients, Zeeman sensitivity | magnetic force mimic unresolved |
| Inertial environment | vibration, rotation, Coriolis, gravity gradient | common and differential acceleration unresolved |
| Detection | imaging transfer, fit quality, saturation, missingness | \(f_0\) and phase bias unresolved |
| Source field | mass map, position, modulation, range response | geometry prediction untestable |

The all-runs ledger must retain failed preparations, invalidated runs, exclusions, censoring, and
reason codes. Missingness must be modeled or bounded when it depends on preparation or outcome
quality.

# 8. Positive, Null, and Adverse Outcomes

A result is not classified by whether it is exciting. It is classified by which preregistered
relations survive.

## 8.1 Positive-pattern requirement

A candidate update to the model must satisfy all of the following:

- a nonzero \(\gamma\) with the prespecified sign convention;
- stability across blocks and allowed nuisance models;
- no corresponding signal in negative-control channels;
- scaling with independently reconstructed \(f_0\), not merely the BEC label;
- the predicted source-position, geometry, or range dependence;
- survival of label permutation and analysis-pipeline controls; and
- replication in an independently configured dataset or apparatus.

A surviving residual would update the declared operator relative to the tested alternatives. It
would not, by itself, validate Super Information Theory as a whole.

## 8.2 Null and exclusion requirement

For a validated forward map and likelihood, the experiment can exclude the subset

\[
\mathcal E_\alpha
=\left\{\theta\in\mathcal A_{\rm prior}:
\text{the prespecified test rejects }M(\theta)
\text{ at level }\alpha\right\}.
\tag{20}
\]

Without the forward map, a null is still useful as an apparatus and design result, but it is not a
sharp theory exclusion.

## 8.3 Adverse design results

The route should be retired or redesigned if:

1. no covariantly or microscopically defensible source approximation can be stated;
2. screening and existing constraints leave no apparatus-reachable region;
3. condensate fraction cannot be varied separately enough from ordinary variables;
4. condensate-fraction reconstruction error dominates the useful range;
5. calibrated nuisance covariance makes Equation (16) unreachable;
6. control channels reproduce the candidate slope;
7. the effect fails source-geometry, range, sign, or replication tests; or
8. the preregistered data support the null over the reachable region.

These are scientific outputs, not administrative failures.

# 9. Go/No-Go Sequence

The original collaboration pitch is replaced by a staged decision architecture:

| Stage | Required evidence | Continue when | Stop when |
| --- | --- | --- | --- |
| 1. Source definition | Equations (1)-(3), dimensions, conservation boundary | bounded source model is coherent | no defensible source approximation exists |
| 2. Constraint translation | Equations (17)-(19), source geometry, screening | nonempty accessible region survives | region is empty or translation fails |
| 3. Apparatus model | pulse sequence, transfer functions, calibrated covariance | conditional reach overlaps allowed region | apparatus floor dominates |
| 4. Identifiability | condensate ladder and nuisance controls | \(f_0\) has independent support | state variables remain inseparable |
| 5. Analysis lock | estimand, missingness, multiplicity, decision thresholds | protocol is frozen before labels open | outcome-dependent flexibility remains |
| 6. Execution | blinded randomized data and all-runs ledger | quality gates pass | prespecified failure criterion triggers |
| 7. Interpretation | controls, geometry, sign, range, replication | complete pattern survives | null or ordinary mechanism explains data |

Specialist criticism can improve any future version, but the local final-preprint result is this
complete design and failure architecture. Conducting the experiment is not a prerequisite for
publishing the architecture; it is the future use for which the architecture is intended.

# 10. Reproducibility Surface

The accompanying machine-readable protocol performs deterministic checks of:

- upstream Level 0 manuscript and result identities;
- the dimensional and null-limit contracts;
- the finite-source response;
- the binary-confounding decomposition;
- measurement-error attenuation;
- slope-precision scaling;
- conditional coupling sensitivity;
- open constraint and apparatus boundaries;
- manuscript equation and reference sequences; and
- the exact release package.

Numerical regression fixtures test algebra and software. They are not measurements, forecasts, or
allowed parameter points. The public package includes the manuscript, model inputs, verifier,
tests, source and correction ledgers, metadata, rendering tool, review receipts, and exact
SHA-256 manifest.


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


# 11. Relationship to SIT and the Earlier Pitch

The earlier paper contributed the bounded experimental intuition: compare a coherent and a
noncoherent preparation of the same species rather than ask an experiment to validate an entire
unification program. That intuition is preserved. The successor replaces three insufficient
elements:

- the undefined \(F(\ldots)\) is replaced by Equations (1)-(7);
- the binary state label is replaced by a measured condensate-fraction estimand; and
- a generic sensitivity request is replaced by Equations (16)-(20) and the go/no-go sequence.

The source operator remains an explicit Level 0 hypothesis rather than a derivation from SIT79.
The experiment, if performed, tests that operator and its declared response. It does not test every
claim associated with SIT, SDT, QGTCD, or SuperTimePosition simultaneously.

# 12. Conclusion

A same-isotope BEC / thermal experiment becomes informative only after the preparation label is
decomposed into measurable physical variables. The proposed condensate-source operator supplies a
clear conditional prediction: within its stated weak-field benchmark, differential acceleration
and phase are linear in condensate-fraction contrast and follow a specified source response. The
experimental-design problem is then to distinguish that slope from the ordinary physical changes
that accompany condensation.

This paper provides the needed bridge from idea to test. It formalizes the confounding
decomposition, measurement-error model, blocked estimand, conditional sensitivity, constraint
translation, control families, likelihood boundary, and retirement rules. The result is useful
before any laboratory commits time: it can show that the route is viable, that it needs redesign,
or that it should be closed. A future experiment can then produce a positive-pattern update, a
model-specific exclusion, or a bounded null without changing the question after seeing the data.

# References

1. Khoury, J., and Weltman, A. Chameleon Fields: Awaiting Surprises for Tests of Gravity in Space.
   *Physical Review Letters* 93, 171104 (2004).
   https://doi.org/10.1103/PhysRevLett.93.171104
2. Hinterbichler, K., and Khoury, J. Screening Long-Range Forces through Local Symmetry
   Restoration. *Physical Review Letters* 104, 231301 (2010).
   https://doi.org/10.1103/PhysRevLett.104.231301
3. Touboul, P., et al. MICROSCOPE Mission: Final Results of the Test of the Equivalence Principle.
   *Physical Review Letters* 129, 121102 (2022).
   https://doi.org/10.1103/PhysRevLett.129.121102
4. Lachmann, M. D., Ahlers, H., Becker, D., et al. Ultracold Atom Interferometry in Space.
   *Nature Communications* 12, 1317 (2021).
   https://doi.org/10.1038/s41467-021-21628-z
5. Penrose, O., and Onsager, L. Bose-Einstein Condensation and Liquid Helium.
   *Physical Review* 104, 576-584 (1956).
   https://doi.org/10.1103/PhysRev.104.576
6. Asenbaum, P., Overstreet, C., Kim, M., Curti, J., and Kasevich, M. A. Atom-Interferometric Test
   of the Equivalence Principle at the 10^-12 Level. *Physical Review Letters* 125, 191101 (2020).
   https://doi.org/10.1103/PhysRevLett.125.191101
7. Rosi, G., D'Amico, G., Cacciapuoti, L., et al. Quantum Test of the Equivalence Principle for
   Atoms in Coherent Superposition of Internal Energy States. *Nature Communications* 8, 15529
   (2017). https://doi.org/10.1038/ncomms15529
8. Berrada, T., van Frank, S., Bucker, R., Schumm, T., Schaff, J.-F., and Schmiedmayer, J.
   Integrated Mach-Zehnder Interferometer for Bose-Einstein Condensates.
   *Nature Communications* 4, 2077 (2013). https://doi.org/10.1038/ncomms3077
9. Muntinga, H., et al. Interferometry with Bose-Einstein Condensates in Microgravity.
   *Physical Review Letters* 110, 093602 (2013).
   https://doi.org/10.1103/PhysRevLett.110.093602
10. Hamilton, P., Jaffe, M., Haslinger, P., Simmons, Q., Muller, H., and Khoury, J.
    Atom-Interferometry Constraints on Dark Energy. *Science* 349, 849-851 (2015).
    https://doi.org/10.1126/science.aaa8883
11. Jaffe, M., Haslinger, P., Xu, V., et al. Testing Sub-Gravitational Forces on Atoms from a
    Miniature In-Vacuum Source Mass. *Nature Physics* 13, 938-942 (2017).
    https://doi.org/10.1038/nphys4189
12. Sabulsky, D. O., Dutta, I., Hinds, E. A., Elder, B., Burrage, C., and Copeland, E. J.
    Experiment to Detect Dark Energy Forces Using Atom Interferometry.
    *Physical Review Letters* 123, 061102 (2019).
    https://doi.org/10.1103/PhysRevLett.123.061102
13. Schlippert, D., et al. Quantum Test of the Universality of Free Fall.
    *Physical Review Letters* 112, 203002 (2014).
    https://doi.org/10.1103/PhysRevLett.112.203002
14. Zhou, L., et al. Test of Equivalence Principle at the 10^-8 Level by a Dual-Species
    Double-Diffraction Raman Atom Interferometer. *Physical Review Letters* 115, 013004 (2015).
    https://doi.org/10.1103/PhysRevLett.115.013004
15. Geiger, R., and Trupke, M. Proposal for a Quantum Test of the Weak Equivalence Principle with
    Entangled Atomic Species. *Physical Review Letters* 120, 043602 (2018).
    https://doi.org/10.1103/PhysRevLett.120.043602
16. Blumberg, M. Level 0 SIT: A Physical-Frame Model and Condensate-Source Falsification Contract.
    Version 3 final preprint, *Level 0 SIT: A Physical-Frame Model and Condensate-Source Falsification Contract* (2026), https://doi.org/10.5281/zenodo.21330764.

# Version Lineage and Release Status

Version 2 was publicly deposited on July 29, 2026 as Paper 014 (Zenodo DOI 10.5281/zenodo.21693886, https://pub.svgn.io/papers/paper-14/). This November 20, 2026 Version 3 candidate preserves the July design architecture intact and adds the synthetic $^{87}\mathrm{Rb}$ Raman Mach--Zehnder identifiability model, nuisance-adjusted multivariable EIV attenuation analysis and measurement-error hierarchy, and the scoped negative gravitational-strength sensitivity calculation for the declared $10^7$-atom BEC source configuration (verified in `verify_paper014_v3.py`). It remains a private review candidate awaiting explicit author release authorization.
