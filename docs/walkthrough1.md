# Walkthrough - Red Fortress (Alhambra Game Mechanics)

We have successfully built and verified the **Red Fortress** board game. All the core mechanics of the classic game *Alhambra* are fully implemented and function as designed.

---

## 1. Features Implemented

### Backend Game Engine (`backend/`)
* **Shared Types (`types.ts`)**: Structured states for players, boards, money, buildings, and synchronization actions.
* **GameLogic (`GameLogic.ts`)**:
  * Shuffling and dealing initial card hands (sum >= 20).
  * Building tile pool (54 tiles) with wall attributes.
  * Validation rules for placing tiles (adjacency, wall alignment, reachability DFS from Fountain).
  * Longest Wall search (backtracking DFS path finder over edge corner graphs).
  * scoring majority calculations for three rounds.
* **AI Controller (`AIPlayer.ts`)**: Server-side bot logic that evaluates exact change options, greedy payments, valid grid coordinates, and drafts cards.
* **Lobby & Room Manager (`GameRoom.ts`, `GameManager.ts`)**: Synchronizes clients, schedules computer turns, triggers scoring rounds, and handles chat logging.

### Frontend App (`frontend/`)
* **Socket Connector Hook (`useGameSocket.ts`)**: High-performance React hook mapping events and auto-reconnecting.
* **Medieval parchment CSS UI (`index.css`)**: Premium theme styling featuring custom layout blocks, animated currency cards, glowing player borders, and responsive grid displays.
* **Interactive Board (`GameBoard.tsx`)**: Render cells, dynamically overlay wall borders, toggle background grids, and offer swap/reserve controls.
* **Drafting Markets (`Markets.tsx`)**: Face-up money cards with combined draft sum limit checks (<= 5) and slot-matched currency builders.
* **Lobby Navigator (`Lobby.tsx`, `PlayerBar.tsx`, `PlayerInfo.tsx`)**: Custom avatar selector buttons, logs feed, live chat, and board inspection toggles.

---

## 2. Verification Results

### Automated Unit Tests
All unit tests pass successfully in both test suites:
* **Board Grid Validation**: Validates adjacency, prevents placing misaligned walls, and verifies reachability.
* **Longest Wall DFS**: Successfully finds the longest simple edge path (tested on a sample board setup).
* **Scoring Standings**: Resolves majority counts and splits/awards scores correctly.
* **AI Strategy**: Correctly finds exact change coin subsets, and picks pairs/high cards from the market.

#### Test Execution Summary:
```bash
 RUN  v1.6.1 C:/Users/rikar/OneDrive/Skrivbord/Red Fortress/backend

 ✓ src/__tests__/GameLogic.test.ts  (4 tests) 4ms
 ✓ src/__tests__/AIPlayer.test.ts  (2 tests) 3ms

 Test Files  2 passed (2)
      Tests  6 passed (6)
   Start at  12:48:28
   Duration  489ms (transform 117ms, setup 1ms, collect 144ms, tests 7ms, environment 0ms, prepare 223ms)
```

---

## 3. How to Launch & Play

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   *The server runs on port 4000.*

2. **Start Frontend Web Client**:
   ```bash
   cd frontend
   npm run dev
   ```
   *The web client runs on http://localhost:3000.*

3. **Play**:
   * Open the web client.
   * Input a nickname, pick an animal avatar, and click **Create Game**.
   * Add 2 or more AI bots, then click **Start Game** once the player count is >= 3.
   * On your turn:
     * Toggle **Grid** system ON/OFF.
     * Draft money cards from the market.
     * Pay exact change to buy building tiles and gain extra actions.
     * Drag/place purchased tiles onto your board adjacent to existing tiles with matching borders.
