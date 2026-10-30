import { useCallback, useEffect, useState } from 'react';
import { getWixClient, isConfigured, persistVisitorTokens } from '../lib/wixClient';
import { normalizeError } from '../lib/errors';
import { toDisplayProduct, type DisplayProduct, type RawProduct } from './productModel';

const PRODUCT_LIMIT = 24;

/**
 * Concurrent product-detail requests. Bounded so we never fire an unbounded
 * number of parallel calls at the Wix API.
 */
const DETAIL_CONCURRENCY = 3;

/**
 * Fields required from `getProduct()`:
 *  - `VARIANT_OPTION_CHOICE_NAMES` → real variant labels (Color: Green, …)
 *  - `CURRENCY` → the product/store currency code
 *  - `THUMBNAIL` → a ready-to-use image URL fallback
 */
const PRODUCT_DETAIL_FIELDS = [
  'VARIANT_OPTION_CHOICE_NAMES',
  'CURRENCY',
  'THUMBNAIL',
] as const;

export interface ProductsState {
  products: DisplayProduct[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Loads visible products from Wix Stores Catalog V3.
 *
 * `queryProducts()` lists the catalog, then `getProduct()` fetches each
 * product's variants (ID, price, choice names) and currency with a bounded,
 * order-preserving worker pool. A single failing product falls back to its
 * summary item so one bad product never breaks the whole catalog.
 */
export function useProducts(): ProductsState {
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      setError(null);
      setProducts([]);
      return;
    }

    let cancelled = false;

    async function loadProductDetail(
      client: ReturnType<typeof getWixClient>,
      item: RawProduct,
    ): Promise<DisplayProduct | null> {
      if (!item._id) return null;
      try {
        const product = await client.productsV3.getProduct(item._id, {
          fields: [...PRODUCT_DETAIL_FIELDS],
        });
        const display = toDisplayProduct(product);
        if (display) return display;
      } catch {
        // Fall through to the summary item (no variant detail).
      }
      return toDisplayProduct(item);
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const client = getWixClient();
        const queryResult = await client.productsV3
          .queryProducts()
          .eq('visible', true)
          .limit(PRODUCT_LIMIT)
          .find();
        const items = queryResult.items ?? [];

        // Bounded, order-preserving parallelism.
        const results: Array<DisplayProduct | null> = new Array(items.length).fill(null);
        let cursor = 0;

        async function worker() {
          while (cursor < items.length) {
            if (cancelled) return;
            const index = cursor;
            cursor += 1;
            results[index] = await loadProductDetail(client, items[index]);
          }
        }

        const workerCount = Math.max(1, Math.min(DETAIL_CONCURRENCY, items.length));
        await Promise.all(
          Array.from({ length: workerCount }, () => worker()),
        );

        persistVisitorTokens();
        if (!cancelled) {
          setProducts(results.filter((p): p is DisplayProduct => p !== null));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(normalizeError(err));
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return { products, loading, error, reload };
}

