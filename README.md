# Tim’s Diecast Garage — customer showroom

A working customer demonstration built from the original Hot Wheels Velocity project. Original pages, database schema, admin prototypes and media remain in the repository; they are intentionally not exposed by the new server.

## Run

Use Node.js 24 (22 or newer is supported).

```sh
npm ci
npm start
```

Open http://localhost:3000, or set PORT to an unused port. No database, account or payment credentials are needed. The existing Railway service follows master and uses `/health`.

## Included

- Responsive collector showroom, searchable/filterable/sortable catalog and 37 sample listings: 34 vehicles (33 Hot Wheels, one GreenLight) and three collector essentials.
- Original photographs optimized into WebP; optional, compressed silent cut of the original film.
- Product galleries, apparel options, persistent device-local shortlist and bag.
- Preview checkout with server-authoritative sample subtotals and proposed $6.95/free-at-$100 shipping in integer cents; tax remains uncalculated.
- About, collecting guide, FAQ/contact, privacy, terms, shipping, returns, cookies, condition/authenticity, accessibility and 404 pages.
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

## Confirmed demo identity

Owner: Tim. Location: Arizona, United States. Currency: US dollars (USD). Proposed creative name: Tim’s Diecast Garage, with the descriptor Hot Wheels & collector cars. This is a working concept name, not a claim of registered business or trademark clearance. No payment provider is selected; checkout remains a demonstration. Support email, full legal business identity and sales policies remain unconfirmed.

## Catalog recovery and policy examples

The original `C:\WebsiteProject\HOT WHEELS` folder was reviewed read-only. Its 203 image files were already present in the repository and matched byte-for-byte. Model names were transcribed from visible package labels; older sample-data mappings sometimes pointed at missing or unrelated images and were not trusted. No new AI car images were needed. `CATALOG_PROVENANCE.json` records source-photo paths, maker, scale and illustrative pricing. The gold Honda S2000 and carded Custom ’72 Datsun 240Z are distinct models; the two BMW M3 examples use different scales. The Volkswagen Air-Cooled example remains at brand/series level until the exact casting is verified. GreenLight is identified as a separate maker.

Customer-care and legal pages now contain full, clearly marked example operating terms: contiguous-US launch scope, proposed handling/delivery estimates, example shipping threshold, 14-day return requests, inspection/refund process, condition disclosure and data-handling boundaries. These are not active promises from Tim. Contact details, final business identity, inventory, media rights, tax handling and policies require approval before live sales. Delivery drafting was checked against the FTC internet-order merchandise guidance linked on the Shipping page.
