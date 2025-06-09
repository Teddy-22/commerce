# Commerce – Key Features & Implementation Guide

## 1  Overview
This document explains the **core capabilities** delivered by the `commerce` Next.js storefront and shows **where** and **how** each capability is implemented in the repository.

Repository root: `https://github.com/Teddy-22/commerce`

---

## 2  Feature Matrix (quick reference)

| # | Feature | Primary Code Locations |
|---|---------|------------------------|
| 1 | Product discovery (home grid, carousel, collections, search) | `app/`, `components/grid`, `components/carousel`, `app/search`, `lib/shopify/queries` |
| 2 | Product detail with variant selection | `app/product/[handle]`, `components/product/*` |
| 3 | Shopping cart (optimistic, server actions) | `components/cart/*`, `lib/shopify/mutations/cart.ts` |
| 4 | Secure checkout redirect | `components/cart/actions.ts` |
| 5 | Dynamic collections & sorting | `app/search/[collection]`, `lib/constants.ts` |
| 6 | Caching & ISR with tag re-validation | `lib/shopify`, `app/api/revalidate/route.ts` |
| 7 | SEO & structured data | `app/layout.tsx`, `app/product/[handle]/page.tsx` |
| 8 | Responsive / a11y UI | Tailwind classes across `components/` |
| 9 | Error handling & graceful fallbacks | try/catch in `lib/shopify`, suspense skeletons |

---

## 3  Detailed Feature Walk-through

### 3.1 Product Discovery

**What it does** –  Presents products on home page, collection pages, and a keyword search with multiple sort orders.

**Key flows**
1. `/` → `ThreeItemGrid` + `Carousel`
2. `/search?q=boots` → keyword search
3. `/search/shoes` → collection filter

**Implementation highlights**
- GraphQL query: `lib/shopify/queries/product.ts`  
- Search page component: `app/search/page.tsx`  
  ```ts
  const products = await getProducts({ sortKey, reverse, query: searchValue });
  ```
- Sort selectors defined in `lib/constants.ts` under `sorting[]`.

### 3.2 Product Detail & Variant Selection

Displays gallery, price, HTML description, and variant options.

```tsx
// app/product/[handle]/page.tsx
<Gallery images={product.images.slice(0,5)} />
<ProductDescription product={product} />
```

Variant logic:

```tsx
// components/product/variant-selector.tsx
const selectedVariant = variants.find(v => matchesOptions(v, state));
```

Hidden products are filtered via `HIDDEN_PRODUCT_TAG` constant.

### 3.3 Shopping Cart (Optimistic)

**Client state**

- Context provider: `components/cart/cart-context.tsx`
  * Maintains React optimistic state with `useOptimistic`.
  * Reducer handles `ADD_ITEM`, `UPDATE_ITEM`, `DELETE`.

```ts
const [optimisticCart, updateOptimisticCart] = useOptimistic(initialCart, cartReducer);
```

**Server mutations**

- `addToCart`, `updateCart`, `removeFromCart` in `lib/shopify/index.ts` wrap GraphQL mutations defined in `lib/shopify/mutations/cart.ts`.

**Server actions (App Router)**

```ts
// components/cart/actions.ts
'use server';
export async function addItem(_, variantId) {
  await addToCart([{ merchandiseId: variantId, quantity: 1 }]);
  revalidateTag(TAGS.cart);
}
```

### 3.4 Secure Checkout Redirect

```ts
export async function redirectToCheckout() {
  const cart = await getCart();
  redirect(cart!.checkoutUrl);     // Shopify-hosted checkout page
}
```

Cookie `cartId` is created via `createCartAndSetCookie()` after first add-to-cart.

### 3.5 Collections & Sorting

Collections retrieved once and cached:

```ts
// lib/shopify/index.ts
export async function getCollections() {
  cacheTag(TAGS.collections);
  ...
}
```

Search route `/search/[collection]` reads `params.collection` and reuses `getCollectionProducts()`.

### 3.6 Caching & Incremental Static Regeneration

- `next/cache` experimental helpers: `cacheTag`, `cacheLife`.
- Webhook endpoint `app/api/revalidate/route.ts` listens to topics like `products/update` and calls:
  ```ts
  revalidateTag(TAGS.products);
  ```

### 3.7 SEO & Structured Data

**Site-wide metadata**

```ts
// app/layout.tsx
export const metadata = { title: SITE_NAME, robots: { follow:true, index:true } };
```

**Product JSON-LD**

```tsx
// app/product/[handle]/page.tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
```

### 3.8 Responsive & Accessible UI

- Tailwind 4 container queries (`@tailwindcss/container-queries`) for adaptive grids.
- Images use Next.js `<Image>` with `sizes` for responsive loading.
- Components employ semantic HTML + ARIA (e.g., `Gallery` buttons labelled).

### 3.9 Error Handling & Fallbacks

- `isShopifyError()` type-guard in `lib/type-guards.ts`.
- All Shopify fetches wrapped in try/catch; errors bubble with status codes.
- React Suspense fallbacks (e.g., blurred image skeleton in gallery).

---

## 4  Putting It Together – Example User Journey

1. **Home Browse**  
   User hits `/` → server component queries 3 products → cached for 1 day.
2. **Search “hoodie”**  
   `/search?q=hoodie&sort=price-asc` → `getProducts()` with `sortKey:'PRICE'`.
3. **View Product**  
   `/product/unisex-hoodie` → server side fetches product & related products.
4. **Add Variant**  
   Client calls server action `addItem` → Shopify mutation → optimistic cart badge updates instantly.
5. **Checkout**  
   Click “Checkout” → server action fetches cart, `redirect(cart.checkoutUrl)`.

---

## 5  Extending the Feature Set

| Task | Suggested Touchpoints |
|------|-----------------------|
| Add wish-list | Create new context + GraphQL metafield |
| Multi-currency | Extend `Money` type & price formatting in `components/price.tsx` |
| Ratings & reviews | New entity, UI in product page, fetch via separate API |

---

## 6  Summary
The commerce codebase blends **Next.js 15**, **Shopify GraphQL**, and modern React patterns to ship a **performant, feature-rich storefront**. Each feature is encapsulated in clear modules, making customisation and extension straightforward for engineering teams.

