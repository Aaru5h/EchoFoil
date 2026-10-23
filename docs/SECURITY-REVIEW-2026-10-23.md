# Security review · 2026-10-23

Reviewed API request protection, role guards, file uploads, blob access, configuration and dependency audit availability. This is a targeted review, not a penetration test.

## Changes

- Block browser requests marked `Sec-Fetch-Site: cross-site` on mutating API routes. Existing Origin validation remains; malformed Origin values now receive a 403 instead of falling through as server errors.
- Pass the configured Blob token explicitly on admin upload, listing and deletion. This avoids relying on an ambient token when the app's token name differs from the SDK default.

## Existing protections observed

- Admin routes call the admin role guard; private quote attachment downloads require that role.
- Uploads enforce file type and size and re-encode through Sharp with a pixel limit.
- Quote upload receipts are signed and expire after ten minutes.
- Production requests fail closed if the distributed rate limiter is not configured.
- API error responses avoid returning unknown exception messages.
- Security headers and a CSP are defined in `next.config.ts`.

## Verification and remaining work

Typecheck and lint passed after the changes. `npm audit --omit=dev` could not query npm because DNS/network access was unavailable; dependency vulnerability status remains unverified. Run that command in a networked environment before deployment. Review the CSP's inline script allowance when implementing a nonce strategy. Production credentials, verified business details and live deployment configuration were outside this local review.
