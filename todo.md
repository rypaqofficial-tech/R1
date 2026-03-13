# AfriEquity AI Pro — TODO

## Database & Backend
- [x] Database schema: users, predictions, deals, portfolios, alerts, subscriptions
- [x] tRPC routers: auth, predictions, portfolio, deals, forecasts, admin, macro
- [x] PesaRisk Net model inference (deterministic JS simulation with SHAP)
- [x] KNBS/CBK macro data fetching (World Bank API with fallback)
- [x] Freemium usage tracking

## Authentication
- [x] Role-based access (Analyst / Admin / Investor)
- [x] DPA compliance notes and data anonymization
- [x] User profile management

## Layout & Design System
- [x] Kenyan-inspired design tokens (green/gold/red)
- [x] DashboardLayout with sidebar navigation
- [x] Dark mode support
- [x] Mobile-first responsive design
- [x] Language toggle (English/Swahili)

## Pages
- [x] Overview / Home screen with KPIs, gauge, pie, alerts
- [x] Risk Predictions screen with form, SHAP, CSV upload
- [x] Forecasts screen with 5-year IRR, confidence intervals, scenarios
- [x] Portfolio Optimization screen with what-if sliders and heatmap
- [x] Portfolio Management screen with saved deals and analytics
- [x] Settings/Profile screen with preferences and admin panel
- [x] Freemium upgrade/pricing page

## Integrations
- [x] World Bank / KNBS macro data API
- [x] PesaRisk Net inference (simulated in JS, real model via FastAPI)
- [ ] Stripe payment integration (freemium tiers — requires Stripe keys)
- [ ] Email notifications for alerts (requires SMTP config)

## Tests
- [x] Auth router tests (3 tests)
- [x] Prediction router tests (8 tests)
- [x] Portfolio router tests (2 tests)
- [x] Forecast router tests (3 tests)
- [x] Admin router tests (2 tests)
- [x] Macro router tests (1 test)
- [x] Batch prediction tests (2 tests)
- [x] All 24 tests passing ✅

## Rebranding
- [x] Upload Rypaq logo to CDN
- [x] Update VITE_APP_TITLE to Rypaq
- [x] Update VITE_APP_LOGO to Rypaq CDN URL
- [x] Replace all "AfriEquity AI" text references with "Rypaq" in frontend files
- [x] Update browser tab title and meta tags

## UI Fixes
- [x] Fix Portfolio Risk Score gauge number alignment on Overview page
