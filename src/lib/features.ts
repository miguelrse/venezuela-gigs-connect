// Feature flags. Keep server-enforced rules independent of these flags.

// Payments are intentionally disabled: there is no real payment provider
// wired up, and RLS forbids clients/specialists from writing to `payments`.
// Flip to true only once a secure payment integration exists.
export const PAYMENTS_ENABLED = false;
