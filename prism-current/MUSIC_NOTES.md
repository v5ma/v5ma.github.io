# Tidal Bloom / original score and chart notes

Released content target: Prism Current v0.4.0. Score and chart definition: tidal-bloom.js. Sound synthesis: music.js. No outside recording, sound font, sample pack, composition download or cloud music service is used. The melody, arrangement, phrase charts and additional oscillator voices were written in this development session for this game. This is a provenance record, not a copyright-registration or uniqueness-search claim.

## Musical design

Tidal Bloom runs at 116 BPM for approximately 118 seconds. Eight sections share the exact beat grid used by the music worker and the note charts: Arrival, Glasswater, Gathering, Full Current, Stillwater, Return, Bloom and Release. The harmony follows Dm9, Bbmaj7, Fmaj9 and Cadd9 voicings, with a final D-minor voicing. A hand-written eight-bar melody returns with octave and accompaniment changes rather than relying on random notes.

New felt-key, glass and detuned-string oscillator voices join the existing bass and restrained percussion. Stillwater removes kick, snare and hi-hat; its opening two bars also contain no targets. The final chord fades to a zero-valued final sample. A single whole-song buffer remains authoritative: section cues do not start another music track.

## Movement design

Flow has 92 targets and Pulse has 170. The authored two-bar motifs use answering hands, wider outside-lane phrases, directional reversals and end-of-phrase gaps. There are no simultaneous two-hand targets, forced locomotion or ducking. A pure geometric check constrains lanes, rows, ordering and same-hand recovery gaps; it is not a measurement of human comfort or proof that every player can reach every target. Physical seated and one-handed charts remain separate future tasks.

The three earlier tracks retain their exact note times, directions and scoring results. Their 12 kHz synthesized audio buffers are checked against SHA-256 fixtures from published v0.3.0. The new track has its own record keys, for example tidal-bloom/flow/gamepad. Run-level timing diagnostics are not written into legacy records.

## Mix acceptance

qa/tidal-v040-audio.json contains the reproducible sample-peak/RMS audit at 24 kHz. The Tidal Bloom sample peak is about 0.5241, and its RMS is about 0.06762, similar to the earlier tracks. Adding the conservative sum of four maximum hit envelopes yields an upper amplitude bound of about 0.8441 at maximum music and effects settings. This numeric check covers sample amplitude and effects-envelope headroom, not inter-sample true peaks, perceived loudness, mastering quality or listening enjoyment.

Music/effects levels, Calm mix, Music only and sound/text density preferences still work independently. Listening review by Micah, external playtest feedback, actual-device latency and physical controller/headset acceptance remain OPEN. More songs should follow creative review of this one, not be added only to inflate the catalog.

## Results interpretation

Section quality uses the same quality numerator as the overall result, divided by all targets in that section. Misses and wrong cuts therefore lower the section score. Timing statistics use actual button-press offsets in timing modes and the closest sampled blade-contact time in slicing modes. Misses have no timing sample. Early/centered/late bins use a 35 ms diagnostic band; the scoring window remains 170 ms. This is practice feedback, not a measurement of hardware audio latency or automatic calibration.
