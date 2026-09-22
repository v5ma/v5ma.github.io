import {
  FAIRY_PROMOTIONS,
  PIECES,
  buyPromotionLicense,
  cloneState,
  coordToSquare,
  createGame,
  getLegalMoves,
  getPromotionOptions,
  isKingInCheck,
  pieceAt,
  playMove
} from "./warledger-engine.mjs";

let state = createGame("standard");
let selectedSquare = null;
let selectedMoves = [];
let pendingPromotion = null;
let undoStack = [];
let notice = "";

const boardEl = document.querySelector("#board");
const statusEl = document.querySelector("#status");
const playersEl = document.querySelector("#players");
const marketEl = document.querySelector("#market");
const capturesEl = document.querySelector("#captures");
const moveLogEl = document.querySelector("#move-log");
const promotionDialog = document.querySelector("#promotion-dialog");
const promotionOptionsEl = document.querySelector("#promotion-options");
const noticeEl = document.querySelector("#notice");

document.querySelector("#reset-standard").addEventListener("click", () => loadScenario("standard"));
document.querySelector("#promotion-lab").addEventListener("click", () => loadScenario("promotionLab"));
document.querySelector("#stalemate-lab").addEventListener("click", () => loadScenario("stalemateLab"));
document.querySelector("#repetition-lab").addEventListener("click", () => loadScenario("repetitionLab"));
document.querySelector("#undo").addEventListener("click", undoLastAction);
document.querySelector("#close-promotion").addEventListener("click", closePromotionDialog);

render();

window.WarLedgerDebug = {
  getState: () => cloneState(state),
  getLegalMoves: () => getLegalMoves(state),
  loadScenario,
  buy: (type) => buyLicense(type),
  move: (from, to, promotionType = null) => commitMove({ from, to, promotionType })
};

function render() {
  selectedMoves = selectedSquare
    ? getLegalMoves(state).filter((move) => move.fromSquare === selectedSquare)
    : [];

  renderBoard();
  renderStatus();
  renderPlayers();
  renderMarket();
  renderCaptures();
  renderMoveLog();
  renderNotice();
}

function renderBoard() {
  boardEl.innerHTML = "";
  const legalTargets = new Map(selectedMoves.map((move) => [move.toSquare, move]));

  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const square = coordToSquare(r, c);
      const entry = state.board[r][c];
      const button = document.createElement("button");
      const isDark = (r + c) % 2 === 1;
      const isSelected = selectedSquare === square;
      const isTarget = legalTargets.has(square);
      const isLast = state.lastMove && (state.lastMove.from === square || state.lastMove.to === square);

      button.type = "button";
      button.className = [
        "square",
        isDark ? "dark" : "light",
        isSelected ? "selected" : "",
        isTarget ? "target" : "",
        isLast ? "last" : "",
        entry ? `piece-${entry.side}` : ""
      ].filter(Boolean).join(" ");
      button.dataset.square = square;
      button.setAttribute("aria-label", square);
      button.addEventListener("click", () => handleSquare(square));

      const label = document.createElement("span");
      label.className = "coord";
      label.textContent = square;
      button.append(label);

      if (entry) {
        const piece = document.createElement("span");
        piece.className = "piece";
        piece.textContent = PIECES[entry.type]?.code || entry.type;
        piece.title = `${capitalize(entry.side)} ${PIECES[entry.type].name}`;
        button.append(piece);
      }

      if (isTarget) {
        const dot = document.createElement("span");
        dot.className = legalTargets.get(square).capture ? "hit-dot capture-dot" : "hit-dot";
        button.append(dot);
      }

      boardEl.append(button);
    }
  }
}

function renderStatus() {
  const check = !state.gameOver && isKingInCheck(state, state.sideToMove);
  const title = state.gameOver
    ? `${capitalize(state.gameOver.winner)} victory`
    : `${capitalize(state.sideToMove)} to move`;
  const detail = state.gameOver
    ? state.gameOver.message
    : check
      ? `${capitalize(state.sideToMove)} is in check.`
      : "Battle active.";

  statusEl.innerHTML = `
    <div class="status-title">${title}</div>
    <div class="status-detail">${detail}</div>
    <div class="status-grid">
      <span>Repetition</span><strong>third maker loses</strong>
      <span>Stalemate</span><strong>maker wins</strong>
      <span>Promotions</span><strong>licenses unlock fairies</strong>
    </div>
  `;
}

function renderPlayers() {
  playersEl.innerHTML = ["white", "black"].map((side) => {
    const active = side === state.sideToMove && !state.gameOver ? " active" : "";
    const licenses = FAIRY_PROMOTIONS
      .map((type) => `${PIECES[type]?.code || type}:${state.licenses[side][type]}`)
      .join(" ");
    return `
      <section class="player-ledger${active}">
        <div>
          <h2>${capitalize(side)}</h2>
          <span>${state.gameOver?.winner === side ? "winner" : active ? "turn" : "reserve"}</span>
        </div>
        <dl>
          <dt>Battle score</dt><dd>${state.battleScore[side]}</dd>
          <dt>Bank</dt><dd>${state.bank[side]}</dd>
          <dt>Licenses</dt><dd>${licenses}</dd>
        </dl>
      </section>
    `;
  }).join("");
}

function renderMarket() {
  if (state.gameOver) {
    marketEl.innerHTML = `<p class="quiet">Market closed.</p>`;
    return;
  }

  const side = state.sideToMove;
  marketEl.innerHTML = FAIRY_PROMOTIONS.map((type) => {
    const piece = PIECES[type];
    const disabled = state.bank[side] < piece.licenseCost ? "disabled" : "";
    return `
      <button class="market-item" type="button" data-buy="${type}" ${disabled}>
        <span class="market-piece">${piece.code || type}</span>
        <span>
          <strong>${piece.name}</strong>
          <small>${piece.summary}</small>
        </span>
        <span class="cost">${piece.licenseCost}</span>
      </button>
    `;
  }).join("");

  marketEl.querySelectorAll("[data-buy]").forEach((button) => {
    button.addEventListener("click", () => buyLicense(button.dataset.buy));
  });
}

function renderCaptures() {
  capturesEl.innerHTML = ["white", "black"].map((side) => {
    const captures = state.captures[side];
    const text = captures.length
      ? captures.map((entry) => `${entry.type}+${entry.value}`).join(" ")
      : "none";
    return `
      <div class="capture-row">
        <span>${capitalize(side)}</span>
        <strong>${text}</strong>
      </div>
    `;
  }).join("");
}

function renderMoveLog() {
  if (!state.moveLog.length) {
    moveLogEl.innerHTML = `<li class="quiet">No moves yet.</li>`;
    return;
  }

  moveLogEl.innerHTML = state.moveLog.slice(-16).map((entry, index, entries) => {
    const moveNumber = state.moveLog.length - entries.length + index + 1;
    return `
      <li>
        <span>${moveNumber}</span>
        <strong>${entry.notation}</strong>
      </li>
    `;
  }).join("");
}

function renderNotice() {
  noticeEl.textContent = notice;
  noticeEl.hidden = !notice;
}

function handleSquare(square) {
  if (pendingPromotion) return;

  const entry = pieceAt(state, square);
  const selectedMove = selectedMoves.find((move) => move.toSquare === square);

  if (selectedMove) {
    if (selectedMove.promotion) {
      openPromotionDialog(selectedMove);
      return;
    }
    commitMove({ from: selectedMove.fromSquare, to: selectedMove.toSquare });
    return;
  }

  if (entry && entry.side === state.sideToMove && !state.gameOver) {
    selectedSquare = square;
    notice = "";
    render();
    return;
  }

  selectedSquare = null;
  render();
}

function commitMove(input) {
  const before = cloneState(state);
  const result = playMove(state, input);

  if (!result.ok) {
    notice = result.error || "Move rejected.";
    render();
    return false;
  }

  undoStack.push(before);
  state = result.state;
  selectedSquare = null;
  pendingPromotion = null;
  notice = "";
  closePromotionDialog(false);
  render();
  return true;
}

function buyLicense(type) {
  const before = cloneState(state);
  const result = buyPromotionLicense(state, state.sideToMove, type);
  if (!result.ok) {
    notice = result.error || "License rejected.";
    render();
    return false;
  }
  undoStack.push(before);
  state = result.state;
  notice = `${capitalize(state.sideToMove)} bought ${PIECES[type].name}.`;
  render();
  return true;
}

function openPromotionDialog(move) {
  pendingPromotion = move;
  const options = getPromotionOptions(state, state.sideToMove);
  promotionOptionsEl.innerHTML = options.map((option) => {
    const disabled = option.available ? "" : "disabled";
    const detail = option.cost
      ? option.available
        ? `license ready, value ${PIECES[option.type].value}`
        : `locked, cost ${option.cost}`
      : `standard, value ${PIECES[option.type].value}`;
    return `
      <button type="button" class="promotion-choice" data-promotion="${option.type}" ${disabled}>
        <span>${option.type}</span>
        <strong>${option.name}</strong>
        <small>${detail}</small>
      </button>
    `;
  }).join("");

  promotionOptionsEl.querySelectorAll("[data-promotion]").forEach((button) => {
    button.addEventListener("click", () => {
      commitMove({
        from: move.fromSquare,
        to: move.toSquare,
        promotionType: button.dataset.promotion
      });
    });
  });

  promotionDialog.hidden = false;
}

function closePromotionDialog(clearPending = true) {
  promotionDialog.hidden = true;
  promotionOptionsEl.innerHTML = "";
  if (clearPending) {
    pendingPromotion = null;
  }
}

function undoLastAction() {
  if (!undoStack.length) {
    notice = "Nothing to undo.";
    render();
    return;
  }
  state = undoStack.pop();
  selectedSquare = null;
  pendingPromotion = null;
  notice = "";
  closePromotionDialog(false);
  render();
}

function loadScenario(scenario) {
  state = createGame(scenario);
  selectedSquare = null;
  pendingPromotion = null;
  undoStack = [];
  notice = state.note;
  closePromotionDialog(false);
  render();
}

function capitalize(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
