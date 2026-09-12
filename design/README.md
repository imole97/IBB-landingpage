# Design source

`Interior By B.html` is the Claude Design prototype of the full landing page — a
9-page "book" with 3D page flips, all CSS and JS inline.

**It is not approved yet.** Nothing here is served; it is kept as the reference
the built site is measured against.

## What has been built from it

Only **Page 0, the cover spread**, which is now the coming-soon page at
`src/app/page.tsx`. Its design system — palette, cover gradients, type roles,
ornaments, form styling, reveal timing — was extracted into
`src/app/globals.css` and `src/components/ui/`, so the remaining pages consume
the same layer rather than restyling from scratch.

## Still to build, once the design is approved

| Prototype page | Section |
|---|---|
| 1 | Foreword — brand statement |
| 2 | Introduction — our story |
| 3 | Chapters — portfolio |
| 4 | Volumes — services |
| 5 | Appendix — process |
| 6 | Annotations — testimonials |
| 7 | The Index — FAQ |
| 8 | Write to Us — contact |

## Two things not to carry over as-is

- **`html { overflow: hidden }` and the 3D page-flip stage.** The prototype is a
  fixed-viewport experience with no scrolling. That fights SEO, deep links, and
  every phone. Keep the book *metaphor*; the pages should be real routes.
- **No `@media` queries exist in the prototype at all.** It is desktop-only.
  Every breakpoint in this repo is new work, not a port.
