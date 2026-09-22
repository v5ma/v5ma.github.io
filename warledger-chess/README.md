# War Ledger Chess

War Ledger Chess is a local two-player chess-variant prototype for a decisive campaign game. Play at [v5ma.github.io/warledger-chess/](https://v5ma.github.io/warledger-chess/).

- Checkmate wins.
- Stalemate wins for the player who made the move that caused it.
- The player who makes the move that creates the third occurrence of the same position loses.
- Captures produce battle score and spendable bank points.
- Bank points buy one-use promotion licenses for fairy pieces.

## Implemented Slice

Files:

- `index.html` - static browser app and responsive board UI.
- `warledger-engine.mjs` - legal move engine, economy, no-draw resolution, scenarios.
- `warledger-ui.mjs` - local hotseat interaction layer.
- `piece-card-data.mjs` - deterministic card metadata and movement grammar.
- `piece-card-renderer.mjs` - SVG card renderer for exact movement diagrams.
- `historical-piece-taxonomy.md` - source-backed naming correction ledger.
- `piece-card-chancellor.html` - corrected rook+knight deterministic piece-card test.
- `piece-card-dragon.html` - legacy URL that now renders the corrected Chancellor card.
- `piece-card-zebra.html` - second deterministic piece-card test.
- `tests/warledger-chess-engine-contract.test.mjs` - Node contract tests.
- `tests/warledger-piece-card-contract.test.mjs` - exact target-square tests for piece cards.
- `cover.png` - screenshot of the playable board used on the games homepage.

Playable modes:

- `Standard` - orthodox chess deployment with the altered decisive rules.
- `Promotion Lab` - starts with enough bank to buy a fairy promotion license.
- `Stalemate Lab` - proves stalemate as a mover win.
- `Repetition Lab` - proves the third-position maker loses.

Promotion market:

- `Cn` Chancellor - rook lines plus knight jumps.
- `Z` Zebra - 3-by-2 leaper.
- `C` Chameleon - queen-style quiet movement, target-pattern captures.
- `A` Cannon - Xiangqi-style rook movement with one-screen capture.

Known scope:

- Castling and en passant are implemented.
- Dice-gated Chaturanga movement is not active in this slice; it is the obvious next mode once the deterministic rules are stable.
- Tournament carry-over scoring is represented as battle score plus bank, but multi-battle standings are not implemented yet.
- Play is local on one device. Online matches and a computer opponent are planned, not available in this release.

## Verification

Run from this folder:

```powershell
node .\tests\warledger-chess-engine-contract.test.mjs
node .\tests\warledger-piece-card-contract.test.mjs
```

Serve locally:

```powershell
python -m http.server 8734
```

Open:

```text
http://127.0.0.1:8734/
```

Open the deterministic Chancellor card:

```text
http://127.0.0.1:8734/piece-card-chancellor.html
```

Legacy corrected URL:

```text
http://127.0.0.1:8734/piece-card-dragon.html
```

Open the deterministic Zebra card:

```text
http://127.0.0.1:8734/piece-card-zebra.html
```

Card-generation rule:

- Use image generation for emblem, texture, and background art.
- Use deterministic SVG for board geometry, movement dots, arrows, coordinates, and rules text.
- Treat the movement target readback and contract test as the truth source before exporting cards.

## Reference Anchors

- Chess variant catalog: <https://www.chessvariants.com/>
- Chameleon reference: <https://www.chessvariants.org/piececlopedia.dir/chameleon.html>
- Al-Biruni Chaturanga model in Ludii: <https://ludii.games/details.php?keyword=Four-Player%20Chaturanga%20(al-Biruni)>
