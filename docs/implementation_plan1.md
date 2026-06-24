# Implementation Plan - Red Fortress Board Game

We will build **Red Fortress**, a web-based version of a classic board game (similar in mechanics to Alhambra) using a modern, reactive stack.

## Architecture Overview

```mermaid
graph TD
    subgraph Client (React + TS)
        UI[Game UI / Board] <--> Hook[useGameSocket Hook]
        Hook <--> WSClient[WebSocket Client]
        DnD[Drag & Drop Grid] --> UI
    end
    subgraph Server (Node.js + TS)
        WSServer[WebSocket Server] <--> Mgr[Game Manager]
        Mgr <--> Rooms[Game Rooms]
        Rooms <--> Logic[Game Engine]
        Rooms <--> AI[AI Bot Controller]
    end
    WSClient <==>|Real-time state & actions| WSServer
```

---

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions & Rules Validation:**
> 1. **Technology Stack:** We propose a unified **TypeScript** stack:
>    - **Backend:** Node.js + Express + `ws` library (WebSocket) written in TypeScript.
>    - **Frontend:** Vite + React + TypeScript + Vanilla CSS (No Tailwind CSS by default, unless requested).
> 2. **Tile Placement Rules:** We will implement adjacency validation:
>    - A newly bought building must be placed adjacent (sharing a horizontal/vertical edge) to a previously placed tile.
>    - Tiles cannot overlap.
>    - No rotation will be required unless you wish to add a tile-rotation mechanic. Let us know if you want tiles to have specific walls/gates like *Alhambra* that must align.
> 3. **Building Market:** We will offer a market showing 4 random building tiles, each assigned a random currency and cost (e.g. 2-15). Players pay using money cards matching the currency.
> 4. **Computer Players:** AI players will run server-side. On their turn, they will compute an action (e.g., draw money, buy a tile if affordable, or rearrange a tile) and commit it after a short delay (e.g., 1000ms) to simulate real-time thought.

---

## Open Questions

> [!WARNING]
> **Please clarify these aspects of the gameplay:**
> 1. **Card Draw Details:** When a player collects money, do they draw a random card from the face-down pile, or is there a face-up "money market" of cards they can choose from?
> 2. **Rearrange Tile Rules:** When a player chooses to rearrange a tile, can they move any tile from their board back to their reserve, or swap it with another, as long as connectivity to the Fountain is maintained?
> 3. **Tile Reserve:** Do players have a "Reserve" space where they can store purchased tiles before placing them on their board?

---

## Proposed Changes

We will create a fresh project layout with `frontend/` and `backend/` directories.

### [NEW] Backend Component

#### [NEW] [package.json](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/package.json)
Contains backend dependencies: `ws`, `express`, `typescript`, `ts-node-dev`, and `@types/ws`.

#### [NEW] [tsconfig.json](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/tsconfig.json)
Configures TypeScript for compilation to Node.js targets.

#### [NEW] [src/types.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/src/types.ts)
Shared interfaces for `Player`, `Card`, `Tile`, `Board`, `GameState`, and WebSocket action messages.

#### [NEW] [src/game/GameLogic.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/src/game/GameLogic.ts)
Core board game rules. Deals initial hand, maintains building market, handles tile placements, checks for adjacency/validation, and ends game when the money deck is empty.

#### [NEW] [src/game/AIPlayer.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/src/game/AIPlayer.ts)
Bot logic decision engine:
- If a high-value building is affordable, buy it and auto-place it at the first valid adjacent grid spot.
- Otherwise, draw a money card.

#### [NEW] [src/game/GameRoom.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/src/game/GameRoom.ts)
Manages connection sockets for a specific lobby. Dispatches events, processes incoming player actions, runs computer player turns, and handles chat logs.

#### [NEW] [src/game/GameManager.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/src/game/GameManager.ts)
Lobby registry. Handles room creation (`createGame`), join requests (`joinGame`), and garbage collection of inactive rooms.

#### [NEW] [src/server.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/backend/src/server.ts)
Main HTTP server and WebSocket upgrade handler.

---

### [NEW] Frontend Component

#### [NEW] [package.json](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/package.json)
Vite dependencies, React, Lucide Icons (for UI decorations), and TypeScript.

#### [NEW] [vite.config.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/vite.config.ts)
Vite configurations, setting up proxy for dev mode backend if needed.

#### [NEW] [src/index.css](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/index.css)
Premium CSS layout with custom scrollbars, dark medieval theme, glassmorphism containers, smooth animations, and high contrast typography.

#### [NEW] [src/App.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/App.tsx)
Router / state controller: switches between Lobby/Join page and active Game screen.

#### [NEW] [src/hooks/useGameSocket.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/hooks/useGameSocket.ts)
Reactive WebSocket hook to communicate actions and listen to state updates from the server.

#### [NEW] [src/components/Lobby.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/components/Lobby.tsx)
Game Setup view: select number of human/AI players, select animal avatar, create/join game lobby.

#### [NEW] [src/components/GameBoard.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/components/GameBoard.tsx)
Interactive player board:
- Render tiles placed on grid relative to Fountain (0,0).
- Toggle grid view on/off.
- Drag-and-drop zone to place purchased tiles.

#### [NEW] [src/components/TileMarket.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/components/TileMarket.tsx)
Display building cards for purchase, styling them based on cost and matching currency color.

#### [NEW] [src/components/CardDeck.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/components/CardDeck.tsx)
Display remaining deck size and active player's hand.

#### [NEW] [src/components/PlayerBar.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Red%20Fortress/frontend/src/components/PlayerBar.tsx)
Bottom button bar with player animal avatars showing active turns, current scores, and board sizes.

---

## Verification Plan

### Automated Tests
- Write Jest or Vitest tests for:
  - `GameLogic.ts` functions (deck shuffling, deck size, card drawing).
  - Tile adjacency checks.
  - Price verification.
- Run tests via `npm run test` or `vitest run`.

### Manual Verification
- Launch server and two client browser instances side by side.
- Connect one instance as room host (Bear) and another as joiner (Gorilla).
- Add 2 AI bots to fill the game.
- Take turns: draw cards, purchase tiles, drag/drop tiles onto the board.
- Check that the grid toggles, computer players act automatically, and the game correctly ends when cards run out.
