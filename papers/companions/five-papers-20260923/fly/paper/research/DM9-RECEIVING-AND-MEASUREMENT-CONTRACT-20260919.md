# Dm9 receiving, intervention identity and measurement contract

19 September 2026. Primary source: Schnaitmann, Pagni, Meyer, Steinhoff, Oberhauser and Reiff (2024), [DOI 10.3389/fnmol.2024.1347540](https://doi.org/10.3389/fnmol.2024.1347540). This document advances a sensory-pathway specification, not a new reproduction of the experiment.

## Source and access

The publisher's introduction, methods, results, discussion and data-availability statement were read, including figure legends 1–6. A 158,292-byte Europe PMC XML copy is preserved at [article.xml](../../access/a6a72d36d1336ac6.md), SHA-256 `39ce6f59b31017869b0b37ac37b97c60af10557433413ab108e96f21796e37e7`. The [receipt](../../access/0e3da0c0715785a8.md) records the official URL, DOI, CC BY 4.0 attribution/license and successful network-permitted read. A prior local network refusal is preserved separately; it was not a scientific access verdict.

The article's raw-data statement offers availability from the authors; it is not a downloaded public raw-recording dataset. `Table_1.XLSX` and `Data_Sheet_1.docx` are named in XML but were not acquired or read here. Recordings and animals are separately reported by the authors in Table S1. No sample count, independent-animal inference, statistical recomputation or extracted numerical figure point is newly claimed. Figures were read through their text/legends, not inspected pixel-by-pixel in this pass.

The article reports a difference from Heath et al. (2020), DOI `10.1016/j.cub.2019.11.075`, over R8p rescue sufficiency. The earlier primary bibliographic/abstract record was checked. Its PMC page returned a browser challenge and the official Europe PMC XML request returned HTTP 500; [that receipt](../../access/ee84165502003e35.md) is preserved. The earlier methods were therefore **not** newly audited. Do not settle the comparison using the later authors' account alone. Background, intensity, spectrum, indicator and adaptation are candidate explanations, not resolved causes.

## What the source constrains

Histamine/Ort input inhibits Dm9, while a histamine-independent R7-associated excitation remains unresolved mechanistically. The authors interpret Dm9 output as excitatory support to photoreceptor terminals, so withdrawing that support can implement net feedback inhibition. Direct R7/R8 HisCl1 interactions are a separate route. Their receptor-rescue and optogenetic conditions are not interchangeable: sustained Dm9 inhibition changes baseline responsiveness as well as opponency. R7 and R8 rescue outcomes differ under the tested conditions. These are component findings, not a demonstration of SAN, visual behavior, a particular oscillator, or a complete reconstruction.

## Register before implementing

| Required field | Source-constrained entry | Remaining boundary |
|---|---|---|
| Preparation | Female, white-positive flies, 2–6 days after eclosion; fixed imaging preparation | Do not equate with the anatomical specimen or free behavior |
| Receiving route | R7/R8 histamine → Ort-dependent Dm9 inhibition; parallel R7 excitation; Dm9 output and HisCl1 routes separate | The proposed excitatory-output molecular implementation is not a complete receptor-kinetic fit |
| Observation | Twitch-2C ratiometric calcium, 8 frames/s | Not membrane voltage, release probability, or an 8-Hz endogenous rhythm |
| Stimulus clock | Approximately 400-Hz scanner-flyback delivery | Instrument timing, not neural oscillation frequency |
| Reference | Normally 16 pre-stimulus frames; delayed-scanning condition uses final four seconds | Different denominators/baselines cannot silently become one voltage reference |
| Processing | Background and bleaching corrections; condition-dependent response windows | Exact numerical reproduction needs traces, calibration and preprocessing, not plot appearance |
| Intervention timing | Visual and optogenetic/scanning onset offset by two seconds in the timing comparison | Not a reported two-second membrane time constant |
| Receptor intervention | Change one receiving mechanism, preserving other declared routes | Do not silently clamp the entire cell |
| Cell intervention | Constrain cell state/output, including baseline consequences | Do not model solely as one removed incoming edge |
| Numerical parameters | None fitted from this paper in this intake | Conductances, time constants, indicator kinetics, voltage-to-release and conduction delays remain unestimated |

The XML section titles “Two-photon calcium imaging,” “Visual stimulus presentation,” “Analysis of calcium imaging experiments,” “Optogenetic inhibition of Dm9 prohibits color opponent processing in R7/R8,” and “Parallel circuit mechanisms mediate color opponency in R7/R8” are the exact locators. The study's wording about multiple-comparison correction should not be copied into a new statistics claim: no statistics were rerun here.

## Consequence for our construction

The current four-band ERG-shaped input model measures neither terminal calcium nor Dm9. Its normalized surrogate captures cannot acquire those meanings by inserting this citation. The ten-cell hue anatomy register likewise does not supply a Dm9 parameter set. A future adapter must declare spatial columns, R7/R8 subtype identities, receptor-specific inputs, a separate Dm9 output state and a measurement transformation. Omitted histamine-independent excitation must be flagged, not represented as known zero.

Record separately: cell baseline, modulation about baseline, model voltage/activity, indicator response, estimated latent state, and reconstructed relation. Intervention comparisons must freeze the already familiarized readout and other parameters. If a separate reacquisition study is desired, name it separately. Match sensor evidence, retain loss of sensitivity, and compare a gain/operating-point control with a route-specific manipulation. Restore the original route without a new fit. The original paper's imaging itself activates the optogenetic channel; proposed tests must model or experimentally control that coupling.

Native temporal constants cannot be extracted from an equilibrium response shape, the camera frame rate or the onset offset alone. The full observation operator includes indicator dynamics, sampling, baseline selection and averaging. A relative-phase test requires a declared physiological reference with suitable simultaneous measurement; a shared phase-origin change remains an allowed coordinate transformation.

The [executable affine witness](../application/receiver-intervention-contract-v0/README.md) demonstrates a narrower design hazard: different interventions can have different absolute states while becoming identical after a particular baseline subtraction. It does not reproduce Twitch-2C, the experimental curves, spectral opponency or fly behavior. Its purpose is to prevent an invalid substitution when the real receiver is built.
