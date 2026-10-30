import { useCart } from '../cart/CartContext';
import { getCartItemCount } from '../cart/normalize';
import { StatusBadge, type Status } from './StatusBadge';

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function Header() {
  const { configured, loading, error, cart } = useCart();
  const count = getCartItemCount(cart);

  let status: Status = 'live';
  let label = 'Live Wix API';
  if (!configured) {
    status = 'error';
    label = 'Not configured';
  } else if (loading && cart === null) {
    status = 'pending';
    label = 'Connecting…';
  } else if (error) {
    status = 'error';
    label = 'API error';
  }

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <span className="site-header__brand">
          Wix <em>Headless</em> Cart
        </span>
        <div className="site-header__actions">
          <a
            className="site-header__github"
            href="https://github.com/AndrianBarbulat/pssHeadlessProject"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon />
            <strong>GitHub</strong>
          </a>
          <StatusBadge status={status} label={label} />
          <span className="cart-badge" aria-label={`${count} items in cart`}>
            <CartIcon />
            <span className="cart-badge__count">{count}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

