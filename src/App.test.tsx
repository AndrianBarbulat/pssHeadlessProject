import { afterAll, describe, expect, it, vi } from 'vitest';

describe('App', () => {
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('renders the full app gracefully when no client ID is configured', async () => {
    // Force the "not configured" state regardless of any local `.env` file, so
    // the smoke test never triggers real Wix network calls.
    vi.stubEnv('VITE_WIX_CLIENT_ID', '');

    const { render, screen } = await import('@testing-library/react');
    const { default: App } = await import('./App');

    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'A live storefront, synchronized with Wix.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Wix Headless Commerce Demo')).toBeInTheDocument();
    expect(screen.getByText(/Wix is not configured\./)).toBeInTheDocument();

    // Wait for the provider's mount effect to settle.
    await screen.findByText(/connect this page to your Wix store/);
  });
});



