# Completed calculations, incomplete receipt: not an accepted run

The amended as-provided-coordinate calculation reached output serialization, then exited with code 1 because one self-check used a NumPy Boolean scalar that the standard JSON encoder did not accept. The first `results/EXECUTION.json` is incomplete and is not a successful execution receipt. Preserve it and its companion outputs as the failed attempt.

The repair converts the self-check values explicitly to built-in Booleans and writes a fresh `results-verified/` directory. It changes neither the frozen analysis plan nor the data, folds, models or scores. The script and plan stored alongside this note preserve the exact failed versions. The final acceptance must compare the two runs' numeric artifact hashes, not assume equivalence.
