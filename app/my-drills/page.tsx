import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import { drills } from "@/lib/data";

type MyDrillsPageProps = {
  searchParams: Promise<{
    assigned?: string;
  }>;
};

export default async function MyDrillsPage({ searchParams }: MyDrillsPageProps) {
  const params = await searchParams;
  const assignedSet = new Set((params.assigned ?? "").split(",").filter(Boolean));
  const visibleDrills = drills.filter((drill) => assignedSet.has(drill.slug));

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader compact />
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900">Your Assigned Practice</h1>
        <p className="mt-3 text-slate-600">Choose one of the drills assigned by your instructor.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {visibleDrills.map((drill) => (
            <article key={drill.slug} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">{drill.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{drill.purpose}</p>
              <Link
                href={`/drill/${drill.slug}?assigned=${Array.from(assignedSet).join(",")}`}
                className="mt-4 inline-block rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
              >
                Start Drill
              </Link>
            </article>
          ))}
        </div>
        {visibleDrills.length === 0 ? (
          <p className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
            No assigned drills were found. Please check your access code or ask your facilitator.
          </p>
        ) : null}
      </main>
    </div>
  );
}
