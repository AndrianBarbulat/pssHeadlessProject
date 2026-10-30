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

