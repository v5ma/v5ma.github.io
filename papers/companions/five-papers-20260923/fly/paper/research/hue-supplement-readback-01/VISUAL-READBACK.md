# Publisher supplement: visual and source readback

19 September 2026. Same-agent source inspection, not independent review or a new manuscript PDF.

The exact 16-page supplement is preserved in `results-01/41593_2024_1640_MOESM1_ESM.pdf`; SHA-256 `023a99bb0f1d18a7fb7e3b683f6630c91347f51a07183dd20d193d7c2c34688a`. Its MD5 and length agree with the article XML. All 16 page texts were read. Anatomical Tables 1–22 occupy one-based PDF pages 2–15, which were rendered at 96 dpi with the bundled Poppler renderer and inspected individually. Table 23's genotype text on pages 15–16 was read but is not part of the 22-table machine comparison; page 16 was not visually inspected.

The table headings, seed identity, input/output direction and separate medulla/lobula columns are legible. Particular visual checks include:

- PDF page 2: both complete seed summaries and the first part of Table 3. The published summaries retain 217 identified pDm8 input sites and 375 yDm8 output sites; these are not silently substituted for detailed-row sums.
- Pages 3–4: the Sm19/Sm20/Sm21/Sm26 labels in Dm8 input tables are genuinely present in the PDF, not OCR inventions. Their repository aliases remain separately preserved.
- Page 4, Table 5: yDm8 input to Tm5a is 13. Page 10, Table 14: its output-view count is 22. Both are present in the publication itself.
- Page 5, Table 7: pDm8 input to Tm5b is 16. Page 9, Table 13: the output view is 34. Both remain evidence objects, not additive counts.
- Page 10: two distinct `N/A` pDm8 output partners have counts 7 and 6; no single shared unidentified neuron is invented.
- Page 12, Table 17: the first partner is **720575940625550823**, Sm40, with counts **22, 0**. The differing repository identifier was checked directly in the original CSV by the separate checker.
- Page 13, Table 20: three PDF rows explicitly say Dm2 where the pinned repository says Mi. These observations do not justify a universal alias or silent type replacement.
- Pages 14–15: Table 22 continues across the page boundary and ends before the genotype table; no genotype row is included in the anatomical census.

The second parser uses PDFMiner/pdfplumber rather than Pypdf. Both parsers and direct CSV reading agree on the complete discrepancy set. The first attempted alternative executable, `pdftotext`, was not available in the bundled directory; no installation or broad search followed. Rendering succeeded using the available `pdftoppm`. An earlier terminal display attempt failed on a Greek character under the default encoding; the subsequent UTF-8 read succeeded without changing the source.

This visual pass certifies neither the original researchers' biological classifications nor the final types in a newer FlyWire materialization. It confirms what the inspected publication visibly reports. All 14 PNGs are retained under `visual-01`; they are source-review images, not new research figures.
