# Published anatomy recovered: exact agreement, label history and one identity difference

19 September 2026. This closes a specific source-access and comparison gap. It does not reproduce the fitted hue model or supply native sensory timing.

## What is now available

The verified [BioStudies record S-EPMC11537989](https://www.ebi.ac.uk/biostudies/studies/S-EPMC11537989), linked to Christenson et al.'s 2024 hue paper, lists 14 supplementary files. Only the two already targeted small sources were downloaded:

- [Supplementary Tables 1–23, 1,207,496 bytes](https://www.ebi.ac.uk/biostudies/files/S-EPMC11537989/41593_2024_1640_MOESM1_ESM.pdf). MD5 `d3eb3940db119f421c0294cdf1efdda0`; SHA-256 `023a99bb0f1d18a7fb7e3b683f6630c91347f51a07183dd20d193d7c2c34688a`.
- [Source Data Extended Data Fig. 5, 387 bytes](https://www.ebi.ac.uk/biostudies/files/S-EPMC11537989/41593_2024_1640_MOESM11_ESM.csv). MD5 `ec04a506230152b5793cab7c0dbef539`; SHA-256 `e8078f43a8df5857c56aba22f4faa99e2ab28c4a742f356ab883dcd017b024a6`.

Both MD5s and lengths match the preserved article XML. BioStudies redirects the exact files to its public EBI archive. No authentication challenge was solved. The 8-MB cap on the earlier whole-supplement request was retained; its oversized response was not saved or retried without a changed route. The named archives of tens or hundreds of megabytes remain untouched. The metadata record is only 8,347 bytes.

This is a new access path to the authors' existing evidence, not an independent replication. The article's permissions state CC BY 4.0 with the usual third-party-credit exception. Attribution and any modified data representation must remain explicit. This does not change the separate non-open status of the older Heath manuscript and unavailable supplement. Its Europe PMC archive request returned an explicit non-open-access error, and the separate public BioStudies accession returned 404; both responses are preserved, not counted as acquired evidence.

## Complete table comparison

All 16 PDF page texts were read; anatomical pages 2–15 were also visually inspected. Tables 1–22 were parsed, with full body lines, page locations, count compartments and captions retained. Table 23's genotype text was read but not included in the anatomical comparison. A second implementation uses PDFMiner/pdfplumber and reads the 22 original CSVs directly. It does not import the Pypdf builder.

The result is precise:

| Comparison | Result |
|---|---|
| Detailed rows, Tables 3–22 | 538 in each source, same table/row ordering |
| Detailed count fields, including both compartments | All agree numerically |
| Ten seed summary rows in each of Tables 1–2 | All compared fields agree |
| Raw cell-type label fields | 94 differences; one is only trailing whitespace |
| Partner identifier fields | One difference |
| Within-ten-seed observations used by the current register | All 23 observations agree in identity, direction and counts |
| Distinct within-ten-seed directed routes | The same 15 routes |

The 93 non-whitespace label differences include more specific names in the PDF, such as Sm19/Sm20 where the repository has Mti labels, but they are not all proven synonyms. A single repository label can correspond to several PDF labels. Three Table 20 rows say Dm2 in the PDF and Mi in the repository. The audit records each identifier and label occurrence; it does not establish a universal renaming dictionary or determine which biological classification is correct.

The identity difference is Table 17, first row, a reported output from Tm5b **720575940627282584**. The PDF names partner **720575940625550823**, labelled Sm40. The pinned repository names **720575940628230417**, labelled Mti_M6. Both report 22 medulla and zero lobula sites. Extended Data Fig. 5's caption also identifies its Sm40 skeleton as **720575940625550823**, supporting internal agreement between the PDF and caption. That does not establish an immutable old-ID/new-ID correspondence. No verified materialization mapping or author explanation was acquired. Both identifiers remain preserved, with no silent substitution.

Both alternate partners lie outside the ten modeled seeds. Consequently, this specific discrepancy does not alter the 15-route seed adjacency used by the existing engineered receiving application. The check establishes the exact source projection, not a rerun of its trajectories or a proof that a larger model would be unaffected. A future population-level model may depend on these labels, the changed partner and additional disynaptic routes.

## What the new copy does not resolve

Agreement of the detailed counts reproduces, rather than removes, the earlier two cross-view differences: yDm8→Tm5a is 13 versus 22, and pDm8→Tm5b is 16 versus 34. The detailed pDm8-input total of 221 still differs from the summary's 217; detailed yDm8 outputs total 369 versus 375. Publication-text versus summary discrepancies likewise remain. More accessible copies are not additional biological observations, and cannot vote a disagreement away.

The small CSV supplies Extended Data Fig. 5's Sm31, Sm40 and Mi3 connectivity summaries, with separate input/output columns and differing stated sample counts. It is **not** the model's signed, normalized 12-by-12 matrix. Blank cells stay unreported rather than becoming measured zeros. The corresponding caption describes putative recurrent routes, transmitter predictions and combined reconstructions; those have distinct evidential roles. No measured timing follows from a synapse count or neurotransmitter prediction.

The twelve-population reproduction still requires the explicit aggregation and disynaptic calculation, additional Heath photoreceptor/Dm9 weights, optimized signs, 29 fitted continuous parameters, exact preprocessing and final intervention configuration. The already recovered fixed-point equations constrain how these pieces fit together, but do not identify the missing values. Native temporal access, PWD throughout NAPOT, broader multimodal learning and the full action-return/experience construction remain separate requirements.

## Evidence and reproducibility

- [Frozen post-readback analysis plan](hue-supplement-readback-01/ANALYSIS-PLAN.json).
- [All publisher tables, exact source lines and page locations](hue-supplement-readback-01/results-01/PUBLISHER-TABLES.json).
- [Complete 95-field difference ledger](hue-supplement-readback-01/results-01/RECONCILIATION.json).
- [Second parser and original-CSV check: 3,582 passing assertions](hue-supplement-readback-01/checks-01/CHECKS.json).
- [Exact seed-route projection, differences and original-source hashes](hue-supplement-readback-01/checks-01/PROJECTION-AND-DIFFERENCES.json).
- [Visual readback and coverage](hue-supplement-readback-01/VISUAL-READBACK.md).
- [Preserved source PDF](../../access/b404d0337c10297a.md).

The first parser/comparison ran in 0.645 seconds and the separate checker in 1.888 seconds, each at verified below-normal priority in one process. Four intentional corruptions are rejected: partner substitution, erased label disagreement, changed count and collapsed unidentified endpoint. These counts refer to software checks, not independent reviewers or experimental samples. No new application episode, formal lemma, physiological fit or biological recording analysis was executed. The earlier application results, thirteen analytic result families and seven compiled supporting lemmas remain unchanged.

Next: recover the source-defined aggregation/final-fit configuration or explicitly develop a separately named source-constrained candidate. Use exact pinned author modules and existing data manifests, not a full repository or drive scan. A usable source table is progress toward the full SAN construction; it is not that construction itself.
