import Link from "next/link";
import { AccessForm } from "@/app/components/access-form";
import { SiteHeader } from "@/app/components/site-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-12 sm:px-6">
        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
            Instructor-Guided Practice
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900">
            Practice communication skills deliberately, not randomly.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-700">
            This platform supports in-person teaching with focused drills that help learners
            improve one communication behavior at a time.
          </p>

          <div id="access" className="mt-10 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900">Enter your access</h2>
            <p className="mt-2 max-w-xl text-slate-600">
              Enter the access code from your instructor. You will only see the drills assigned to
              you.
            </p>
            <div className="mt-6">
              <AccessForm />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Focused micro-skills", "Practice a specific behavior instead of broad theory."],
            ["Immediate repetition", "Run short rounds and apply feedback quickly."],
            ["Real-world transfer", "Carry each skill directly into live sessions."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-slate-600">{text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-slate-900">How it works</h2>
          <p className="mt-3 text-slate-700">
            Get an access code from your instructor, complete your assigned drills, and apply your
            learning in your next live session.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-slate-900">For educators</h2>
          <p className="mt-3 text-slate-700">
            Use the educator area to preview all drills and pick the right sequence for each learner.
          </p>
          <Link
            href="/educators"
            className="mt-5 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white"
          >
            Educator Access
          </Link>
        </section>
      </main>
    </div>
  );
}
