# Wix Headless Cart Summary — Presentation README

A technical handoff for the Wix Headless commerce demonstration.

---

## 1. Project overview

I built a self-managed, deployable **React + Vite + TypeScript** storefront that
connects to a real Wix Stores site through the Wix JavaScript SDK. The page renders
a live product catalogue and a live, synchronized cart, using **Wix Stores Products
V3** for the catalog and **Wix eCommerce Cart V2** for the cart.

The goal was to prove that a headless storefront can be driven entirely from Wix
APIs — with real products, real variants, real prices, and a real visitor cart —
without a backend, a database, or any server-side secret. Everything a visitor does
on the page (select a variant, add a product, change a quantity, remove a line)
talks directly to Wix and reflects Wix's own response.

The page is styled as a modern editorial storefront rather than a raw technical
screen, so it reads as a real commerce demo while remaining honest about the APIs
underneath.

---

## 2. Live functionality

The deployed site demonstrates the complete cart flow:

- **Products are retrieved from Wix Stores.** The catalog is loaded live with
  `productsV3.queryProducts()`, and each product's details (variants, prices,
  currency, image) come from `productsV3.getProduct()`.
- **Visitors can select variants.** Variants that carry real option-choice names
  are shown in a selector with labels like `Color: Green · Size: XL`. Hidden
  variants are excluded, and out-of-stock options are surfaced.
- **Visitors can add products.** Adding sends the selected product + variant ID to
  Cart V2 and the summary updates immediately from Wix's response.
- **Quantities can be changed.** Increase/decrease buttons call
  `updateLineItemsInCurrentCart()` and render the confirmed quantity Wix returns.
- **Products can be removed.** Each line has a Remove action backed by
  `removeLineItemsFromCurrentCart()`.
- **Cart totals remain synchronized.** Unit prices, line totals and the subtotal are
  always read from Wix — they are never computed in the browser.
- **Empty carts are handled.** When there is no current cart (including a Wix
  `OWNED_CART_NOT_FOUND` response) the page shows a friendly empty-cart state, not
  an error.
- **Visitor carts persist after refresh.** Anonymous visitor tokens are stored in
  `localStorage` and restored on reload, so the same visitor keeps the same cart.

---

## 3. Technology used

| Technology | Role |
|------------|------|
| **React** | Component-based UI and state management (`CartProvider` / `useCart`) |
| **TypeScript** | Strict, typed end-to-end code (structural types for Wix objects) |
| **Vite** | Fast dev server and production bundling |
| **Wix JavaScript SDK** | `createClient` + `OAuthStrategy` + the shared client |
| **Products V3** | `productsV3.queryProducts()` and `productsV3.getProduct()` |
| **Cart V2** | `currentCartV2` get / add / update / remove / refresh |
| **OAuthStrategy** | Visitor authentication with a public client ID |
| **localStorage** | Persisting the visitor session across reloads |
| **Vitest** | Unit + component test runner |
| **React Testing Library** | Behavior-driven component tests |
| **Netlify** | Static hosting with an SPA rewrite |

---

## 4. Wix APIs and methods

The final implementation calls exactly these Wix APIs:

```text
productsV3.queryProducts()
productsV3.getProduct()
currentCartV2.getCurrentCart()
currentCartV2.refreshCurrentCart()
currentCartV2.addLineItemsToCurrentCart()
currentCartV2.updateLineItemsInCurrentCart()
currentCartV2.removeLineItemsFromCurrentCart()
```

How each one is used:

- `productsV3.queryProducts()` — lists visible products in the catalog.
- `productsV3.getProduct()` — fetches a single product's variants, variant choice
  names, prices, currency and image. The request passes
  `fields: ['VARIANT_OPTION_CHOICE_NAMES', 'CURRENCY', 'THUMBNAIL']` so the response
  includes the data needed for labels, currency and imagery.
- `currentCartV2.getCurrentCart()` — initial retrieval of the visitor's current cart.
- `currentCartV2.refreshCurrentCart()` — revalidates prices/inventory of an
  already-known cart on focus/visibility changes.
- `currentCartV2.addLineItemsToCurrentCart()` — adds a catalog item with its variant ID.
- `currentCartV2.updateLineItemsInCurrentCart()` — changes a line item's quantity.
- `currentCartV2.removeLineItemsFromCurrentCart()` — removes a line item.

`refreshCurrentCart()` is genuinely called (not just documented) — it is used for
revalidation once a cart already exists.

---

## 5. Authentication

The browser application needs exactly one environment variable:

```env
VITE_WIX_CLIENT_ID=
```

This is the public **Wix Headless OAuth client ID**. It is safe to include in the
frontend bundle, and it is the only credential visitor authentication, product
retrieval, and current-cart operations require.

Why the other credentials are not used:

- **Wix API key** — only needed for administrative/server-side operations, never for
  a customer-facing visitor cart.
- **Client secret** — used only for the confidential `client_credentials` flow; it
  must never ship to a browser.
- **Website ID environment variable** — not required for the Headless SDK's
  `OAuthStrategy` visitor flow.
- **Administrative authentication** — not needed; the demo is read/visitor-only.

The app creates the client with `OAuthStrategy({ clientId })`, generates or restores
visitor tokens with `generateVisitorTokens()`, applies them with `setTokens()`, and
persists them in `localStorage` so the session survives reloads.

---

## 6. Step-by-step implementation

1. **Create the Vite/React application.** A minimal TypeScript scaffold gives a fast
   dev loop and a clean production build without extra framework weight.
2. **Install the Wix SDK modules.** `@wix/sdk`, `@wix/ecom`, and `@wix/stores`
   provide the client, the Cart V2 module, and the Products V3 module.
3. **Create a Wix Headless client.** One shared client (`getWixClient()`) is created
   lazily and reused across the whole app, rather than creating a client per call.
4. **Configure `OAuthStrategy`.** `OAuthStrategy({ clientId })` is the only auth the
   app needs; no API key or secret.
5. **Generate/restore visitor tokens.** On first request, stored tokens are restored
   from `localStorage`, passed to `generateVisitorTokens()` (which renews them if
   expired or creates new ones), applied with `setTokens()`, and re-persisted.
6. **Retrieve Products V3 data.** `queryProducts().eq('visible', true)` lists the
   catalog, and `getProduct()` fetches per-product detail.
7. **Request variant names and currency.** The `getProduct()` call requests
   `VARIANT_OPTION_CHOICE_NAMES`, `CURRENCY`, and `THUMBNAIL` so labels and currency
   come from Wix instead of being guessed or defaulted.
8. **Normalize the product response.** A small mapping layer turns the raw Wix
   response into a display model, keeping each variant ID tied to its label and
   excluding hidden variants.
9. **Retrieve the current Cart V2 cart.** `getCurrentCart()` returns the visitor's
   cart (or an empty one) on first load.
10. **Handle the no-current-cart state.** A Wix `OWNED_CART_NOT_FOUND` response is
    normalized to an empty cart rather than shown as an error.
11. **Add selected variants.** The Add button sends the product ID plus the selected
    variant ID to `addLineItemsToCurrentCart()`.
12. **Update quantities.** The quantity controls send a line-item ID and new
    quantity to `updateLineItemsInCurrentCart()`.
13. **Remove products.** The Remove button sends the line-item ID to
    `removeLineItemsFromCurrentCart()`.
14. **Replace local state with Wix mutation responses.** After every mutation the
    reducer stores `response.cart` verbatim — no client-side merging or totalling.
15. **Persist the visitor session.** Active tokens are saved after API activity so
    the same cart returns on refresh.
16. **Revalidate safely.** `getCurrentCart()` (first load) and
    `refreshCurrentCart()` (existing cart) run on mount, focus and visibility
    changes; a mutation epoch guard prevents a stale refresh from overwriting newer
    cart state.
17. **Deploy through Netlify.** `netlify.toml` builds the Vite app and rewrites SPA
    routes to `index.html`; the single env var is set in the Netlify dashboard.

---

## 7. Architecture

```text
Wix Stores Products V3
          ↓
     Wix SDK client
          ↓
 React product catalogue
          ↓
 Selected product + variant
          ↓
 Wix eCommerce Cart V2
          ↓
 React cart context and summary
```

- A single shared Wix client (`getWixClient()`) holds the `OAuthStrategy` session and
  the `currentCartV2` / `productsV3` modules.
- A `CartProvider` exposes `cart`, `loading`, `mutating`, `error`, `refreshCart`,
  `addProduct`, `updateQuantity`, `removeItem`, and `clearError` through `useCart()`.
- Product data flows through a mapping layer (`productModel.ts`) into display
  components; cart data flows through a reducer into the cart summary.

---

## 8. Synchronization strategy

Totals are never calculated manually. Unit prices, line totals and the subtotal all
come from the Wix cart object (`pricing.unitPrice`, `pricing.totalPrice`,
`cart.subtotal`).

After every mutation the application waits for the Wix response and then **replaces**
its local cart state with `response.cart` — it never merges or patches locally. This
means the UI is always a faithful mirror of what Wix reports.

On top of that, the cart is revalidated on mount, window focus, and
`visibilitychange`, using `getCurrentCart()` for the first load and
`refreshCurrentCart()` once a cart exists. A mutation-epoch guard ensures an
in-flight refresh can never overwrite a newer mutation result.

---

## 9. Security

- **The OAuth client ID is public.** It is designed to be shipped in frontend code;
  it is not a secret.
- **No secret is shipped to the browser.** There is no API key, client secret, access
  token, or administrative credential anywhere in the frontend or the build.
- **`.env` is ignored.** The real client ID lives only in the local `.env` file,
  which is excluded from Git. `.env.example` contains only `VITE_WIX_CLIENT_ID=`.
- **Visitor tokens are stored for session continuity.** Anonymous visitor tokens are
  kept in `localStorage` solely so the same visitor keeps the same cart; they are not
  used for any privileged access.
- **Administrative APIs are not used.** Every call is a customer-facing visitor call.

---

## 10. Testing and verification

Automated commands:

```bash
npm install
npm run typecheck
npm test
npm run build
```

Automated coverage (59 tests / 11 files) includes: variant-label normalization,
product currency before a cart exists, cart-line rendering, empty-cart rendering,
currency formatting, quantity-update and removal payloads, no-current-cart
normalization, state replacement after mutation, error preservation after a failed
mutation, `OWNED_CART_NOT_FOUND` handling, and token persistence.

Live scenarios verified against the configured Wix project:

- Empty cart
- Add one product
- Add another product
- Increase quantity
- Decrease quantity
- Remove one item
- Remove the final item
- Refresh persistence
- Variant selection with distinguishable labels
- Correct empty-cart currency

---

## 11. Local and Netlify setup

**Local:**

```bash
npm install
cp .env.example .env   # paste your client ID into .env
npm run dev            # http://localhost:5173
```

Add `http://localhost:5173` to the Wix client's approved domains if the dashboard
requires it.

**Netlify:**

1. Push the repository (or drag the folder) to Netlify.
2. `netlify.toml` already sets the build command (`npm run build`) and publish
   directory (`dist`), plus the SPA rewrite.
3. Set the environment variable `VITE_WIX_CLIENT_ID` to your client ID.
4. Deploy, then add the final `https://your-site.netlify.app` domain to the Wix
   client's approved domains.

---

## 12. Official documentation

- Wix Headless — About authentication:
  https://dev.wix.com/docs/go-headless/authentication/about-authentication
- Wix Headless — Set up a Headless client:
  https://dev.wix.com/docs/go-headless/authentication/setup/set-up-a-headless-client
- Wix Headless — Authenticate visitors with the JavaScript SDK:
  https://dev.wix.com/docs/go-headless/authentication/visitors/authenticate-visitors-js-sdk
- Wix eCommerce Cart V2 introduction:
  https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart-v2/introduction
- Wix Stores Products V3:
  https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/introduction
- Wix SDK — Media:
  https://dev.wix.com/docs/sdk/core-modules/sdk/media
- Netlify — Vite framework setup:
  https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/
- Netlify — SPA rewrites:
  https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/

