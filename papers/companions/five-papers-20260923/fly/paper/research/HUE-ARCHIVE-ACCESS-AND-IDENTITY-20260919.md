# Hue archive: bounded access and identity limits

19 September 2026. Exact source inventory and metadata sample, not raw-recording reanalysis.

The [Christenson dataset](https://zenodo.org/records/10720630) exposes a 2,162,981,700-byte `Medulla raw.zip`. Instead of downloading that archive, the [directory reader](../tools/inspect_hue_remote_archive.py) requested explicit byte ranges and rejected a response that did not honor HTTP 206/Content-Range. The successful [receipt](../../access/45c3638ba8a02cc3.md) records 430,906 received bytes and 3.406 seconds. The whole archive and its advertised MD5 were not verified.

The complete directory contains 3,683 entries, including **3,272 files organized into 409 recording bundles**. Every bundle has eight file types: `dfof.npy`, `raw.npy`, `times.npy`, `events.json`, `other_events.json`, `rec_metadata.json`, `roi_metadata.json` and `stimulus_metadata.json`. No filename identifies a fitted-model checkpoint or parameter file. This is a statement about names, not a search of every unread metadata field or response array. It does not establish that recovering a fitted configuration is impossible.

The [separate metadata selection](../../access/8a5ab66bfcea4d59.md) takes the first three lexical recording IDs and only their recording/ROI metadata. Selection preceded reading any response arrays; no such arrays were acquired. All six JSON files were completely read, CRC-checked and hashed. Network traffic was 434,209 bytes including a repeated directory; the six actual metadata files total 6,827 bytes.

| Recording | Subject | Sex | Recorded age (days) | Genotype number | ROI entries | Acquisition date |
|---|---:|---|---:|---:|---:|---|
| rec30032 | 3952 | M | 3 | 1191 | 66 | 24 November 2021 |
| rec30072 | 3955 | F | 3 | 1428 | 47 | 24 November 2021 |
| rec31619 | 3992 | F | 2 | 1191 | 34 | 9 December 2021 |

The recorded sampling rate is approximately 29.4163 Hz. That is an acquisition rate, **not a neuronal oscillation frequency or a fitted calcium/synaptic time constant**. `brain_area` and `neuron_section` are null in these records. The ROI metadata provides locations and sizes, not registered FlyWire cell identities.

The article's Sec12 describes male and female imaging and distinguishes targeting lines from final cell selection: the Tm5a line includes some L3 expression, the Tm5b line can include Tm5a, and clustering excludes some ROIs. Thus genotype alone does not certify every ROI's type. The age-2 metadata versus the article's stated imaging age range is a cohort/filter provenance question. The raw archive may contain excluded records; this sample does not establish an error in the reported analyzed cohort.

Most importantly, physiological recordings from mixed-sex subjects cannot silently become exact response measurements of the adult-female anatomical specimen. Cell-level joins, session grouping, inclusion filters, preprocessing and population mapping remain necessary. The source supports neither an automatic one-ROI/one-registered-neuron match nor extracting neuronal phase from a slow fluorescence clock alone.

## Consequence for construction

Keep the existing anatomical register and processed hue diagnostic unchanged. Final fitted weights/gains/signs, stimulus transformation and population mapping remain unrecovered. Do not manufacture them from raw file names, acquisition rate or anatomical contact counts. A new exploratory refit would need its own explicit identity, data contract and declared evaluation; it would not be the recovered author checkpoint.

The successful bounded inspection removes the need for a blind multi-gigabyte download. Its negative checkpoint finding and the small identity sample narrow the next source request. The separate [motor timing reference](FLIGHT-TIMING-SOURCE-AND-REPRODUCTION-20260919.md) advances a different dynamical prerequisite; it does not close this sensory-model requirement.
