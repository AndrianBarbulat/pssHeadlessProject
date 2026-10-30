export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <p className="hero__eyebrow">Wix Headless Commerce Demo</p>
        <h1 id="hero-title" className="hero__title">
          A live storefront, synchronized with Wix.
        </h1>
        <p className="hero__lead">
          Products, prices and cart totals stream directly from a real Wix store through
          the Wix JavaScript SDK — no mock data and no client-side calculations.
        </p>
        <ul className="hero__badges" aria-label="Technology stack">
          <li>React + TypeScript</li>
          <li>Products V3</li>
          <li>Cart V2</li>
          <li>OAuth visitor session</li>
        </ul>
      </div>
    </section>
  );
}
