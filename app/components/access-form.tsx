"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { learnerAssignments } from "@/lib/data";

export function AccessForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const normalized = code.trim().toUpperCase();
    const assigned = learnerAssignments[normalized];
    if (!assigned) {
      setError("That code is invalid or expired. Please contact your facilitator.");
      return;
    }

    const serialized = assigned.join(",");
    if (assigned.length === 1) {
      router.push(`/drill/${assigned[0]}?assigned=${serialized}`);
      return;
    }
    router.push(`/my-drills?assigned=${serialized}`);
  };

  return (
    <div className="w-full max-w-xl rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm text-slate-600">Enter the access code from your instructor.</p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Example: SAVE"
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 outline-none ring-[var(--accent)] focus:ring-2"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white transition hover:opacity-95"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
