\begin{center}

{\LARGE\bfseries QGTCD Constraints Note\par}

\vspace{0.35em}

{\large\itshape Five Countermodel Certificates for Temporal-Opportunity Models of Gravity\par}

\vspace{0.8em}

{\small\textbf{Author: Micah Blumberg}\par}

{\small Self Aware Networks Research Institute\par}

{\small\url{https://selfawarenetworks.com}\par}

{\small November 20, 2026 (Version 2 Standing Counterexample Library and Verification Suite to DOI 10.5281/zenodo.21693935)\par}

\end{center}

\vspace{0.65em}

MICHAHABSTRACTOPENMARKER

Quantum Gradient Time Crystal Dilation (QGTCD) proposes that unequal temporal opportunity can bias otherwise symmetric microscopic transitions and thereby contribute to gravitational behavior. A bounded companion model turns that narrative into positive normalized Markov kernels, proves a smooth-lattice drift-diffusion limit, and constructs a conditional position-velocity calibration [19]. This technical companion note asks a different question: which stronger gravity conclusions do not follow from those premises? It converts five limitations already exposed by the companion's constructive analysis into explicit countermodel certificates and a premise-dependency audit. It does not claim five independent discoveries. Its purpose is neither to promote the formalization as a completed gravity theory nor to dismiss every possible future QGTCD completion.

Five certificates delimit the tested model family. First, at least three distinct finite-step kernels share the same leading drift under matched continuum scaling, so the leading differential equation does not identify the microscopic transition rule. Second, the direct position-only interpretation predicts a response proportional to a probe diffusion scale and therefore does not produce universal free fall without an exact compensation. Third, the inertial relation that reproduces Newtonian acceleration does so only after the Newtonian potential, source law, and cancelling universal response coefficient are imposed; it is a conditional identity, not a derivation of gravity. Fourth, additive velocity noise without friction or a specified bath produces secular kinetic heating rather than equilibrium. Fifth, a family of weak-field geometries can share the same leading clock relation while predicting different spatial-curvature effects, and the classical process contains no quantum state structure. Clock agreement therefore does not determine a relativistic or quantum completion.

The analysis also yields a useful internal discriminator. Varying independently measured probe diffusivity separates the unrenormalized overdamped implementation from the imposed inertial calibration. Neither outcome alone establishes QGTCD against general relativity, but the test can reject one implementation and prevent incompatible model variants from being treated as one theory. A source-custody audit distinguishes the publication dates declared on five 2024 SVGN articles from the first independently verified Wayback captures. The note concludes with a completion ledger specifying the mathematics and measurements a future QGTCD gravity theory must supply.

MICHAHABSTRACTCLOSEMARKER

\noindent\textbf{Keywords:} QGTCD; stochastic process; temporal opportunity; emergent gravity; non-derivation certificate; equivalence principle; model identifiability; falsifiability



# 1. Purpose and scope

QGTCD's documented historical atom is directional: a spatial difference in the proposed local availability or density of time changes the relative probability of otherwise symmetric microscopic deviations [1-4]. That idea is conceptually prior to the model studied here. The endpoint-weighted kernel, its exponent, the state graph, and the update time are 2026 formal choices used to ask what follows when the narrative is made mathematically explicit. They are not retroactively attributed to the earlier sources.

This distinction creates two separate research questions.

1. Can a temporal-opportunity field consistently bias a normalized stochastic process?
2. Does that process derive the observed laws of gravity?

The bounded model answers the first question positively under stated assumptions. It does not answer the second. Sections 2 through 7 summarize and reuse the companion paper's definitions, proofs, frozen numerical checks, and physical limitations [19]; they are included so this shorter technical note can be read independently, not claimed as new this note discoveries. this note's added work begins with the source-custody and intent-recovery audit, then organizes the inherited limitations through Equation (16), typed premise sets, witness-separation certificates, and a repair ledger.

The 2024 SVGN series materially clarifies the intended physical scope. The January article preserves the joined sequence from mass and additional time frames, through greater virtual area in the direction of mass, to changed random trajectory odds [4]. The February article argues that QGTCD cannot be reduced to metric curvature alone and explicitly calls for a robust mathematical bridge and distinctive predictions [15]. The March article names light trajectories, the Hubble tension, and modified galactic dynamics as intended targets [16]. The October QGTCD and Dark Time articles make *time density* the organizing variable and extend the proposed consequences to energy shifts, redshift, black holes, dark matter, dark energy, and cosmic expansion [17,18]. These pages strengthen public genealogy and define a broader obligation set. They do not prove any of those consequences. In this note they justify testing whether the bounded model supplies the necessary matter, clock, light, source, and cosmological structures; the answer remains negative for the present equations.

A **non-derivation result** means that the desired result appears only after the target law or an equivalent assumption has been inserted. An **implementation no-go result** means that a stated implementation cannot satisfy a physical requirement without compensation or replacement. Neither phrase means that every conceivable descendant of QGTCD is impossible.

## 1.1 The problem before the name

Consider a particle or other microscopic system that has several locally available transitions. In a uniform environment, symmetric possibilities should have equal weight, and their average directional effect should cancel. The QGTCD research question begins when the proposed temporal opportunity is not uniform: if one side offers a systematically different amount of available temporal measure than another, can that difference change the relative frequency of otherwise symmetric transitions?

That question has four separate parts. A valid model must keep every transition probability nonnegative and normalized. It must state what the temporal quantity means operationally. It must show how a local transition bias scales into an acceleration or other measurable response. Finally, it must recover the observed universality and relativistic structure of gravity without silently inserting those targets as assumptions.

Established probability theory already supplies biased random walks, Markov kernels, stochastic differential equations, and continuum limits. Those tools explain how unequal local weights can produce a drift. They do not decide that temporal opportunity is a physical field, select its microscopic law, or derive gravity from it.

The proposed operation studied here is therefore plain before it is named:

1. identify the locally available transitions;
2. assign each destination a positive weight determined by the destination's temporal-opportunity value;
3. normalize those weights into transition probabilities;
4. repeat the update and calculate the accumulated large-scale motion;
5. test whether that motion is probe-independent and whether its source, clock, light, and energy relations are derived rather than imported.

**Quantum Gradient Time Crystal Dilation** is the name of the broader research program that proposes the first three steps as a microscopic route toward gravity. The endpoint kernel below is one 2026 mathematical realization of that proposal. The five constraints in this paper arise because a consistent realization of the local bias is not yet the same achievement as a physical derivation of gravity.

## 1.2 Public-source custody

Publication dates and archive-capture dates answer different questions. The date printed on an article identifies the platform's declared publication date. A Wayback capture establishes that the captured bytes were publicly retrievable no later than the capture time. The first valid captures recovered in this audit are:

| Source | Declared publication date | First independently verified Wayback capture | Custody boundary |
|---|---:|---:|---|
| QGTCD Part I [4] | 29 January 2024 | 2 March 2024, `20240302110649` | The capture corroborates public availability by March; it does not independently prove the January date |
| QGTCD Part II [15] | 15 February 2024 | 21 April 2024, `20240421105331` | Same distinction |
| QGTCD Part III [16] | 28 March 2024 | 21 April 2024, `20240421111934` | Same distinction |
| *Quantum Gravity's New Frontier* [17] | 21 October 2024 | 2 November 2024, `20241102214706` | Same distinction |
| *Dark Time Theory* [18] | 22 October 2024 | 7 November 2024, `20241107022842` | Same distinction |

Each archived page was read back for title, author / date line, and the mechanism atoms for which it is cited. Retrospective archive aliases that did not resolve were excluded rather than used as timestamp evidence. The 2022 repository objects are content-addressed records carrying 2022 commit metadata. Their hashes fix the cited bytes, but commit metadata alone is not an independent public timestamp. The independently verified public-date floor for the five SVGN pages is supplied by their Wayback captures; the public-date status of the earlier repository objects remains a separate custody question.

## 1.3 Intent-recovery boundary

Historical wording is preserved before it is corrected or narrowed. In particular, *mass as a time crystal*, *additional time as additional area*, and *random walk* remain part of the dated proposal. The present model translates those phrases into a positive field, a normalized transition rule, and a conditional large-scale limit; it does not claim that the earlier prose already contained the 2026 equations. Likewise, the apparent tension between *more temporal opportunity near mass* and *slower proper time on a clock* is treated as an ambiguity between two candidate observables, not as grounds to delete the historical account. The calibration distinguishes the proposed field from clock proper time and then tests the relation explicitly.

This preservation rule is scientific as well as historical. If a phrase compresses a legitimate directional mechanism, the mechanism is recovered and tested. If an equation is dimensionally inconsistent or a proposed consequence is unsupported, the original record remains visible while the corrected manuscript changes its status rather than silently rewriting the genealogy.

# 2. Minimal temporal-opportunity model

Let a locally finite undirected graph represent possible positions. Let \(\tau(x)>0\) be a temporal-opportunity field, let \(\tau_0\) be a reference value, and define the companion model's dimensionless field [19]

\[
u(x)=\log\!\left(\frac{\tau(x)}{\tau_0}\right),
\qquad q(x)=\exp\!\bigl(\beta u(x)\bigr),
\tag{1}
\]

where \(\beta\) is a dimensionless response parameter. The endpoint-weighted transition kernel is

\[
P_\beta(x,y)=
\frac{\mathbf 1_{\{y\in N(x)\}}q(y)}
{\sum_{z\in N(x)}q(z)}.
\tag{2}
\]

For positive \(\tau\) and finite nonzero degree, Equation (2) is positive and normalized. When \(\tau\) is constant over the neighborhood, it reduces exactly to the unbiased nearest-neighbor walk. These elementary properties formalize the claims that a uniform environment preserves local symmetry and a field gradient can tilt directional odds.

On a regular Cartesian lattice of spacing \(\epsilon\), choose the diffusive time step \(\Delta t=\epsilon^2/(2dD)\). For a sufficiently smooth field on the interior, the endpoint chain has the leading diffusion

\[
dX_t=2\beta D\nabla u(X_t)\,dt+\sqrt{2D}\,dW_t,
\tag{3}
\]

with generator \(Lf=D\Delta f+2\beta D\nabla u\cdot\nabla f\). On compatible periodic lattices converging to a flat torus, generator convergence and vanishing jump size give a narrow weak-process limit under standard regularity conditions [5,6]. The limiting diffusion has reversible invariant density

\[
p_\infty(x)=
\frac{\exp\!\bigl(2\beta u(x)\bigr)}
{\int \exp\!\bigl(2\beta u(z)\bigr)\,dz}.
\tag{4}
\]

The finite endpoint chain's stationary cell densities converge to Equation (4) in this compact smooth setting. The companion's frozen numerical regression on grids from 32 through 1024 sites found normalized positive stationary masses, detailed-balance and stationarity residuals at floating-point precision, and approximately second-order convergence to the sampled continuum density [19]. Those checks test the implementation of the stated model; they are not physical validation.

# 3. Constraint I: the continuum limit does not identify the microscopic kernel

The historical mechanism says that a gradient changes directional odds. It does not uniquely determine how the change is encoded at a finite step. The endpoint kernel, a centered linear tilt, and a Metropolis-type accept / reject kernel can all be tuned to approach the same leading drift-diffusion generator while retaining different transition probabilities at finite spacing in the specified nonzero-gradient comparison [7,8]. In a uniform field all three reduce to the same unbiased walk, so the non-identifiability witness requires a field configuration that exposes their finite-step differences.

In a one-dimensional linear field, the common target drift is

\[
b_{\mathrm{target}}=2\beta D\,u'.
\tag{5}
\]

The companion's frozen comparison used \(\beta=0.7\), \(u'=0.4\), and \(D=0.4\), yielding a target drift of 0.224 [19]. At lattice spacing 0.025, the endpoint, centered-linear, and Metropolis implementations produced drifts of approximately 0.223996, 0.224000, and 0.222439, respectively. The endpoint error decreased at approximately second order, the centered-linear rule was exact for this linear-field case, and the Metropolis error decreased at approximately first order.

The result is an identifiability constraint:

> Agreement with the leading drift or invariant density does not establish which finite-step temporal-opportunity rule, if any, generated the observations.

Finite-resolution transients, waiting probabilities, higher conditional moments, or interventions that discriminate the transition rules are therefore required. A continuum fit alone cannot be offered as evidence for the endpoint kernel specifically. More broadly, the temporal-opportunity narrative denotes a model class until an additional physical principle selects the graph, kernel, response exponent, update clock, and boundary rule.

# 4. Constraint II: direct overdamped gravity is not universal free fall

The companion's Equation (3) gives the field-directed conditional mean velocity [19]

\[
b(x)=2\beta D\nabla u(x).
\tag{6}
\]

The coefficient contains the diffusion scale \(D\). If two preparations have different independently measured diffusivities while sharing the same proposed field \(u\) and coupling \(\beta\), the unmodified model predicts different field-directed drifts. The frozen implementation check used diffusivities 0.2 and 0.6 and obtained a drift ratio of 3.0, equal to the diffusivity ratio to floating-point precision.

This is not automatically a defect for a Brownian transport model; drift mobility commonly depends on preparation and environment. It is a defect if \(b\) is identified directly with a universal gravitational response. The weak equivalence principle requires the same freely falling trajectory for probes with the same initial state, independent of arbitrary nongravitational preparation parameters within experimental bounds [9].

Define the preparation-dependence slope

\[
s_D=\frac{\partial\log|b|}{\partial\log D}.
\tag{7}
\]

The unrenormalized endpoint interpretation predicts \(s_D=1\). A universal mean free-fall response requires that controlled probe diffusivity not alter the gravitational acceleration, corresponding to \(s_D=0\) after ordinary drag, thermal, electrostatic, magnetic, and apparatus effects are removed.

This produces an implementation no-go result: the position-only kernel cannot serve directly as a universal free-fall law unless another mechanism cancels the probe scale exactly. Permissible responses include deriving a universal compensation, replacing the overdamped state with inertial dynamics, or limiting the kernel to a subordinate microscopic transport sector. Relabeling a drift velocity as acceleration is dimensionally invalid and does not resolve the problem.

# 5. Constraint III: the Newtonian bridge is an imported identity

An inertial calibration can remove the explicit diffusivity dependence. Let \(\Phi\) be the Newtonian potential per unit mass and define a dimensionless field by

\[
u(x,t)=-\frac{\Phi(x,t)}{c_*^2},
\qquad \Delta\Phi=4\pi G\rho_m,
\tag{8}
\]

where \(c_*\) is a universal conversion speed. Enlarge the state to position and velocity and postulate

\[
dX_t=V_t\,dt,
\qquad dV_t=c_*^2\nabla u(X_t,t)\,dt+\sigma_v\,dW_t.
\tag{9}
\]

With \(\sigma_v=0\), substitution gives

\[
\frac{d^2X_t}{dt^2}=c_*^2\nabla u(X_t)=-\nabla\Phi(X_t).
\tag{10}
\]

Equation (10) is dimensionally coherent and independent of \(D\). For a point-source Newtonian exterior it gives the usual inverse-square acceleration. Yet the result is obtained because Equation (8) defines \(u\) from the already-known Newtonian potential and Equation (9) selects the coefficient that cancels \(c_*^2\). The Poisson source law, Newton's constant, the potential, and the universal response are inputs.

The distinction is easiest to audit by assigning every quantity a role rather than allowing one symbol to carry several meanings.

| Quantity | Units | Role in the bounded model | Present evidential status |
|---|---:|---|---|
| \(\tau(x)\) | model-dependent | proposed temporal opportunity | not yet independently measured |
| \(u=\log(\tau/\tau_0)\) | dimensionless | field used by the transition kernel | defined from \(\tau\); not yet independently identified |
| \(\beta\) | dimensionless | sensitivity of transition odds to \(u\) | free response parameter |
| \(D\) | length squared per time | probe diffusion scale in the overdamped limit | measurable preparation parameter |
| \(\Phi\) | length squared per time squared | Newtonian potential per unit mass | imported standard-gravity field |
| \(\rho_m\) and \(G\) | standard Newtonian units | source density and coupling in Poisson's equation | imported standard-gravity source law |
| \(c_*\) | length per time | conversion scale in the inertial response | imposed universal coefficient; set to \(c\) for the clock comparison |
| \(\sigma_v\) | length per time to the three-halves power | velocity-noise amplitude | optional model parameter without a supplied bath |

This ledger also exposes the dimensional boundary between the two implementations. The overdamped expression \(2\beta D\nabla u\) has units of velocity. The inertial expression \(c_*^2\nabla u\) has units of acceleration. Moving from one to the other is a change of state model and response law, not a change of notation.

The non-derivation result is therefore precise:

> Substituting an imposed Newtonian field map into an imposed universal inertial response proves compatibility with Newtonian gravity, not a derivation of why matter sources gravity or why all probes share that response.

The identity remains useful. It clarifies the sign convention, separates the proposed microscopic opportunity field from clock proper time, and shows the minimum bridge needed for a universal classical benchmark [19]. But it cannot be cited as a new force law or as an explanation of the source coupling.

A future positive derivation must replace at least one imported element with an independently specified result. For example, it could derive the source equation for \(u\), derive a universal matter coupling that fixes \(c_*\), or identify a direct observable of \(\tau\) that can be measured without first reconstructing \(\Phi\). Fitting \(\beta\), \(c_*\), and \(u\) together to the same gravitational data would not identify which part of the fit belongs to a new mechanism.

# 6. Constraint IV: additive velocity noise heats without dissipation

For \(\sigma_v=0\) in a static field, the specific mechanical energy

\[
E_{\mathrm{spec}}=\frac{|V|^2}{2}-c_*^2u
=\frac{|V|^2}{2}+\Phi
\tag{11}
\]

is conserved along the deterministic trajectories. If additive velocity noise is retained without friction, then in the force-free case each component satisfies \(dV_i=\sigma_v dW_i\), so

\[
\operatorname{Var}[V_i(t)]
=\operatorname{Var}[V_i(0)]+\sigma_v^2t.
\tag{12}
\]

Expected kinetic energy grows linearly. The corresponding phase-space density obeys

\[
\partial_t f+v\cdot\nabla_x f+c_*^2\nabla u\cdot\nabla_v f
=\frac{\sigma_v^2}{2}\Delta_v f.
\tag{13}
\]

Under suitable boundary conditions Equation (13) conserves probability, but probability conservation is not thermodynamic equilibrium. A stationary thermal interpretation requires a specified friction term, bath, fluctuation-dissipation relation, or explicit external energy source. Adding one of those elements would define a new model whose invariant law and gravitational interpretation require a new audit.

This no-go result blocks a common shortcut: stochastic forcing cannot be treated simultaneously as unexplained microscopic variation and as an equilibrium mechanism. Normalized noise is mathematically admissible; it is not an energy budget.

# 7. Constraint V: a clock match is not a relativistic or quantum completion

If \(c_*=c\), the imposed field map is compatible at leading weak-field order with the standard stationary-clock relation

\[
\frac{d\tau_{\mathrm{proper}}}{dt}\approx 1+\frac{\Phi}{c^2}=1-u.
\tag{14}
\]

This is an internal consistency check, not an independent measurement of the microscopic quantity \(\tau\). Both the field map and the clock relation have been reconstructed from the same standard weak-field potential. An operational QGTCD field would need an observable defined without first inferring \(\Phi\).

More importantly, clock redshift constrains only part of the weak-field structure. A schematic post-Newtonian metric is

\[
ds^2=-(1-2u)c^2dt^2
+(1+2\gamma_{\mathrm{PPN}}u)\delta_{ij}dx^idx^j+O(u^2).
\tag{15}
\]

Light bending and Shapiro delay also depend on spatial curvature through \(\gamma_{\mathrm{PPN}}\). The calibration neither derives Equation (15), fixes \(\gamma_{\mathrm{PPN}}\), nor establishes that light follows null trajectories of a QGTCD geometry [9]. It therefore cannot claim agreement with lensing, time delay, perihelion advance, frame dragging, binary dynamics, or gravitational waves.

The classical stochastic equations also contain no Hilbert-space state, complex amplitude, unitary or other quantum evolution law, observable algebra, measurement rule, Born probability, or controlled classical limit. Brownian noise is not quantum dynamics. Likewise, the historical phrase *time crystal* does not itself provide a time-crystal order parameter or connect the model to demonstrated time-crystalline eigenstate order [10]. Relativistic quantum-clock and redshift studies define relevant comparison constraints, but they do not fill the missing QGTCD derivation [11-13].

Nor is this position process equivalent to stochastic gravity in the established Einstein-Langevin sense. That program studies metric backreaction sourced by quantum stress-energy fluctuations and a noise kernel [14]. The temporal-opportunity walk contains none of that source or metric structure. Sharing the word *stochastic* does not make the models physically interchangeable.

The resulting constraint is architectural: a temporal scalar is not yet a spacetime theory, and a classical stochastic kernel is not yet a quantum theory.

# 7A. Five non-derivation certificates

The phrase *does not derive* should be testable rather than rhetorical. Let \(\mathcal A\) denote a stated set of assumptions and let \(C\) denote a stronger conclusion. A countermodel certificate has the form

\[
\mathcal A\not\models C
\quad\Longleftarrow\quad
\exists\,\mathcal M\;[\mathcal M\models\mathcal A
\ \text{and}\ 
\mathcal M\not\models C].
\tag{16}
\]

One admissible model satisfying the premises while failing the conclusion is sufficient to show that the conclusion is not entailed by those premises. This is not proof that the conclusion is false in nature. It identifies an additional premise, mechanism, or measurement that a positive derivation must supply.

The assumptions used in this paper are deliberately typed:

- \(\mathcal A_{\mathrm{hist}}\): unequal temporal opportunity is proposed to change directional odds;
- \(\mathcal A_{\mathrm{ker}}\): a positive normalized local transition kernel realizes that directional atom;
- \(\mathcal A_{\mathrm{lim}}\): smooth Cartesian-lattice scaling yields the stated leading drift-diffusion limit;
- \(\mathcal A_{\Phi}\): the Newtonian potential and Poisson source law are imported through Equation (8);
- \(\mathcal A_{\mathrm{in}}\): a universal inertial response is postulated through Equation (9);
- \(\mathcal A_{\mathrm{noise}}\): optional additive velocity noise is present without friction.
- \(\mathcal A_{\mathrm{clk}}\): the weak-field clock relation in Equation (14) is imposed;
- \(\mathcal A_{\mathrm{cl}}\): the state and evolution remain classical Markov or Langevin objects.

The five certificates are then explicit.

| Certificate | Premises retained | Stronger conclusion tested | Witness that blocks entailment | Missing positive bridge |
|---|---|---|---|---|
| NC-1 microscopic identifiability | \(\mathcal A_{\mathrm{hist}}+\mathcal A_{\mathrm{lim}}\) | The leading continuum generator uniquely identifies the finite-step kernel | Endpoint, centered-linear, and Metropolis rules share the leading generator but differ at finite mesh in the specified nonzero-gradient comparison | A kernel-selection principle or finite-step intervention |
| NC-2 universal free fall | \(\mathcal A_{\mathrm{ker}}+\mathcal A_{\mathrm{lim}}\) | The position-only drift is a universal gravitational response | With nonzero \(\beta\nabla u\), two preparations with \(D_1\ne D_2\) in the same \(u,\beta\) field have \(b_1/b_2=D_1/D_2\) | Derived probe cancellation or a different inertial state law |
| NC-3 derived Newtonian gravity | \(\mathcal A_{\mathrm{ker}}+\mathcal A_{\mathrm{lim}}\) | Newtonian sourcing and acceleration follow from the local-bias mechanism | A smooth non-Poisson assignment, for example \(u(x)=x^2\) with \(\rho_m=0\) on a local one-dimensional domain, satisfies the kernel assumptions but not the imported source relation; Newtonian acceleration appears only after \(\mathcal A_{\Phi}+\mathcal A_{\mathrm{in}}\) are added | A derived source equation and universal matter coupling |
| NC-4 stochastic equilibrium | \(\mathcal A_{\mathrm{in}}+\mathcal A_{\mathrm{noise}}\) | Additive velocity noise produces a stationary thermal state | In the force-free case \(\operatorname{Var}V_i(t)=\operatorname{Var}V_i(0)+\sigma_v^2t\) | Friction, bath, fluctuation-dissipation law, or explicit energy source |
| NC-5 relativistic and quantum completion | \(\mathcal A_{\mathrm{clk}}+\mathcal A_{\mathrm{cl}}\) | A leading clock match fixes light propagation, covariance, and quantum dynamics | The metric family below shares its leading temporal clock term while varying spatial curvature; the same stochastic process has no Hilbert-space state | A metric or covariant propagation law, source / backreaction dynamics, and a genuine quantum sector |

**Proposition 1 (witness separation).** For each certificate \(i\), let \(\mathcal A_i\) be the premises in its row, \(C_i\) the tested conclusion, and \(\mathcal M_i\) the stated witness. If \(\mathcal M_i\models\mathcal A_i\) and \(\mathcal M_i\not\models C_i\), then \(\mathcal A_i\not\models C_i\). Consequently, any repaired premise set \(\mathcal A_i\cup\mathcal R_i\) that entails \(C_i\) must contain at least one premise that excludes \(\mathcal M_i\).

*Proof.* The first statement is the definition of failure of semantic entailment in Equation (16). If a repaired premise set still admitted \(\mathcal M_i\), then \(\mathcal M_i\) would satisfy the repaired premises while failing \(C_i\), contradicting entailment. \(\square\)

The proposition does not prove that the repair categories in the final column are sufficient, unique, or logically minimal. It establishes only a necessary witness-exclusion condition. The witnesses are: a nonzero-gradient finite-mesh comparison for NC-1; unequal \(D_1,D_2\) at fixed nonzero \(\beta\nabla u\) for NC-2; a smooth non-Poisson assignment such as \(u(x)=x^2,\rho_m=0\) for NC-3; force-free Brownian velocity with \(\sigma_v>0\) for NC-4; and clock-equivalent metrics with unequal spatial-curvature parameters, paired with the classical Markov sector, for NC-5.

For NC-5, consider the one-parameter weak-field family

\[
ds_\gamma^2=-(1-2u)c^2dt^2
+(1+2\gamma u)\delta_{ij}dx^idx^j+O(u^2).
\tag{17}
\]

Every member has the same leading stationary-clock term, while the leading light-deflection coefficient depends on \(\gamma\):

\[
\alpha_\gamma(b)=\frac{2(1+\gamma)GM}{bc^2}
+O\!\left(\frac{G^2M^2}{b^2c^4}\right).
\tag{18}
\]

Thus a clock match alone cannot select \(\gamma\) or the light law. General relativity fixes \(\gamma=1\); the present temporal-opportunity calibration does not. Separately, the classical Markov and Langevin models themselves satisfy the stochastic premises while lacking complex amplitudes, an observable algebra, unitary or other quantum evolution, a measurement rule, and a time-crystal order parameter. They are direct counterexamples to the implication that stochastic temporal language alone supplies a quantum completion.

The certificates also show which failures are repairable without erasing the historical proposal. NC-1 calls for a kernel-selection experiment. NC-2 calls for a universal response law. NC-3 calls for a source derivation. NC-4 calls for a thermodynamic environment. NC-5 calls for relativistic and quantum architecture. A future model can add those structures, but each addition changes the premise set and must be audited as a new derivation.

# 7B. Nonduplication from the companion model paper

This note openly reuses the minimal definitions, selected equations, and bounded results of the longer QGTCD model paper [19]. It does not present that common material as a second independent invention. In particular, the companion already states kernel non-uniqueness, probe-diffusivity dependence, the conditional Newtonian identity, additive-noise heating, the clock / PPN gap, and the absence of a quantum completion. this note's distinct role is narrower: it recasts those results as a common model-theoretic certificate set, types their premises, maps each witness to a necessary witness-exclusion obligation, adds the readback of five archived source pages, and publishes the short consequence audit as a separately readable technical note.

| Dimension | Companion model paper [19] | This constraints note |
|---|---|---|
| Governing question | Can the historical directional atom be represented by coherent classical kernels, and what conditional properties follow? | Which stronger gravity claims are not entailed by those properties, and what exact premise would repair each gap? |
| Primary constructive objects | Three finite-step kernels, matched local moments, endpoint-chain equilibrium, torus process convergence, and conditional inertial calibration | No new constructive kernel result claimed; countermodel schema in Equation (16), five named non-derivation certificates, typed premise map, and certificate-to-repair ledger |
| Use of the numerical regressions | Validate specified kernel behavior and finite-mesh convergence in frozen cases | Supply witnesses for NC-1 and NC-2; no new empirical or numerical claim is made |
| Source contribution | Full mechanism and equation genealogy | Independent readback of five 2024 article bodies with declared-date versus archive-capture separation |
| Reader outcome | A bounded positive model and its assumptions | A compact audit showing exactly why kernel consistency is not yet gravity derivation |

The exact overlap is auditable rather than asserted. The companion QGTCD paper's Section 2.1 and Proposition 2A supply the kernel comparison used by NC-1; Sections 6.1, 6.7, and 6.8 supply the diffusivity obligation and discriminator used by NC-2; Proposition 6 supplies the conditional identity audited by NC-3; the additive-noise energy audit supplies NC-4; Sections 11.4 through 11.8 supply the clock, PPN, backreaction, and quantum gaps organized by NC-5. this note adds no second credit for those results.

The relationship is therefore *premise paper to technical consequence-audit paper*. Removing this note leaves the companion's constructive theorems and substantive limitations intact but removes the compact certificate / dependency architecture, source-custody readback, and repair ledger. Removing the companion leaves this note's logical organization intact but removes the full constructive proofs on which several certificates rely. Cross-citation and the atlas identify every shared atom, so common definitions cannot be miscounted as two separate contributions.

# 8. Empirical discriminator and decision rules

The diffusivity slope in Equation (7) can distinguish two internal implementations without pretending to test the entire QGTCD research program against general relativity.

A controlled experiment would independently measure the effective diffusivity of at least three neutral-probe preparations, hold or monitor the field proxy, reverse the prespecified source geometry, and estimate the signed response along the declared axis. Zero-gradient, sham-source, apparatus-reversal, thermal, electrostatic, magnetic, pressure, vibration, and drag controls are mandatory. Analysis should be blinded to preparation labels, and uncertainty in both response and diffusivity should enter the slope fit.

The decision rules are asymmetric.

- A result compatible with \(s_D=0\) rejects the unrenormalized overdamped kernel as a direct universal free-fall mechanism. It does not support QGTCD because standard gravity and the imported inertial calibration also predict no arbitrary diffusivity dependence.
- A result compatible with \(s_D=1\) does not establish gravity. Ordinary stochastic forces must first be excluded, the response must track source reversal, and the effect must replicate across probe composition and apparatus.
- A slope that changes materially with temperature, apparatus, or composition fails the proposed universality.
- A field proxy defined by reconstructing the known Newtonian potential fails the independence requirement before data analysis.

No QGTCD-versus-general-relativity residual is claimed here. A future test must freeze a quantitative departure that is not already produced by standard gravity or ordinary environmental transport.

# 9. Completion ledger

| Required component | Present result | Status needed for a physical theory |
|---|---|---|
| Positive transition rule | Proved for the endpoint kernel | Derive or physically select the kernel |
| Smooth continuum limit | Proved on a regular lattice; process limit on a compact torus | Extend to justified boundaries, sources, and geometry |
| Microscopic identifiability | Three distinct kernels share a leading limit | Measure discriminating finite-step observables |
| Universal free fall | Fails for direct overdamped interpretation | Derive probe-independent inertial response |
| Newtonian acceleration | Recovered by imposed calibration | Derive source and coupling without inserting the target law |
| Static energy accounting | Conditional conservation when noise is absent | Supply a complete field-matter energy budget |
| Noisy equilibrium | Additive noise heats | Specify bath, dissipation, and fluctuation-dissipation structure |
| Operational temporal field | Defined mathematically | Measure independently of the known potential |
| Light and spatial curvature | Not modeled | Derive propagation and post-Newtonian parameters |
| Covariance and backreaction | Not modeled | Supply spacetime dynamics, sources, and conservation identity |
| Quantum status | Classical probability only | Supply states, evolution, observables, measurement, and limit |
| Time-crystal status | Historical label only | Supply order parameter and physical realization |
| Novel empirical residual | None frozen | Predict and survive a result beyond standard gravity |


# 9A. Standing Counterexample Matrix Mapped to Current SIT Derivations (November 2026)

To operate as an active review gate across the entire SIT portfolio (including Papers 002, 003, 007, 014, 034, 048, 062, and the separate SIT Version 81 monograph series), each countermodel in this note is now paired with an exact symbolic or numerical verification check in `verify_paper055_v2.py` (`paper055_v2_verification_results.json`, 4/4 checks passing) and mapped directly to the premise required to exclude it in any proposed derivation.

| Standing Counterexample | Verified Quantitative Certificate (`verify_paper055_v2.py`) | Target SIT Derivation Affected | Premise Required to Exclude Counterexample (Derived vs. Assumed) |
|---|---|---|---|
| Constraint I: Non-uniqueness of diffusion limit | 2-point kernel $K_1$ ($\pm h$) vs. 5-point kernel $K_2$ ($\{0,\pm h,\pm 2h\}$, weights $1/2,1/6,1/12$): identical second moment $\mu_2 = h^2$ (same diffusion $M_2 = h^2/\tau$), distinct **fourth raw moments** $\mu_4(K_1) = h^4$ vs. $\mu_4(K_2) = 3h^4$ (raw-moment ratio $3$) and distinct **fourth cumulants** $\kappa_4(K_1) = -2h^4$ vs. $\kappa_4(K_2) = 0$ (excess kurtosis $-2$ vs. $0$, cumulant ratio $0 \neq 3$) | Paper 007, Paper 062, continuum stochastic derivations | Must specify higher moments/cumulants or microscopic transition law directly (**assumed**, not derived from diffusion limit) |
| Constraint II: Probe-dependent overdamped drift contrast (vs. acceleration WEP) | Overdamped drift $b_i = 2\beta D_i\nabla u$ in a constant gradient gives linear mean trajectory $\langle x_i(t)\rangle = x_0 + b_i t$ with **zero mean acceleration** ($d^2\langle x_i\rangle/dt^2 = 0$) and normalized **overdamped drift-velocity contrast** $\Delta_{v,AB} := 2|b_A - b_B|/(b_A + b_B) = 2/3$ when $D_B = 2 D_A$ | Paper 002, Paper 007, Paper 062 | Must impose universal composition-independent coupling $\beta D_i = \text{const}$ AND supply an explicit inertial dynamics or calibrated force-to-acceleration apparatus map before making an acceleration-based Eotvos / WEP claim (agreeing with Section 5's prohibition against renaming drift velocity as acceleration) |
| Constraint IV: Undamped additive noise heating | Undamped $dv = \sigma dW$ gives $\langle v^2(T=5)\rangle = 4.904$ (exact $5.0$, linear runaway) vs. damped Ornstein--Uhlenbeck equilibrium $1.0045$ | Paper 062 bath models, stochastic gravity extensions | Must include fluctuation-dissipation friction $-\gamma v\,dt$ with $\sigma^2 = 2\gamma k_B T/m$ (**derived** only from an explicit thermal bath) |
| Constraint V: Clock match underdetermines metric/quantum completion | $\gamma = 1$ (GR) vs. $\gamma = 0$ (spatially flat) metrics give $0$ stationary clock-rate difference while differing $2\times$ in light deflection $(1+\gamma)/2 = 1$ vs. $1/2$ | Paper 002, Paper 007, clock-to-gravity bridges | Must supply spatial metric / light-propagation equations from a full covariant action (**assumed** via Einstein--Hilbert + declared matter coupling) |

**Formalization priority note:** Proving the explicit kernel moment and cumulant identities ($\mu_2$ equality with $\mu_4$ ratio $3$ and $\kappa_4 = -2h^4$ vs. $0$), the exact $\Delta_{v,AB} = 2/3$ overdamped drift-velocity contrast with $d^2\langle x\rangle/dt^2 = 0$, the linear variance-runaway identity, and the stationary-clock vs. light-deflection counterexample directly in machine-checked code contributes concrete mathematical obstructions rather than merely formalizing the general logical tautology that a countermodel defeats an implication.


# 10. Limitations

The mathematical claims concern a selected classical model family. The smooth-lattice expansion does not cover singular point sources, noncompact domains, irregular graphs, anisotropic neighborhoods, absorbing or reflecting boundaries, or dynamic geometry. The compact-torus convergence result is deliberately narrower than a gravitational setting.

The numerical regressions verify equations and implementation behavior for chosen examples. They are not measurements, do not validate temporal opportunity as a physical field, and do not establish that any microscopic kernel operates in nature. The three-kernel comparison is sufficient to demonstrate non-uniqueness, not to enumerate every admissible model.

The physical conclusions are also bounded. The note does not show that all future QGTCD or Super Information Theory formulations fail. It shows that the tested endpoint diffusion and imposed inertial calibration cannot bear stronger claims than their assumptions permit. A successor that changes the state, source law, coupling, geometry, noise model, or quantum structure is a new model and must be evaluated on its own equations.

Finally, the historical sources establish development and provenance, not correctness. The mathematical and physics audit was conducted inside the manuscript-development program; independent review and author disposition remain open.

# 11. Conclusion

Formalization clarifies both what QGTCD can currently express and what it has not derived. A positive temporal-opportunity field can consistently tilt a normalized local transition rule, and the selected endpoint kernel has a controlled smooth continuum limit and compact-domain invariant density. Those constructive results are established in the companion model paper [19] and used here as explicit premises rather than presented as new results.

Five constraints prevent those results from being overstated. The continuum generator does not identify the microscopic kernel. Direct overdamped drift depends on probe diffusivity. Newtonian acceleration appears only after the Newtonian field map and universal inertial response are imposed. Additive velocity noise heats without dissipation. A leading clock relation leaves the spatial, causal, source, conservation, quantum, and time-crystal architecture open.

These are productive negative results. Equation (16) and certificates NC-1 through NC-5 turn a broad narrative into a falsifiable model family, separate consistency from derivation, expose incompatible implementations, and identify the exact obligations for a future completion. The strongest next contribution is not a more forceful interpretation of the present equations, but a separately derived source-and-response architecture with an independent temporal observable and a quantitative residual beyond general relativity.

The practical result is a sharper division of labor for the research program. The companion establishes a mathematically admissible local-bias mechanism; the present paper contributes the countermodel certificates, premise-dependency audit, source-custody readback, and repair ledger. A successor paper must earn the gravity claim by deriving the source, universal response, and independent observable that this bounded model presently imports or leaves undefined.

# Version lineage, data, and code availability

The July 27, 2026 edition was publicly deposited on July 29, 2026 as Paper 055 (Zenodo DOI 10.5281/zenodo.21693935, https://pub.svgn.io/papers/paper-55/). This November 20, 2026 Version 2 candidate adds Section 9A connecting each standing counterexample to current portfolio derivations with exact raw-moment vs. cumulant and drift-velocity-contrast vs. acceleration distinctions, and supplies the standalone reproducible verification script `verify_paper055_v2.py` (`paper055_v2_verification_results.json`, 4/4 checks passing).

## Archival data note

The governed release candidate contains the manuscript, Letter PDF, math-free provider description, combined claim-source-genealogy atlas, source ledger, predecessor-integrity record, audits, validators, and a cryptographic manifest. The companion model package contains the endpoint-kernel implementation, frozen three-kernel comparison, periodic stationary-limit regression, and result files on which several certificates rely [19]. The reported mechanical checks can be reproduced from the frozen validators. No public or repository release is authorized by this manuscript.

# Authorial provenance and research chronology

The underlying QGTCD research program and its core conceptual claims are Micah Blumberg's original research. The dated sources in References 1-4 document the development of the directional temporal-opportunity mechanism. Later computational and editorial tools assisted with formalization, code, checking, and manuscript preparation; they did not originate the historical theory. Micah Blumberg selected the claims and sources and remains responsible for the paper's arguments, interpretations, and errors.

# References

1. Blumberg, M. *Time Crystals, Time Dilation, Quantum Gradient Time Dilation*. `a0253z.md`, content-addressed Git record carrying 26 July 2022 commit metadata, commit `92dc0fd1aad256664df035711b58e7d8e273f327`. https://github.com/v5ma/selfawarenetworks/blob/92dc0fd1aad256664df035711b58e7d8e273f327/a0253z.md
2. Blumberg, M. Revision of `a0253z.md` containing the directional probability mechanism. Content-addressed Git record carrying 30 July 2022 commit metadata, commit `c4e94e9fcd049c97d47ef6a5f2f8c29485f5a98d`. https://github.com/v5ma/selfawarenetworks/blob/c4e94e9fcd049c97d47ef6a5f2f8c29485f5a98d/a0253z.md
3. Blumberg, M. Naming record for Quantum Gradient Time Crystal Dilation. `a0322z.md`, content-addressed Git record carrying 28 November 2022 commit metadata, commit `4e0cf1ee0975c01dc57182368497d3f0cd864030`: https://github.com/v5ma/selfawarenetworks/blob/4e0cf1ee0975c01dc57182368497d3f0cd864030/a0322z.md. Corroborating changelog object, commit `60ca380f1e04e3d5a26a9a65ba628d70e4ba8136`: https://github.com/v5ma/selfawarenetworks/blob/60ca380f1e04e3d5a26a9a65ba628d70e4ba8136/00changelog.md
4. Blumberg, M. *New Unified Field Theory: Quantum Gradient Time Crystal Dilation*. SVGN (29 January 2024). Current: https://www.svgn.io/p/a-new-unified-field-theory-called. Archived no later than 2 March 2024: https://web.archive.org/web/20240302110649id_/https://www.svgn.io/p/a-new-unified-field-theory-called
5. Levin, D. A. & Peres, Y., with contributions by Wilmer, E. L. *Markov Chains and Mixing Times*, 2nd ed. American Mathematical Society (2017). https://doi.org/10.1090/mbk/107
6. Ethier, S. N. & Kurtz, T. G. *Markov Processes: Characterization and Convergence*. Wiley (1986). https://doi.org/10.1002/9780470316658
7. Metropolis, N. et al. Equation of state calculations by fast computing machines. *Journal of Chemical Physics* **21**, 1087-1092 (1953). https://doi.org/10.1063/1.1699114
8. Hastings, W. K. Monte Carlo sampling methods using Markov chains and their applications. *Biometrika* **57**, 97-109 (1970). https://doi.org/10.1093/biomet/57.1.97
9. Will, C. M. The confrontation between general relativity and experiment. *Living Reviews in Relativity* **17**, 4 (2014). https://doi.org/10.12942/lrr-2014-4
10. Mi, X. et al. Time-crystalline eigenstate order on a quantum processor. *Nature* **601**, 531-536 (2022). https://doi.org/10.1038/s41586-021-04257-w
11. Bothwell, T. et al. Resolving the gravitational redshift across a millimetre-scale atomic sample. *Nature* **602**, 420-424 (2022). https://doi.org/10.1038/s41586-021-04349-7
12. Grochowski, P. T., Smith, A. R. H., Dragan, A. & Dębski, K. Quantum time dilation in atomic spectra. *Physical Review Research* **3**, 023053 (2021). https://doi.org/10.1103/PhysRevResearch.3.023053
13. Paige, A. J., Plato, A. D. K. & Kim, M. S. Classical and nonclassical time dilation for quantum clocks. *Physical Review Letters* **124**, 160602 (2020). https://doi.org/10.1103/PhysRevLett.124.160602
14. Hu, B. L. & Verdaguer, E. Stochastic gravity: theory and applications. *Living Reviews in Relativity* **11**, 3 (2008). https://doi.org/10.12942/lrr-2008-3
15. Blumberg, M. *Quantum Gradient Time Crystal Dilation breaks the assumption that gravity equals metric curvature alone*. SVGN (15 February 2024). Current: https://www.svgn.io/p/quantum-gradient-time-crystal-dilation. Archived no later than 21 April 2024: https://web.archive.org/web/20240421105331id_/https://www.svgn.io/p/quantum-gradient-time-crystal-dilation
16. Blumberg, M. *Explain it to me like I am six: Quantum Gradient Time Crystal Dilation Theory. Part 3*. SVGN (28 March 2024). Current: https://www.svgn.io/p/explain-it-to-me-like-i-am-six-quantum. Archived no later than 21 April 2024: https://web.archive.org/web/20240421111934id_/https://www.svgn.io/p/explain-it-to-me-like-i-am-six-quantum
17. Blumberg, M. *Quantum Gravity's New Frontier: Time, Density, and Information*. SVGN (21 October 2024). Current: https://www.svgn.io/p/quantum-gravitys-new-frontier-time. Archived no later than 2 November 2024: https://web.archive.org/web/20241102214706id_/https://www.svgn.io/p/quantum-gravitys-new-frontier-time
18. Blumberg, M. *Dark Time Theory: A conversation about the core ideas forming a new frontier in physics*. SVGN (22 October 2024). Current: https://www.svgn.io/p/dark-time-theory-a-conversation-about. Archived no later than 7 November 2024: https://web.archive.org/web/20241107022842id_/https://www.svgn.io/p/dark-time-theory-a-conversation-about
19. Blumberg, M. *Quantum Gradient Time Crystal Dilation: Classical Temporal-Opportunity Kernels and a Conditional Newtonian Calibration*. Final-preprint manuscript, version 1.0 (2026). Co-packaged as a supplementary reference in the governed this note release bundle; persistent public identifier pending.