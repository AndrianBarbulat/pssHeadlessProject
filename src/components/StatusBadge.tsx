export type Status = 'live' | 'error' | 'pending';

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  return (
    <span className={`status-badge status-badge--${status}`} role="status">
      <span className="status-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
