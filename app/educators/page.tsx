import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import { drills, educatorPreviewPassword } from "@/lib/data";

type EducatorsPageProps = {
  searchParams: Promise<{
    key?: string;
  }>;
};

export default async function EducatorsPage({ searchParams }: EducatorsPageProps) {
  const params = await searchParams;
  const isAuthorized = params.key === educatorPreviewPassword;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <SiteHeader compact />
        <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900">Educator Access</h1>
          <p className="mt-3 text-slate-700">
            This area is reserved for facilitators. For this MVP scaffold, append{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5">?key=educator-demo</code> to preview.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader compact />
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-6 inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-800">
          Educator View
        </div>
        <h1 className="text-3xl font-bold text-slate-900">All Drills</h1>
        <p className="mt-3 text-slate-700">
          Preview any drill and choose the right sequence for your in-person sessions.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {drills.map((drill) => (
            <article key={drill.slug} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">{drill.title}</h2>
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Focus:</span> {drill.skillFocus}
              </p>
              <p className="mt-2 text-sm text-slate-600">{drill.purpose}</p>
              <Link
                href={`/drill/${drill.slug}?assigned=${drill.slug}`}
                className="mt-4 inline-block rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
              >
                Preview
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
