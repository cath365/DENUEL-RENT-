# DENUEL 2.0 Upgrade

This upgrade repositions DENUEL from a generic rental-listing experience into a Zambia-first property and living platform while preserving the existing project architecture, Prisma schema, authentication, APIs and admin tooling.

## Added / improved

- Property-first navigation: Buy, Rent, Land, Commercial, Agents, Services and Market Insights.
- New Zambia-first homepage and positioning.
- Search intent tabs with price, bed, bath, type, furnished, parking and pet filters.
- New `/land` and `/commercial` discovery pages.
- New `/ask-denuel` natural-language search translator. It converts ordinary-language requests into live DENUEL filters and does not invent property data.
- City and Lusaka-area discovery surfaces.
- Signed-in personalized “recently viewed” discovery.
- Real Mapbox map/list rental view with “search this area”.
- Search API support for property type and proper 1+/2+/3+ bedroom/bathroom semantics.
- Search API now returns listing images and verification context.
- Property-page trust badges, monthly-cost transparency, Zambia living essentials, price history and area median-rent comparison where data exists.
- WhatsApp property contact remains available and is tied to the listing title.
- Renter Hub expanded around applications, leases, rent payments, saved homes, alerts and safety.
- Landlord dashboard hard-coded sample metrics removed; dashboard statistics now come from live project APIs.
- Added landlord maintenance, payments, leases, expenses and screening pages.
- Transport removed from the primary navigation and retained as a supporting service.
- Footer rebuilt around the property ecosystem and configured contact/social data only; placeholder address/app-store content removed.
- Sitemap expanded to include the major DENUEL discovery routes and approved properties.
- Mapbox CSS added globally and the heavy map component is dynamically loaded on the rental page.
- Removed unsupported “millions/thousands” style marketing claims from key public acquisition pages.

## Validation

All changed TypeScript/TSX files were parsed with the TypeScript compiler API and passed syntactic diagnostics.

A full `npm ci`, `tsc`, and Next production build could not be completed in the execution environment because the npm registry was unavailable (`EAI_AGAIN registry.npmjs.org`). The repository itself does not include `node_modules`.

Run locally or in CI with network access:

```bash
npm ci
npx prisma generate
npx tsc --noEmit
npm run build
```

For map search, make sure `NEXT_PUBLIC_MAPBOX_TOKEN` is configured.
