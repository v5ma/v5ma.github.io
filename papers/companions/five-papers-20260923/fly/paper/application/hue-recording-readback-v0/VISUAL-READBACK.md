# Measured-figure readback

19 September 2026. Same-agent visual inspection of actual rendered PNGs, not independent review or a final-PDF approval.

The first render, `figures-01/publisher-data-coverage-and-amplitudes.png`, SHA-256 `c54da91c4339deb5a78088096115eea09a01ec0e46aeccbf2f06b27321a5d200`, has a legend/title overlap in panel A. It is preserved but not approved for use.

The corrected render, [figures-02/publisher-data-coverage-and-amplitudes.png](figures-02/publisher-data-coverage-and-amplitudes.png), SHA-256 `2e6dee4aca682be4927ceb94a2c1ea07f351832a3f7476a7ffe5ac374558a362`, was visually read back after rendering. Titles, legend, all eight row labels, complete/table counts, group counts, axis labels and all four caption lines are legible and do not overlap. The actual PNG is 1750 × 924 pixels. Its [SVG counterpart](../../../access/a665798e0ad7dd52.md) is SHA-256 `725dfa3716ec49871c3914f0c17079a8645ded3a57002c4028a13471a462b9cc`; the SVG was not separately opened in a browser.

Panel A distinguishes complete endpoint windows from the full sparse table. Panel B shows descriptive distributions of stimulus means, with a caption explicitly rejecting animal-confidence-interval and matched-selectivity interpretations. The source, unknown scaling, absent verified animal/recording identities and lack of a SAN-specific model test are visible. No data were removed to improve the chart.

The generated figure receipt has `visual_review_completed: false` because it records the pre-review render. This separate readback supplies the subsequent review status; it does not alter the original rendering receipt or claim that the earlier render passed.
