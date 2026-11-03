# Velocity collector showroom

A working customer demonstration built from the original Hot Wheels Velocity project. Original pages, database schema, admin prototypes and media remain in the repository; they are intentionally not exposed by the new server.

## Run

Use Node.js 24 (22 or newer is supported).

```sh
npm ci
npm start
```

Open http://localhost:3000, or set PORT to an unused port. No database, account or payment credentials are needed. The existing Railway service follows master and uses `/health`.

## Included

- Responsive collector showroom, searchable/filterable/sortable catalog and eight sample products.
- Original photographs optimized into WebP; optional, compressed silent cut of the original film.
- Product galleries, apparel options, persistent device-local shortlist and bag.
- Preview checkout with server-authoritative sample subtotals in integer cents.
- About, collecting guide, FAQ/contact, privacy, terms, shipping, returns, cookies, accessibility and 404 pages.
- Security headers, restricted static mounts, API rate limits and request validation.
- Legacy URL redirects; no public admin, upload, schema-edit, email or payment APIs.

## Verify

```sh
npm run check
npm test
npx playwright install chromium
npm run test:browser
npm audit --omit=dev
```

Browser evidence is written to the ignored `.qa` folder. Set VERIFY_BASE_URL to repeat browser checks against a deployment. The suite checks 320, 375, 390, 430, 768 and 1440 widths, overflow, accessibility, broken images, runtime errors, search, gallery, shortlist, bag and subtotal verification.

## Commercial launch gate

This is a clearly labeled non-indexed showroom, not a live trading store. No money, personal details, orders or reservations are collected. Sample prices, stock, editions and condition require seller confirmation. Seller identity, country, customer support, media rights, currency, tax/shipping/returns and approved policies are required before enabling real commerce. Legal pages describe the preview and contain clearly identified commercial drafts; they are not jurisdiction-specific legal advice.

The original backend has database dependencies and unauthenticated editing routes. Do not expose it publicly. `package.legacy.json` records its original dependencies for a separate migration; these unused packages are excluded from the active runtime.

For an actual store, implement authenticated inventory administration, durable order storage, server-side payment creation/capture, signed idempotent webhooks, transactional notifications and refund/fulfillment tests before taking orders.
