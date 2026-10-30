export function TechnicalSummary() {
  return (
    <section className="tech" aria-labelledby="tech-heading">
      <h2 id="tech-heading">How it works</h2>
      <div className="tech__grid">
        <div className="tech__item">
          <h3>Authentication</h3>
          <p>
            Wix Headless OAuth visitor authentication via <code>OAuthStrategy</code> using a
            public client ID — no API key or client secret.
          </p>
        </div>
        <div className="tech__item">
          <h3>Products</h3>
          <p>
            Catalog V3 via <code>productsV3.queryProducts()</code> and{' '}
            <code>productsV3.getProduct()</code>, including variant choice names and currency.
          </p>
        </div>
        <div className="tech__item">
          <h3>Cart</h3>
          <p>
            Cart V2 via <code>currentCartV2</code> — get, add, update quantity, remove, and
            refresh.
          </p>
        </div>
        <div className="tech__item">
          <h3>Synchronization</h3>
          <p>
            After every mutation the UI replaces local state with the cart returned by Wix;
            totals are never calculated in the browser.
          </p>
        </div>
      </div>
    </section>
  );
}

