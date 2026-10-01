"""Versioned, scoped virtual-action runtime. This is not an LLM alignment result."""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import hmac
import json
import random

Action = tuple[str, str]
FIXTURE_KEY = b"public-development-fixture-not-a-production-secret"


def canonical(revision: int, scope: frozenset[Action]) -> bytes:
    return json.dumps([revision, sorted(scope)], separators=(",", ":")).encode()


@dataclass(frozen=True)
class Update:
    revision: int
    scope: frozenset[Action]
    signature: str


def sign_update(revision: int, scope: frozenset[Action]) -> Update:
    return Update(revision, scope, hmac.new(FIXTURE_KEY, canonical(revision, scope), "sha256").hexdigest())


@dataclass(frozen=True)
class Proposal:
    revision: int
    action: Action
    delegated_scope: frozenset[Action]


class CommitmentStore:
    def __init__(self) -> None:
        self.revision = -1
        self.scope: frozenset[Action] = frozenset()

    def accept(self, update: Update) -> bool:
        expected = hmac.new(FIXTURE_KEY, canonical(update.revision, update.scope), "sha256").hexdigest()
        if not hmac.compare_digest(update.signature, expected) or update.revision <= self.revision:
            return False
        self.revision, self.scope = update.revision, update.scope
        return True

    def commit(self, proposal: Proposal) -> bool:
        return (proposal.revision == self.revision and proposal.action in self.scope
                and proposal.action in proposal.delegated_scope)


def delegate(parent: frozenset[Action], requested: frozenset[Action]) -> frozenset[Action]:
    return parent & requested


def run_condition(seed: int, horizon: int, depth: int, policy: str) -> tuple[dict, list[dict]]:
    """Shared world and human-update schedule. Safety gates deliberately match.

    The HMAC fixture simulates an authenticated input channel. The tested agent cannot
    invoke sign_update in the simulation; a process with this source/key can. This is
    a protocol property under a trusted boundary, not cryptographic deployment proof.
    """
    rng = random.Random(seed)
    store = CommitmentStore()
    all_actions = frozenset((obj, "export") for obj in ("A", "B", "C"))
    initial = frozenset({("A", "export")})
    revised = frozenset({("B", "export")})
    assert store.accept(sign_update(0, initial))
    cached_revision, cached_scope = store.revision, store.scope
    text_scope = initial
    useful = violations = rejects = eligible = checks = 0
    rows = []
    for t in range(horizon):
        if t == horizon // 2:
            assert store.accept(sign_update(1, revised))
            if policy == "propagated_gate":
                cached_revision, cached_scope = store.revision, store.scope
        # Untrusted text repeats an apparent permission, but is never a signed event.
        if t == horizon // 2 + 1:
            text_scope = all_actions
        action = (rng.choice(("A", "B", "C")), "export")
        truth_allowed = action in store.scope
        eligible += int(truth_allowed)
        if policy == "text_only":
            did_execute = action in text_scope
            rejection = False
        elif policy == "deny_all":
            did_execute, rejection = False, False
        else:
            candidate_scope = cached_scope
            # All delegation requests are equally broad; attenuation must not widen.
            for _ in range(depth):
                candidate_scope = delegate(candidate_scope, all_actions)
                checks += 1
            candidate = action in candidate_scope
            did_execute = candidate and store.commit(Proposal(cached_revision, action, candidate_scope))
            rejection = candidate and not did_execute
            if rejection:
                cached_revision, cached_scope = store.revision, store.scope
        useful += int(did_execute and truth_allowed)
        violations += int(did_execute and not truth_allowed)
        rejects += int(rejection)
        rows.append({"t": t, "object": action[0], "authority_revision": store.revision,
                     "truth_allowed": truth_allowed, "executed": bool(did_execute),
                     "rejected": bool(rejection), "policy": policy})
    metrics = {"seed": seed, "horizon": horizon, "depth": depth, "policy": policy,
               "human_updates": 2, "unauthorized_executions": violations,
               "eligible_requests": eligible, "useful_executions": useful,
               "useful_completion": useful / eligible if eligible else None,
               "rejected_proposals": rejects, "checked_delegation_edges": checks}
    return metrics, rows


def evaluate(config: dict) -> tuple[list[dict], list[dict]]:
    metrics, events = [], []
    for seed in config["seeds"]:
        for horizon in config["horizons"]:
            for depth in config["delegation_depths"]:
                for policy in config["policies"]:
                    result, rows = run_condition(seed, horizon, depth, policy)
                    metrics.append(result)
                    tag = f"{seed}-{horizon}-{depth}-{policy}"
                    prior = "0" * 64
                    for row in rows:
                        row = dict(row, run=tag, previous_hash=prior)
                        prior = hashlib.sha256(json.dumps(row, sort_keys=True).encode()).hexdigest()
                        row["hash"] = prior
                        events.append(row)
    return metrics, events
