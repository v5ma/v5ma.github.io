# Passive-observation boundary, v0.3

Run `model.py` with the bundled Python runtime. It exhaustively compares all 27 three-symbol sequences over `{A,B,C}` for two deliberately different latent architectures: a scheduled three-branch route and a one-unit ordered-history route. Their passive input-output maps are equal on the full declared domain, including order reversal, while the route assignments differ. A stipulated branch-1 block separates these particular implementations on `ABC`.

This is a constructive *negative* control for the paper: successful sequence discrimination and a matching output do not identify a dendritic alternation mechanism. It is not a biological fit or a general claim that every branch perturbation would be unconfounded. The one-unit alternative is not matched for memory capacity, energy, or anatomical feasibility; those are later empirical/modeling questions. The machine-readable check is in `results/RESULT.json` after a run.
