import { useCart } from '../cart/CartContext';
import { getCurrencyCode, resolveProductCurrency } from '../lib/format';
import { useProducts } from '../products/useProducts';
import { ProductCard } from './ProductCard';

export function TestProducts() {
  const { products, loading, error, reload } = useProducts();
  const { addProduct, mutating, cart, configured } = useCart();
  const cartCurrency = getCurrencyCode(cart);

  return (
    <section className="catalog" aria-labelledby="catalog-heading">
      <div className="catalog__header">
        <h2 id="catalog-heading">Products</h2>
        {configured && !loading && (
          <p className="catalog__count" aria-live="polite">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        )}
      </div>

      {!configured && (
        <p className="muted">Add your Wix client ID to load the live catalog.</p>
      )}

      {configured && loading && (
        <p className="muted" role="status">
          Loading products…
        </p>
      )}

      {configured && !loading && error && (
        <div className="banner banner--error" role="alert">
          <p>{error}</p>
          <button type="button" className="button button--ghost" onClick={reload}>
            Retry
          </button>
        </div>
      )}

      {configured && !loading && !error && products.length === 0 && (
        <p className="muted">The Wix catalog has no visible products yet.</p>
      )}

      <ul className="product-grid">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard
              product={product}
              currency={resolveProductCurrency(product.currency, cartCurrency)}
              mutating={mutating}
              onAdd={addProduct}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

