import { useConfigurables } from "~/modules/configurables";

/**
 * Single, minimal landing page — exactly one centered hero that fills the
 * viewport. Headline, supporting line, and the one call-to-action are all
 * driven by configurables so the copy is trivially repointable.
 */
export default function IndexPage() {
  const { config, loading } = useConfigurables();

  const headline = config?.heroHeadline ?? "";
  const subhead = config?.heroSubhead ?? "";
  const ctaLabel = config?.ctaLabel ?? "";
  const ctaUrl = config?.ctaUrl?.trim() ? config.ctaUrl : "#";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div
        className={
          "flex max-w-2xl flex-col items-center text-center transition-opacity duration-700 ease-out " +
          (loading ? "opacity-0" : "opacity-100")
        }
      >
        <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-bold leading-tight tracking-tight text-foreground">
          {headline}
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {subhead}
        </p>

        <a
          href={ctaUrl}
          className="mt-10 inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-colors duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {ctaLabel}
        </a>
      </div>
    </main>
  );
}
