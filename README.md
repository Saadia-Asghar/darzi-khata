# ✂️ Darzi Khata — درزی کھاتہ

**A complete, offline-first Pakistani tailor shop management web app.**  
Built with React + Vite. 100% runs in the browser — no server, no database, no internet required after first load.

> 🇵🇰 Bilingual: English + Urdu (Nastaliq) throughout

---

## 🔴 Live Demo

| Item | Detail |
|------|--------|
| **Demo URL** | _(publish on Replit to get link)_ |
| **Demo PIN** | `1234` _(set via Settings → PIN Lock)_ |
| **Demo Data** | 10 pre-loaded orders (DK-001 → DK-010), 3 karigars |
| **Demo Shop** | Al-Madina Tailors / المدینہ ٹیلرز |

> First load shows 10 realistic sample orders including overdue, urgent, stitching, ready, and delivered states — so you can explore every feature immediately.

---

## ✨ Features

### 📋 Order Management
- **New / Edit / Delete orders** — multi-step form: Customer → Measurements → Style → Billing
- **DK-001 serial numbers** — auto-incrementing per shop (`darzi-khata-serial-counter` key)
- **Order status** — Pending → Stitching → Ready → Delivered (inline dropdown)
- **Urgent flag** — red URGENT badge, special sorting
- **Suit count** + fabric description per order

### 📏 Measurements
- 11-point measurement set — Kameez + Shalwar/Pajama (in inches)
- Stepper buttons (± 0.5) for fast entry
- **Named measurement templates** — save/load frequent customer sizes
- **Copy measurements** from customer history into new order

### 🎨 Style Specifications
- Collar (Gala), Daman, Pocket, Cuff type selects
- Special notes (free text)

### 💰 Billing
- Total silai / Advance / **Baqi (balance)** auto-calculated
- **Quick payment update** — tap wallet icon on any card with baqi > 0
- Full billing summary on receipt

### 🧾 Digital Parchi (Receipt)
- Beautiful printable receipt with shop branding
- Serial number on receipt
- **WhatsApp sharing** — pre-formatted message with full measurements + billing
- Copy to clipboard
- Browser print

### 🔐 Login / Logout (PIN Lock)
- Optional 4-digit PIN lock screen with numeric keypad
- Wrong-PIN shake animation
- Session stored in `sessionStorage` (auto-locks when browser/tab closes)
- Logout button in header
- **Demo PIN: `1234`** (set in Settings → PIN Lock after enabling)

### 📊 Statistics & Reporting
- **Stats bar** — Active orders, Due Today/Kal count (with badge), Total Baqi
- **Monthly Earnings modal** — this month totals + 6-month history table
- **Production Work Sheet** — printable table of all active orders grouped: Overdue → Urgent → Regular; includes karigar, status, baqi, notes

### 🚨 Overdue Orders
- Red-bordered section at top of order list
- "Overdue: N din" label in red on each card
- Separate section divider in All tab

### 📅 Due Today / Due Tomorrow Modal
- Tap the "Due Today/Kal" stats card
- Focused view of today + tomorrow deliveries
- Quick WhatsApp + Parchi actions per order

### 👷 Karigar (Worker) Management
- Assign a karigar per order
- **Karigar filter pills** — filter the order list by worker instantly
- Manage karigar list in Settings (add/remove)
- Demo karigars: Ustad Bashir, Ahmed Karigar, Rustam Ustad

### 👥 Customer Directory
- Tap the People icon in header
- All unique customers with: total orders, total silai earned, outstanding baqi, last order date
- Tap any customer → full order history
- Search by name or phone

### 📜 Customer History
- Tap any customer name on an order card
- All past orders for that phone number
- "Copy measurements" into new order

### 🌙 Dark Mode
- Toggle in Settings
- Full dark theme persisted in localStorage

### 💾 Backup & Restore
- Export all orders + settings as JSON
- Restore from JSON backup
- Works offline, no cloud needed

### 📱 PWA / Add to Home Screen
- `manifest.json` with icons + theme color
- Apple + Android home screen meta tags
- Installable from browser: tap "Add to Home Screen"

---

## 🗂️ Data Storage

All data lives in `localStorage` — no backend, no account required:

| Key | Contents |
|-----|----------|
| `darzi-khata-orders` | All orders (JSON array) |
| `darzi-khata-settings` | Shop settings + dark mode + PIN |
| `darzi-khata-templates` | Measurement templates |
| `darzi-khata-karigars` | Karigar name list |
| `darzi-khata-serial-counter` | Last serial number counter |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| UI Primitives | Radix UI (Dialog, etc.) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Fonts | Inter + Noto Nastaliq Urdu (Google Fonts) |
| Routing | Wouter |

---

## 🚀 Running Locally

```bash
# Install dependencies (Node 20+, pnpm)
pnpm install

# Start dev server
pnpm --filter @workspace/darzi-khata run dev

# Type check
cd artifacts/darzi-khata && npx tsc --noEmit
```

The app runs at the port set by the `PORT` env variable (default dev port via Vite).

---

## 📁 Project Structure

```
artifacts/darzi-khata/
├── src/
│   ├── components/
│   │   ├── customer-directory-modal.tsx   # Customer list + search
│   │   ├── customer-history-modal.tsx     # Per-customer order history
│   │   ├── due-today-modal.tsx            # Today/tomorrow deliveries
│   │   ├── earnings-modal.tsx             # Monthly earnings chart
│   │   ├── login-screen.tsx              # PIN keypad lock screen
│   │   ├── order-card.tsx                # Order card with all actions
│   │   ├── order-form.tsx                # Multi-step new/edit form
│   │   ├── payment-update-dialog.tsx     # Quick advance payment update
│   │   ├── receipt-modal.tsx             # Digital parchi / receipt
│   │   ├── settings-modal.tsx            # All settings + PIN + karigar
│   │   ├── stats-bar.tsx                 # Dashboard stats row
│   │   └── work-sheet-modal.tsx          # Printable production sheet
│   ├── hooks/
│   │   ├── use-auth.ts          # PIN session management
│   │   ├── use-karigars.ts      # Worker list (localStorage)
│   │   ├── use-orders.ts        # Order CRUD + demo data
│   │   ├── use-settings.ts      # Shop settings + dark mode + PIN
│   │   └── use-templates.ts     # Measurement templates
│   ├── pages/
│   │   └── dashboard.tsx        # Main app page
│   ├── types/
│   │   └── order.ts             # TypeScript types
│   ├── App.tsx                  # Auth gate + router
│   └── index.css                # Theme + dark mode CSS vars
├── public/
│   ├── manifest.json            # PWA manifest
│   └── favicon.svg              # App icon
└── index.html                   # PWA meta tags
```

---

## 🎯 Demo Account & Data

When you first open the app (fresh browser / cleared localStorage):

**10 demo orders are loaded automatically:**

| Serial | Customer | Status | Karigar | Note |
|--------|----------|--------|---------|------|
| DK-001 | Muhammad Rizwan | Stitching 🔴 URGENT | Ustad Bashir | Due today |
| DK-002 | Tariq Mehmood | Ready ✅ | Ahmed Karigar | Due today |
| DK-003 | Hamza Ali | Stitching | — | 3 days |
| DK-004 | Khalid Hussain | Pending 🚨 Overdue | Rustam Ustad | 3 days late |
| DK-005 | Imran Butt | Pending 🔴 URGENT | Ustad Bashir | 5 days |
| DK-006 | Asif Raza | Delivered ✅ | Ahmed Karigar | Paid in full |
| DK-007 | Naveed Ahmad | Pending | — | 7 days |
| DK-008 | Salman Chaudhry | Stitching 🔴 URGENT | Rustam Ustad | Eid ke liye |
| DK-009 | Farooq Shah | Delivered ✅ | Ustad Bashir | Silk sherwani |
| DK-010 | Zubair Malik | Pending | Ahmed Karigar | 4 suits, 1 size |

**To enable PIN lock with demo PIN:**
1. Open Settings (⚙️ gear icon)
2. Toggle **PIN Lock** on
3. Enter `1234` as PIN, confirm `1234`
4. Tap Save
5. Refresh — PIN keypad appears on load

---

## 📸 Screenshots

_(Add screenshots here after publishing)_

---

## 📄 License

MIT — free to use, modify, and distribute.

---

Made with ❤️ for Pakistani tailors — درزی حضرات کے لیے
