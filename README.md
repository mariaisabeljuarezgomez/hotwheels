# Tim’s Diecast Garage — customer showroom

A working customer demonstration built from the original Hot Wheels Velocity project. Original pages, database schema, admin prototypes and media remain in the repository; they are intentionally not exposed by the new server.

## Run

Use Node.js 24 or newer.

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
- Legacy URL redirects and a protected Garage Admin workspace; no public schema-edit, email or payment APIs.

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

This is a clearly labeled non-indexed showroom, not a live trading store. No money, shopper contact details, orders or reservations are collected. Administrator accounts are stored privately for site management. Sample prices, stock, editions and condition require seller confirmation. Seller identity, customer support, media rights, tax/shipping/returns and approved policies are required before enabling real commerce. Legal pages describe the preview and contain clearly identified commercial drafts; they are not jurisdiction-specific legal advice.

The original backend has database dependencies and unauthenticated editing routes. Do not expose it publicly. `package.legacy.json` records its original dependencies for a separate migration; these unused packages are excluded from the active runtime.

Authenticated inventory administration is included. An actual trading store still needs durable order storage, server-side payment creation/capture, signed idempotent webhooks, transactional notifications and refund/fulfillment tests before taking orders.

## Confirmed demo identity

Owner: Tim. Location: Arizona, United States. Currency: US dollars (USD). Proposed creative name: Tim’s Diecast Garage, with the descriptor Hot Wheels & collector cars. This is a working concept name, not a claim of registered business or trademark clearance. No payment provider is selected; checkout remains a demonstration. Support email, full legal business identity and sales policies remain unconfirmed.

## Catalog recovery and policy examples

The original `C:\WebsiteProject\HOT WHEELS` folder was reviewed read-only. Its 203 image files were already present in the repository and matched byte-for-byte. Model names were transcribed from visible package labels; older sample-data mappings sometimes pointed at missing or unrelated images and were not trusted. No new AI car images were needed. `CATALOG_PROVENANCE.json` records source-photo paths, maker, scale and illustrative pricing. The gold Honda S2000 and carded Custom ’72 Datsun 240Z are distinct models; the two BMW M3 examples use different scales. The Volkswagen Air-Cooled example remains at brand/series level until the exact casting is verified. GreenLight is identified as a separate maker.

Customer-care and legal pages now contain full, clearly marked example operating terms: contiguous-US launch scope, proposed handling/delivery estimates, example shipping threshold, 14-day return requests, inspection/refund process, condition disclosure and data-handling boundaries. These are not active promises from Tim. Contact details, final business identity, inventory, media rights, tax handling and policies require approval before live sales. Delivery drafting was checked against the FTC internet-order merchandise guidance linked on the Shipping page.

## Garage Admin

Open `/admin`. The first owner uses a privately supplied one-time setup link and chooses their own username/password. There is no public registration and no shared default password. Owner recovery codes and 24-hour single-use team invitations avoid dependence on an unconfigured email service. Owners control accounts and backup/restore; editors manage products, media, pages and presentation.

Products have separate private drafts and published snapshots. The editor supports name, price, stock count, categories, maker/series/scale, condition, options, highlights, display order, cover-photo choice, image ordering and optional video/transcript. Archive and recycle-bin actions are recoverable. Owners can permanently remove trashed products and unused uploads after explicit confirmation. Files still referenced by any product version are protected.

Pages use Markdown with server-side HTML sanitization. Site settings control brand text, hero, featured products, support email, announcement, footer note and example shipping. Publishing does not enable real sales. The public site loads only published records.

### Persistent storage

Production uses the existing Railway service with a 1 GB volume mounted at `/data`; `DATA_DIR=/data/garage`. `RAILWAY_RUN_UID=0` is set for Railway volume permissions. `ADMIN_SETUP_HASH` contains only the SHA-256 hash of the one-time setup code. Never commit or log the raw setup link, passwords, recovery codes or volume contents. Locally the data directory defaults to ignored `.runtime/`; tests use isolated ignored folders.

The catalog, settings, pages, accounts and sessions live in an atomically written JSON store. The one-service/one-process volume configuration is required; do not run parallel writers or replicas against this store. Bundled examples seed a new store once. Redeployments do not overwrite Tim’s edits. For substantially larger or multi-service workloads, migrate deliberately to a database.

Safety limits: 1,000 product records, 15 MB state file, 800 MiB uploaded-media allowance, up to 40 content snapshots within 50 MB. Images: JPEG/PNG/WebP up to 25 MB and 40 megapixels, automatically rotated/optimized to WebP with metadata stripped. Videos: MP4/WebM up to 100 MB, provided already compressed. No SVG, arbitrary remote media URLs, or executable upload types are accepted.

### Backups and access recovery

Owners can download a full ZIP containing content and uploaded media. Original bundled media remain in the source repository. Password hashes, sessions and recovery codes are excluded. A full ZIP can be restored through the admin area; account access stays unchanged. Automatic on-volume snapshots protect recent content changes but rely on media still being present. Download off-site full backups regularly and before permanent deletions. Removing an unused upload permanently can make an older content snapshot require its full ZIP backup.

If an owner forgets a password, use the private recovery code on the recovery screen. Changing or recovering a password revokes older sessions and creates a fresh recovery code. If all owners lose passwords and recovery codes, recovery requires an authorized operator with Railway volume access; there is no public bypass.

### Verification

`npm test` covers authorization, CSRF, draft privacy, stale revisions, publishing, archive/trash recovery, upload rejection/optimization, ZIP backup/restore, team permissions, session revocation and persistence. `npm run test:admin` exercises the browser interface and phone layouts against isolated local data, never the customer’s live inventory. The public regression suites use published content.
