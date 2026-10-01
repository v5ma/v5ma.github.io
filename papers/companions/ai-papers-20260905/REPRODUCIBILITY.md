# Reproduction and inspection

The [release guide](README.md) states the scientific limits. No command below should write into an existing frozen result directory. Start with the read-only checks; native execution is a separate, resource-intensive choice.

## 1. Distribution integrity and saved-result arithmetic

Use Python 3.12 or later for the distribution verifier; the saved-answer checker itself supports Python 3.10 or later.

```text
python verify_package.py
python project/release-preparation-11/portable-evidence/verify_saved_results.py --self-test
```

The first command hashes only the files declared in `PUBLIC-MANIFEST.json`; it does not search the computer. The second rechecks 672 saved answers: 384 learned-correction answers and 288 state-transfer answers. It checks identities, coverage, scoring, denominators, opposite directions and complete groups, then runs 15 in-memory corruption/path controls. PASS means the reported tables agree with the saved outputs; it does not mean learned correction succeeded or that the model was run again.

## 2. Interactive review

Open `project/review-app/current-10/index.html` in a browser. It uses only bundled scripts/data and does not fetch models or send information. If local-file restrictions prevent a browser from displaying it, serve the extracted companion on a loopback-only address using a local static server, then open the same relative path. Do not expose a local development server to a public network. The older small-network lab is retained and clearly labeled historical.

## 3. Full learned-Qwen native pipeline

The distribution includes the original application, protocols, prepared fixtures, fitted editors, test outputs, separate auditors and completed reproduction evidence. Base-model/tokenizer/runtime binaries are **not** bundled. Obtain the exact dependency identities through the [third-party notice routes](THIRD-PARTY-NOTICES.md), observing their licenses; the recorded intake receipts bind the files actually executed.

Recorded environment: Windows, Python 3.12.14, NumPy 2.4.6 and the isolated ONNX Runtime 1.29.0 CPU wheel. The pinned Qwen export is `onnx-community/Qwen3.5-0.8B-ONNX-OPT` at `fafab72d87a9e6be3925b38caf48286d2838f2d0`. Preserve the graph/external-data/tokenizer relative structure and compare its 11 declared files to the two included intake receipts. The runtime receipt declares 323 extracted wheel files. The original helper enforces its recorded environment and resource contract; a different environment needs a separately reported compatibility/reproduction attempt, not bypassed checks.

From `project/pipeline-replay-16`, replacing the three uppercase path arguments with locations on your machine:

```text
python pipeline.py plan --project PROJECT-DIRECTORY --model QWEN-DIRECTORY --runtime ORT-DIRECTORY --save NEW-PLAN.json
python pipeline.py stage --plan NEW-PLAN.json --workspace NEW-WORKSPACE
python pipeline.py status --workspace NEW-WORKSPACE
python pipeline.py step --workspace NEW-WORKSPACE --index 0 --execute
```

Here `PROJECT-DIRECTORY` is this distribution's `project` folder; `QWEN-DIRECTORY` and `ORT-DIRECTORY` hold the separately obtained dependencies. Planning checks the finite input closure but performs no inference. Staging hashes the full declared dependencies and requires sufficient space; its default hard links require the same volume and must never be edited. `--dependency-mode copy` makes independent dependency copies when needed.

Each `step` invocation requests exactly one operation, indexed 0 through 48. Inspect its receipt before explicitly selecting the next index. Completed/partial destinations cannot be silently overwritten. `finish --workspace NEW-WORKSPACE` verifies completion after all 49 operations. Do not run the native steps merely to check this public archive. The recorded replay is already complete, and the original negative result must not be tuned away.

Resource limits include one numerical thread, a 75-second/5.5-GB monitored native-process contract, at least 8 GB free RAM at start, and a supervising timeout. These controls reduce resource risk; they are not a proof that arbitrary hardware will remain responsive. Do not run a swarm or concurrent model jobs.

## 4. Mathematics and older applications

Read [the formal guide](project/formal/README.md) for four source files and their accepted Lean 4.30.0 receipts. Mathlib/compiler dependencies and the original governed lease are external; no claim is made that this archive is a fully self-contained Lean installation. A fresh compilation must report its toolchain, dependencies, axioms and exit status separately.

Earlier applications retain their exact scripts, protocols and outputs. MiniLM's local export lacks an independently established upstream revision; GPT-2 has a pinned quantized export identity. The full learned-Qwen reproduction does not silently certify all earlier families. Production authentication, raw-signature auditability, formal refinement of Python/ONNX, independent scientific review and generalization remain separate obligations.

Historical status files and hashes are preserved as evidence of their stages. Inert author-machine paths in old receipts are not portable launch instructions. Public TeX figure references are relative to `project/output/tex`; compiling a new PDF is not part of the saved-result check and would need fresh visual validation.
