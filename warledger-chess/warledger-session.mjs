import { PIECES, FAIRY_PROMOTIONS, SIDES, createGame, cloneState, getLegalMoves } from './warledger-engine.mjs';

export const SAVE_KEY = 'warledger.session.v1';
const MAX_UNDO = 60;
const isCount = n => Number.isSafeInteger(n) && n >= 0;

export function validState(state) {
  try {
    if (!state || !SIDES.includes(state.sideToMove) || !Array.isArray(state.board) || state.board.length !== 8) return false;
    const kings = {white:0, black:0};
    for (const row of state.board) {
      if (!Array.isArray(row) || row.length !== 8) return false;
      for (const p of row) {
        if (p === null) continue;
        if (!p || !Object.hasOwn(PIECES,p.type) || !SIDES.includes(p.side) || typeof p.id !== 'string') return false;
        if (p.type === 'K') kings[p.side]++;
      }
    }
    for (const side of SIDES) {
      if (kings[side] !== 1 || !isCount(state.bank?.[side]) || !isCount(state.battleScore?.[side])) return false;
      if (!Array.isArray(state.captures?.[side]) || typeof state.castling?.[side]?.kingSide !== 'boolean' || typeof state.castling?.[side]?.queenSide !== 'boolean') return false;
      for (const type of FAIRY_PROMOTIONS) if (!isCount(state.licenses?.[side]?.[type])) return false;
    }
    if (!Array.isArray(state.moveLog) || state.moveLog.some(e => !e || typeof e.notation !== 'string' || /[<>]/.test(e.notation))) return false;
    if (!state.positionCounts || typeof state.positionCounts !== 'object' || Array.isArray(state.positionCounts)) return false;
    if (Object.values(state.positionCounts).some(n => !isCount(n))) return false;
    if (state.gameOver && (!SIDES.includes(state.gameOver.winner) || typeof state.gameOver.message !== 'string' || /[<>]/.test(state.gameOver.message))) return false;
    getLegalMoves(state);
    return true;
  } catch { return false; }
}

export function loadSession(storage = undefined) {
  let raw;
  try {
    storage ??= globalThis.localStorage;
    raw = storage?.getItem(SAVE_KEY);
    if (raw) {
      if (raw.length > 8000000) throw new Error('Save is too large.');
      const saved = JSON.parse(raw);
      if (saved.version !== 1 || !validState(saved.state)) throw new Error('Invalid save.');
      const undoStack = Array.isArray(saved.undoStack) ? saved.undoStack.slice(-MAX_UNDO).filter(validState) : [];
      return {state:cloneState(saved.state), undoStack, warning:''};
    }
  } catch {
    try { if (raw) storage?.setItem(`${SAVE_KEY}.recovery`,raw); } catch {}
    return {state:createGame(),undoStack:[],warning:'The save could not be loaded. A fresh board was opened; any readable original was kept under the recovery key.'};
  }
  return {state:createGame(),undoStack:[],warning:''};
}

export function saveSession(state, undoStack = [], storage = undefined) {
  try {
    storage ??= globalThis.localStorage;
    if (!storage) return false;
    storage.setItem(SAVE_KEY,JSON.stringify({version:1,savedAt:Date.now(),state,undoStack:undoStack.slice(-MAX_UNDO)}));
    return true;
  } catch { return false; }
}
