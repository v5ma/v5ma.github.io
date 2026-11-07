# Latest additions

A static, no-JavaScript selected release log. Edit `manifest.json`, preserving newest-first order. Dates mean **wiki publication or substantive update**, never source export or composition dates. Use `New` for first publication and `Updated` for substantial changes. Keep links relative to this directory and within the Theology Wiki.

Build and validate from any working directory:

```
node theology-wiki/latest/build.cjs
node theology-wiki/latest/build.cjs --check
node --test theology-wiki/latest/test.cjs
```

The builder validates dates, ordering, labels, unique links, and safe wiki-relative paths. Output has no timestamp or environment-dependent inputs. Commit the generated `index.html` with the manifest. `latest.css` is intentionally self-contained.

The tests also check the six November 6 additions, synthetic-only protocol caveat, static accessibility, local new-chapter targets, and byte preservation of both main entry points after removing exactly one Latest link. `nav-preservation.json` records SHA-256 hashes of those entry points immediately before adding Latest (including the already-proposed section navigation). It is a regression fixture, not article metadata. Intentional future entry-point edits require reviewing and refreshing that fixture.

## Release provenance

- November 7, 2026: the complete November 6 conversation about Jesus, Resurrection Theology and Imperial Capture, including all 17 messages and both user-supplied texts. The transcript retains original wording, source links, historical qualifications, and the user's clarification about imperial pressure within the Gospel narratives.

- November 6, 2026: first publication of five prepared chapters and one proposed research protocol. November 5 directory/source dates are preparation dates, not public-release dates.
- October 30, 2026: Iran infrastructure cascade inquiry; verified publication commit `6efe636e0db5107fbf25e241ca2605f68e984bc2`.
- October 24, 2026: Trump signs timeline, public executions study and Earlier-Teacher overview; verified publication commits `3835e657aefe9f3946666cf75774fe065d8b24ac` and `a28d99a6f4eca0c4c1efa85584b3688d7ef37c94`.
- October 23, 2026: substantive Joseph-before-Hyksos chronology update; verified commit `effb9043b8613ed540fd4f6a5a7663f0d28b5c68`.

The sparse staging tree does not include every legacy target or reader data file. All new chapter targets are checked locally; legacy targets and reader query routes require the full repository or live-site verification before release. This log deliberately does not infer first-publication dates from older chat exports.
