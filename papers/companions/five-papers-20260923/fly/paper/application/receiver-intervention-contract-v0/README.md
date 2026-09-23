# Receiver-intervention non-equivalence witness

This small deterministic application checks an experimental-design dependency for the fly paper. It is **not** a fitted Dm9 simulator, an added SAN performance result, a new biological data reanalysis or another batch of embodied episodes.

- [Frozen specification and coefficients](ANALYSIS-PLAN.json)
- [M12 derivation and observation boundary](../../MATHEMATICAL-SUPPLEMENT-08.md)
- [Actual source, intervention and measurement contract](../../research/DM9-RECEIVING-AND-MEASUREMENT-CONTRACT-20260919.md)
- [All 15 exact trajectories](run-01/TRAJECTORIES.json)
- [Numerical checks, hashes and resource receipt](run-01/CHECKS.json)
- [Runnable source](../../tools/run_receiver_intervention_witness.py)
- [Measured intervention figure](figures-01/INTERVENTION-AND-OBSERVATION.png) and [visual readback](figures-01/VISUAL-READBACK.md)
- [Replay entry point with a new output directory](../../tools/run_receiver_intervention_witness_v1.py)

The two states model an excitatory output route and opposing receiving inputs. The tests distinguish inhibitory-receptor-path removal, whole-cell clamping, output disconnection and restoration. All unmanipulated coefficients remain fixed. A clamped cell and an output-disconnected circuit differ in absolute P by 0.15 under the chosen parameters, yet their own-initial-baseline-subtracted P traces are identical under the explicitly affine model. The actual calcium study uses a more complicated observation transform; this example must not be relabeled as its reproduction.

Matrix-exponential solutions and separately written scalar RK4 agree within 1.72×10⁻¹¹ across 15 trajectories, 1,201 saved time points each, with 70 checks including one intentional corruption rejected. They share equations but not a derivative implementation. They were developed by the same agent and are not independent review. The run took 0.126 seconds with one numerical thread at verified below-normal priority.

To replay, preserve `run-01` and use the versioned entry point with `--output-name` set to a new direct child directory. It refuses existing directories and paths outside this application. The original runner and its exact receipt remain unchanged. From the paper root in PowerShell, with the existing bundled Python:

```powershell
& 'C:\Users\micah\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -B '.\tools\run_receiver_intervention_witness_v1.py' --output-name 'run-03-replay'
```

No installation, download or network access is needed. This is a reproducible source/model diagnostic, not a ready-to-deploy application. Replaying identical cases is reproducibility work, not additional experimental replication or extra embodied episodes.

The new entry point was executed as [run-02-replay](run-02-replay/CHECKS.json). Its trajectory file has the same SHA-256 as `run-01` (`0b4ef92f5b24a38d9dd263f98c2a13362d459189470e8f6d28f869b4510435ba`) and again passes 70 checks. The replay took 0.112 seconds; it is not a second independent experiment. Numerical functions and the plan were unchanged; only output selection and path guards were added.
