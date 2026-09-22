# Historical Piece Taxonomy

This file is the correction ledger for War Ledger Chess piece names.

## Compound Names

| Movement | Preferred War Ledger name | Common aliases | Notes |
| --- | --- | --- | --- |
| Rook + Knight | Chancellor | Empress, Marshall, Champion | The old prototype called this Dragon. That was corrected. |
| Bishop + Knight | Archbishop | Princess, Cardinal, Janus | Not Dragon in the standard fairy-piece naming family. |
| Queen + Knight | Amazon | Superqueen, Maharajah, sometimes Dragon | Strongest common queen compound; Dragon is an overloaded alias in some references. |
| Rook + Ferz or non-royal King | Dragon King | Promoted Rook, Dragon | Shogi promoted rook family. |
| Bishop + Wazir or non-royal King | Dragon Horse | Promoted Bishop, Horse | Shogi promoted bishop family. |
| Pawn + Knight | Dragon | varies by problem tradition | Piececlopedia indexes Dragon as Pawn + Knight. Directionality depends on pawn convention. |

## Policy

- Movement cards must use the historically preferred name as the title.
- Ambiguous names go in the overload panel, not the title.
- Internal engine codes may remain stable for compatibility, but the player-facing `name` and `code` fields must be accurate.
- Sources should be kept with the card data when a piece has overloaded names.

## Source Anchors

- ChessVariants Piececlopedia index: <https://www.chessvariants.org/piececlopedia.dir/>
- Rook-Knight compound: <https://www.chessvariants.org/piececlopedia.dir/rook-knight.html>
- Archbishop tag / Bishop-Knight family: <https://www.chessvariants.org/tag/Piece%3AArchbishop>
- GNU Shogi rules for Dragon King and Dragon Horse: <https://www.gnu.org/software/gnushogi/manual/The-rules-of-shogi.html>
- Unicode fairy-chess proposal tables for knight-rook, knight-bishop, and knight-queen symbols: <https://www.unicode.org/L2/L2017/17034r2-n4784-fairy-chess.pdf>
