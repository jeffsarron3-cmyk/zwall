# ZODL Web Wallet — Claude Instructions

## Project Overview
Web-based Zcash (ZEC) wallet inspired by the ZODL/ZASHI mobile app.
**Stack:** React 18 + React Router 6 + Vite 6 + plain CSS (no UI library, no TypeScript)

## Commands
```bash
npm run dev      # Start dev server (Vite HMR)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

## Architecture

### Routing (`src/App.jsx`)
HashRouter (`#/`) for static deployment compatibility.
- `/` — Welcome (full-screen, no sidebar)
- `/restore` — 24-word seed phrase recovery (no sidebar)
- `/dashboard`, `/receive`, `/send`, `/pay`, `/swap`, `/settings` — Main app (wrapped in `AppLayout` with sidebar)

### State Management (`src/context/WalletContext.jsx`)
Single context provider, accessed via `useWallet()` hook. No Redux/Zustand.

Key state:
- `balanceVisible` — toggle balance visibility
- `syncProgress` / `syncing` — blockchain sync simulation (auto-increments)
- `toast` — notification system (auto-dismiss 2.5s)

Methods: `toggleBalance()`, `showToast(message, type)`, `copyToClipboard(text, label)`

### Mock Data (`src/data/mock.js`)
No backend — all data is hardcoded:
- `WALLET` — single wallet (balance, ZEC price, shielded/transparent addresses)
- `TRANSACTIONS` — 6 sample transactions
- `ASSETS` — 9 crypto assets (BTC, ETH, SOL, USDC, USDT, etc.)
- `SEED_WORDS` — 24 BIP39 demo words

## File Structure
```
src/
├── main.jsx                 # React entry point
├── App.jsx                  # Router + WalletProvider
├── components/
│   ├── AppLayout.jsx        # Sidebar + main content wrapper + Toast
│   ├── Sidebar.jsx          # Left nav (240px fixed)
│   ├── Icons.jsx            # 22 SVG icons (Heroicons-style)
│   ├── Modal.jsx            # Reusable dialog (overlay click / Escape to close)
│   └── QRCodeDisplay.jsx    # Demo-only QR (non-scannable, visual only)
├── context/
│   └── WalletContext.jsx    # Global state
├── data/
│   └── mock.js              # All mock data
├── pages/
│   ├── Welcome.jsx          # Splash / onboarding
│   ├── Restore.jsx          # Seed phrase entry (6×4 grid, paste support)
│   ├── Dashboard.jsx        # Balance, 4 action buttons, tx list, sync banner
│   ├── Receive.jsx          # Shielded + transparent address cards + QR modal
│   ├── Send.jsx             # Send ZEC with validation + review modal
│   ├── Pay.jsx              # CrossPay: ZEC → other chain crypto
│   └── Swap.jsx             # Swap: other crypto → ZEC
└── styles/
    └── global.css           # Design system (CSS vars, all component styles)
```

## Design System (`src/styles/global.css`)

### CSS Variables (key tokens)
```css
--bg-primary:   #181818   /* page background */
--bg-secondary: #222222   /* subtle sections */
--bg-card:      #262626   /* cards */
--bg-input:     #2e2e2e   /* inputs */
--accent:       #6B45E8   /* purple — shielded/privacy/CTA */
--accent-light: #8B69FF
--error:        #E84040
--success:      #3DD68C
--warning:      #F5A623
--text-primary: #FFFFFF
--text-secondary: #8A8A8A
--sidebar-width: 240px
--radius-sm: 8px  --radius-md: 12px  --radius-lg: 16px  --radius-xl: 20px
--transition: 0.18s ease
```

### Key CSS Classes
- Layout: `.app-shell`, `.main-content`, `.page` (max 680px), `.page-wide` (max 900px)
- Cards: `.card`, `.card-shielded` (purple tint)
- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-accent`
- Inputs: `.input-group`, `.input-wrap`, `.input-label`, `.input-error`
- Balance: `.balance-amount` (52px bold), `.balance-symbol`, `.balance-usd`
- Tx list: `.tx-list`, `.tx-item`, `.tx-icon`, `.tx-memo`
- Actions: `.action-grid`, `.action-btn` (2×2 grid)
- Badges: `.badge`, `.badge-purple`, `.badge-gray`
- Seed grid: `.seed-grid` (6 cols), `.seed-cell`, `.seed-input`
- Toast: `.toast` (fixed bottom-center, auto-dismiss)
- Modal: `.modal-overlay`, `.modal`, `.modal-header`, `.modal-body`, `.modal-footer`
- Animations: `fadeIn`, `slideUp`, `spin`, `pulse`

### Fonts
- **Inter** — UI text (loaded from Google Fonts)
- **JetBrains Mono** — addresses, seed words, code

## Conventions
- **No TypeScript** — plain `.jsx` files throughout
- **No CSS modules** — single `global.css` for all styles
- **No external UI library** — all components hand-crafted
- **Inline styles only for dynamic values** — e.g. color, width from data; classes for everything else
- **Icons:** All from `Icons.jsx`, accept `size` prop (default 20), use `currentColor`
- **Modals:** Always use `<Modal>` component; manage `showXxxModal` state in the page
- **Validation:** Inline below inputs; `input-error` class on wrapper, error text in `.error-text`
- **Toasts:** Always via `showToast(message, type)` from `useWallet()`
- **Copy:** Always via `copyToClipboard(text, label)` from `useWallet()`
- **Addresses:** Shielded starts with `u1...`, transparent with `t1...`

## Pages Detail

### Dashboard (`/dashboard`)
Balance card (gradient) → 4-action grid → sync banner → tx list.
Eye toggle on balance calls `toggleBalance()`. Action buttons navigate to respective routes.

### Receive (`/receive`)
Two address cards (shielded purple, transparent gray). QR modal state: `showQR`.
Info toggles per card: `showShieldedInfo`, `showTransparentInfo`.

### Send (`/send`)
Fields: recipient address, amount (ZEC + live USD), optional encrypted message (512 char).
Validation: address format, insufficient funds. Review modal → confirm sends toast + navigate to dashboard.

### Pay (`/pay`)
CrossPay: user selects destination asset (modal), enters amount, gets estimated ZEC cost.
Asset modal has search. Slippage pill (visual only, 1% default).

### Swap (`/swap`)
FROM (any asset) → TO (ZEC fixed). Quote flow: enter amount → "Get a Quote" (1.2s delay) → "Confirm Swap" → toast.
Refund address required. Asset modal same pattern as Pay.

### Restore (`/restore`)
6×4 grid of inputs. Tab/Enter advances cells. Paste distributes words. "Demo fill" populates all 24.
Next button disabled until all 24 filled. Birthday height optional.

## Important Notes
- **QR codes are visual only** — `QRCodeDisplay` generates a fake but consistent pattern; not scannable
- **No real crypto** — fully demo, no wallet SDK integration
- **Sync simulation** — auto-runs in context, increases by 0.4% every 300ms
- **ZEC price** — hardcoded at $0.1193/ZEC in mock.js


curl -L \
--url 'https://zecbook.nownodes.io/api/v2/balancehistory/t1K79TgQbqu74d6rBmsMu2oFEXEwAmdYiT7' \
--header 'api-key: 0c0a515c-e84b-48fc-a4ce-d7e6a0a95e03' \
--header 'Accept: */*'
