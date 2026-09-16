# SVGN Interactive Level Design Library

Public agent-reference edition. Prepared September 15, 2026.

This folder is the shared level-design reference for SVGN Interactive. Any agent working on an SVGN game should begin with `AGENTS.md`, then read `studio-manual.md`, the matching file under `games/`, and any game-specific current handoff/roadmap in the game's own directory before changing code or geometry.

The library is advisory, not release authority. Current game source, save contracts, layout IDs, roadmaps, controls, accessibility requirements, publication receipts, and hardware evidence always take precedence when they are newer. Recommendations are hypotheses until implemented and tested.

Core files:

- `AGENTS.md`: mandatory agent workflow and evidence rules.
- `studio-manual.md`: shared methodology, genre guidance, design patterns, and review framework.
- `quality-rubric.md`: internal quality dimensions and evidence requirements.
- `recommendations.json`: structured recommendations with stable IDs.
- `catalog.json`: game and genre index.
- `games/`: game-specific level-design briefs for Aether Reach, Dino Atlas, Leonardo's Guild, Neighborhood Missions, Prism Current, Rainward, Sky Cycle, and Vesperfall.
- `sky-cycle-manual.md`: separate detailed manual for Sky Cycle.
- `sources/registry.md` and `sources/registry.json`: research provenance and scope notes.
- `data/library.json`: canonical structured library record for this edition.

The original review snapshot was based on v5ma/v5ma.github.io commit `a6d0e27d349fc69c011a5130b7dff1b6da9f8af2`. The repository has continued to evolve since then. Before applying a recommendation, refresh the game's current release and determine whether the recommendation is already implemented, superseded, or needs adaptation.

The goal is not to make every game use the same map structure. The shared standard is intentionality: teach readable rules, create meaningful choices, make spaces and systems accumulate meaning, design recovery as carefully as success, preserve each game's identity, and validate changes with real gameplay evidence.
