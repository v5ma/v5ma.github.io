# Behavior-versus-representation diagnostic: protocol

Status: written before this script's first execution on September 8, 2026. This is an exact, deliberately constructed counterexample with analytically expected outcomes, not a registered empirical prediction, a learned agent, or an independent replication.

## Question and boundary

Can correct task-dependent behavior, including changes of role, by itself distinguish a changing selective representation from an unchanged full-information encoding rule with a task-dependent readout?

Use eight equally weighted states `(x, y, z)` of three independent binary coordinates. Role 0 asks for `x`; role 1 asks for `y`. These names are mathematical coordinates, not measured sensory modalities. Both models receive identical state and role information. The selective model retains only the requested bit. The full model retains the three-bit state; its readout selects the requested coordinate. A static **encoding rule** does not mean that its representation values remain constant when the world changes.

## Fixed evaluations

1. Exhaust all three-step world sequences and role sequences: `8^3 * 2^3 = 4,096` paired trajectories, or 12,288 paired step comparisons. Both models should output the requested bit identically at every step. There is no training, observation noise, temporal memory, hidden role inference, or held-out generalization claim.
2. At each role, freeze the declared representation before issuing three readout-only queries: current target, other role's target, and unused coordinate `z`. Neither model may acquire another observation, recompute its encoder, consult an undeclared memory, or change its frozen state. Compute optimal readout accuracy from the eight-state fibers. Expected accuracies are 1, 1/2, 1/2 for selection and 1, 1, 1 for the full representation. These are known analytic expectations, not discovered biological effects.
3. Recode the full representation invertibly as `(x XOR y, y, z)` and compensate the decoder. Primary-task outputs and representation fibers should remain unchanged. An encoding's coordinate names are not an identified neural implementation.
4. Record code, protocol, and preserved Draft 1 hashes; elapsed time; complete small result tables; and separate checks. Re-execution must not overwrite an existing receipt accidentally.

## Interpretation rules

The diagnostic proves an insufficiency of this observation design, not that representations can never be studied. A frozen auxiliary query can discriminate these particular artificial states under an explicit boundary. A human probe can itself recruit memory or alter the state; it is not automatically a frozen readout. Decodability with an unrestricted decoder does not guarantee access by a biological decoder. Absence of access through one measurement does not establish absent memory elsewhere.

This complements the existing mathematical propositions; it does not replace the planned learned, closed-loop application. No neural result, consciousness measurement, biological cost saving, or distinctive SAN algorithmic advantage may be inferred from it. Exhaustive step counts are not independent sample sizes. The old ordinary-attention tie remains unchanged.

## Resource limits

One standard-library Python process, fewer than 20,000 paired step evaluations, no network, no training, no directory discovery, no other-owner write, no background service. Writes are confined to a new result directory inside this paper. No source, prior result, or prior PDF is overwritten.
