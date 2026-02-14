##
Retail Analytics Platform
##
Overview
This repository contains a full‑stack retail analytics platform with:
- Backend (Node.js + Express + PostgreSQL) exposing REST APIs for KPIs, analytics, catalog and ML integration
- ML service (Python + FastAPI) for forecasting and customer clustering (RFM/K‑Means)
- Frontend (static HTML/JS) dashboard

What Problems This Solves (Business Context)
- Strategic: identify high‑value and at‑risk customers, understand seasonal trends, plan inventory and marketing
- Operational: daily KPIs, category performance, top customers, near‑term sales forecast for staffing/stocking
- Data Science: consistent feature definitions (RFM), transparent model endpoints, clean outputs for visualization

Repository Structure
- backend/ — Express server, routes, controllers, and PostgreSQL access
- ml/ — FastAPI app with forecasting and clustering services
- frontend/ — Static dashboard pages and scripts
- database/ — (optional) data/migrations directory

High‑Level Architecture
- Frontend (browser) renders dashboard and calls backend REST APIs
- Backend (Express) queries PostgreSQL and proxies ML endpoints; contains SQL aggregation logic and fallbacks
- Database (PostgreSQL) hosts a star schema: dim tables for customer/product/date and fact table for sales
- ML Service (FastAPI) connects to the same DB, computes RFM, clustering, and forecasting (Prophet)

Typical Request Flow
1) User opens dashboard → frontend requests `/api/analytics/kpis`
2) Backend runs SQL via `dbService`, returns JSON KPIs
3) For forecasting → frontend or server calls `/api/ml/forecast`
4) Backend calls FastAPI at `ML_SERVICE_URL` and returns the result; on failure, it serves a simple moving‑average fallback
5) Charts render with uniform JSON structures

Prerequisites
- Node.js 18+
- Python 3.10+ (Prophet installs easiest with 3.10/3.11)
- PostgreSQL 13+

Environment Variables
Create a .env file in both backend/ and ml/ (they share keys):

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=retail_dw

# Backend
PORT=5000
ML_SERVICE_URL=http://127.0.0.1:8000
```

Database Schema Expectations
APIs assume a star schema with:
- fact.fact_sales(transaction_id, date_id, product_id, customer_id, quantity, total_amount)
- dim.dim_date(date_id, full_date, year, month, quarter, day)
- dim.dim_customer(customer_id, customer_code, gender, age)
- dim.dim_product(product_id, category, price_per_unit)

Data Model Notes and Calculations
- KPIs: SUM(total_amount), COUNT(transactions/customers/products), AVG(total_amount)
- Sales Trends: aggregated monthly/quarterly by joining `fact_sales` to `dim_date`
- Top Customers: revenue and order counts per customer; simple rule‑based cluster labels when ML is unavailable
- RFM (ML Service):
  - Recency: days since last purchase (inactive customers are handled as large recency)
  - Frequency: number of transactions
  - Monetary: sum of spend
  - K‑Means is run over standardized R, F, M features; results include cluster summaries and top customers per cluster
- Forecasting (ML Service): Prophet trained on daily revenue; output merges historical and forecast points with a `type` field

Backend (Node/Express)
Install and run:
```
cd backend
npm install
node server.js
```
Defaults to http://localhost:5000. CORS allows http://localhost:3000 and http://127.0.0.1:3000 by default.

Health
- GET /api/health → { status, message, timestamp }

Analytics Endpoints
- GET /api/analytics/kpis → { totalRevenue, totalCustomers, totalTransactions, averageOrderValue, totalProducts }
- GET /api/analytics/trends?period=monthly|quarterly → time series revenue/transactions/AOV
- GET /api/analytics/top-customers?limit=20&cluster=0|1|2|3|all → top spenders, optional cluster filter
- GET /api/analytics/daily-sales → last 30 days aggregated sales

Customer Endpoints
- GET /api/customers?page=1&limit=10 → paginated customers
- GET /api/customers/:id → single customer

Product Endpoints
- GET /api/products?page=1&limit=50 → paginated products
- GET /api/products/top/categories?limit=10 → top categories by revenue
- GET /api/products/:id → product with totals

Date Endpoints
- GET /api/dates → list dates
- GET /api/dates/:year → dates for a year
- GET /api/dates/:year/:month → dates for a month

ML Endpoints (proxied by backend)
- GET /api/ml/forecast?periods=12&model_type=simple → sales forecast (falls back to simple MA if ML down)
- GET /api/ml/clusters → customer clusters with summary

Direct ML Service (FastAPI)
Install and run (prefer a virtual environment):
```
cd ml
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# If using Prophet, install separately (recommended):
pip install prophet

uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
FastAPI endpoints (served at http://127.0.0.1:8000):
- GET / → service status
- GET /test-db → verifies DB connectivity
- GET /rfm → RFM metrics for sample data
- GET /test-rfm → RFM unit test output
- GET /clusters?k=4&top_n=5 → K‑Means on RFM, summary + top customers
- GET /forecast?periods=30 → Prophet based sales forecast

Frontend
Open frontend/index2.html in a browser (static demo UI). The included `frontend/main.js` shows a utility class and default API base `http://localhost:3000/api`; update it to `http://localhost:5000/api` if serving backend on 5000.

Recommended local setup for dashboard to call backend:
- Serve the HTML with a lightweight server (or open directly) and ensure backend CORS allows your origin
- Or run a simple server:
```
cd frontend
python -m http.server 3000
```
Then update backend CORS allowedOrigins to include http://localhost:3000 if needed.

Running Everything (quick start)
1) PostgreSQL: ensure DB reachable with the .env values
2) ML service:
   - Create ml/.env (same DB vars)
   - Install deps and start FastAPI (uvicorn)
3) Backend:
   - Create backend/.env
   - npm install && node server.js
4) Frontend: open frontend/index2.html (or serve on 3000)

Notes & Troubleshooting
- If /api/ml/forecast errors, backend falls back to a simple moving average forecast from recent sales
- If Prophet install fails on Windows, install build tools and `pip install prophet` separately, or switch to the backend fallback by omitting the ML service
- Ensure DB has the expected dim/fact tables; queries rely on them

Security & Configuration
- Secrets: keep `.env` files out of version control; use environment injection in production
- CORS: restrict origins in `backend/server.js` to your deployment domains
- Network: allow backend to reach PostgreSQL and FastAPI over private network segments
- Input validation: query params are sanitized for pagination; extend where needed (e.g., whitelists for `period` values)

Performance Considerations
- SQL indices: ensure indexes on foreign keys (`date_id`, `product_id`, `customer_id`) and on `full_date`
- Pagination: use `queryPaginated` to reduce payloads for large lists
- Caching: add a reverse proxy or in‑process caching for stable aggregates (e.g., KPIs) if load increases

Deployment Options
- Separate services on VMs/containers:
  - Service A: Backend on Node 18+ (port 5000)
  - Service B: FastAPI on Python 3.10+ (port 8000)
  - Service C: PostgreSQL
- Reverse proxy: route `/api/*` to backend; optionally expose ML service internally only
- Observability: add request logging (already present), metrics and tracing via OpenTelemetry or similar

Operations Runbook (Suggested)
- Health checks: `/api/health` (backend), `/` and `/test-db` (ML)
- Rollouts: deploy ML and backend independently; backend has a forecast fallback to tolerate ML downtime
- Backups: PostgreSQL logical backups; test restores periodically

Extensibility Roadmap
- Add category‑level forecasts (extend SQL and forecasting to group by `category`)
- Add anomaly detection for sales dips/spikes
- Add cohort analysis and CLV modeling to complement RFM
- Replace fallback forecasting with a simple on‑backend model (e.g., Holt‑Winters) where Prophet isn’t available

License
ISC (see backend/package.json). Update as needed.


