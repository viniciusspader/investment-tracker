# Investment Tracker

A personal investment portfolio tracker built with Next.js. Tracks stocks, ETFs, and crypto with live prices, analyst signals, fundamentals, and AI-generated investment thesis.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![SQLite](https://img.shields.io/badge/SQLite-local-green)

## Features

- **Portfolio dashboard** — live prices for stocks, ETFs, and crypto with daily P&L and per-ticker news
- **Buy signals** — AI-generated investment thesis from a text prompt, matched to tickers via Claude
- **Sell signals** — analyst consensus, price targets, 52-week range, earnings vs estimates, and fundamentals (revenue, net income, FCF with YoY growth)
- **Performance tracking** — portfolio value over time
- **Local-first** — all data stored in a local SQLite database; nothing sent to external servers except live market data fetches

## Data Sources

| Source | What it provides | Cost |
|--------|-----------------|------|
| Yahoo Finance | Stock & ETF prices, analyst ratings | Free |
| CoinGecko | Cryptocurrency prices | Free |
| Financial Datasets API | Company news, income statements, cash flow, earnings | API key required |
| Anthropic Claude | AI investment thesis generation | API key required |

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** SQLite via `better-sqlite3` (local, no server)
- **UI:** Tailwind CSS + shadcn/ui
- **AI:** Claude claude-sonnet-4-6 via Anthropic SDK

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Configure API keys (optional)

Go to **Settings** in the app to add:
- **Anthropic API key** — enables the AI Thesis feature on the Buy tab
- **Financial Datasets API key** — enables company news, fundamentals, and earnings data

Keys are stored locally in `database.sqlite` and never transmitted except directly to their respective APIs.

## Project Structure

```
app/
├── page.tsx              # Dashboard (holdings + live prices + news)
├── buy/page.tsx          # Buy signals — AI thesis to ticker suggestions
├── sell/page.tsx         # Sell signals — analyst data + fundamentals
├── portfolio/page.tsx    # Portfolio management
├── performance/page.tsx  # Performance over time
├── settings/page.tsx     # API key configuration
└── api/                  # API routes (prices, signals, news, settings)

lib/
├── yahoo.ts              # Yahoo Finance integration (prices, analyst data)
├── coingecko.ts          # CoinGecko integration (crypto prices)
├── financial-datasets.ts # Financial Datasets API (news, fundamentals, earnings)
├── claude.ts             # Anthropic Claude integration (AI thesis)
└── db.ts                 # SQLite database access
```

## Notes

- This is a personal tool, not production software
- The SQLite database (`database.sqlite`) is excluded from version control — it contains your portfolio and API keys
- Tested on Windows 11 with WSL2 and Node.js 20+
