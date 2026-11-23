\begin{center}

{\LARGE\bfseries Level 0 SIT: A Physical-Frame Model and Condensate-Source Falsification Contract\par}

\vspace{0.8em}

{\small\textbf{Author: Micah Blumberg}\par}

{\small Self Aware Networks Research Institute\par}

{\small\url{https://selfawarenetworks.com}\par}

{\small November 20, 2026 (Version 4 Successor Candidate to DOI 10.5281/zenodo.21693868)\par}

\end{center}

\vspace{0.65em}

MICHAHABSTRACTOPENMARKER

This is a model and methods note; it reports no measured anomaly,
constraint-cleared parameter region, or validated physical SIT effect. It
narrows the Level 0 surface of Super Information Theory to a
specified scalar-tensor effective-model contract. The Einstein-frame fields are
a metric and two neutral real scalar amplitudes, while ordinary matter follows
the single physical metric `gtilde_mn=Omega(tau,sigma)^2 g_mn` and
electromagnetism remains an independent Maxwell sector. The baseline action by
itself does not distinguish a Bose-Einstein condensate from a matched thermal
cloud. We therefore add one explicit new hypothesis: the Penrose-Onsager
condensate density sources `sigma` through a dimension-four matter operator.
In the weak-field point-source regime this gives the signed differential
acceleration
`eta_Q=2 beta_S g_Q (f_BEC-f_thermal)(1+x)exp(-x)`, with
`x=m_sigma r`, and the idealized interferometer phase
`Delta phi_Q=k_eff g eta_Q T^2`. For a linear, unscreened, uniform spherical
source, the point response is replaced by an exact finite-source form factor.
The committed regression fixture also propagates first-order parameter
uncertainty and five explicitly placeholder apparatus-systematic terms. These
calculations test the formula, geometry, and null limits; they are not measured
performance, a sensitivity forecast, a constraint-cleared parameter region,
or a prediction derived from SIT79. A full source stress tensor, microscopic
operator derivation, nonlinear screening calculation, experimental covariance
model, and direct likelihood translation remain open. The contribution is a
source-explicit linear-response benchmark and falsification contract, not
evidence for full SIT or an observed gravity anomaly.

MICHAHABSTRACTCLOSEMARKER

# Scope and evidence boundary

## Version 3 Final Preprint
selfawarenetworks.com  
**Continues:** https://doi.org/10.5281/zenodo.21330764  
**Concept DOI:** https://doi.org/10.5281/zenodo.21231154



# Reader Orientation: The Problem Before the Terminology

Imagine preparing two clouds of the same atomic species in the same apparatus.
They have matched atom number, position, launch, geometry, and ordinary
composition, but one contains a large Bose-Einstein-condensed component and
the other is predominantly thermal. A differential-gravity proposal must say
exactly what physical variable distinguishes those preparations, how that
variable enters a field equation, and what measurement would change. The word
*coherence* cannot do that work by itself.

Established physics supplies several pieces without supplying the proposed
effect. Scalar-tensor models specify which metric matter follows and how an
extra scalar couples to matter. Screening models show why a light scalar may
need nonlinear environmental analysis. Penrose and Onsager define condensation
through the largest eigenvalue and mode of the one-body density matrix. Atom
interferometers translate acceleration differences into phase differences.
None of those inherited pieces says that condensate density carries a new
gravitational charge.

The operation proposed here can therefore be stated in plain language before
it is named:

1. reconstruct or measure the condensate mode and condensate fraction;
2. convert that mode into a spatial condensate-density field;
3. declare, as a new hypothesis, that this density sources a neutral scalar;
4. solve the bounded linear field problem for a specified source geometry;
5. compare the accelerations or interferometer phases of matched condensed and
   thermal preparations; and
6. require the effect to vanish when the new coupling, source charge, or
   condensate-fraction difference vanishes.

This sequence is the **condensate-source falsification contract**. The broader
historical phrase *coherence-source* is retained as lineage, but the measurable
input in this paper is the Penrose-Onsager condensate density, not an undefined
amount of coherence. If the source operator cannot be completed consistently,
if screening removes every accessible effect, if direct constraints eliminate
the parameter space, or if calibrated measurements agree with the null, the
corresponding model is narrowed or excluded. The contract remains useful
because it makes those failure conditions executable.

# 1. Scope

The v1 paper correctly excluded full SIT, the Coherence Tower, HSIT, RH,
neuroscience, holography, Yang-Mills, and particle-physics derivations. This v2
retains those exclusions and closes three ambiguities that prevented a physical
calculation: it chooses one matter frame, separates physical electromagnetism
from the coherence order parameter, and states the additional matter operator
required for a BEC / thermal distinction.

The only accepted thesis is:

> A two-scalar extension of Einstein-Maxwell-matter theory plus a declared
> condensate-density source operator yields a bounded weak-field
> differential-acceleration formula. Whether the operator has a microscopic
> origin or any nonzero viable parameter region exists remains open.

# 2. Fields and Physical Metric

Use four-dimensional natural units. The model contains:

- an Einstein-frame metric `g_mn`;
- a real scalar `tau`;
- a real macroscopic amplitude `sigma`;
- an independent electromagnetic connection `A_m` with curvature `F_mn`; and
- ordinary matter fields `chi`.

Matter rods and clocks couple to

```text
gtilde_mn = Omega(tau,sigma)^2 g_mn.                            (1)
```

This Jordan metric is the physical metric by definition. Observable time,
length, acceleration, stress-energy, and apparatus geometry must be evaluated
in this frame or translated to it consistently.

The wider SIT program may retain a complex order parameter and phase language.
The Level 0 benchmark does not identify that phase connection with physical
electromagnetism. If the coherence condensate were minimally charged under the
electromagnetic U(1), a nonzero vacuum amplitude would generically raise a
photon-mass question. This letter avoids that unexamined claim by setting the
physical electric charge of `sigma` to zero. A future hidden U(1) would be a
separate model with separate constraints.

# 3. Benchmark Action

The action is

```text
S = integral d^4x sqrt(-g) [
      M_Pl^2 R/2
    - (partial tau)^2/2
    - (partial sigma)^2/2
    - V(tau,sigma)
    - f_EM(tau,sigma) F_mn F^mn/4
    ]
    + S_m[Omega(tau,sigma)^2 g, A, chi].                        (2)
```

Einstein-Hilbert gravity and Maxwell theory are assumed sectors. Their recovery
in a limit is not a derivation of their origin.

This baseline action has no coherence-specific matter source. The Draft 5
laboratory extension therefore adds

```text
L_Q = -(g_Q m_a/M_Pl) sigma n_0.                                (3)
```

where `m_a` is the atomic mass and `n_0` is the condensate number density in the
physical apparatus frame. This is a new modeling hypothesis, not a consequence
of SIT79. Since `[sigma]=1` and `[n_0]=3`, the interaction has mass dimension
four. A covariant completion must represent `n_0=-u_m j_0^m` with the apparatus
four-velocity, conserve the condensate current during the modeled interval, and
include its stress tensor and exchange terms.

A first stable polynomial specification is

```text
V = m_tau^2 tau^2/2
  + m_sigma^2 sigma^2/2
  + m_link^2 (tau-alpha sigma)^2/2
  + lambda_tau tau^4/4
  + lambda_sigma sigma^4/4,

Omega = exp(beta_tau tau/M_Pl + beta_sigma sigma/M_Pl),

f_EM = 1 + xi_tau tau/M_Pl + xi_sigma sigma/M_Pl + higher terms. (4)
```

Every mass, coupling, cutoff, higher operator, and boundary condition is model
data. Positive quadratic masses and quartics supply a stable local origin for
the committed recovery benchmark; they do not establish radiative stability or
global UV consistency.

# 4. Variation Convention

Define the physical-frame matter tensor by

```text
delta S_m = (1/2) integral sqrt(-gtilde)
            Ttilde^mn delta gtilde_mn d^4x.                     (5)
```

Since `delta gtilde_mn = 2 gtilde_mn delta ln Omega`, the matter variation with
respect to either scalar is proportional to the physical trace `Ttilde` and
the corresponding derivative of `ln Omega`. With the displayed action, the
scalar equations have the structural form

```text
Box tau - V_,tau - f_EM,tau F^2/4
  + Omega^4 Ttilde (ln Omega)_,tau = 0,

Box sigma - V_,sigma - f_EM,sigma F^2/4
  + Omega^4 Ttilde (ln Omega)_,sigma = 0.                       (6)
```

under the stated stress-tensor convention. The internal full-variation audit
gives

```text
Box sigma - V_,sigma - f_EM,sigma F^2/4
  + Omega^4 Ttilde (ln Omega)_,sigma + J_Q = 0,                 (7)

J_Q = (1/sqrt(-g)) delta S_Q/delta sigma.
```

For the shorthand source action

```text
S_Q = - integral sqrt(-g) (g_Q m_a/M_Pl) sigma n_0 d^4x.        (8)
```

holding `n_0` fixed during scalar variation gives
`J_Q=-(g_Q m_a/M_Pl)n_0`. The corresponding Maxwell and structural metric
equations are

```text
nabla_mu(f_EM F^mu_nu)=J_matter^nu,

M_Pl^2 G_mn = T_tau_mn + T_sigma_mn + f_EM T_EM_mn
              + T_matter_mn + T_Q_mn.                           (9)
```

Here `T_Q_mn=-2 delta S_Q/(sqrt(-g) delta g^mn)` is not yet determined.
Specifying it requires the independent condensate variables, current and
four-velocity normalization, pressure and gradient energy, trapping terms, and
exchange with the noncondensed fraction. The Bianchi identity applies to the
combined stress tensor, so the shorthand source cannot simultaneously be
treated as fixed and promoted to a complete covariant matter theory. Draft 5
therefore uses it only as an external fixed-source approximation with omitted
backreaction. The scalar signs, Maxwell equation, and structural metric
equation have been derived internally under the declared convention; complete
source stress / current conservation and independent review remain open.

For the bounded source benchmark, decouple `tau`, set `f_EM=1`, use
`Omega=exp(beta_sigma sigma/M_Pl)`, and linearize around `sigma=0`. With
nonrelativistic density `rho` and the new source term, the static equation is

```text
(nabla^2-m_sigma^2) sigma
  = beta_sigma rho/M_Pl + g_Q m_a n_0/M_Pl.                    (10)
```

This linear equation fixes the sign convention used below. It does not replace
a covariant source action, nonlinear screening solution, or source-sector
conservation review.

\newpage

# 5. Null Recovery Benchmark

The machine-readable null benchmark sets

```text
beta_tau = beta_sigma = xi_tau = xi_sigma = 0,
g_Q = 0   (or L_Q omitted / n_0 = 0),
Omega = 1,
f_EM = 1.                                                       (11)
```

(Setting `g_Q = 0`, or equivalently omitting the laboratory extension (3) or evaluating on `n_0 = 0`, is required alongside `beta_tau = beta_sigma = xi_tau = xi_sigma = 0` so that the condensate-density portal in (10) vanishes together with the ordinary matter and Maxwell couplings; the historical baseline script `model/validate_benchmark.py` evaluated the pure scalar potential prior to adding `L_Q`.)

Its quadratic scalar mass matrix is

```text
[[m_tau^2 + m_link^2,        -alpha m_link^2],
 [-alpha m_link^2, m_sigma^2 + alpha^2 m_link^2]].              (12)
```

The committed parameters give two positive eigenvalues, as checked by
`model/validate_benchmark.py`. The benchmark therefore supplies a stable local
scalar vacuum and decoupled Einstein-Maxwell-matter recovery at the classical
quadratic level. It makes no prediction for `Delta g/g` and is not evidence of
a coherence-gravity interaction.

# 6. A Declared Condensate-to-Source Map

The symbol `sigma` remains a classical model amplitude. It is not condensate
fraction, interference visibility, off-diagonal long-range order,
density-matrix purity, or phase-correlation length. Draft 5 instead defines a
separate condensate observable from the one-body reduced density matrix:

```text
integral rho_1(x,x') phi_0(x') d^3x' = N_0 phi_0(x),
integral |phi_0(x)|^2 d^3x = 1,
n_0(x)=N_0 |phi_0(x)|^2,
f_0=N_0/N.                                                       (13)
```

`N_0` is the largest Penrose-Onsager eigenvalue and `phi_0` its normalized
mode. The map uses the measured or reconstructed condensate fraction; it does
not force the thermal preparation to have exactly zero `f_0`.

The resulting operational chain is

```text
Q: {rho_1, apparatus resolution}
   -> {N_0, phi_0, n_0, f_0}
   -> {source term (g_Q m_a/M_Pl) n_0}.                          (14)
```

This closes the benchmark definition, not its microscopic justification. The
new coupling must still account for preparation energy, ordinary stress-energy,
finite-temperature fluctuations, source backreaction, and the experimental
method used to estimate `rho_1` and `f_0`.

# 7. Nonzero Linear-Response Result and Constraint Program

Use the reduced Planck convention `M_Pl^-2=8 pi G`. For a point source with
effective scalar coupling `beta_S`, define

```text
Y(x)=(1+x)exp(-x),  x=m_sigma r.                                (15)
```

A cloud with condensate fraction `f_0` has effective scalar coupling

```text
beta_cloud=beta_sigma+g_Q f_0.                                  (16)
```

The scalar acceleration relative to Newtonian gravity is therefore

```text
a_sigma/a_N=2 beta_S (beta_sigma+g_Q f_0) Y(x).                 (17)
```

For matched preparations, the universal term cancels and the declared
coherence-source operator gives

```text
eta_Q=(a_BEC-a_thermal)/a_N
     =2 beta_S g_Q (f_BEC-f_thermal) Y(x).                      (18)
```

This is a derived result of the stated linear-response benchmark. It is not a
derivation of `g_Q`, and it is not constraint-cleared. Its sign follows
`beta_S g_Q`; it vanishes for `g_Q=0`, `beta_S=0`, equal condensate fractions,
or short scalar range.

Existing MICROSCOPE, dual-isotope, and coherent-internal-state tests are
neighboring constraints, not direct BEC-versus-thermal bounds on this operator.
A constraint fit must derive the translation before using their reported
sensitivities. It must also include finite Earth / source form factors, screening,
inverse-square-law and PPN limits, electromagnetic effects if `xi` is nonzero,
and the source-sector stress-energy.

If no allowed region remains, the source-coupled benchmark is excluded. If no
direct translation can be justified, the paper remains a model and methods
note rather than a prediction letter.

## 7.1 Exact Linear Uniform-Sphere Benchmark

For a uniform spherical source of radius `R`, total mass `M`, inverse scalar
range `mu`, and exterior detector radius `r=R+h`, define `z=mu R` and `y=mu h`.
The exact linear unscreened source-amplitude factor is

```text
A(z)=3[z cosh(z)-sinh(z)]/z^3,

Y_sphere(z,y)=A(z)[1+z+y]exp(-z-y).                             (19)
```

The implementation evaluates the algebraically equivalent stable form

```text
Y_sphere(z,y)=3(1+z+y)/(2z^3)
               [(z-1)exp(-y)+(z+1)exp(-2z-y)].                 (20)
```

and uses the small-`z` series `A(z)=1+z^2/10+z^4/280+...`. For the declared
fixture `R=6,371,000 m`, `h=100 m`, and `mu(R+h)=0.1`, the point response is
`0.9953211598395556`, the uniform-sphere response is
`0.9963168052700276`, and their ratio is `1.001000325794975`. With the
illustrative coupling fixture this gives
`eta_Q=1.5542542162212432e-12` and
`Delta phi_Q=2.456440917215015e-4 rad`.

This is exact only for a linear, unscreened, uniform sphere. It is not a
layered Earth model, laboratory source geometry, thin-shell solution, or
nonlinear screening calculation. The numbers are deterministic software
regressions, not measurements, forecasts, sensitivities, allowed regions, or
physical validation.

# 8. BEC Versus Thermal Protocol

The experiment remains a falsifier architecture, not a constraint-cleared
prediction. It compares the same atomic species under matched atom number,
launch, trap, geometry, external fields, and readout, with deliberately
different measured condensate fractions.

For an idealized light-pulse interferometer,

```text
Delta phi_Q = k_eff g eta_Q T^2.                                (21)
```

The committed regression point uses explicit `beta_S`, `g_Q`, condensate
fractions, source geometry and range, laser wavelength, and interrogation
time. Centered numerical differentiation propagates declared standard
uncertainties in wavelength, interrogation time, local gravity, both
condensate fractions, source radius, and detector altitude. It gives a
parameter-only standard uncertainty of `7.042182760266661e-6 rad`.

Five separately declared phase-systematic placeholders cover wavefront
aberration, Coriolis / rotation, gravity-gradient / launch mismatch, AC-Stark and
Zeeman effects, and detection / fit bias. Their quadrature is
`2.2360679774997898e-4 rad`; combining it with the parameter term gives
`2.2371766210567507e-4 rad`. The resulting illustrative
signal-to-placeholder ratio is `1.098009381152344`. Because these systematic
values are placeholders rather than calibrated distributions, none of these
numbers is an experimental forecast, sensitivity, significance, exclusion, or
allowed parameter claim.

Required ordinary controls include density profile, interaction energy,
temperature, condensate fraction, release dynamics, magnetic and electric
fields, gravity gradients, vibrations, imaging bias, and decoherence. A
blinded analysis must evaluate a preregistered differential acceleration or
phase statistic.

The complete forward model must replace the uniform source by the real Earth or
laboratory density profile, establish or solve the screening regime, propagate
both clouds through the pulse sequence, and fit measured controls and
covariances jointly. A null result excludes only parameter points whose
validated signal exceeds demonstrated sensitivity under a justified
likelihood. A positive residual supports only the specified source-coupled
model relative to the nulls and alternatives; it does not prove full SIT.

# 9. Corrected External Anchors

The external literature supplies constraints and experimental capability, not
validation of this model.

- Khoury and Weltman and Hinterbichler and Khoury provide examples of screened
  scalar mechanisms whose assumptions must be derived for a benchmark.
- MICROSCOPE reports a stringent null test of the weak equivalence principle.
- Penrose and Onsager define condensation through an extensive largest
  eigenvalue of the one-body reduced density matrix; Draft 5 uses that
  definition for `N_0` and `f_0`.
- Asenbaum et al. constrain dual-isotope free fall, and Rosi et al. test atoms
  in internal-state superpositions. Neither paper directly constrains the new
  condensate-fraction operator without a translation calculation.
- Cold-atom and BEC interferometry demonstrates relevant preparation and
  metrology capabilities.
- The space-interferometry citation is correctly identified as Maike D.
  Lachmann, Holger Ahlers, Dennis Becker, et al., *Nature Communications* 12,
  article 1317 (2021), DOI `10.1038/s41467-021-21628-z`; v1's author / article
  metadata was incorrect.

# 10. Dependency and Claim Boundary

Paper 13 may use the declared map, source operator, sign convention,
linear-response formula, and exact uniform-sphere fixture as private theory
inputs. It must remain a feasibility and protocol paper until Level 0 supplies
a realistic source profile, screening calculation, constraint-cleared
parameter region, and calibrated apparatus / covariance model. Paper 16 may
record source and hash provenance but cannot validate the physics. Branch C
finite formal artifacts do not derive this action or its observables.

The Level 0 paper makes no claim about physical SIT, full SIT, HSIT, the
Coherence Tower, SIT / Riemann, RH, Yang-Mills, P versus NP, SAN, or consciousness.

# 11. Release and Promotion Gates

Version 3 fixes the endpoint as a model-and-methods note. The exact linear
uniform-sphere solution, first-order uncertainty propagation, and placeholder
systematics are retained as reproducible software and bookkeeping tests. They
are not promoted to a sensitivity forecast, viable parameter point, or
experimental prediction.

For this bounded release, the citation, equation, cross-reference,
source-to-PDF, rendering, privacy, package, metadata, and version-lineage checks
are local acceptance gates. Independent scalar-tensor, many-body, cold-atom,
apparatus, and statistical review remains recommended and may motivate a later
version; it is not classified as unfinished local drafting work for this exact
model-and-methods preprint.

Any later prediction or experimental-outreach version additionally requires a
covariant source completion or justified fixed-source domain, realistic source
profile, nonlinear screening analysis, direct constraint likelihood, calibrated
apparatus transfer functions and covariances, and a blinded analysis plan. Those
are promotion gates, not results of this note.


# 11.5 Microscopic Two-Fluid Matter Model, Canonical Source Normalization, and Conservation Equations (November 2026)

## Architectural decision relative to the November 2026 authoritative SIT action

An explicit model-continuity decision is required so that a phenomenological condensate-source proposal is never mistaken for an automatic consequence of the November 2026 authoritative SIT continuum action (`M_NOV2026_AUTH_EFT_V1`, canon `v1_1`, in the separate SIT Version 81 monograph lane). In `M_NOV2026_AUTH_EFT_V1`, the constitutive factor $f_{\mathrm{SM}}(R_{\mathrm{coh}}) = 1 + R_{\mathrm{coh}}^2/(2 M_{\mathrm{sym}}^2)$ multiplies the entire local Standard Model matter Lagrangian $\mathcal{L}_{\mathrm{matter}}$ uniformly. In the nonrelativistic reduction of a weakly interacting Bose gas of $N$ atoms of mass $m_a$ and $s$-wave scattering length $a_s$ ($g_{\mathrm{int}} = 4\pi\hbar^2 a_s / m_a$), the leading rest-mass contribution $-m_a c^2 (n_0 + n_{\mathrm{th}}) = -m_a c^2 n$ depends solely on the total atom number density $n = n_0 + n_{\mathrm{th}}$ and is completely blind to the Penrose--Onsager condensate fraction $f_c = N_0/N$ at fixed $N$.

Consequently, **unchanged `M_NOV2026_AUTH_EFT_V1` does not produce an $O(1)$ rest-mass condensate-fraction contrast**. The only ordinary difference entering $\mathcal{L}_{\mathrm{matter}}$ between a condensed and thermal cloud at fixed $N$ comes from thermal kinetic, trap, and Hartree--Fock exchange-interaction energies (factor-of-2 direct-plus-exchange vs. pure-direct interaction energy). **Explicit declaration:** the condensate-selective source $J_Q(\mathbf{x}) = -(g_Q m_a / M_{\mathrm{Pl}})\,n_0(\mathbf{x})$ of Level 0 SIT is classified strictly as an **additional phenomenological matter-source model (`M_LEVEL0_CONDENSATE`)** carrying its own independent coupling and apparatus-frame closure, rather than a proved theorem of `M_NOV2026_AUTH_EFT_V1`.

## Canonical scalar normalization, conservative GP limit, and open ZNG-type particle exchange

To match Section 3 Equations (2)--(3) and Section 4 Equation (10) with exact dimensional and variational consistency (in four-dimensional natural units $\hbar = c = 1$ where $[\sigma] = 1$, $[n_0] = 3$, $[\rho] = 4$, and $[m_a] = [M_{\mathrm{Pl}}] = 1$, keeping $\hbar$ explicit in the nonrelativistic matter derivative conventions when convenient), define the **dimensionless** condensate portal coupling

\[
\lambda_Q := \frac{g_Q m_a}{M_{\mathrm{Pl}}}, \qquad [\lambda_Q] = 0,
\]

so the interaction Lagrangian (3) is $\mathcal{L}_Q = -\lambda_Q \sigma(\mathbf{x}, t) |\Phi_0(\mathbf{x}, t)|^2$ ($[\mathcal{L}_Q] = 4$). Combining $\mathcal{L}_Q$ with the canonical static scalar Lagrangian $-\frac{1}{2}|\nabla\sigma|^2 - \frac{1}{2}m_\sigma^2\sigma^2 - (\beta_\sigma / M_{\mathrm{Pl}})\rho\,\sigma$ of Section 4 gives by Euler--Lagrange variation with respect to $\sigma$ the exact static field equation matching Equation (10) (`verify_paper003_v4.py`):

\[
(\nabla^2 - m_\sigma^2)\sigma(\mathbf{x}) = \frac{\beta_\sigma}{M_{\mathrm{Pl}}}\,\rho(\mathbf{x}) + \lambda_Q\,n_0(\mathbf{x}),
\qquad
(\nabla^2 - m_\sigma^2)\delta\sigma_Q(\mathbf{x}) = \lambda_Q\,n_0(\mathbf{x}),
\]

where $\delta\sigma_Q := \sigma - \sigma_{\mathrm{ord}}$ denotes the **background-subtracted condensate-induced scalar response** above the ordinary-matter background $(\nabla^2 - m_\sigma^2)\sigma_{\mathrm{ord}} = (\beta_\sigma / M_{\mathrm{Pl}})\rho$ (equivalently satisfied by the full field $\sigma$ on the isolated condensate-source slice $\beta_\sigma = 0$). Both sides carry exact mass dimension $3$; no extra mass-squared denominator divides $\lambda_Q n_0$ for canonically normalized $\sigma$.

Under the Hartree--Fock--Bogoliubov (Popov) decomposition $\hat{\Psi}(\mathbf{x}, t) = \Phi_0(\mathbf{x}, t) + \hat{\delta}(\mathbf{x}, t)$, the one-body density matrix $\rho_1(\mathbf{x}, \mathbf{x}') = \langle \hat{\Psi}^\dagger(\mathbf{x}')\hat{\Psi}(\mathbf{x})\rangle = \Phi_0^*(\mathbf{x}')\Phi_0(\mathbf{x}) + \rho_1^{\mathrm{th}}(\mathbf{x}, \mathbf{x}')$ isolates $n_0(\mathbf{x}, t) = |\Phi_0(\mathbf{x}, t)|^2$ and $n_{\mathrm{th}}(\mathbf{x}, t) = \langle \hat{\delta}^\dagger \hat{\delta} \rangle$. Varying the same interaction $-\lambda_Q\sigma|\Phi_0|^2$ with respect to $\Phi_0^*$, we explicitly separate two dynamical regimes:

**1. Conservative, separately number-conserving collisionless limit ($\Gamma_{12} = 0$).** In the apparatus rest frame (four-velocity $u^\mu$), the Hermitian Gross--Pitaevskii (GP) equation is:

\[
i\hbar \partial_t \Phi_0
= \left[ -\frac{\hbar^2}{2 m_a}\nabla^2 + V_{\mathrm{eff}}(\mathbf{x}, t) \right]\Phi_0,
\qquad
V_{\mathrm{eff}} := V_{\mathrm{trap}}(\mathbf{x}, t) + m_a \Phi_N(\mathbf{x}) + g_{\mathrm{int}}\bigl(n_0 + 2 n_{\mathrm{th}}\bigr) + \lambda_Q \sigma(\mathbf{x}, t).
\]

Because $V_{\mathrm{eff}}$ is real and the kinetic operator is Hermitian, substituting the Madelung representation $\Phi_0 = \sqrt{n_0}\,\exp(i S / \hbar)$ with $\mathbf{v}_0 = \nabla S / m_a$ and quantum pressure $Q_{\mathrm{Bohm}} = -(\hbar^2/2m_a)\nabla^2\sqrt{n_0}/\sqrt{n_0}$ yields **strictly zero condensate particle source** together with the exact Hamilton--Jacobi / Euler equation (verified symbolically with zero residual, and with a negative-control test confirming that nonzero $\Gamma_{12}$ cannot follow from the conservative GP equation, in `verify_paper003_v4.py`):

\[
\partial_t n_0 + \nabla\cdot(n_0 \mathbf{v}_0) = 0, \qquad
\partial_t S + \frac{|\nabla S|^2}{2 m_a} + V_{\mathrm{eff}} + Q_{\mathrm{Bohm}} = 0.
\]

Taking the gradient of the phase equation yields the condensate force-balance equation derived from the same interaction $-\lambda_Q\sigma|\Phi_0|^2$:

\[
m_a n_0 \bigl(\partial_t \mathbf{v}_0 + (\mathbf{v}_0\cdot\nabla)\mathbf{v}_0\bigr)
= -n_0 \nabla\bigl(V_{\mathrm{trap}} + m_a\Phi_N + g_{\mathrm{int}}(n_0 + 2 n_{\mathrm{th}}) + Q_{\mathrm{Bohm}}\bigr) - \lambda_Q n_0 \nabla\sigma.
\]

**2. Open finite-temperature particle-exchange regime ($\Gamma_{12} \neq 0$, Zaremba--Nikuni--Griffin structure).** Particle exchange between condensate and thermal cloud is **additional collisional kinetic structure** beyond the conservative GP equation (as in finite-temperature ZNG two-fluid theory, Zaremba, Nikuni, and Griffin 1999). On any open domain where $n_0(\mathbf{x}, t) > 0$, introducing the explicit non-Hermitian collisional transfer term $-i\hbar\,\Gamma_{12}(\mathbf{x}, t)\,\Phi_0 / (2 n_0)$ into the GP right-hand side,

\[
i\hbar \partial_t \Phi_0
= \left[ -\frac{\hbar^2}{2 m_a}\nabla^2 + V_{\mathrm{eff}}(\mathbf{x}, t) - i\frac{\hbar\,\Gamma_{12}(\mathbf{x}, t)}{2 n_0(\mathbf{x}, t)} \right]\Phi_0,
\]

yields by exact Madelung substitution (`verify_paper003_v4.py`) the condensate number balance $\partial_t n_0 + \nabla\cdot(n_0 \mathbf{v}_0) = -\Gamma_{12}$ while leaving the real Hamilton--Jacobi phase equation unmodified. Total atom-number conservation does **not** follow from the condensate GP equation alone; it holds only when paired with a separately specified thermal kinetic continuity equation $\partial_t n_{\mathrm{th}} + \nabla\cdot\mathbf{j}_{\mathrm{th}} = +\Gamma_{12}$ obtained by integrating the Boltzmann--ZNG collision integral $C_{12}[f_{\mathrm{th}}, \Phi_0]$ over thermal momenta, yielding $\partial_t(n_0 + n_{\mathrm{th}}) + \nabla\cdot(n_0\mathbf{v}_0 + \mathbf{j}_{\mathrm{th}}) = 0$.

**Energy-balance and external-potential work qualification.** Write $U(\mathbf{x}, t) := m_a\Phi_N(\mathbf{x}) + \lambda_Q\sigma(\mathbf{x}, t)$ for the gravitational and scalar potentials appearing in $V_{\mathrm{eff}}$ above, and define the energy flux $\mathbf{J}_E = -(\hbar^2/2m_a)(\partial_t\Phi_0^*\nabla\Phi_0 + \partial_t\Phi_0\nabla\Phi_0^*)$. Even in the collisionless limit ($\Gamma_{12} = 0$, $n_{\mathrm{th}} = 0$), setting $\Gamma_{12} = n_{\mathrm{th}} = 0$ does not eliminate $U$: if one evaluates only the trap-only density $e_0 := (\hbar^2/2m_a)|\nabla\Phi_0|^2 + V_{\mathrm{trap}}|\Phi_0|^2 + (g_{\mathrm{int}}/2)|\Phi_0|^4$ under the full equation with $U \neq 0$, direct substitution gives $\partial_t e_0 + \nabla\cdot\mathbf{J}_E = n_0\,\partial_t V_{\mathrm{trap}} - U\,\partial_t n_0$, leaving a generally nonzero omitted term $-U\,\partial_t n_0$ (`verify_paper003_v4.py`). Including $U n_0$ consistently in the total condensate energy density $e := e_0 + U n_0$ for a prescribed external potential $V_{\mathrm{trap}}(\mathbf{x}, t) + U(\mathbf{x}, t)$ gives the exact local balance (`verify_paper003_v4.py`):

\[
\partial_t e + \nabla\cdot\mathbf{J}_E = n_0\,\partial_t\bigl(V_{\mathrm{trap}}(\mathbf{x}, t) + U(\mathbf{x}, t)\bigr),
\]

which reduces to the trap-only work identity $n_0\,\partial_t V_{\mathrm{trap}}$ when $U = 0$ (or when $U$ is static, $\partial_t U = 0$, with $U n_0$ retained inside $e$). Thus whenever external trap or potential fields are time-dependent, apparatus work $\int n_0\,\partial_t(V_{\mathrm{trap}} + U)\,d^3x$ enters the condensate energy budget; if $\sigma(\mathbf{x}, t)$ is promoted to a dynamical self-consistent scalar field rather than a prescribed external potential, a complete closed-system energy conservation law must additionally include the scalar field's energy density, flux, and condensate--scalar energy exchange, and in the open $\Gamma_{12} \neq 0$ regime full two-fluid momentum and energy exchange requires the coupled ZNG kinetic equations.

**Locality and covariance boundary:** Because the Penrose--Onsager condensate number $N_0$ is the largest eigenvalue of the nonlocal operator $\rho_1(\mathbf{x}, \mathbf{x}')$, identifying $n_0(\mathbf{x}) = |\Phi_0(\mathbf{x})|^2$ as a local source in a field equation is valid strictly in the coarse-grained hydrodynamic / broken-symmetry limit ($\ell_{\mathrm{coarse}} \gg \xi_{\mathrm{heal}}$, single macroscopic mode in the apparatus rest frame $u^\mu$). A relativistic covariant completion would require promoting $\Phi_0$ to a local covariant scalar order parameter coupled consistently to the full energy-momentum tensor.

## Quantitative separation of ordinary $^{87}\mathrm{Rb}$ energy and spatial confounders

Evaluating a concrete $^{87}\mathrm{Rb}$ harmonic-trap benchmark ($N = 10^6$ atoms, $a_s = 5.29\,\mathrm{nm}$, isotropic trap $\bar{\omega} = 2\pi \times 50\,\mathrm{Hz}$, verified in `verify_paper003_v4.py` / `paper003_v4_verification_results.json`) separates condensate fraction from ordinary thermodynamic and spatial changes:

| Quantity (for $N = 10^6$ $^{87}\mathrm{Rb}$ atoms, $\bar{\omega}/2\pi = 50\,\mathrm{Hz}$) | Value | Physical implication |
|---|---|---|
| Ideal critical temperature $T_c$ / thermal reference $1.2 T_c$ | $225.68\,\mathrm{nK}$ / $270.82\,\mathrm{nK}$ | Sets evaporative transition window |
| Thomas--Fermi chemical potential $\mu_{\mathrm{TF}}/k_B$ and radius $R_{\mathrm{TF}}$ | $92.39\,\mathrm{nK}$ and $13.38\,\mu\mathrm{m}$ | Compact condensed core ($R_{\mathrm{rms,BEC}} = 8.76\,\mu\mathrm{m}$) |
| Thermal cloud width $\sigma_{\mathrm{th}}$ and RMS radius $R_{\mathrm{rms,th}}$ | $16.20\,\mu\mathrm{m}$ and $28.06\,\mu\mathrm{m}$ | Thermal cloud is $3.20\times$ larger in RMS radius |
| Ordinary total energy shift $\Delta E_{\mathrm{tot}} / (N m_a c^2)$ | $7.97 \times 10^{-22}$ | Negligible relativistic mass-energy difference |
| Ordinary interaction energy shift $\Delta E_{\mathrm{int}} / (N m_a c^2)$ | $2.60 \times 10^{-23}$ | Hartree--Fock exchange shift is 23 orders below rest mass |
| Earth gravity-gradient shift per $1\,\mu\mathrm{m}$ centroid offset ($\Gamma_{zz}\delta z / g$) | $3.15 \times 10^{-13}$ | **$3.95 \times 10^8\times$ larger** than ordinary energy shift |

Any realistic experimental test (developed in Paper 014 v3) must therefore control spatial redistribution, gravity gradients, and temperature-dependent wavefront curvature explicitly rather than treating condensate-vs-thermal energy matching as sufficient.


# 12. Conclusion

The Level 0 model-and-methods note contains a precise declared reason why a BEC and thermal cloud
could differ: a new condensate-density source operator defined through the
Penrose-Onsager condensate mode. The null benchmark verifies the recovery path;
the nonzero linear response verifies the signed Yukawa and interferometer
formulas; and the exact linear uniform-sphere and first-order uncertainty
fixtures test source geometry and apparatus bookkeeping without manufacturing
a constraint-cleared anomaly. The internal variation audit also exposes the
remaining covariant source stress / current problem instead of hiding it. The
decisive question is whether the operator has a defensible microscopic origin
and survives realistic source, screening, fifth-force, cold-atom, and
calibrated apparatus constraints. Until those gates and independent reviews
close, the paper is a model and falsification contract rather than a validated
prediction letter. Its publication-level result is the explicit source
hypothesis, linear-response derivation, exact bounded fixture, reproducibility
surface, and failure criteria - not evidence that the proposed interaction
exists.

# References

1. Khoury, J., and Weltman, A. Chameleon Fields: Awaiting Surprises for Tests
   of Gravity in Space. *Physical Review Letters* 93, 171104 (2004).
   https://doi.org/10.1103/PhysRevLett.93.171104
2. Hinterbichler, K., and Khoury, J. Screening Long-Range Forces Through Local
   Symmetry Restoration. *Physical Review Letters* 104, 231301 (2010).
   https://doi.org/10.1103/PhysRevLett.104.231301
3. Touboul, P., et al. MICROSCOPE Mission: Final Results of the Test of the
   Equivalence Principle. *Physical Review Letters* 129, 121102 (2022).
   https://doi.org/10.1103/PhysRevLett.129.121102
4. Lachmann, M. D., Ahlers, H., Becker, D., et al. Ultracold atom
   interferometry in space. *Nature Communications* 12, 1317 (2021).
   https://doi.org/10.1038/s41467-021-21628-z
5. Penrose, O., and Onsager, L. Bose-Einstein Condensation and Liquid Helium.
   *Physical Review* 104, 576-584 (1956).
   https://doi.org/10.1103/PhysRev.104.576
6. Asenbaum, P., Overstreet, C., Kim, M., Curti, J., and Kasevich, M. A.
   Atom-Interferometric Test of the Equivalence Principle at the 10^-12 Level.
   *Physical Review Letters* 125, 191101 (2020).
   https://doi.org/10.1103/PhysRevLett.125.191101
7. Rosi, G., D'Amico, G., Cacciapuoti, L., et al. Quantum test of the
   equivalence principle for atoms in coherent superposition of internal energy
   states. *Nature Communications* 8, 15529 (2017).
   https://doi.org/10.1038/ncomms15529

# Version Lineage and Release Status

Version 3 was publicly deposited on July 29, 2026 as Paper 003 (Zenodo DOI 10.5281/zenodo.21693868, https://pub.svgn.io/papers/paper-3/). This November 20, 2026 Version 4 candidate adds the explicit architectural separation from the November 2026 authoritative SIT action, reconciles the canonical scalar source normalization ($\lambda_Q := g_Q m_a / M_{\mathrm{Pl}}$) and null-recovery condition ($g_Q = 0$), separates conservative GP ($\Gamma_{12}=0$) from open ZNG-type particle exchange ($-i\hbar\Gamma_{12}\Phi_0/(2n_0)$ paired with thermal kinetic continuity) and full external-potential energy balance (all verified symbolically in `verify_paper003_v4.py`), and reports the quantitative $^{87}\mathrm{Rb}$ energy and spatial-confounder budget. It remains a private review candidate awaiting explicit author release authorization.
