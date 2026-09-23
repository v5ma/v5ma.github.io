# Local APL inhibition and the receiving-state contract

20 September 2026. Bounded primary-source and published-data extension to
Draft 19. No whole-connectome scan, native-code execution, or new animal work.

## The full argument being tested

The SAN source account joins learned receiving structure and present state
to differential response, temporary participation, reconstruction, action
and subsequent reception. Draft 19 supplied a specific conditional model:
changing a contribution **before** otherwise information-losing mixing can
reveal a distinction that common gain **after** mixing cannot recover. The
model did not establish native independent control of arbitrary input ports.

The scientific question here is therefore not whether inhibition exists or
whether every local calcium difference is a PWD. It is which observed fly
mechanisms could implement the relevant state-dependent receiving operation,
with the correct anatomical location and controllability. The stronger
argument is preserved before its implementation boundary is assessed.

## Sources and what was read

1. Amin et al. (2020), *Localized inhibition in the Drosophila mushroom body*,
   eLife 9:e56954, [primary article](https://doi.org/10.7554/eLife.56954).
   Publisher HTML acquired, with results, relevant methods, Figure 7 legend,
   local-inhibition discussion and appendix example examined. The separate
   statistics supplement and native skeleton code were not replayed. The
   [publisher workbook](../../access/803d998b68ab9ee7.md)
   is 91,095 bytes; acquisition and schema receipts pin it. This file labels
   its second sheet `Fig 7-supp1`, whereas the article's source-data caption
   names Figure 7 supplement 2. The present analysis uses only `Fig 7` and
   does not silently reconcile those supplement labels.
2. Prisco et al. (2021), *The anterior paired lateral neuron normalizes
   odour-evoked activity in the Drosophila mushroom body calyx*, eLife
   10:e74172, [primary article](https://doi.org/10.7554/eLife.74172).
   Publisher HTML acquired; main results, selected figure legends and
   experiment/data methods examined. The [Dryad record](https://doi.org/10.5061/dryad.bk3j9kdd1)
   and version/file metadata were read. The four declared tables/readme
   remain unacquired, so there is no numerical Prisco reanalysis.
3. Gruntman and Turner (2013), [claw-integration article](https://doi.org/10.1038/nn.3547),
   is a further mechanistic lead. A locally downloaded HTML file was a
   browser-check page, not the manuscript. Primary indexed text supplied
   abstract/supplement context only; full method recovery remains open. It
   is not used to assign conductances or thresholds in this slice.

Exact acquired bytes, HTTP failures and metadata are recorded in source
intakes 46–51. Intake 46 is a sandbox-network failure; intake 47 obtained
publisher prose but not Dryad files. Intakes 48–50 obtained repository
metadata. The later normal-browser attempt, explicitly authorized by the
author, showed a connection-security check rather than a login form. The
API's 401 cannot by itself establish that public UI access requires login.
No account token or security control was inspected or bypassed.

## Biological distinctions

Amin et al. found localized activity in the nonspiking APL neuron and local
inhibitory consequences for KCs, with some spread beyond the strongest APL
activity. Their ATP stimulation uses experimentally expressed P2X2; it is not
a native ATP control mechanism of the fly. GABA application is a separate
intervention. A calcium decrease is not automatically a proportional
membrane-voltage, spike-output, or conductance decrease. The paper itself
discusses these distinctions and possible GABA-B-related effects without
settling subcellular receptor localization.

Prisco et al. identifies a more upstream site: reciprocal APL interactions
with PN boutons and KC claws in olfactory microglomeruli, with an inhibitory
normalization effect before KC integration. The study compares odor-evoked
claw responses under intact and silenced APL conditions and reports local
odor-dependent responses. This supports a candidate pre-integration control
location, but silencing a neuron is not a demonstration of independently
commanding two chosen input contacts. Neither study supplies the arbitrary
79-channel receiving controller used in the constructed visual-memory test.

The main olfactory calyx is not the same registered input population as the
visual KC-gamma-d export. `gamma` in that cell-class name is not an oscillation
frequency. Calcium-imaging sampling does not supply a native PWD phase clock.
There is no verified sensory four-channel-to-79-input mapping in these data.

## Checked component result

The [complete paired reanalysis](../application/apl-receiving-data-v0/README.md)
uses fixed exported cells and retains all results. A2 gives nine positive
260-minus-200 contrasts out of ten, with mean 0.395047. A4 gives ten positive
contrasts, with mean 0.353374. The sole A2 reversal is -0.021885. All 45
possible two-record-fly assignments have positive equal-fly means in each
condition. That is descriptive robustness to unknown pairing, not inferential
evidence from newly sampled flies. The two conditions are not pooled as
independent cohorts. No published p-value is claimed reproduced.

The original article describes normalization of its plotted curves by a
maximum across matching conditions. That plot transformation is not rebuilt
here. The exported A2 and A4 measures are retained separately; negative values
are not clipped to [-1,0] or called percent inhibition. The secondary result
supports an already reported physiological component; it is not an
independent replication or experimental confirmation of complete SAN.

## Two useful mathematical statements, not a new proof family

For two observed responses a,b, the best equal-response prediction is their
mean and its residual is `(a-b)^2/2`. For unknown two-record-fly membership,
the equally weighted nine-fly mean contrast is `(S-(d_i+d_j)/2)/9`. Derivations
and numerical checks are in the application. These elementary identities do
not warrant a new named theorem family, new Lean count, or whole-theory proof.

A spatial difference in observed response alone does **not** distinguish
local inhibition from every common-gain model: heterogeneous initial responses,
calcium sensitivity and noise can generate differences under a shared gain.
The equal-observed-response restriction is much narrower. M15 concerns a
declared linear channel and exact null contrast; it must not be transferred
to a calcium observation merely because both involve two locations.

## Next connected implementation: explicit decision rules

The candidate receiving model must distinguish contact-specific modulation
`u_j(q) = sum_i w_ji r_ji(q) x_i` from a cell-level threshold/gain
`a_j = phi_j(u_j, theta_j(q))`. Neither equation is a fitted biological result.
Where APL participates in feedback, q depends on network activity; it cannot
silently become an independently supplied task label or arbitrary diagonal
matrix. Contact-specific modulation and threshold modulation are competing
or coexisting mechanisms to test, not names for the same fitted operation.

Before joining it to the existing memory/return application:

1. Recover the selected Prisco data through normal access and inspect animal
   identities, measures and normalizations before fixing a numerical test.
   If access remains unavailable, keep that dependency open; do not digitize
   favorable curves or pretend the Amin analysis covers it.
2. Register the PN/APL/KC receiving location and source version. Do not merge
   olfactory and visual populations or infer one specimen from another.
3. Compare a feedback-coupled local receiving model with matched common gain
   and changed-threshold alternatives under the same observations. Selective
   perturbation and identifiability evidence, not a local-fit advantage alone,
   must justify any independent input control.
4. Couple only a justified interface to retained memory and actual return.
   Test which former ambiguities become distinguishable, and preserve cases
   where an equally informed ordinary observer ties. Add broader memory,
   internal relations and PWD/NAPOT without using hidden labels as inputs.
5. Obtain source-native temporal constraints and a held-out intervention
   before describing the connected system as physiological rather than an
   explicit engineered hypothesis. Preserve experience as the full research
   question without labeling calcium locality a measurement of experience.

No Book, wiki, other task, catalog or public record was edited. No sealed
session was read. This work strengthens one physiological component and its
implementation specification; it does not complete the paper program.
