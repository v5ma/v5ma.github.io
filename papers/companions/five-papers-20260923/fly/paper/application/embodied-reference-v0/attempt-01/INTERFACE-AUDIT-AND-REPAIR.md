# Preserved first run: constructor interface too broad

The first run completed all 96 planned episodes and passed 203 initial checks. Subsequent source inspection found that `ReferenceController` received the complete configuration dictionary. Its executed code read only nine public task/controller settings, but the dictionary also contained scheduled perturbation times, the changed actuator gain, illuminants and starting distances. Therefore the first run cannot support the stronger claim that environment-only constants were absent from every controller input.

The original implementation and runner are preserved beside this note, with the hashes recorded in `../results-01/EXECUTION.json`. Its complete episodes and results are unchanged.

The repair introduces a nine-key public-settings allowlist, copies only those values across the constructor boundary, and rejects configurations containing any extra key. The existing serialized sensory and body-return interfaces remain unchanged. Two tests explicitly reject the former overbroad configuration and verify exclusion of environment constants.

The complete run is repeated into `results-02`. Its episode values must exactly equal the preserved first run; this is an interface repair, not a performance-driven algorithm or parameter change. Only the repaired run may support the strict input-contract claim. This remains a local software/data-flow contract, not an operating-system security boundary or an adversarial isolation guarantee.
