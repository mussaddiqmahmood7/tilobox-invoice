# TiloBox Invoice

> **Free, Fast & Secure In-Browser Invoice & Thermal Receipt Generator**  
> *Built with open-source love • Based on Invoify • Maintained & Enhanced by TiloBox*

TiloBox Invoice is a modern, zero-database, client-side billing web tool built with Next.js 15, TypeScript, React, and Tailwind CSS / shadcn/ui. Designed for freelancers, agencies, consultants, retail stores, cafes, and small businesses, it lets you generate professional PDF invoices and 80mm thermal POS receipts straight from your browser.

100% private, zero signup, no database required, and ready for instant deployment on Vercel.

---

## Key Features

- **📄 Standard A4 Invoices & 🧾 80mm POS Thermal Receipts**: Seamless one-click toggle between standard full A4 consulting/B2B invoices and compact 80mm thermal receipts with `@media print` thermal printer support.
- **📱 Dynamic Payment QR Code Generator**: Enable payment QR codes on any invoice or receipt for UPI, PayPal, Stripe, IBAN / EPC, or custom payment links.
- **👥 Client Address Book (LocalStorage)**: Save clients with contact details and Tax ID/VAT to browser storage (`tilobox_saved_clients`) for instant one-click auto-fill, editing, and management.
- **🎨 Custom Color Theme & Modern Accent Picker**: Choose from modern presets (TiloBox Blue, Emerald Green, Indigo, Slate Black, Crimson) or choose any custom Hex color. Your preference is automatically persisted.
- **📑 13 Professional A4 Invoice Templates**: Classic, Modern, Sidebar, Bold Header, Minimal, Letterhead, Compact, Two-Tone, Bordered, Left Rail, Statement, Corner, and Column.
- **⚡ Live Interactive Preview**: See changes instantly with debounced live previews and click-to-jump direct field editing.
- **🔒 100% Private & Client-Side**: No user tracking, no backend database. Your data is stored locally in your browser and encrypted at rest with AES-GCM 256.
- **🌍 18 Languages & Full RTL Support**: Full multi-lingual support including Arabic and Hebrew right-to-left layouts.
- **✉️ Direct PDF Export & Email**: Generate native Chromium-rendered vector PDFs or email documents directly.
- **🚀 Zero-Configuration Vercel Deployment**: No database connections, no API keys, and zero required backend environment variables.

---

## Attribution & Licensing

This project is an enhanced, modern distribution maintained by [TiloBox](https://tilobox.com). It builds upon the fantastic open-source foundation of [Invoify](https://github.com/al1abb/invoify) created by Ali Abbasov.

- Original codebase: Copyright (c) 2023 Ali Abbasov
- Modifications, branding, and custom features: Copyright (c) 2026 TiloBox (https://tilobox.com)
- Licensed under the [MIT License](LICENSE).

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components & Route Handlers)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, PostCSS, Radix UI & shadcn/ui
- **PDF Generation**: Puppeteer Core & `@sparticuz/chromium` (embedded fonts, zero external network calls)
- **Forms & Validation**: React Hook Form, Zod
- **Localization**: next-intl (18 locales)
- **Storage**: Browser LocalStorage & Web Crypto API (AES-GCM encryption at rest)

---

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mussaddiqmahmood7/Tilobox-Invoice.git
   cd Tilobox-Invoice
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment to Vercel

TiloBox Invoice runs out of the box with **zero required backend environment variables**:

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project in the [Vercel Dashboard](https://vercel.com).
3. Leave all build settings as default (`next build`) and deploy.
4. (Optional) Set `NEXT_PUBLIC_SITE_URL` to your custom domain (e.g. `https://invoice.tilobox.com`).

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts development server with pre-built PDF stylesheet |
| `npm run build` | Compiles production Next.js build |
| `npm run start` | Runs production server |
| `npm run lint` | Runs ESLint |
| `npx tsc --noEmit` | Runs TypeScript type checker |
| `npm run build:pdf-css` | Compiles embedded Tailwind CSS for Chromium PDF renderer |
