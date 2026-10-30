# Wix Headless Cart Summary

A self-managed, deployable **React + Vite + TypeScript** site that connects to a real
Wix Stores site through the Wix JavaScript SDK and displays a live, synchronized cart
using **Wix eCommerce Cart V2**.

No API key or client secret is used. Authentication is done with a public Wix Headless
OAuth **client ID** (`OAuthStrategy`), which is safe to ship in the frontend bundle.

---

## 1. Repository / file structure

```text
pssHeadlessProject/
├── .env.example                     # Only VITE_WIX_CLIENT_ID= (no secrets)
├── .gitignore                       # Ignores node_modules, dist, .env, etc.
├── index.html                       # Vite HTML entry
├── netlify.toml                     # Netlify build + SPA rewrite
├── package.json                     # Scripts + dependencies
├── package-lock.json
├── tsconfig.json                    # Strict TS config
├── vite.config.ts                   # Vite + Vitest config
├── README.md
└── src/
    ├── main.tsx                     # React entry (StrictMode)
    ├── App.tsx                      # Page shell (header / intro / layout / footer)
    ├── App.test.tsx                 # Full-app smoke test (no client ID)
    ├── index.css                    # All styling (responsive, focus states)
    ├── vite-env.d.ts                # import.meta.env typing for VITE_WIX_CLIENT_ID
    ├── cart/
    │   ├── CartContext.tsx          # CartProvider + useCart() hook
    │   ├── cartReducer.ts           # Pure reducer (state replacement / error preservation)
    │   ├── cartReducer.test.ts
    │   ├── normalize.ts             # no-current-cart → null, empty detection
    │   ├── normalize.test.ts
    │   ├── payloads.ts              # add / update-quantity / remove payload builders
    │   ├── payloads.test.ts
    │   └── types.ts                 # Structural Cart V2 types
    ├── components/
    │   ├── Header.tsx               # Compact nav: brand + status + cart badge
    │   ├── Hero.tsx                 # Hero section with tech badges
    │   ├── StatusBadge.tsx
    │   ├── TestProducts.tsx         # Product catalog area
    │   ├── ProductCard.tsx          # image / name / price / variant / stock / Add
    │   ├── ProductCard.test.tsx
    │   ├── CartSummary.tsx          # Sticky cart summary + subtotal + item count
    │   ├── CartLineItem.tsx         # image / name / variant / price / qty / total / remove
    │   ├── CartLineItem.test.tsx
    │   ├── CartSummary.test.tsx
    │   ├── EmptyCart.tsx            # Empty-cart message
    │   └── TechnicalSummary.tsx     # Compact "How it works" section
    ├── lib/
    │   ├── wixClient.ts             # createClient + OAuthStrategy + token helpers
    │   ├── tokens.ts                # localStorage token persistence
    │   ├── tokens.test.ts
    │   ├── format.ts                # Intl.NumberFormat money + currency helpers
    │   ├── format.test.ts
    │   ├── media.ts                 # media.getImageUrl() wrapper with fallback
    │   └── errors.ts                # error normalization + OWNED_CART_NOT_FOUND
    │   └── errors.test.ts
    ├── products/
    │   ├── productModel.ts          # Catalog V3 product/variant/currency mapping
    │   ├── productModel.test.ts
    │   └── useProducts.ts           # queryProducts() + bounded getProduct() loader
    └── test/
        └── setup.ts                 # jest-dom matchers for Vitest
```

---

## 2. Architecture

```text
Netlify React/Vite application
        │
        ├── Wix OAuth visitor session (OAuthStrategy, public client ID)
        │     └── tokens persisted in localStorage
        │
        ├── Wix Stores Products V3
        │     ├── productsV3.queryProducts()   → list visible products
        │     └── productsV3.getProduct()      → variants (IDs, choice names, prices) + currency
        │
        └── Wix eCommerce Cart V2 (currentCartV2)
              ├── getCurrentCart()             → initial retrieval
              ├── refreshCurrentCart()         → revalidate an existing cart
              ├── addLineItemsToCurrentCart()
              ├── updateLineItemsInCurrentCart()
              └── removeLineItemsFromCurrentCart()
```

**State flow (central `CartProvider` / `useCart()`):**

1. On mount, focus, and `visibilitychange` → `refreshCart()`:
   - uses `getCurrentCart()` for the initial load, then
   - `refreshCurrentCart()` to revalidate an already-known cart,
   - and replaces state with `response.cart`. A returned `OWNED_CART_NOT_FOUND`
     is treated as a normal empty cart.
2. Every mutation (`addProduct` / `updateQuantity` / `removeItem`):
   - waits for the Wix response,
   - replaces local cart state with `response.cart` (no client-side merge),
   - persists the active visitor tokens to `localStorage`,
   - prevents overlapping mutations,
   - invalidates any in-flight refresh so a stale refresh can't overwrite newer
     cart state,
   - reports errors without destroying the previously loaded cart.
3. Money and totals are always read from Wix (`pricing.unitPrice`,
   `pricing.totalPrice`, `cart.subtotal`) — never calculated client-side.

---

## 3. Quick start (local development)

```bash
npm install
cp .env.example .env     # then paste your client ID into .env
npm run dev              # http://localhost:5173
```

Without `VITE_WIX_CLIENT_ID` the app renders a friendly "Wix is not configured"
state instead of crashing.

Scripts:

```bash
npm run dev          # start dev server
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npm run build        # tsc && vite build  → dist/
npm run preview      # serve the production build
```

---

## 4. Wix Dashboard setup steps

1. Open the Wix site that provides the store catalog.
2. Confirm **Wix Stores** is installed.
3. Add ~3 visible **test products** (products with selectable variants are
   supported — the app requests `VARIANT_OPTION_CHOICE_NAMES` to show real option
   labels). Publish the site.
4. Open **Wix Dashboard → Settings → Development & integrations → Headless Settings**.
5. Click **Create New Client**.
6. Create a **web / JavaScript** client (e.g. `PSS Cart Summary — Netlify`).
7. Copy the generated **Client ID**.
8. Add the allowed domains (redirect-domain config) on the client:
   - `http://localhost:5173` (local dev, if supported)
   - `https://your-site-name.netlify.app` (once Netlify provides the domain)

> Redirect domains are only required for login/checkout redirect flows; the cart
> summary itself does not need them.

Official docs:
- Set up a Headless client: https://dev.wix.com/docs/go-headless/authentication/setup/set-up-a-headless-client
- Authenticate visitors (JS SDK): https://dev.wix.com/docs/go-headless/authentication/visitors/authenticate-visitors-js-sdk

---

## 5. Netlify deployment + environment variable steps

`netlify.toml` is already included:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Deployment steps:

1. Push this repository to GitHub/GitLab/Bitbucket, or drag-and-drop the folder
   into Netlify.
2. In Netlify, set the build command `npm run build` and publish directory `dist`
   (or just let `netlify.toml` drive it).
3. Add the environment variable:

   ```text
   VITE_WIX_CLIENT_ID = your-wix-headless-client-id
   ```

4. Deploy. After Netlify assigns the final domain, add that domain to the Wix
   client's approved domains (step 8 above).

**Do NOT** create `VITE_WIX_API_KEY`, `VITE_WIX_CLIENT_SECRET`, or
`VITE_WIX_ACCESS_TOKEN`. The client ID is public and is the only value needed.

---

## 6. Wix Client ID variable name required

The app reads exactly one environment variable:

```text
VITE_WIX_CLIENT_ID
```

It is declared in `src/vite-env.d.ts`, read in `src/lib/wixClient.ts`, documented in
`.env.example`, and is the **only** `VITE_` variable used anywhere in the source.

---

## 7. Requirements matrix

| # | Requirement | Implementation |
|---|-------------|----------------|
| 1 | Display cart products | `CartSummary.tsx` renders `cart.lineItems` via `CartLineItem.tsx` |
| 2 | Display product images | `CartLineItem.tsx` → `resolveImageUrl()` in `lib/media.ts` (`media.getImageUrl`) |
| 3 | Display product names | `CartLineItem.tsx` uses `name.translated ?? name.original` |
| 4 | Display unit prices | `CartLineItem.tsx` uses `pricing.unitPrice` via `formatMoney` |
| 5 | Display quantities | `CartLineItem.tsx` uses `quantityInfo.confirmedQuantity` |
| 6 | Display line totals | `CartLineItem.tsx` uses `pricing.totalPrice` |
| 7 | Display server subtotal | `CartSummary.tsx` uses `cart.subtotal` |
| 8 | Empty-cart message | `EmptyCart.tsx` + `CartSummary.tsx` + `normalize.ts` |
| 9 | Update immediately on add | `CartContext.tsx` `addProduct` → `MUTATION_SUCCESS` replaces cart |
| 10 | Update immediately on quantity change | `CartContext.tsx` `updateQuantity` |
| 11 | Update immediately on remove | `CartContext.tsx` `removeItem` |
| 12 | Same cart after refresh | `lib/tokens.ts` persists visitor tokens in `localStorage`; restored in `lib/wixClient.ts` |
| 13 | Only live Wix data (no mocks) | All data comes from the Wix SDK (`lib/wixClient.ts`, `useProducts.ts`) |
| 14 | React / Vite / TS / Wix SDK / Netlify / CSS | `package.json`, `vite.config.ts`, `tsconfig.json`, `netlify.toml`, `index.css` |
| 15 | `OAuthStrategy` + public client ID | `lib/wixClient.ts` |
| 16 | No API key / client secret / admin token | Only `VITE_WIX_CLIENT_ID` is read |
| 17 | Create the client once, reuse it | `getWixClient()` singleton in `lib/wixClient.ts` |
| 18 | Restore stored tokens when creating the client | `createWixClient(loadTokens())` |
| 19 | `generateVisitorTokens()` + persist | `ensureVisitorTokens()` / `persistVisitorTokens()` |
| 20 | Cart V2 (not deprecated V1) | Only `currentCartV2` from `@wix/ecom` is imported |
| 21 | Required Cart V2 methods | `getCurrentCart`, `addLineItemsToCurrentCart`, `updateLineItemsInCurrentCart`, `removeLineItemsFromCurrentCart`, `refreshCurrentCart` all used in `CartContext.tsx` |
| 22 | Quantity update payload shape | `buildUpdateQuantityPayload()` in `cart/payloads.ts` |
| 23 | Removal payload shape | `buildRemovePayload()` returns `[lineItemId]` |
| 24 | Wix Stores app ID | `WIX_STORES_APP_ID = 215238eb-22a5-4c36-9e7b-e7c08025e04e` in `payloads.ts` |
| 25 | Catalog V3 requires a variant ID | `buildAddProductPayload()` sets `options.variantId`; `useProducts.ts` fetches variants via `getProduct()` with `VARIANT_OPTION_CHOICE_NAMES` + `CURRENCY` fields |
| 26 | Multi-variant handling | `ProductCard.tsx` renders an explicit `<select>` with real choice-name labels; disabled when no purchasable variant |
| 27 | Header: title, live status, explanation | `Header.tsx` + `StatusBadge.tsx` |
| 28 | Hero / introduction section | `Hero.tsx` (`A live storefront, synchronized with Wix.`) |
| 29 | Responsive layout | `index.css` (`.commerce` grid breakpoints, mobile-first) |
| 30 | Test products area | `TestProducts.tsx` |
| 31 | Cart summary area | `CartSummary.tsx` |
| 32 | Empty-cart text | `EmptyCart.tsx` ("Your cart is currently empty. Add one of the products…") |
| 33 | Technical summary panel | `TechnicalSummary.tsx` |
| 34 | `CartProvider`/`useCart` exposes full API | `CartContext.tsx` exposes `cart, loading, mutating, error, refreshCart, addProduct, updateQuantity, removeItem, clearError` |
| 35 | Replace state with `response.cart`, persist tokens, re-enable, surface errors | `runMutation()` in `CartContext.tsx` |
| 36 | Refresh on mount / focus / visibility | `useEffect` in `CartContext.tsx` |
| 37 | Don't calculate totals manually | Subtotals/totals read from Wix; `formatMoney` only formats |
| 38 | Currency | Cart via `customerInfo ?? businessInfo` (`getCurrencyCode()`); product prices via the product currency from Products V3 (`resolveProductCurrency()` in `lib/format.ts`) |
| 39 | `Intl.NumberFormat` | `lib/format.ts` |
| 40 | `media.getImageUrl()` + fallback | `lib/media.ts` |
| 41 | Accessibility (semantic HTML, alt text, aria-live, focus states, responsive) | Components + `index.css` (`:focus-visible`, `aria-live`, `aria-label` on icon buttons) |
| 42 | Distinct error handling | `lib/errors.ts` + per-feature error states (missing client ID, auth/cart/product failures, out-of-stock, invalid media; `OWNED_CART_NOT_FOUND` treated as an empty cart, not an error) |
| 43 | `netlify.toml` with SPA rewrite | `netlify.toml` |
| 44 | `.env.example` with only `VITE_WIX_CLIENT_ID=` | `.env.example` |
| 45 | Focused tests | `*.test.ts(x)` files (see §8) |
| 46 | `npm install` / `npm test` / `npm run build` pass | Verified (see §9 and §10) |

---

## 8. Tests

Focused tests cover every requested area:

| Test file | Covers |
|-----------|--------|
| `src/lib/format.test.ts` | Currency formatting (`Intl.NumberFormat`, converted amount, product-currency resolution) |
| `src/lib/errors.test.ts` | `OWNED_CART_NOT_FOUND` detection + error normalization |
| `src/lib/tokens.test.ts` | Visitor-token persistence/restoration through localStorage |
| `src/cart/normalize.test.ts` | No-current-cart normalization, empty-cart detection, item count |
| `src/cart/payloads.test.ts` | Quantity update payload, removal payload, add payload (variant ID + app ID) |
| `src/cart/cartReducer.test.ts` | State replacement after a successful mutation, error preservation after a failed mutation |
| `src/products/productModel.test.ts` | Variant-label normalization, currency extraction, hidden-variant filtering |
| `src/components/ProductCard.test.tsx` | Product price currency before a cart exists, variant options |
| `src/components/CartSummary.test.tsx` | Empty-cart rendering, cart-line rendering, server subtotal |
| `src/components/CartLineItem.test.tsx` | Cart-line rendering (name, price, qty, line total, warnings, fixed qty) |
| `src/App.test.tsx` | Full app renders gracefully without a client ID |

Run with:

```bash
npm test
```

---

## 9. Test results

```
Test Files  11 passed (11)
     Tests  59 passed (59)
```

All 59 tests pass (Vitest 2.1.9, jsdom, @testing-library/react).

---

## 10. Production build result

```bash
npm run build   # tsc && vite build
```

```
✓ 299 modules transformed.
dist/index.html                   0.62 kB │ gzip:   0.39 kB
dist/assets/index-*.css           9.47 kB │ gzip:   2.60 kB
dist/assets/index-*.js          683.61 kB │ gzip: 112.25 kB
✓ built
```

Build succeeds. The JS bundle is ~684 kB (112 kB gzip) because the Wix SDK is
bundled; this is a non-fatal size warning, not an error.

---

## 11. Git repository URL / Netlify URL

- **Git repository URL:** not available. This project was generated locally
  (`d:\Projects\pssHeadlessProject`) and is not yet connected to a remote. Run
  `git init && git add . && git commit` and push to create the remote.
- **Published Netlify URL:** not available. Netlify deployment access (account /
  site) was not provided, so no live URL was created or claimed.

---

## 12. Manual steps still required

1. Create the Wix Headless **client ID** and copy it (Wix Dashboard →
   Settings → Development & integrations → Headless Settings → Create New Client).
2. Create a local `.env` (from `.env.example`) with `VITE_WIX_CLIENT_ID=...`
   for local testing.
3. Publish the Wix site and add ~3 simple, visible test products.
4. Deploy to Netlify and set the `VITE_WIX_CLIENT_ID` environment variable.
5. Add the final Netlify domain (and `http://localhost:5173`) to the Wix client's
   approved domains.
6. (Optional) `git init` and push to a remote to get a repository URL.
7. Confirm the live site against the verification scenarios in §13.

> Everything else — code, tests, build, `netlify.toml`, `.env.example` — is
> complete and passing locally.

---

## 13. Verification report (manual, requires a live Wix store)

These scenarios must be run against the deployed site once `VITE_WIX_CLIENT_ID`
is configured. They are manual because they require a real Wix store and a real
browser session.

1. **Open with no current cart** → the "Your cart is currently empty." message is shown.
2. **Product prices use the correct currency before a cart exists** → prices come from the product currency returned by Products V3 (not a USD default).
3. **Variant selectors contain real, distinguishable values** → e.g. "Color: Green · Size: XL".
4. **Add the selected variant** → the line item appears with image, name, unit price, quantity, line total, and the subtotal updates.
5. **Add a second product** → a second line item appears; subtotal is the server value.
6. **Increase quantity** → confirmed quantity increments and line total/subtotal update from Wix.
7. **Decrease quantity** → confirmed quantity decrements (min 1).
8. **Remove one line** → that line disappears; subtotal updates.
9. **Refresh the browser** → the same visitor cart is preserved (tokens in `localStorage`).
10. **Remove the final line** → the empty-cart state returns.
11. **Open in a second fresh/private session** → an independent, empty cart is shown.

---

## 14. Security / API confirmations

- ✅ The Wix client uses **`currentCartV2`** (Cart V2). The deprecated Cart V1
  `currentCart` API is not used anywhere in this codebase.
- ✅ Only **`VITE_WIX_CLIENT_ID`** is configured. There are no
  `VITE_WIX_API_KEY`, `VITE_WIX_CLIENT_SECRET`, or `VITE_WIX_ACCESS_TOKEN`
  variables. `.gitignore` excludes `.env`, so a real client ID is never committed.
- ✅ The OAuth client ID is public and safe in the frontend bundle; no server-side
  secret is required for visitor carts.



