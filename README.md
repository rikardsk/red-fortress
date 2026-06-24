# Red Fortress 🏰

A premium, real-time multiplayer web adaptation of the classic tactical board game Alhambra. Build the grandest fortress, manage resources across four currencies, construct walls strategically, and compete against humans or AI bots in a medieval-themed aesthetic.

---

## 🚀 Key Features

*   **Real-time Multiplayer & Lobby**: Supports 3–6 players (human and bots). Room hosts can dynamically add or remove AI computer players during setup.
*   **Tactical Board Grid**: Interactive grid where buildings are placed. Integrates connection validation rules (matching adjacent walls/open spaces) and dynamic path checks back to the central starting Fountain.
*   **Dual Marketplaces**:
    *   **Building Market**: Purchase from 4 active building slots, each requiring a specific currency. Individual building walls are rendered dynamically.
    *   **Money Market**: Draft currency cards matching value-based picking limits (e.g., auto-deselecting guards for cards valued $\ge$ 5).
*   **Visual Game Tracker & Timeline**:
    *   **Castle Score Track**: Smoothly animated sliding player chips along a point timeline.
    *   **Deck Progression**: Visual bar tracking cards remaining in the deck and marking the approach of first, second, and final scoring rounds.
    *   **Event Timeline**: Horizontal feed parsing recent actions (Drafts, Purchases, Placements, and Scorings).
*   **Player Chat & Whispers**: Real-time communication system with auto-scrolling log window and private whisper options for strategic negotiation.
*   **Keyboard Shortcuts**: Advanced control binds for high-efficiency gameplay.
*   **Aesthetics**: Glassmorphic dark panel designs with medieval color palettes and customized player wall colors.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React 18 (TypeScript)
*   **Build Tool**: Vite
*   **Styling**: Vanilla CSS (Tailored variables, radial gradients, medieval components)
*   **State & Networking**: WebSocket client hook connecting to backend room server

### Backend
*   **Runtime**: Node.js (TypeScript)
*   **Web Server**: WebSocket (`ws`)
*   **Testing**: Vitest (Unit tests for AI behavior and validation logic)

---

## 📖 Keyboard Shortcuts

Press **`H`** in-game to toggle the Keyboard Shortcuts overlay:

| Key | Action |
| :---: | :--- |
| **`H`** | Toggle Shortcuts Guide (Help) |
| **`X` / `Escape`** | Close Active Modal |
| **`C`** | Toggle Hand Cards Modal |
| **`B`** | Toggle Reserve Buildings Modal |
| **`R`** | Toggle Rules Guide |
| **`S`** | Toggle Settings Menu |
| **`M`** | Toggle Game Menu |
| **`V`** | Toggle Scoreboard Modal |
| **`G`** | Toggle Grid Visibility |
| **`T`** | Toggle Game Timeline |

---

## ⚙️ Setup & Running

### Prerequisites
*   Node.js (v18 or higher)
*   npm

### Quick Start (Windows)
Double-click the batch files in the root folder to start both servers:
1.  Run `start_backend.bat` to launch the WebSocket server (Port `8080`).
2.  Run `start_frontend.bat` to launch the Vite development server (Port `5173`).

### Manual Setup
1.  **Install dependencies**:
    ```bash
    # Root folder, backend, and frontend
    npm install
    cd backend && npm install
    cd ../frontend && npm install
    ```
2.  **Start Backend**:
    ```bash
    cd backend
    npm run dev
    ```
3.  **Start Frontend**:
    ```bash
    cd frontend
    npm run dev
    ```
4.  **Run Tests (Backend)**:
    ```bash
    cd backend
    npm run test
    ```
