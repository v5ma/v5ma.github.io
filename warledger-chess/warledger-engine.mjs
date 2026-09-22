export const SIDES = ["white", "black"];
export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const PIECES = {
  K: { name: "King", value: 0, canPromote: false },
  Q: { name: "Queen", value: 9, canPromote: true },
  R: { name: "Rook", value: 5, canPromote: true },
  B: { name: "Bishop", value: 3, canPromote: true },
  N: { name: "Knight", value: 3, canPromote: true },
  P: { name: "Pawn", value: 1, canPromote: false },
  D: {
    name: "Chancellor",
    code: "Cn",
    value: 10,
    canPromote: true,
    licenseCost: 10,
    summary: "Rook lines plus knight jumps"
  },
  Z: {
    name: "Zebra",
    value: 5,
    canPromote: true,
    licenseCost: 5,
    summary: "Long 3-by-2 leaper"
  },
  C: {
    name: "Chameleon",
    value: 7,
    canPromote: true,
    licenseCost: 7,
    summary: "Queen walk, captures by target pattern"
  },
  A: {
    name: "Cannon",
    value: 6,
    canPromote: true,
    licenseCost: 6,
    summary: "Rook walk, one-screen capture"
  }
};

const STANDARD_PROMOTIONS = ["Q", "R", "B", "N"];
export const FAIRY_PROMOTIONS = ["D", "Z", "C", "A"];
const ORTHOGONAL = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1]
];
const DIAGONAL = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1]
];
const KNIGHT_DELTAS = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1]
];
const ZEBRA_DELTAS = [
  [-3, -2],
  [-3, 2],
  [-2, -3],
  [-2, 3],
  [2, -3],
  [2, 3],
  [3, -2],
  [3, 2]
];
const KING_DELTAS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1]
];

export function createGame(scenario = "standard") {
  if (scenario === "promotionLab") {
    return createCustomGame({
      sideToMove: "white",
      bank: { white: 10, black: 0 },
      battleScore: { white: 10, black: 0 },
      placements: [
        ["white", "K", "e1"],
        ["black", "K", "h8"],
        ["white", "P", "e7"],
        ["black", "R", "a8"]
      ],
      note: "Promotion lab"
    });
  }

  if (scenario === "stalemateLab") {
    return createCustomGame({
      sideToMove: "white",
      placements: [
        ["white", "K", "f7"],
        ["white", "Q", "g5"],
        ["black", "K", "h8"]
      ],
      note: "White can play Qg6 and win by stalemate"
    });
  }

  if (scenario === "repetitionLab") {
    return createCustomGame({
      sideToMove: "white",
      placements: [
        ["white", "K", "e1"],
        ["black", "K", "e8"],
        ["white", "N", "b1"],
        ["black", "N", "g8"]
      ],
      note: "Repeat Nb1-c3, Ng8-f6, Nc3-b1, Nf6-g8 twice"
    });
  }

  return createStandardGame();
}

export function createStandardGame() {
  const board = emptyBoard();
  const backRank = ["R", "N", "B", "Q", "K", "B", "N", "R"];

  backRank.forEach((type, file) => {
    board[7][file] = piece("white", type, `w${type}${file}`);
    board[0][file] = piece("black", type, `b${type}${file}`);
  });

  for (let file = 0; file < 8; file += 1) {
    board[6][file] = piece("white", "P", `wP${file}`);
    board[1][file] = piece("black", "P", `bP${file}`);
  }

  return finishNewState({
    board,
    sideToMove: "white",
    bank: freshSideRecord(0),
    battleScore: freshSideRecord(0),
    captures: { white: [], black: [] },
    licenses: freshLicenses(),
    castling: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true }
    },
    enPassant: null,
    moveLog: [],
    lastMove: null,
    gameOver: null,
    note: "Standard deployment"
  });
}

export function createCustomGame(config) {
  const board = emptyBoard();
  const ids = {};

  for (const entry of config.placements || []) {
    const [side, type, square] = Array.isArray(entry)
      ? entry
      : [entry.side, entry.type, entry.square];
    const { r, c } = squareToCoord(square);
    const key = `${side}${type}`;
    ids[key] = (ids[key] || 0) + 1;
    board[r][c] = piece(side, type, `${side[0]}${type}${ids[key]}`);
  }

  return finishNewState({
    board,
    sideToMove: config.sideToMove || "white",
    bank: config.bank || freshSideRecord(0),
    battleScore: config.battleScore || freshSideRecord(0),
    captures: config.captures || { white: [], black: [] },
    licenses: config.licenses || freshLicenses(),
    castling: config.castling || {
      white: { kingSide: false, queenSide: false },
      black: { kingSide: false, queenSide: false }
    },
    enPassant: config.enPassant || null,
    moveLog: config.moveLog || [],
    lastMove: config.lastMove || null,
    gameOver: config.gameOver || null,
    note: config.note || "Custom position"
  });
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function opponent(side) {
  return side === "white" ? "black" : "white";
}

export function squareToCoord(square) {
  if (typeof square !== "string" || !/^[a-h][1-8]$/.test(square)) {
    throw new Error(`Invalid square: ${square}`);
  }
  return {
    r: 8 - Number(square[1]),
    c: FILES.indexOf(square[0])
  };
}

export function coordToSquare(r, c) {
  if (!inBounds(r, c)) {
    throw new Error(`Invalid coordinate: ${r},${c}`);
  }
  return `${FILES[c]}${8 - r}`;
}

export function pieceAt(state, square) {
  const { r, c } = squareToCoord(square);
  return state.board[r][c];
}

export function getLegalMoves(state, side = state.sideToMove) {
  if (state.gameOver) {
    return [];
  }

  const pseudoMoves = getPseudoMoves(state, side);
  const legalMoves = [];

  for (const move of pseudoMoves) {
    const next = applyMoveCore(state, move, {
      promotionType: move.promotion ? "Q" : null,
      skipEconomy: true
    });
    if (!isKingInCheck(next, side)) {
      legalMoves.push(move);
    }
  }

  return legalMoves;
}

export function playMove(state, input) {
  if (state.gameOver) {
    return { ok: false, error: "Game is already over." };
  }

  const from = normalizeSquare(input.from);
  const to = normalizeSquare(input.to);
  const legalMove = getLegalMoves(state).find(
    (move) => move.fromSquare === from && move.toSquare === to
  );

  if (!legalMove) {
    return { ok: false, error: `Illegal move: ${from}-${to}` };
  }

  if (legalMove.promotion && !input.promotionType) {
    return {
      ok: false,
      promotionRequired: true,
      move: legalMove,
      options: getPromotionOptions(state, state.sideToMove)
    };
  }

  const promotionType = input.promotionType || null;
  if (legalMove.promotion) {
    const validation = validatePromotionChoice(state, state.sideToMove, promotionType);
    if (!validation.ok) {
      return validation;
    }
  }

  const next = applyMoveCore(state, legalMove, { promotionType });
  resolveAfterMove(next, state.sideToMove);
  return { ok: true, state: next, move: legalMove };
}

export function buyPromotionLicense(state, side, type) {
  if (state.gameOver) {
    return { ok: false, error: "Game is already over." };
  }
  if (side !== state.sideToMove) {
    return { ok: false, error: "Only the player to move can buy a license." };
  }
  if (!FAIRY_PROMOTIONS.includes(type)) {
    return { ok: false, error: "Only fairy promotion licenses are sold." };
  }

  const cost = PIECES[type].licenseCost;
  if (state.bank[side] < cost) {
    return { ok: false, error: `${side} needs ${cost} bank points for ${PIECES[type].name}.` };
  }

  const next = cloneState(state);
  next.bank[side] -= cost;
  next.licenses[side][type] += 1;
  next.moveLog.push({
    side,
    notation: `${capitalize(side)} buys ${PIECES[type].name}`,
    economy: true
  });
  return { ok: true, state: next };
}

export function getPromotionOptions(state, side) {
  const options = STANDARD_PROMOTIONS.map((type) => ({
    type,
    name: PIECES[type].name,
    cost: 0,
    available: true,
    owned: null
  }));

  for (const type of FAIRY_PROMOTIONS) {
    options.push({
      type,
      name: PIECES[type].name,
      cost: PIECES[type].licenseCost,
      available: state.licenses[side][type] > 0,
      owned: state.licenses[side][type],
      summary: PIECES[type].summary
    });
  }

  return options;
}

export function isKingInCheck(state, side) {
  const king = findKing(state, side);
  if (!king) {
    return true;
  }
  return isSquareAttacked(state, king.r, king.c, opponent(side));
}

export function positionKey(state) {
  const rows = state.board.map((row) =>
    row.map((entry) => {
      if (!entry) return ".";
      return `${entry.side[0]}${entry.type}`;
    }).join("")
  );
  const castle = SIDES.map((side) => {
    const rights = state.castling[side];
    return `${side[0]}${rights.kingSide ? "k" : "-"}${rights.queenSide ? "q" : "-"}`;
  }).join("");
  const ep = state.enPassant ? state.enPassant.square : "-";
  return `${state.sideToMove}|${rows.join("/")}|${castle}|${ep}`;
}

function finishNewState(state) {
  const next = cloneState({
    ...state,
    positionCounts: {}
  });
  next.positionCounts[positionKey(next)] = 1;
  return next;
}

function emptyBoard() {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
}

function piece(side, type, id) {
  return { side, type, id };
}

function freshSideRecord(value) {
  return { white: value, black: value };
}

function freshLicenses() {
  return {
    white: { D: 0, Z: 0, C: 0, A: 0 },
    black: { D: 0, Z: 0, C: 0, A: 0 }
  };
}

function getPseudoMoves(state, side) {
  const moves = [];

  forEachPiece(state, side, (pieceEntry, r, c) => {
    if (pieceEntry.type === "P") addPawnMoves(state, moves, pieceEntry, r, c);
    if (pieceEntry.type === "K") addKingMoves(state, moves, pieceEntry, r, c);
    if (pieceEntry.type === "Q") addSliderMoves(state, moves, pieceEntry, r, c, ORTHOGONAL.concat(DIAGONAL));
    if (pieceEntry.type === "R") addSliderMoves(state, moves, pieceEntry, r, c, ORTHOGONAL);
    if (pieceEntry.type === "B") addSliderMoves(state, moves, pieceEntry, r, c, DIAGONAL);
    if (pieceEntry.type === "N") addLeaperMoves(state, moves, pieceEntry, r, c, KNIGHT_DELTAS);
    if (pieceEntry.type === "D") {
      addSliderMoves(state, moves, pieceEntry, r, c, ORTHOGONAL);
      addLeaperMoves(state, moves, pieceEntry, r, c, KNIGHT_DELTAS);
    }
    if (pieceEntry.type === "Z") addLeaperMoves(state, moves, pieceEntry, r, c, ZEBRA_DELTAS);
    if (pieceEntry.type === "C") addChameleonMoves(state, moves, pieceEntry, r, c);
    if (pieceEntry.type === "A") addCannonMoves(state, moves, pieceEntry, r, c);
  });

  return moves;
}

function addPawnMoves(state, moves, pieceEntry, r, c) {
  const direction = pieceEntry.side === "white" ? -1 : 1;
  const startRank = pieceEntry.side === "white" ? 6 : 1;
  const promotionRank = pieceEntry.side === "white" ? 0 : 7;
  const oneStep = r + direction;

  if (inBounds(oneStep, c) && !state.board[oneStep][c]) {
    pushMove(moves, state, pieceEntry, r, c, oneStep, c, {
      promotion: oneStep === promotionRank
    });

    const twoStep = r + direction * 2;
    if (r === startRank && inBounds(twoStep, c) && !state.board[twoStep][c]) {
      pushMove(moves, state, pieceEntry, r, c, twoStep, c, {
        doublePawn: true,
        enPassantSquare: coordToSquare(r + direction, c)
      });
    }
  }

  for (const dc of [-1, 1]) {
    const tr = r + direction;
    const tc = c + dc;
    if (!inBounds(tr, tc)) continue;
    const target = state.board[tr][tc];

    if (target && target.side !== pieceEntry.side) {
      pushMove(moves, state, pieceEntry, r, c, tr, tc, {
        promotion: tr === promotionRank
      });
    }

    if (state.enPassant && state.enPassant.square === coordToSquare(tr, tc)) {
      pushMove(moves, state, pieceEntry, r, c, tr, tc, {
        enPassant: true,
        capturedSquare: state.enPassant.capturedSquare
      });
    }
  }
}

function addKingMoves(state, moves, pieceEntry, r, c) {
  addLeaperMoves(state, moves, pieceEntry, r, c, KING_DELTAS);
  addCastlingMoves(state, moves, pieceEntry, r, c);
}

function addCastlingMoves(state, moves, pieceEntry, r, c) {
  const side = pieceEntry.side;
  const homeRank = side === "white" ? 7 : 0;
  const enemy = opponent(side);
  const rights = state.castling[side];

  if (r !== homeRank || c !== 4 || isSquareAttacked(state, r, c, enemy)) {
    return;
  }

  if (
    rights.kingSide &&
    state.board[homeRank][7]?.side === side &&
    state.board[homeRank][7]?.type === "R" &&
    !state.board[homeRank][5] &&
    !state.board[homeRank][6] &&
    !isSquareAttacked(state, homeRank, 5, enemy) &&
    !isSquareAttacked(state, homeRank, 6, enemy)
  ) {
    pushMove(moves, state, pieceEntry, r, c, homeRank, 6, {
      castle: "kingSide",
      rookFrom: coordToSquare(homeRank, 7),
      rookTo: coordToSquare(homeRank, 5)
    });
  }

  if (
    rights.queenSide &&
    state.board[homeRank][0]?.side === side &&
    state.board[homeRank][0]?.type === "R" &&
    !state.board[homeRank][1] &&
    !state.board[homeRank][2] &&
    !state.board[homeRank][3] &&
    !isSquareAttacked(state, homeRank, 3, enemy) &&
    !isSquareAttacked(state, homeRank, 2, enemy)
  ) {
    pushMove(moves, state, pieceEntry, r, c, homeRank, 2, {
      castle: "queenSide",
      rookFrom: coordToSquare(homeRank, 0),
      rookTo: coordToSquare(homeRank, 3)
    });
  }
}

function addSliderMoves(state, moves, pieceEntry, r, c, directions) {
  for (const [dr, dc] of directions) {
    let tr = r + dr;
    let tc = c + dc;
    while (inBounds(tr, tc)) {
      const target = state.board[tr][tc];
      if (!target) {
        pushMove(moves, state, pieceEntry, r, c, tr, tc);
      } else {
        if (target.side !== pieceEntry.side) {
          pushMove(moves, state, pieceEntry, r, c, tr, tc);
        }
        break;
      }
      tr += dr;
      tc += dc;
    }
  }
}

function addLeaperMoves(state, moves, pieceEntry, r, c, deltas) {
  for (const [dr, dc] of deltas) {
    const tr = r + dr;
    const tc = c + dc;
    if (!inBounds(tr, tc)) continue;
    const target = state.board[tr][tc];
    if (!target || target.side !== pieceEntry.side) {
      pushMove(moves, state, pieceEntry, r, c, tr, tc);
    }
  }
}

function addChameleonMoves(state, moves, pieceEntry, r, c) {
  addChameleonQuietMoves(state, moves, pieceEntry, r, c);

  forEachPiece(state, opponent(pieceEntry.side), (target, tr, tc) => {
    if (canChameleonCaptureTarget(state, r, c, tr, tc, target)) {
      pushMove(moves, state, pieceEntry, r, c, tr, tc, { chameleonCapture: true });
    }
  });
}

function addCannonMoves(state, moves, pieceEntry, r, c) {
  for (const [dr, dc] of ORTHOGONAL) {
    let tr = r + dr;
    let tc = c + dc;
    let screenSeen = false;

    while (inBounds(tr, tc)) {
      const target = state.board[tr][tc];

      if (!screenSeen) {
        if (!target) {
          pushMove(moves, state, pieceEntry, r, c, tr, tc);
        } else {
          screenSeen = true;
        }
      } else if (target) {
        if (target.side !== pieceEntry.side) {
          pushMove(moves, state, pieceEntry, r, c, tr, tc, { cannonCapture: true });
        }
        break;
      }

      tr += dr;
      tc += dc;
    }
  }
}

function addChameleonQuietMoves(state, moves, pieceEntry, r, c) {
  for (const [dr, dc] of ORTHOGONAL.concat(DIAGONAL)) {
    let tr = r + dr;
    let tc = c + dc;
    while (inBounds(tr, tc)) {
      if (state.board[tr][tc]) {
        break;
      }
      pushMove(moves, state, pieceEntry, r, c, tr, tc);
      tr += dr;
      tc += dc;
    }
  }
}

function canChameleonCaptureTarget(state, fromR, fromC, targetR, targetC, targetPiece) {
  if (!targetPiece || targetPiece.type === "C") {
    return false;
  }
  return pieceCanMovePattern(state, targetPiece, targetR, targetC, fromR, fromC, {
    forAttack: true
  });
}

function pieceCanMovePattern(state, pieceEntry, fromR, fromC, targetR, targetC, options = {}) {
  const dr = targetR - fromR;
  const dc = targetC - fromC;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);

  if (pieceEntry.type === "P") {
    const direction = pieceEntry.side === "white" ? -1 : 1;
    return dr === direction && Math.abs(dc) === 1;
  }
  if (pieceEntry.type === "K") return adr <= 1 && adc <= 1 && (adr + adc > 0);
  if (pieceEntry.type === "N") return hasDelta(KNIGHT_DELTAS, dr, dc);
  if (pieceEntry.type === "Z") return hasDelta(ZEBRA_DELTAS, dr, dc);
  if (pieceEntry.type === "R") return isClearOrthogonal(state, fromR, fromC, targetR, targetC);
  if (pieceEntry.type === "B") return isClearDiagonal(state, fromR, fromC, targetR, targetC);
  if (pieceEntry.type === "Q") {
    return (
      isClearOrthogonal(state, fromR, fromC, targetR, targetC) ||
      isClearDiagonal(state, fromR, fromC, targetR, targetC)
    );
  }
  if (pieceEntry.type === "D") {
    return (
      isClearOrthogonal(state, fromR, fromC, targetR, targetC) ||
      hasDelta(KNIGHT_DELTAS, dr, dc)
    );
  }
  if (pieceEntry.type === "A") return isCannonAttack(state, fromR, fromC, targetR, targetC);
  if (pieceEntry.type === "C") {
    if (!options.targetPiece) return false;
    return canChameleonCaptureTarget(state, fromR, fromC, targetR, targetC, options.targetPiece);
  }
  return false;
}

function isCannonAttack(state, fromR, fromC, targetR, targetC) {
  if (fromR !== targetR && fromC !== targetC) {
    return false;
  }
  if (fromR === targetR && fromC === targetC) {
    return false;
  }

  const stepR = Math.sign(targetR - fromR);
  const stepC = Math.sign(targetC - fromC);
  let r = fromR + stepR;
  let c = fromC + stepC;
  let screens = 0;

  while (r !== targetR || c !== targetC) {
    if (state.board[r][c]) {
      screens += 1;
    }
    r += stepR;
    c += stepC;
  }

  return screens === 1;
}

function pushMove(moves, state, pieceEntry, fromR, fromC, toR, toC, flags = {}) {
  const target = flags.enPassant
    ? getBySquare(state, flags.capturedSquare)
    : state.board[toR][toC];

  if (target?.type === "K") {
    return;
  }

  moves.push({
    from: { r: fromR, c: fromC },
    to: { r: toR, c: toC },
    fromSquare: coordToSquare(fromR, fromC),
    toSquare: coordToSquare(toR, toC),
    piece: pieceEntry.type,
    side: pieceEntry.side,
    capture: target
      ? {
          type: target.type,
          side: target.side,
          value: PIECES[target.type].value,
          square: flags.capturedSquare || coordToSquare(toR, toC)
        }
      : null,
    ...flags
  });
}

function applyMoveCore(state, move, options = {}) {
  const next = cloneState(state);
  const movingPiece = next.board[move.from.r][move.from.c];
  const capturedSquare = move.capture?.square || move.toSquare;

  next.board[move.from.r][move.from.c] = null;

  if (move.enPassant && move.capturedSquare) {
    const captured = squareToCoord(move.capturedSquare);
    next.board[captured.r][captured.c] = null;
  }

  const target = next.board[move.to.r][move.to.c];
  next.board[move.to.r][move.to.c] = movingPiece;

  if (move.castle) {
    const rookFrom = squareToCoord(move.rookFrom);
    const rookTo = squareToCoord(move.rookTo);
    next.board[rookTo.r][rookTo.c] = next.board[rookFrom.r][rookFrom.c];
    next.board[rookFrom.r][rookFrom.c] = null;
  }

  updateCastlingRights(next, movingPiece, move, target, capturedSquare);

  if (move.promotion && options.promotionType) {
    movingPiece.type = options.promotionType;
    movingPiece.promoted = true;
  }

  if (!options.skipEconomy && move.capture) {
    const side = movingPiece.side;
    next.bank[side] += move.capture.value;
    next.battleScore[side] += move.capture.value;
    next.captures[side].push({
      type: move.capture.type,
      value: move.capture.value,
      square: move.capture.square
    });
  }

  if (!options.skipEconomy && move.promotion && FAIRY_PROMOTIONS.includes(options.promotionType)) {
    next.licenses[movingPiece.side][options.promotionType] -= 1;
  }

  if (move.doublePawn) {
    next.enPassant = {
      square: move.enPassantSquare,
      capturedSquare: move.toSquare,
      side: movingPiece.side
    };
  } else {
    next.enPassant = null;
  }

  next.sideToMove = opponent(movingPiece.side);

  if (!options.skipEconomy) {
    next.moveLog.push(formatLogEntry(move, options.promotionType));
    next.lastMove = {
      from: move.fromSquare,
      to: move.toSquare,
      piece: move.piece,
      side: move.side,
      capture: move.capture,
      promotion: options.promotionType || null
    };
  }

  return next;
}

function updateCastlingRights(state, movingPiece, move, capturedTarget, capturedSquare) {
  if (movingPiece.type === "K") {
    state.castling[movingPiece.side].kingSide = false;
    state.castling[movingPiece.side].queenSide = false;
  }

  if (movingPiece.type === "R") {
    clearRookCastleSquare(state, movingPiece.side, move.fromSquare);
  }

  if (capturedTarget?.type === "R" && move.capture) {
    clearRookCastleSquare(state, capturedTarget.side, capturedSquare);
  }
}

function clearRookCastleSquare(state, side, square) {
  if (side === "white") {
    if (square === "h1") state.castling.white.kingSide = false;
    if (square === "a1") state.castling.white.queenSide = false;
  } else {
    if (square === "h8") state.castling.black.kingSide = false;
    if (square === "a8") state.castling.black.queenSide = false;
  }
}

function resolveAfterMove(state, mover) {
  const key = positionKey(state);
  state.positionCounts[key] = (state.positionCounts[key] || 0) + 1;

  if (state.positionCounts[key] >= 3) {
    state.gameOver = {
      winner: opponent(mover),
      loser: mover,
      reason: "repetition-loss",
      message: `${capitalize(mover)} completed the third occurrence and loses.`
    };
    return;
  }

  const side = state.sideToMove;
  const legalReplies = getLegalMoves(state, side);
  if (legalReplies.length > 0) {
    state.gameOver = null;
    return;
  }

  const checked = isKingInCheck(state, side);
  state.gameOver = {
    winner: mover,
    loser: side,
    reason: checked ? "checkmate" : "stalemate-win",
    message: checked
      ? `${capitalize(mover)} wins by checkmate.`
      : `${capitalize(mover)} wins by causing stalemate.`
  };
}

function validatePromotionChoice(state, side, type) {
  if (!PIECES[type] || !PIECES[type].canPromote) {
    return { ok: false, error: "Invalid promotion piece." };
  }
  if (STANDARD_PROMOTIONS.includes(type)) {
    return { ok: true };
  }
  if (!FAIRY_PROMOTIONS.includes(type)) {
    return { ok: false, error: "That piece cannot be bought for promotion." };
  }
  if (state.licenses[side][type] <= 0) {
    return { ok: false, error: `${capitalize(side)} has no ${PIECES[type].name} license.` };
  }
  return { ok: true };
}

function formatLogEntry(move, promotionType) {
  const capture = move.capture ? `x${move.toSquare}` : `-${move.toSquare}`;
  const promo = promotionType ? `=${promotionType}` : "";
  const suffix = move.castle ? (move.castle === "kingSide" ? "O-O" : "O-O-O") : `${move.piece}${move.fromSquare}${capture}${promo}`;
  return {
    side: move.side,
    notation: suffix,
    capture: move.capture,
    promotion: promotionType || null
  };
}

function isSquareAttacked(state, r, c, bySide) {
  let attacked = false;
  const targetPiece = state.board[r][c];

  forEachPiece(state, bySide, (pieceEntry, fromR, fromC) => {
    if (attacked) return;
    if (pieceEntry.type === "C") {
      attacked = targetPiece
        ? canChameleonCaptureTarget(state, fromR, fromC, r, c, targetPiece)
        : false;
      return;
    }
    attacked = pieceCanMovePattern(state, pieceEntry, fromR, fromC, r, c, {
      targetPiece,
      forAttack: true
    });
  });

  return attacked;
}

function findKing(state, side) {
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const entry = state.board[r][c];
      if (entry?.side === side && entry.type === "K") {
        return { r, c };
      }
    }
  }
  return null;
}

function forEachPiece(state, side, callback) {
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const entry = state.board[r][c];
      if (entry?.side === side) {
        callback(entry, r, c);
      }
    }
  }
}

function getBySquare(state, square) {
  const { r, c } = squareToCoord(square);
  return state.board[r][c];
}

function normalizeSquare(input) {
  if (typeof input === "string") {
    return input;
  }
  return coordToSquare(input.r, input.c);
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function hasDelta(deltas, dr, dc) {
  return deltas.some(([entryR, entryC]) => entryR === dr && entryC === dc);
}

function isClearOrthogonal(state, fromR, fromC, targetR, targetC) {
  if (fromR !== targetR && fromC !== targetC) {
    return false;
  }
  if (fromR === targetR && fromC === targetC) {
    return false;
  }
  return isClearLine(state, fromR, fromC, targetR, targetC);
}

function isClearDiagonal(state, fromR, fromC, targetR, targetC) {
  if (Math.abs(targetR - fromR) !== Math.abs(targetC - fromC)) {
    return false;
  }
  if (fromR === targetR && fromC === targetC) {
    return false;
  }
  return isClearLine(state, fromR, fromC, targetR, targetC);
}

function isClearLine(state, fromR, fromC, targetR, targetC) {
  const stepR = Math.sign(targetR - fromR);
  const stepC = Math.sign(targetC - fromC);
  let r = fromR + stepR;
  let c = fromC + stepC;

  while (r !== targetR || c !== targetC) {
    if (state.board[r][c]) {
      return false;
    }
    r += stepR;
    c += stepC;
  }

  return true;
}

function capitalize(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
