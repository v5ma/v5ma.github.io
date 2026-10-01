# Portable saved-evidence companion

For **AI Core Alignment Across Scales** and **AI Mechanistic Interpretability and Self-Aware Networks**, by Micah Blumberg, Self Aware Networks Research Institute.

This is a **local candidate**, not a public release or the complete paper package. It rechecks the two principal Qwen study tables from the exact saved native answers. It does not run a language model, download anything, read private source folders or depend on the author's drive layout. It uses Python's standard library and writes no files when run.

From this directory, with Python 3.10 or later:

```text
python verify_saved_results.py --self-test
```

The expected output is PASS for 672 saved answers: 384 in the learned-correction study and 288 in the earlier state-transfer study. It verifies exact input hashes, complete case/condition/question coverage, opposite-direction identities, whole-answer scoring, original versus reversed targets, EOS metadata, aggregate denominators and complete six-answer groups. Fifteen in-memory corruption/path checks reject deliberately invalid evidence without changing the source files.

The principal learned result must remain visible: linear and nonlinear maps each achieve 5/32 requested role answers and **zero** complete groups. The privileged corrected-state donors achieve eight complete groups. An arithmetic PASS means those recorded outcomes were represented consistently; it does not convert failed learned correction into success.

## What is included

- Exact saved question/answer records, generated-token identities and first-step logit hashes for the 32 case runs across the two studies.
- Exact prepared case definitions, reported metrics and group records.
- Selected model/method identity and rights notices, plus a self-contained read-only verifier.

`MANIFEST.json` binds every included file to its bytes; copied research inputs also retain their original relative source path and hash. A manifest is not a cryptographic author signature or proof that an experiment occurred. The parent project holds the native reconstruction receipts and full research history.

## What is not included or proved

No base-model weights, tokenizer, runtime, fitted 43 MB editor, private transcript, clinical anecdote, AI-chat attachment or unpublished source-original file is included. This is not a fresh training/inference replay, a decoder/tokenizer-equivalence test, a raw-signature audit, an independent replication or a theorem compilation. The datasets are small synthetic development cases, not independent population samples. The two papers share these experiments.

The full Draft 10 manuscripts/PDFs, older positive/null/adverse studies, complete applications, formal statements, dated source context and source-retention map remain in the main author-review package. This compact companion does not replace them. A complete publication companion still needs portable native-execution instructions, final license choices/notices, source-excerpt decisions, independent review and author readback.

Read [third-party and license status](THIRD-PARTY-AND-LICENSE-STATUS.md) before redistribution. No public upload, paper number or provider action is authorized by this local copy.
