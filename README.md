# Interiors By B. — website

Next.js 16 (App Router, TypeScript, Tailwind v4) for
[interiorsbyb.net](https://www.interiorsbyb.net).

Right now it serves a **coming-soon page** with a waitlist. The full landing
page design is not approved yet — see [`design/`](design/) for the prototype
and what is still to build.

## The design system comes first

The prototype's palette, cover gradients, type roles, ornaments, form styling
and reveal timing were extracted into a reusable layer. The coming-soon page is
assembled entirely from it, and the remaining pages should be too — nothing
should define its own colour, gradient or tracking.

| Where | What |
|---|---|
| `src/app/globals.css` | Palette, surfaces (`surface-cover-front/-back`, `surface-spine`), tracking scale, reveal + loader keyframes |
| `src/components/ui/` | `Label`, `Body`, `Rule`, `Ornament`, `CornerBrackets`, `Spine`, `Reveal`, `Field`, `SubmitButton`, `Wordmark` |
| `src/lib/site.ts` | Every brand fact and every piece of standing copy |

`src/app/page.tsx` is the prototype's Page 0 — the open-book cover spread —
with the waitlist where the studio bio sits on the back cover. Below 1024px the
book closes: the spread stacks and the spine lies down as a rule.

## Running it

```bash
npm install
cp .env.example .env.local     # fill in the Resend keys
npm run dev
```

| Script | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run logo:light` | Regenerates `public/logo-light.png` — only needed if `public/logo.png` changes |
| `npm run emails:preview` | Renders the transactional emails to `.preview/emails/*.html` so you can open them in a browser without sending anything |

### Why there are two logo files

`public/logo.png` is pure black artwork whose shape lives in its alpha channel.
Browsers recolour it with the `wordmark-on-ink` utility. Satori, which renders
the OG card, supports neither CSS filters nor `mask-image`, so it uses the
pre-recoloured `public/logo-light.png` instead.

## Environment

| Variable | |
|---|---|
| `RESEND_API_KEY` | From [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_FROM` | Must be on a domain **verified in Resend** (SPF + DKIM in DNS) |
| `NOTIFY_EMAIL` | Where signups are delivered |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin — drives metadata, sitemap, robots and JSON-LD. **Inlined at build time**, so it must be set when the build runs |
| `SITE_URL` | Optional runtime override, read per request. Server-side code (emails) prefers it, so a build missing the public var can't bake a wrong origin into a link or the logo |

Without the first three, `POST /api/subscribe` returns a 503 and the form says
signups aren't open yet, rather than failing silently.

## SEO

Metadata, `opengraph-image`, `twitter-image`, `icon`, `apple-icon`, `sitemap.ts`
and `robots.ts` are all in `src/app/` and all read `src/lib/site.ts`. JSON-LD
(`InteriorDesign` + `LocalBusiness`) is in `src/app/layout.tsx`.

`robots.ts` disallows everything when `VERCEL_ENV` is not `production`, so
preview deployments don't get indexed as duplicates.

## Deploying

```bash
vercel link
vercel env add RESEND_API_KEY        # and the other three
vercel --prod
```

**Before launch**, `www.interiorsbyb.net` has to be reactivated. Then: add it as
the project domain, point the apex at `www`, and add Resend's DKIM records to
the same DNS zone. The form stays in its 503 state until Resend verifies the
sending domain.
