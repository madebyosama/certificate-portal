# SafQual Training Center Portal

A full-stack training center management portal built with **Next.js 14**, **Supabase**, and **TypeScript** — no Tailwind, pure custom CSS.

## Features

- 🔐 **Authentication** — Email/password login with captcha
- 📊 **Dashboard** — KYC status, account stats, deposit balance
- 📋 **Course Management** — Create courses, view reference numbers, manage status
- 👤 **Candidate Management** — Add candidates with marks, assessment results, and status
- 💳 **Purchase Flow** — Buy course packs via Deposit Account or Stripe
- 👥 **Trainers** — Add/manage trainers per ATP
- 🧾 **Invoices** — View course and other invoices
- 💰 **Transactions** — Full transaction history with balance tracking
- 🏦 **Deposits** — Request deposits, track approval status
- 🎓 **Certificates** — Download branded PDF certificates with unique IDs (per-ATP sequence: `{ATP_NO}-CRT-000001` …)
- 📦 **Hard-Copy Orders** — Order physical certificates with delivery address, subtotal + delivery + tax payment, and order history
- 🔎 **Student Search** — Search students by name, email, country, serial, certificate no, or status

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Custom CSS (no Tailwind) |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Supabase SSR cookies |

---

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the **SQL Editor**, run the following in order:
   - `schema.sql` — base tables and triggers
   - `admin-migration.sql` — admin role, support tickets, announcements
   - `support-messages-migration.sql` — support ticket threading
   - `certificate-migration.sql` — certificate numbering, hard-copy orders, and pricing settings
   - `deposit-approval-migration.sql` — atomic `approve_deposit` RPC used by the admin deposit page
3. Copy your Project URL and Anon Key from **Settings → API**

### Certificate pricing (admin)

Hard-copy certificate prices are stored in the `app_settings` table:

| Key | Default | What it controls |
|---|---|---|
| `certificate_hardcopy_price` | `15.00` | Price of the physical certificate (USD) |
| `certificate_delivery_price` | `8.00` | Flat delivery / shipping fee (USD) |
| `certificate_tax_rate` | `0.05` | Tax rate as decimal (0.05 = 5%) |

To change a price, run e.g. `update app_settings set value = 20.00 where key = 'certificate_hardcopy_price';` in the Supabase SQL editor.

### Certificate number format

Each certificate gets a unique ID per ATP, using `{ATP_NO}-CRT-{6-digit-seq}`. The sequence starts at `000001` for each ATP and increments atomically via the `next_cert_seq()` Postgres function — so a centre with ATP `ATP-20251108-1234` will issue `ATP-20251108-1234-CRT-000001`, `…-CRT-000002`, and so on. The number is assigned the first time a user downloads the certificate (or orders a hard copy) for that candidate, and is then locked — re-downloading reuses the same number.

### 2. Install & Configure

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and Anon Key
```

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Create First User

1. Go to your Supabase dashboard → **Authentication → Users**
2. Click "Add User" and create a user with email & password
3. The `handle_new_user` trigger will auto-create their profile
4. Optionally, set `kyc_verified = true` and a `deposit_balance` in the `profiles` table for testing

---

## Project Structure

```
src/
├── app/
│   ├── login/           # Login page
│   ├── dashboard/       # Dashboard with stats
│   ├── courses/
│   │   ├── page.tsx         # Courses list
│   │   ├── create/          # Create course form
│   │   └── [id]/
│   │       ├── page.tsx         # Course detail + candidates
│   │       ├── candidates/      # Add candidates form
│   │       └── purchase/        # Purchase flow
│   ├── trainers/        # Trainer management
│   ├── invoices/        # Invoice list
│   ├── other-invoices/  # Other invoices
│   ├── transactions/    # Transaction history
│   └── deposit/         # Deposit management
├── components/
│   ├── AppLayout.tsx    # Layout shell
│   ├── Sidebar.tsx      # Navigation sidebar
│   └── Header.tsx       # Top header
├── lib/
│   ├── types.ts         # TypeScript interfaces
│   └── supabase/
│       ├── client.ts    # Browser client
│       └── server.ts    # Server client
└── styles/
    └── globals.css      # All styles (custom CSS, no Tailwind)
```

---

## Database Schema

| Table | Description |
|---|---|
| `profiles` | ATP user profiles, KYC status, deposit balance |
| `course_types` | Predefined course catalog |
| `trainers` | Trainers per ATP |
| `courses` | Course instances (reference numbers) |
| `candidates` | Candidates per course with marks |
| `invoices` | Course purchase invoices |
| `other_invoices` | Non-course invoices |
| `transactions` | Deposit/debit ledger |
| `deposits` | Deposit requests |

All tables have **Row Level Security (RLS)** — users only see their own data.

---

## Customization

- **Add more course types**: Insert into `course_types` table
- **KYC verification**: Set `kyc_verified = true` in `profiles` via admin
- **Stripe integration**: Replace the mock in `PurchaseForm.tsx` with `@stripe/stripe-js`
- **Email notifications**: Add Supabase Edge Functions triggered by DB events
