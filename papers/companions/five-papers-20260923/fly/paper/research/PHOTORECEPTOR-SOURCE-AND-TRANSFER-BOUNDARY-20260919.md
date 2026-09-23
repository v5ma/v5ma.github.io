# Photoreceptor source and transfer boundary

19 September 2026. Source reuse and an explicitly proposed sensory surrogate. Not raw-animal reanalysis or a recovered native phototransduction model.

## Exact primary material

Sharkey, C. R., Blanco, J., Leibowitz, M. M., Pinto-Benito, D. and Wardill, T. J. (2020). [The spectral sensitivity of Drosophila photoreceptors](https://doi.org/10.1038/s41598-020-74742-1). *Scientific Reports* 10, 18242. Publisher Results, Discussion and Methods sections and supplementary legends were read. Supplementary Figure S6, PDF page 7, was also rendered and visually inspected. No claim is made that every supplementary figure was visually reviewed.

Three exact publisher-linked supplements were downloaded in 2.39 seconds, totaling 3,015,761 bytes. [Source specification](../../access/5759994f6ac08777.md) and [retrieval receipt](../../access/c07a42e95488e7b4.md) preserve URLs, access time, size and hashes. The two workbooks and PDF remain unchanged. The downloader executed no supplied code, accepted no macros and enforced per-file size caps.

| File | Role inspected | SHA-256 |
|---|---|---|
| Supplementary Data 1 | All seven mean/SD response curves | `740f8517fc0f6ce18d724d71568db08d2c58567551057a0008068f8f88de8044` |
| Supplementary Data 2 | Sheet/header inventory: Figure 3, 4 and 6 statistical comparisons; tests not rerun | `764198ee31f53320ae18f15d6bf4b267293a2fbebdc87ef3ed3bd4099696109d` |
| Supplementary Information | Legends and S6 visual/units check | `47fa61b17829df681bd34d00af7f01bd2bd55398e420bc76c7cb1dd1b2d11c53` |

The article's Rights and permissions section states [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), subject to separately credited third-party material. The local plots redraw the authors' numerical summaries with attribution; the application changes their use through explicitly declared normalization and synthetic mixing. This source license is not a blanket clearance for the other components in the eventual release.

## What the experiment measures

The authors selectively restored photoreceptor activity in *norpA* flies and used whole-eye electroretinograms under wide-field illumination. These are not simultaneous intracellular voltage measurements of four native receptor cells, nor recordings from the ten FlyWire seed neurons. Screening pigment, distal receptors, illumination geometry and preparation influence the spectral response. An opsin's isolated spectral peak is therefore not a complete specification of the receiving system.

Methods describe 200 ms intensity-test flashes, spectral stimulation every five seconds, ten repeated presentations with the last five used for analysis, dark adaptation, and class/animal-specific test intensities chosen near half-response. The spectral response is a baseline-referenced voltage statistic near the flash's end, not an oscillatory time series. The analysis includes outlier handling, smoothing and separate normalization/combination procedures. Those procedures cannot be reconstructed in full from the published group means alone.

Figure S6 supplies the voltage unit, mV, and six animals per curve. Supplementary Data 1 contains 342 wavelength-indexed mean/SD pairs: five curves with 48 points each over 315–550 nm and two curves with 51 points each over 450–700 nm. Rh1 and Rh6 occur in both windows. These are seven preparation/window curves, not seven independent receptor classes or 342 independent animals. Animal pairing and cross-wavelength covariance are not available in this workbook.

## Cell-level extraction contract

All ranges below belong to `Sheet 1` of Supplementary Data 1. The [extracted JSON](../application/spectral-receiver-bridge-v0/source-extraction-01/CURVES.json) records the exact wavelength, mean and SD cell for every point.

| Curve | Wavelength cells | Mean cells | SD cells |
|---|---|---|---|
| Rh1, lower window | D3:D50 | E3:E50 | F3:F50 |
| Rh3, lower window | D3:D50 | G3:G50 | H3:H50 |
| Rh4, lower window | D3:D50 | I3:I50 | J3:J50 |
| Rh5, lower window | D3:D50 | K3:K50 | L3:L50 |
| Rh6, lower window | D3:D50 | M3:M50 | N3:N50 |
| Rh1, upper window | O3:O53 | P3:P53 | Q3:Q53 |
| Rh6, upper window | O3:O53 | R3:R53 | S3:S53 |

The workbook declares a wide formatted extent but has no nonempty values outside D:S. Header spellings, including `Standard devation`, are preserved and checked. No formulas are evaluated. A separate checker reads the source Excel XML directly and compares all 342 pairs and their wavelength locators, independent of the extraction library. It rejects a deliberately changed mean cell.

## Permitted engineering transfer

The new application uses only the common 315–550 nm window of Rh3, Rh4, Rh5 and Rh6. Each mean curve is divided by its maximum **within that window**, then sampled at the declared 330, 355, 435 and 520 nm grid points. This is not the source authors' normalize-per-animal-then-average operation, not a join of the two grating ranges, and not a measured relative gain across receptor classes. In particular, the Rh6 common-window maximum is not its full-spectrum peak.

The resulting nonnegative 4-by-4 matrix supplies an empirically shaped linear surrogate for synthetic four-component spectra. Normalizing aggregate curves cannot restore missing single-animal responses, native temporal kinetics, absolute photon calibration, adaptation, terminal opponency or receptor-to-seed connectivity. Linear superposition of these coefficients across wavelengths and changing intensities is a **model assumption**; the source's end-of-flash measurements do not certify it. The model uses neither the Rh1 curve nor long-wave tails in its controller input, although all source values remain preserved and plotted.

Illumination multiplies the synthetic spectrum before receptor mixing. A four-component illumination vector cannot generally be reused as four receptor-specific gains after mixing. The explicit counterexample in [the results](../application/spectral-receiver-bridge-v0/checks-01/RESULTS.json) gives a maximum difference of 0.0937665 in normalized surrogate coordinates. This is an implementation consequence, not a newly measured biological effect.

## Remaining physiological work

The next temporal implementation needs a justified receiving process, observed or appropriately constrained time constants and an explicit sensory reference. The accessible response summaries supply spectral shape but none of those temporal quantities. Connectome adjacency, motor oscillator parameters and group ERG curves must not silently fill one another's gaps. This tranche improves the input contract of the connected application while leaving that physiological join open.
