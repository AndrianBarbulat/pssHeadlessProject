import { CartProvider, useCart } from './cart/CartContext';
import { CartSummary } from './components/CartSummary';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TechnicalSummary } from './components/TechnicalSummary';
import { TestProducts } from './components/TestProducts';

function MissingConfig() {
  return (
    <div className="banner banner--error" role="alert">
      <p>
        <strong>Wix is not configured.</strong> Set <code>VITE_WIX_CLIENT_ID</code> to your
        Wix Headless OAuth client ID (see <code>.env.example</code>), then restart the dev
        server or redeploy.
      </p>
    </div>
  );
}

function AppShell() {
  const { configured } = useCart();

  return (
    <>
      <Header />
      <main className="app-main">
        <Hero />

        <div className="container">
          {!configured && <MissingConfig />}

          <div className="commerce">
            <TestProducts />
            <CartSummary />
          </div>
        </div>

        <div className="container">
          <TechnicalSummary />
        </div>
      </main>
      <footer className="site-footer">
        <div className="container site-footer__inner">
          <p>
            Wix Headless Cart Summary — a technical assessment demo using live Wix data. No
            mock products and no client-side totals.
          </p>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppShell />
    </CartProvider>
  );
}

