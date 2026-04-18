// dots[r][c]    r=0..rows-1, c=0..r
// hEdges[r][c]  r=0..rows-1, c=0..r-1   edge (r,c)↔(r,c+1)
// lEdges[r][c]  r=0..rows-2, c=0..r     edge (r,c)↔(r+1,c)
// rEdges[r][c]  r=0..rows-2, c=0..r     edge (r,c)↔(r+1,c+1)
// upTri[r][c]   r=0..rows-2, c=0..r     △ apex=(r,c), base=(r+1,c)–(r+1,c+1)
// downTri[r][c] r=0..rows-2, c=0..r-1   ▽ base=(r,c)–(r,c+1), apex=(r+1,c+1)

export function initGameState(rows = 8) {
  return {
    rows,
    dots:    Array.from({ length: rows },     (_, r) => Array(r + 1).fill(null)),
    hEdges:  Array.from({ length: rows },     (_, r) => Array(r).fill(null)),
    lEdges:  Array.from({ length: rows - 1 }, (_, r) => Array(r + 1).fill(null)),
    rEdges:  Array.from({ length: rows - 1 }, (_, r) => Array(r + 1).fill(null)),
    upTri:   Array.from({ length: rows - 1 }, (_, r) => Array(r + 1).fill(null)),
    downTri: Array.from({ length: rows - 1 }, (_, r) => Array(r).fill(null)),
    scores:  { player1: 0, player2: 0 },
    currentPlayer: 'player1',
    gameOver: false,
  };
}

function inBounds(rows, r, c) {
  return r >= 0 && r < rows && c >= 0 && c <= r;
}

function getEdge({ hEdges, lEdges, rEdges }, r1, c1, r2, c2) {
  if (r1 === r2) return hEdges[r1][Math.min(c1, c2)];
  const [rT, cT, , cB] = r1 < r2 ? [r1, c1, r2, c2] : [r2, c2, r1, c1];
  return cB === cT ? lEdges[rT][cT] : rEdges[rT][cT];
}

function setEdge(hEdges, lEdges, rEdges, r1, c1, r2, c2, val) {
  if (r1 === r2) { hEdges[r1][Math.min(c1, c2)] = val; return; }
  const [rT, cT, , cB] = r1 < r2 ? [r1, c1, r2, c2] : [r2, c2, r1, c1];
  if (cB === cT) lEdges[rT][cT] = val;
  else           rEdges[rT][cT] = val;
}

function isAdjacent(rows, r1, c1, r2, c2) {
  if (!inBounds(rows, r1, c1) || !inBounds(rows, r2, c2)) return false;
  if (r1 === r2) return Math.abs(c1 - c2) === 1;
  const [rT, cT, rB, cB] = r1 < r2 ? [r1, c1, r2, c2] : [r2, c2, r1, c1];
  if (rB !== rT + 1) return false;
  return cB === cT || cB === cT + 1;
}

export function isValidMove(state, r1, c1, r2, c2) {
  return isAdjacent(state.rows, r1, c1, r2, c2) && getEdge(state, r1, c1, r2, c2) === null;
}

// The at-most-2 triangles that share the given edge
function adjacentTriangles(rows, r1, c1, r2, c2) {
  const tris = [];
  if (r1 === r2) {
    const r = r1, c = Math.min(c1, c2);
    if (r > 0)          tris.push({ type: 'up',   row: r - 1, col: c });
    if (r <= rows - 2)  tris.push({ type: 'down', row: r,     col: c });
  } else {
    const [rT, cT, , cB] = r1 < r2 ? [r1, c1, r2, c2] : [r2, c2, r1, c1];
    tris.push({ type: 'up', row: rT, col: cT });
    if (cB === cT) {
      if (cT > 0)  tris.push({ type: 'down', row: rT, col: cT - 1 });
    } else {
      if (cT < rT) tris.push({ type: 'down', row: rT, col: cT });
    }
  }
  return tris;
}

// upTri[r][c]   edges: lEdges[r][c], rEdges[r][c], hEdges[r+1][c]
// downTri[r][c] edges: hEdges[r][c], lEdges[r][c+1], rEdges[r][c]
function isTriComplete(hEdges, lEdges, rEdges, type, row, col) {
  if (type === 'up') {
    return lEdges[row][col]     !== null &&
           rEdges[row][col]     !== null &&
           hEdges[row + 1][col] !== null;
  }
  return hEdges[row][col]     !== null &&
         lEdges[row][col + 1] !== null &&
         rEdges[row][col]     !== null;
}

export function getNeighbors(rows, r, c) {
  const nb = [];
  if (c > 0)                nb.push([r, c - 1]);
  if (c < r)                nb.push([r, c + 1]);
  if (r < rows - 1)       { nb.push([r + 1, c]); nb.push([r + 1, c + 1]); }
  if (r > 0 && c < r)       nb.push([r - 1, c]);
  if (r > 0 && c > 0)       nb.push([r - 1, c - 1]);
  return nb;
}

export function validSecondPoints(state, r, c) {
  return getNeighbors(state.rows, r, c)
    .filter(([nr, nc]) => isValidMove(state, r, c, nr, nc))
    .map(([nr, nc]) => ({ row: nr, col: nc }));
}

export function isValidFirstPoint(state, r, c) {
  return validSecondPoints(state, r, c).length > 0;
}

export function hasAnyValidMove(state) {
  for (let r = 0; r < state.rows; r++)
    for (let c = 0; c <= r; c++)
      if (isValidFirstPoint(state, r, c)) return true;
  return false;
}

export function makeMove(state, r1, c1, r2, c2) {
  if (!isValidMove(state, r1, c1, r2, c2)) return null;
  const player = state.currentPlayer;

  const newDots = state.dots.map(row => [...row]);
  if (newDots[r1][c1] === null) newDots[r1][c1] = player;
  if (newDots[r2][c2] === null) newDots[r2][c2] = player;

  const newH = state.hEdges.map(row => [...row]);
  const newL = state.lEdges.map(row => [...row]);
  const newR = state.rEdges.map(row => [...row]);
  setEdge(newH, newL, newR, r1, c1, r2, c2, player);

  const newUp   = state.upTri.map(row => [...row]);
  const newDown = state.downTri.map(row => [...row]);
  let gained = 0;

  for (const { type, row, col } of adjacentTriangles(state.rows, r1, c1, r2, c2)) {
    const arr = type === 'up' ? newUp : newDown;
    if (arr[row][col] !== null) continue;
    if (isTriComplete(newH, newL, newR, type, row, col)) {
      arr[row][col] = player;
      gained++;
    }
  }

  const newScores = { ...state.scores, [player]: state.scores[player] + gained };
  const next = gained > 0 ? player : (player === 'player1' ? 'player2' : 'player1');
  const newState = {
    rows: state.rows,
    dots: newDots, hEdges: newH, lEdges: newL, rEdges: newR,
    upTri: newUp, downTri: newDown,
    scores: newScores, currentPlayer: next, gameOver: false,
  };
  newState.gameOver = !hasAnyValidMove(newState);
  return newState;
}
