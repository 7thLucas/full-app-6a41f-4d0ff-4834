# Product Overview — Landing

> Status: MVP built and live in preview. "Landing" is a working title chosen in the absence of a user-specified name; it and all copy are repointable in seconds. The user did not specify what offer/product the page promotes, so the built page ships with neutral, tasteful placeholder copy by design.

## What it is
A single, deliberately minimal landing page. Exactly one page — a clean centered hero with a headline, one supporting pitch line, and a single call-to-action button. No navigation, no footer link clusters, no secondary pages, no extra sections. Minimalism is the product decision, not a placeholder for "more later."

## Who it's for
- **Visitors** — general web traffic arriving from a shared link, an ad, or a social post: prospective customers/leads who need a quick, clear pitch and one obvious next step.
- **Owner** — the person publishing the page, who wants something clean and shippable fast and easy to repoint at their real offer.

## The one job
Present the hero and drive the single call-to-action. One message, one action.

## What's built (MVP)
- Single route `/` only (`app/routes/_index.tsx`). No other routes or sections.
- One viewport-filling centered hero: headline + one supporting line + one primary CTA button.
- Copy and links are owner-editable via the configurables module — four repointable fields:
  - `heroHeadline` (default: "Everything you need, nothing you don't")
  - `heroSubhead`
  - `ctaLabel` (default: "Get Started")
  - `ctaUrl`
- Fully responsive, mobile-first. Subtle fade-in on load; otherwise flat and calm.

## Brand & design
- Clean, minimal, premium-neutral.
- White background; near-black headline (#111827); muted-gray subtext (#6B7280).
- Single accent color: indigo (#4F46E5), used for the CTA button (solid fill, 8px radius, clear hover/focus states).
- Large confident headline `clamp(2.5rem, 6vw, 4rem)`; readable subhead ~1.125–1.25rem.
- All color via theme tokens / `brandColor` CSS vars — no hardcoded color classes.

## The verified operation (north star)
- **CTA click** — a visitor pressing the primary call-to-action is the single domain event this page exists to produce. Page views and visits are not operations; the CTA click is the conversion the page lives or dies by.
- No traffic or volume facts have been provided yet, so any weekly projection is an editable assumption, not a measured or promised figure.

## Strategic principles
- Honor the minimalism — resist scope creep; the restraint is the value.
- Keep it trivially repointable: swapping headline/subhead/CTA to the real offer is a seconds-long edit, no rebuild.
- Ship fast, stay clean.

## Not yet specified
- The actual product/service/offer the page promotes (drives real headline, subhead, CTA copy and destination).
- A final product name (currently the working title "Landing").
- Any traffic / conversion volume facts needed to project real impact.
