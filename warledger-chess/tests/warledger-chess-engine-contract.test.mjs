import assert from "node:assert/strict";

import {
  PIECES,
  buyPromotionLicense,
  createCustomGame,
  createGame,
  getLegalMoves,
  pieceAt,
  playMove
} from "../warledger-engine.mjs";

function mustMove(state, from, to, promotionType = null) {
  const result = playMove(state, { from, to, promotionType });
  assert.equal(result.ok, true, result.error);
  return result.state;
}

{
  const state = createGame("standard");
  assert.equal(getLegalMoves(state).length, 20, "standard opening should preserve 20 white legal moves");
  assert.equal(state.gameOver, null);
}

{
  let state = createGame("stalemateLab");
  state = mustMove(state, "g5", "g6");
  assert.equal(state.gameOver?.reason, "stalemate-win");
  assert.equal(state.gameOver?.winner, "white");
  assert.equal(state.gameOver?.loser, "black");
}

{
  let state = createGame("repetitionLab");
  const line = [
    ["b1", "c3"],
    ["g8", "f6"],
    ["c3", "b1"],
    ["f6", "g8"],
    ["b1", "c3"],
    ["g8", "f6"],
    ["c3", "b1"],
    ["f6", "g8"]
  ];

  for (const [from, to] of line) {
    state = mustMove(state, from, to);
  }

  assert.equal(state.gameOver?.reason, "repetition-loss");
  assert.equal(state.gameOver?.winner, "white");
  assert.equal(state.gameOver?.loser, "black");
}

{
  let state = createGame("promotionLab");
  const buy = buyPromotionLicense(state, "white", "D");
  assert.equal(buy.ok, true, buy.error);
  state = buy.state;
  assert.equal(state.bank.white, 0);
  assert.equal(state.licenses.white.D, 1);

  state = mustMove(state, "e7", "e8", "D");
  assert.equal(pieceAt(state, "e8").type, "D");
  assert.equal(state.licenses.white.D, 0);
  assert.equal(PIECES.D.name, "Chancellor", "legacy internal code D must display as Chancellor");
}

{
  const state = createCustomGame({
    sideToMove: "white",
    placements: [
      ["white", "K", "a1"],
      ["black", "K", "h8"],
      ["white", "C", "e4"],
      ["black", "R", "e8"],
      ["black", "N", "g5"],
      ["black", "C", "h4"]
    ]
  });
  const moves = getLegalMoves(state)
    .filter((move) => move.fromSquare === "e4")
    .map((move) => move.toSquare);

  assert.ok(moves.includes("e8"), "chameleon can capture a rook by rook pattern");
  assert.ok(moves.includes("g5"), "chameleon can capture a knight by knight pattern");
  assert.equal(moves.includes("h4"), false, "chameleon cannot capture another chameleon");
}

{
  const state = createCustomGame({
    sideToMove: "white",
    placements: [
      ["white", "K", "a1"],
      ["black", "K", "h8"],
      ["white", "A", "a2"],
      ["white", "P", "a4"],
      ["black", "R", "a8"],
      ["black", "B", "h2"]
    ]
  });
  const moves = getLegalMoves(state)
    .filter((move) => move.fromSquare === "a2")
    .map((move) => move.toSquare);

  assert.ok(moves.includes("a3"), "cannon moves quietly like a rook before the screen");
  assert.ok(moves.includes("a8"), "cannon captures after exactly one screen");
  assert.equal(moves.includes("h2"), false, "cannon cannot capture without a screen");
}

console.log("warledger-chess-engine-contract: PASS");
