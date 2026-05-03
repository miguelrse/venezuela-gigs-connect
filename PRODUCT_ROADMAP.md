# ChambaLink Product Roadmap

## Current MVP position
ChambaLink is becoming a Venezuela-focused marketplace for local and remote services. The app already has the core marketplace skeleton: auth, roles, job posting, job browsing, bids, contracts, reviews, profiles, dashboards, and earnings.

## Product thesis
Start with trust and liquidity before payments.

The first version should make it easy to:
1. Publish a clear service request.
2. Find relevant open jobs.
3. Compare specialists and proposals.
4. Build specialist reputation through profiles, portfolio, services, reviews, and response quality.

Avoid complex escrow/payment monetization until there is real usage.

## Near-term priorities

### 1. Specialist profile as sales page
Goal: every provider profile should feel like a mini business page.

Add or improve:
- Services/packages: Basic / Standard / Premium or “Desde $X”.
- Availability: today, this week, flexible.
- Service areas/cities.
- WhatsApp/contact preference.
- Response time.
- Verification badges.
- Portfolio with before/after images.

### 2. Client job creation wizard
Goal: better job posts generate better bids.

Add:
- Step-by-step guided form.
- Category-specific prompts.
- Examples/templates by category.
- Photo upload path for repairs/events/beauty.
- “Quality score” for the request before publishing.

### 3. Browse jobs marketplace quality
Goal: specialists should quickly find jobs worth bidding on.

Add:
- Server-side filters/pagination.
- Urgent, remote, nearby, high-budget tabs.
- Saved filters.
- Job quality indicators.
- Hide jobs already bid on by the specialist.

### 4. Trust and safety
Goal: reduce fear for both sides.

Add:
- Verified phone badge.
- Completed jobs count.
- Report user/job flow.
- Review reminders.
- Clear platform safety tips.

### 5. Growth surfaces
Goal: make the site feel broader than a dashboard app.

Add public pages:
- `/servicios` category directory.
- `/servicios/:category` category landing pages.
- `/ciudades/:city` city landing pages.
- Public specialist discovery preview.

## Monetization ideas for later, not now
No money should be spent or activated without Miguel's explicit approval.

Potential models after validation:
- Featured specialist profiles.
- Paid verification.
- Lead credits for high-intent requests.
- Commission on completed contracts.
- Business subscriptions for agencies/teams.

## Technical priorities

### Cleanliness
- Build passes.
- Lint has 0 hard errors and only warnings.
- Remaining warnings are mostly React hook dependency and generated component refresh warnings.

### Risk areas
- Bid acceptance should eventually be transactional via Supabase RPC.
- Dashboard stats should use aggregate/count queries instead of limited rows.
- Supabase policies/schema should be audited before any real launch.
- Bundle size warning should be addressed with code splitting later.

## Brand note
`ChambaLink` is a working name. Before polish/deployment, Miguel should decide whether to keep it or choose another brand.
