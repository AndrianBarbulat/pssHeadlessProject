export function EmptyCart() {
  return (
    <div className="empty-cart" role="status">
      <p className="empty-cart__title">Your cart is currently empty.</p>
      <p className="empty-cart__hint">
        Add one of the products to see the summary update.
      </p>
    </div>
  );
}

