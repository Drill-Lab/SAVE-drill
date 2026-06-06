import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/app/components/site-header";
import { SaveStatementDrill } from "@/app/components/save-statement-drill";
import { drills } from "@/lib/data";

type DrillPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    assigned?: string;
  }>;
};

export default async function DrillPage({ params, searchParams }: DrillPageProps) {
  const routeParams = await params;
  const query = await searchParams;
  const assigned = (query.assigned ?? "").split(",").filter(Boolean);
  const currentDrill = drills.find((drill) => drill.slug === routeParams.slug);

  if (!currentDrill) {
    notFound();
  }

  if (!assigned.includes(routeParams.slug)) {
    redirect("/invalid-access");
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader compact />
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        {assigned.length > 1 ? (
          <Link href={`/my-drills?assigned=${assigned.join(",")}`} className="text-sm text-[var(--primary)]">
            Back to your assigned drills
          </Link>
        ) : null}
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{currentDrill.title}</h1>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">Before you begin</p>
          <p className="mt-2 text-slate-700">{currentDrill.introTextShort}</p>
        </div>
        {routeParams.slug === "save-statement" ? (
          <SaveStatementDrill />
        ) : (
          <>
            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">Drill Experience Placeholder</h2>
              <p className="mt-3 text-slate-600">
                Replace this block with your existing drill experience (iframe or custom component).
              </p>
              <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                Drill content mounts here
              </div>
            </section>
            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900">Reflection prompt</h3>
              <p className="mt-2 text-slate-700">What did you do differently in this round?</p>
              <button className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
                Mark complete
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
