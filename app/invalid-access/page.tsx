import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";

export default function InvalidAccessPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader compact />
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900">Invalid Access</h1>
        <p className="mt-3 text-slate-700">
          This drill is not part of your current assignment, or your access code has expired.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/#access" className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white">
            Re-enter Access
          </Link>
          <Link href="/" className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700">
            Go Home
          </Link>
        </div>
      </main>
    </div>
  );
}
