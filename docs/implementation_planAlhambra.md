# Implementation Plan - Red Fortress (Alhambra Game Mechanics)

We will build **Red Fortress**, a web-based board game that fully implements the core game mechanics of the classic board game *Alhambra*. It will feature real-time multiplayer support, local AI players, custom wall rendering and placement verification, and a premium dark-themed interface.

---

## Game Rules & Mechanics (Alhambra Aligned)

### 1. Currency & Markets
* **Money Deck**: 108 cards (4 currencies: Denar, Dirham, Ducats, Florins; values 1-9; 3 copies of each).
* **Money Market**: 4 face-up money cards. A player can spend their action to take money:
  * Any single money card of any value.
  * OR multiple cards if their sum is 5 or less.
* **Building Market**: 4 slots, each dedicated to one of the 4 currencies (Denar, Dirham, Ducat, Florin). A random building tile is placed in each slot.
* **Buying Actions**:
  * To buy a building, a player must pay at least its cost in the slot's matching currency. No change is given.
  * **Exact Change Rule**: If the player pays the *exact* cost, they get an **extra action** immediately. They can chain multiple purchases or money draws on the same turn.
  * Purchased tiles can be placed immediately onto the player's board (for free) or stored in their **Reserve**.
* **Replenishment**: Markets (money and building) are replenished only at the end of a player's complete turn (after all their chained actions are completed).

### 2. Tile Placement & Wall Rules
* **Tile Pool**: 54 tiles across 6 building types: Chamber, Garden, Manor, Mezzanine, Pavilion, and Tower.
* **Walls**: Tiles programmatically have wall configurations (`north`, `east`, `south`, `west` as booleans). Walls will be visually highlighted as thick dark borders.
* **Placement Rules**:
  * **Adjacency**: A new tile must share at least one edge with a previously placed tile.
  * **Wall Alignment**: Adjacent edges must match: wall-to-wall or open-to-open. A wall cannot touch an open edge.
  * **Connectivity**: Every tile on the board must be reachable from the starting tile (the Fountain at coordinate `0,0`) through a path of open edges (i.e. without crossing any walls).
  * **Orientation**: Tiles cannot be rotated. They must be placed in their default orientation.
* **Reserve & Redesign**:
  * Players have a **Reserve** shelf.
  * A player can spend an action to perform one of three Redesign actions:
    1. Place a tile from the Reserve onto their board.
    2. Move a tile from their board to the Reserve (remaining board must still be valid & fully connected).
    3. Swap a tile on their board with a tile in their Reserve (the new board state must be valid).

### 3. Scoring & End Game
* **Scoring Cards**: Two scoring cards are shuffled into the money deck (roughly at the 1/3 and 2/3 marks).
* **Scoring Rounds**:
  * **Round 1 (First Scoring Card)**: Points awarded to the player with the *most* tiles of each building type:
    * Pavilion: 1 pt | Manor: 2 pts | Mezzanine: 3 pts | Chamber: 4 pts | Garden: 5 pts | Tower: 6 pts
  * **Round 2 (Second Scoring Card)**: Points awarded to 1st and 2nd place:
    * Pavilion: 8/1 | Manor: 9/2 | Mezzanine: 10/3 | Chamber: 11/4 | Garden: 12/5 | Tower: 13/6
  * **Round 3 (End of Game)**: Points awarded to 1st, 2nd, and 3rd place:
    * Pavilion: 16/8/1 | Manor: 17/9/2 | Mezzanine: 18/10/3 | Chamber: 19/11/4 | Garden: 20/12/5 | Tower: 21/13/6
  * **Longest Wall**: In all rounds, each player gets 1 point per segment of their longest continuous wall on the outer edges/internal walls of their Alhambra.
* **End Game Trigger**: The game ends when the building tile pool is depleted and the building market cannot be fully replenished to 4 tiles.

---

## Technical Stack & Architecture

We will implement a clean client-server architecture in **TypeScript** using WebSockets for real-time state synchronization.

```mermaid
graph TD
    subgraph Client (Vite + React + TS)
        UI[Game UI / Board Grid] <--> Hook[useGameSocket Hook]
        Hook <--> WSClient[WebSocket Client]
        DnD[Drag & Drop System] --> UI
    end
    subgraph Server (Node.js + TS)
        WSServer[WebSocket Server] <--> Mgr[Game Manager]
        Mgr <--> Rooms[Game Rooms]
        Rooms <--> Engine[Game Engine]
        Rooms <--> AI[AI Bot Controller]
    end
    WSClient <==>|Real-time actions & state sync| WSServer
```

* **Backend**: Node.js + Express + `ws` library (WebSocket) written in TypeScript.
* **Frontend**: Vite + React + TypeScript + Vanilla CSS (Aesthetic glassmorphism and animations).
* **AI Bots**: Computed server-side. Bots follow exact rules (evaluate exact change opportunities, valid placements, and reserve management).

---

## User Review Required

> [!IMPORTANT]
> **Key Decisions for Approval:**
> 1. **Visual Wall Indication:** Since we only have a single asset per building type, we will draw wall boundaries dynamically as thick medieval borders (red/gold or dark slate) around the tile elements based on their wall properties.
> 2. **Longest Wall Scoring Algorithm:** We will implement a depth-first search (DFS) over the grid edges to find the longest continuous wall segment path for scoring.
> 3. **Rule Set Confirmation:** This fully replicates the standard Alhambra rules. Let us know if you want any custom rule adjustments (e.g. allowing tile rotation or playing without scoring cards).

---

## Proposed Changes

We will create a multi-package folder structure:
* `backend/` - The Node.js WebSocket game server.
* `frontend/` - The React Vite client app.

### Backend Component

#### [NEW] [package.json](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/package.json)
Configures TypeScript dependencies, `ws` (WebSockets), `cors`, `express`, and dev-scripts like `ts-node-dev`.

#### [NEW] [tsconfig.json](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/tsconfig.json)
Configures compilation settings for Node.js environment.

#### [NEW] [src/types.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/src/types.ts)
Definitions of `GameState`, `Player`, `Card`, `Tile`, `BoardTile`, `Action`, and WebSocket message structures.

#### [NEW] [src/game/GameLogic.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/src/game/GameLogic.ts)
Core engine containing:
* Deck & tile bag initialization.
* Turn handling (tracking actions left, exact change detections).
* Validation of tile placement (adjacency, wall alignment matching, and connectivity from Fountain).
* Rearrange actions logic (place, reserve, swap).
* Scoring calculation (building majorities, tie resolution, and longest wall DFS traversal).

#### [NEW] [src/game/AIPlayer.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/src/game/AIPlayer.ts)
AI decision logic:
* Checks building market for exact change options they can afford.
* If affordable, buys it, and attempts to find a valid spot on their board or places it in the Reserve.
* If no exact change, checks if they can afford any building.
* Checks if they can place a tile from the Reserve.
* Otherwise, selects optimal money cards.

#### [NEW] [src/game/GameRoom.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/src/game/GameRoom.ts)
Manages the room session, client connections, broadcasting game states, handling player/bot actions, and chat logs.

#### [NEW] [src/game/GameManager.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/src/game/GameManager.ts)
Registry for lobby creation and player joining.

#### [NEW] [src/server.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/src/server.ts)
Express app starting the HTTP server and upgrading connections to WebSocket.

---

### Frontend Component

#### [NEW] [package.json](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/package.json)
Configures Vite, React, Lucide Icons, and TypeScript.

#### [NEW] [vite.config.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/vite.config.ts)
Standard Vite config with dev-server port configuration.

#### [NEW] [src/index.css](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/index.css)
Thematic styles: dark parchment paper backgrounds, golden medieval highlights, glowing action indicators, and responsive grid layouts.

#### [NEW] [src/App.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/App.tsx)
Handles active screens: Main Lobby (Create/Join) and Game Board.

#### [NEW] [src/hooks/useGameSocket.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/hooks/useGameSocket.ts)
Main hook managing socket connection, reconnect attempts, and dispatching/receiving states.

#### [NEW] [src/components/Lobby.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/components/Lobby.tsx)
Let's players pick their animal avatar, select AI counts, and start the game room.

#### [NEW] [src/components/GameBoard.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/components/GameBoard.tsx)
Primary view:
* Main grid showing player's current board with zoom/pan and togglable helper grid lines.
* Highlights valid placement coordinates during building purchase or Reserve placement.
* Implements HTML5 Drag & Drop (or click-to-place) for tiles.

#### [NEW] [src/components/Markets.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/components/Markets.tsx)
Displays the 4 face-up money cards (with selectable checkmarks to take multiple totaling <= 5) and the 4 building market slots showing tiles and cost/currency.

#### [NEW] [src/components/PlayerInfo.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/components/PlayerInfo.tsx)
Sidebar or panels detailing scores, hand cards, reserve tiles, and action histories.

#### [NEW] [src/components/PlayerBar.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/components/PlayerBar.tsx)
Bottom avatar navigation list. Clicking on an avatar lets you inspect other players' boards. Highlight active turn and scoring thresholds.

---

## Verification Plan

### Automated Tests
* Create unit tests for:
  * Adjacency & wall matching rules.
  * Connectivity check (DFS/BFS reachability from Fountain).
  * Longest wall detection algorithm.
  * Exact change action chain validation.
* Run tests with Vitest on frontend or ts-node/mocha on backend.

### Manual Verification
* Run clients in side-by-side browser sessions to test turn handoffs, board inspection, exact change multi-turns, and scoring updates.
