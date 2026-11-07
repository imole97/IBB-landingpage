# Interiors By B. — website

Next.js 16 (App Router, TypeScript, Tailwind v4) for
[interiorsbyb.net](https://www.interiorsbyb.net).

The site is a book: a cover and four pages — About us, Our services, Our
process, Contact us — each a real route, turned with a page curl. Our process
opens onto its six stages, each a page of its own, read in sequence. Service
detail pages exist as "Coming soon" until their content arrives.

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

| `src/lib/content.ts` | Every page's copy, the section order and the placeholder images — **the one file to edit when real content arrives** |
| `src/components/book/` | `BookShell` turns between routes with page-flip; `BookLink` is a real link that turns the page instead of jumping |
| `src/components/page/` | `InnerPage`, `ScriptHeading`, `ImagePlaceholder`, `PageFooter`, `ComingSoon`, `ContactForm` |

Images are placeholders: give a project or the About page an `image` path in
`content.ts` and the photograph replaces the placeholder plate.

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
| `NOTIFY_EMAIL` | Where contact-form enquiries are delivered |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin — drives metadata, sitemap, robots and JSON-LD. **Inlined at build time**, so it must be set when the build runs |
| `SITE_URL` | Optional runtime override, read per request. Server-side code (emails) prefers it, so a build missing the public var can't bake a wrong origin into a link or the logo |

Without the first three, `POST /api/contact` returns a 503 and the form points
people to the studio's email, rather than failing silently.

### Testing the form without sending mail

In `npm run dev` with the Resend keys unset, a message **succeeds without
sending** — it returns `{ ok: true, mocked: true }` after a short pause and
logs what it would have sent. That's there so the success state and the
thank-you can be exercised with no account and no keys.

This never happens in production: a deployment missing its keys returns the
503 rather than quietly telling people their message arrived when it didn't.
To get the same behaviour from a local production build, set `MOCK_CONTACT=1`.

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
