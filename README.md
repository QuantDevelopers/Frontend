# TSETMC Option Market Monitor — Frontend

A Persian (RTL) web app for the Tehran Stock Exchange options market.
It shows the data collected by the course backend (QuantBackend: Go / Echo / PostgreSQL) as the five pages the Phase 1 rules require:

- dashboard
- instrument search (the search box in the navbar, on every page)
- instrument detail with chart
- option chain
- data quality
---

## Quick start

**Prerequisites:** Node.js 20+ (tested with 22), and the backend running on `http://localhost:8000`.

Start the backend first:

```bash
cd ../trade-backend/Backend
cp .env.example .env
docker compose up --build -d        # postgres + seed (25 underlyings) + backend on :8000
```

Then the frontend:

```bash
npm ci
cp .env.example .env
npm run dev                         # http://localhost:5173
```

| Script            | Description                                    |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Dev server with hot reload (port 5173)         |
| `npm run build`   | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run preview` | Serve the production build                     |
| `npm test`        | Unit tests (Vitest)                            |

The backend's default `CORS_ORIGINS` already allows `http://localhost:5173`.

### Filling the database

A fresh backend contains only the 25 seeded underlyings, so most pages show "no data yet".
Run the backend crawler to load data:

```bash
cd ../trade-backend/Backend
go run ./cmd/crawler -mode=discover -persist-db                              # option contracts
go run ./cmd/crawler -mode=daily-history -persist-db -days=0                 # daily OHLCV
go run ./cmd/crawler -mode=production -workers=3 -days-back=5 -persist-db    # ticks
```

---

## Docker

The image is built in two stages: Node builds the bundle, then nginx serves it.
Image tags are pinned (`node:22.12.0-alpine3.21`, `nginx:1.27.3-alpine`).

```bash
cp .env.example .env
docker compose up --build -d        # http://localhost:5173
docker compose ps                   # health check: GET /healthz
docker compose down
```

- `VITE_API_BASE_URL` is read at **build time**. Rebuild after changing it.
- `nginx.conf` provides the SPA history fallback, caching for hashed assets and fonts, gzip, and security headers.
- The compose file runs the frontend only. Start the backend from its own repository.

## Configuration

| Variable            | Default                 | Description                         |
| ------------------- | ----------------------- | ----------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend base URL                    |
| `PORT`              | `5173`                  | Host port of the Docker container   |

Constants derived from the course rules live in `src/config.ts`:

| Constant                  | Value        | Meaning                                       |
| ------------------------- | ------------ | --------------------------------------------- |
| `DATA_START_DATE`         | `2023-03-21` | 1402/01/01, start of the Phase 1 data scope   |
| `DAILY_HISTORY_MAX_LIMIT` | `1000`       | Backend cap for `/daily-history?limit=`       |
| `COVERAGE_TARGET_PCT`     | `98`         | Coverage target (≥ 98% of trading days)       |

---

## Pages

| Route | Page | Content |
| ----- | ---- | ------- |
| `/` | Dashboard | Registry and database counts, active contracts per underlying (calls and puts), upcoming expiries |
| `/instruments` | Instruments | Tab 1: the underlyings table (insCode, market, last close, change, active contracts, nearest expiry). It is sortable and filterable, with CSV export. Tab 2: all option contracts, with server-side filters (underlying, call/put, active/expired, text) and pagination. |
| `/charts?u=&o=` | Charts | Pick an underlying (and optionally one of its active contracts) and see its daily candles and intraday candles built from ticks, without going through the instrument pages |
| `/underlyings/:symbol` | Underlying detail | Last close and day stats. Tabs: daily candlestick chart with volume (1M → all), intraday (candles from ticks, tick table, reconciliation with the daily bar), daily history table, and the underlying's contracts. |
| `/options/:symbol` | Option detail | Type, strike, expiry (Jalali, days left), contract size, status, insCode/ISIN, moneyness vs the underlying's last close, open interest. Tabs: daily chart, intraday, history. |
| `/option-chain/:symbol` | Option chain | Expiry selector, then a calls \| strike \| puts table with ITM/ATM/OTM, the last price, volume and open interest of each contract, and a spot-price marker row |
| `/data-quality` | Data quality | Crawl and database status, latest crawler run, coverage heatmap (underlyings × Jalali months), per-symbol checks, and a gaps list |

The navbar search (shortcut `/`) matches underlyings and contracts by symbol, name, insCode or ISIN. Enter opens the highlighted (or first) result.

All numbers use Persian digits, dates are Jalali, and timestamps are in Asia/Tehran.
The navbar shows backend status (`/health`, polled every 30s).

---

## Backend endpoints used

Responses are unwrapped from the envelope `{statusCode, message, data}`.
Requests send `Accept-Language: fa_IR`, so 404/422 errors arrive in Persian (`src/services/http.ts`).

| Endpoint | Used for |
| -------- | -------- |
| `GET /health` | Navbar status |
| `GET /api/v1/underlyings` | Registry (most pages) |
| `GET /api/v1/underlyings/{symbol_fa}` | Underlying detail |
| `GET /api/v1/underlyings/{symbol_fa}/option-chain` | Option chain |
| `GET /api/v1/options` | Contract list, counts per underlying |
| `GET /api/v1/options/{symbol_fa}` | Option detail |
| `GET /api/v1/instruments/search` | Navbar search suggestions |
| `GET /api/v1/daily-history/{underlying\|option}/{symbol_fa}` | Charts, history, last prices, chain prices, quality checks |
| `GET /api/v1/ticks/{underlying\|option}/{symbol_fa}` | Intraday chart, tick table, reconciliation |
| `GET /api/v1/crawl/status` | Dashboard and data-quality counters |

Responses are cached in memory per query (`src/hooks/useQuery.ts`), and identical concurrent requests are merged.
When a view needs one request per instrument, at most 4–6 run in parallel (`utils/concurrency.ts`), staying well below the backend rate limit.

---

## Computed in the frontend

| View | How | Why |
| ---- | --- | --- |
| Intraday candles | `/ticks` grouped into 1m / 5m / 15m / 1h buckets (`utils/candles.ts`) | No candle endpoint |
| Tick times on the chart | Tehran wall-clock time encoded as a UTC timestamp | The axis shows exchange time (09:00–12:30) in any timezone |
| Last price / change per underlying | `/daily-history?limit=2` | `/underlyings` has no prices |
| Active calls/puts, nearest expiry | All active contracts from `/options` (200 per page) | No aggregate endpoint |
| Contract status and active/expired filters | Expiry date in the past → «منقضی» (expired), whatever `is_active`/`status` say. Used by the badge, the contract filters, active counts, the chain's expiry list and the chart picker (`fetchLiveOptions`, `fetchExpiredOptions`) | The backend never marks contracts expired |
| Option daily history | Rows after the expiry date are dropped (`capAtExpiry`) | The backend returns zero-volume rows after expiry |
| Moneyness on the option page | Same rule as backend `domain/options` (ATM = within ±1% of strike) | The chain endpoint does this only for the chain |
| Chain prices | Last daily bar of each contract in the selected expiry | The chain endpoint returns no prices |
| Trading calendar | Days on which any underlying traded | No calendar endpoint |
| Quality checks | `utils/quality.ts` over daily history since 1402/01/01 | `/crawl/status` gives totals only |

### Quality rules

For each underlying:

- **Duplicates:** more than one bar for the same day.
- **Order:** the API returns newest first; any pair out of order is counted.
- **OHLC:** on traded days, `low ≤ open, close ≤ high` and prices are > 0.
- **Coverage:** days with data ÷ trading days since the symbol's first traded day.
- **Gaps:** consecutive missing trading days, merged into ranges.
- **Status:**
  - *passed*: coverage ≥ 98%, no issues, and insCode set.
  - *warning*: otherwise.
  - *failed*: no data, or coverage under 80%.

Tick-vs-daily reconciliation (volume, trade count, price range) is shown in the **intraday** tab of every instrument.

---

## Project structure

```
src/
├── App.tsx                 routes
├── config.ts               constants from the course rules
├── index.css               Tailwind + shared classes (.card, .btn-*, .input, .table-base)
├── types/api.ts            TypeScript copies of the backend DTOs
├── services/               http client (envelope + errors) and one function per endpoint
├── hooks/                  useQuery (cache), health polling, market overview, daily history, debounce
├── utils/                  formatters (Persian digits, Jalali), candles, quality, market, csv, routes
├── components/
│   ├── ui/                 Card, StatCard, PageHeader, SegmentedControl, Pagination, states
│   ├── PriceChart.tsx      lightweight-charts wrapper (Jalali axis, Persian digits)
│   └── …                   tables, chain, heatmap, intraday panel, navbar, search
└── pages/                  one file per route
```

**Stack:**
- React 18 and TypeScript (strict)
- Vite 5, React Router 6, Tailwind CSS 3
- axios
- lightweight-charts 5.0.9
- lucide-react
- Vitest

## Tests

```bash
npm test
```

There are 21 unit tests covering:

- Quality checks, gap merging and status thresholds.
- Jalali month grouping.
- Tick → candle aggregation, and `hEven` time padding (`90005 → 09:00:05`).
- Daily candle cleanup.
- Moneyness, matching the backend rule.
- Persian number, date and time formatting, and ي/ك normalization.

## Known limitations

- The dashboard, instruments and quality pages request daily history once per underlying (25 requests, 4–6 at a time, cached).
- Intraday views load at most 20,000 ticks per day (40 pages × 500). Beyond that the view is marked truncated and reconciliation is skipped.
- The trading calendar is inferred from the data. A day missing for every symbol is not detected as a gap.
- `/ticks` without `?date=` returns 500 when an instrument has no ticks at all (backend `MAX(trade_date)` NULL scan). The intraday view retries with the latest traded day, so it shows "no ticks" instead of an error.
- Underlyings without a TSETMC insCode are hidden everywhere (list, search, counts, quality). They can't be crawled, so they would only ever show as empty. They appear automatically once the backend stores their insCode.
- The «فعال»/«منقضی» (active/expired) filters on the contracts tab load every matching contract (200 per request) and page on the client, because the backend's `is_active` stays true after expiry. «همه» (all) still pages on the server.
- The option chain shows active contracts only (backend behaviour). Expired contracts are listed under Instruments → contracts → «منقضی».

