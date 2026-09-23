# Ordered-event benchmark v03

A 37,779-byte symbolic dataset makes a specific temporal shortcut testable.
There are 112 background blocks, each containing eight balanced cases: 896
episodes in total. Old-only, current-only, unordered-pair and coarse-pair
oracles are each limited to 1/2 accuracy, even with the background supplied.
The full ordered fine pair determines the answer exactly.

Both construction runs pass 31 checks and reproduce identical dataset and
evidence hashes. This is not a trained-model result or a new Lean proof.

- [Protocol, exact argument and learner boundary](PROTOCOL.md)
- [Dataset](check-01/episodes.csv)
- [Construction receipt](check-01/CHECK.json)
- [Replay receipt](check-replay-01/CHECK.json)
- [Generator and checks](build_benchmark.py)

Dataset SHA-256:
`da8a0dff85a3be026b546914fbd43f471961a32b4d0ba9370bc93ea2b38d3192`.
Evidence SHA-256:
`11da26081a3a406aded9f834b1b14daf8c62396f749d42fbae8b0de2f1e0d7d9`.

The splits contain 512 training, 128 development and 256 held-out episodes.
Background combinations are disjoint, but all symbols and the task rule are
familiar. IDs and CSV row order must never be used as model inputs. This is a
small component of the multimodal episode program, not its replacement.
Nothing is trained, downloaded, published or run in the background.
