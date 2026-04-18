# Dots & Triangles — Project Guide

## Running the project

```bash
npm install
npm run dev      # serves at http://localhost:3000
```

## Architecture

Single-page React app bundled by Vite. All game logic is pure JS; the board is SVG.

```
index.html          Vite entry point
src/
  main.jsx          App shell, NewGameScreen, GameScreen
  GameBoard.jsx     SVG board renderer (dots, edges, triangle fills, hover/selection)
  game.js           Pure game logic (no React)
  app.css           Styles
.github/workflows/
  deploy.yml        GitHub Pages deploy + games-hub dispatch trigger
```

## Game rules

- **Board**: equilateral triangular grid. Row `r` has `r+1` dots (row 0 = apex, one dot; row `rows-1` = base). Configurable from 4 to 10 rows; default is 8.
- **Dots**: each dot is either free (uncolored) or colored with one of the two players' colors.
- **Turns**: players alternate. A player keeps their turn if they complete at least one triangle.
- **Move**: select any two *adjacent* dots and draw an edge between them, provided no edge already exists there. Three edge types exist:
  - **Horizontal**: `(r,c) ↔ (r,c+1)`
  - **Left-diagonal**: `(r,c) ↔ (r+1,c)`
  - **Right-diagonal**: `(r,c) ↔ (r+1,c+1)`
- **After a move**:
  1. Any free dot in the selected pair is colored with the current player's color.
  2. An edge is drawn in the current player's color.
  3. Each newly completed triangle (both △ and ▽ types) is filled with the player's color and added to their score.
  4. Completing one or more triangles grants the player an additional turn.
- **Triangle types**:
  - **Upward △** `upTri[r][c]`: apex `(r,c)`, base `(r+1,c)–(r+1,c+1)` — edges: lEdge[r][c], rEdge[r][c], hEdge[r+1][c]
  - **Downward ▽** `downTri[r][c]`: base `(r,c)–(r,c+1)`, apex `(r+1,c+1)` — edges: hEdge[r][c], lEdge[r][c+1], rEdge[r][c]
  - An `n`-row board has `(n-1)²` triangles total (e.g. 8 rows → 49 triangles).
- **Game over**: when no valid move remains (all adjacent dot pairs already have an edge).
- **Winner**: the player with the most triangles.

## Session log — initial build (2026-04-17)

### What was built

1. **GitHub repo** created at `git@github.com:IggShaman/dots_and_triangles.git`.
2. **Scaffolded from dots_and_boxes**: copied source files, updated package name, vite base path, and page title.
3. **Full triangular game implementation**:
   - `src/game.js` — `initGameState(rows)`, `makeMove`, `isValidMove`, `validSecondPoints`, `hasAnyValidMove`, `getNeighbors`. Board size stored in game state so all functions read it from there; no module-level constant.
   - `src/GameBoard.jsx` — SVG board: ghost grid (all 3 edge types), stripe-filled triangle polygons, colored edges, dot selection/hover highlights and preview edge. Board dimensions computed from `gameState.rows`.
   - `src/main.jsx` — `NewGameScreen` with a row-count picker (4–10, default 8) and `GameScreen` with score header ("tri" unit) and turn banner.
4. **Configurable board size** added to new-game screen via a Blueprint `ButtonGroup`.
5. **GitHub Pages deploy workflow** copied from dots_and_boxes, updated payload to reference `dots_and_triangles`.

### Key data structures

| Array | Dimensions | Represents |
|-------|-----------|------------|
| `dots[r][c]` | `rows × (r+1)` | dot owner |
| `hEdges[r][c]` | `rows × r` | horizontal edges |
| `lEdges[r][c]` | `(rows-1) × (r+1)` | left-diagonal edges |
| `rEdges[r][c]` | `(rows-1) × (r+1)` | right-diagonal edges |
| `upTri[r][c]` | `(rows-1) × (r+1)` | upward triangle owners |
| `downTri[r][c]` | `(rows-1) × r` | downward triangle owners |
