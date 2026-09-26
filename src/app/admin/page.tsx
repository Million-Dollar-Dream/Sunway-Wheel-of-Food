import type { Metadata } from "next";
import { cookies } from "next/headers";

import { login } from "@/app/admin/actions";
import { AdminFrame } from "@/components/admin-frame";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/admin-auth";
import { getSql } from "@/lib/db";
import { restaurants } from "@/data/restaurants";
import { FEEDBACK_KIND_LABELS, type FeedbackKind } from "@/lib/feedback";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notes",
  robots: { index: false, follow: false },
};

type FeedbackRow = {
  id: string;
  created_at: string | Date;
  kind: string;
  restaurant_id: string | null;
  message: string;
};

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "medium",
  timeStyle: "short",
});

function restaurantName(id: string | null) {
  if (!id) return "—";
  return restaurants.find((restaurant) => restaurant.id === id)?.name ?? id;
}

function kindLabel(kind: string) {
  if (kind in FEEDBACK_KIND_LABELS) {
    return FEEDBACK_KIND_LABELS[kind as FeedbackKind];
  }
  return kind;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const jar = await cookies();
  const signedIn = readAdminSession(jar.get(ADMIN_COOKIE)?.value);

  if (!signedIn) {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center px-4 py-16">
        <h1 className="font-heading text-2xl font-semibold">Admin</h1>
        <form action={login} className="mt-6 flex flex-col gap-3">
          <label className="text-sm" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={200}
            className="rounded-md border border-black/15 bg-white px-3 py-2"
          />
          {params.error ? (
            <p className="text-sm text-red-700">That password did not work.</p>
          ) : null}
          <button
            type="submit"
            className="rounded-md bg-black px-3 py-2 text-sm text-white"
          >
            Continue
          </button>
        </form>
      </main>
    );
  }

  const sql = getSql();
  let rows: FeedbackRow[] = [];
  let unavailable = false;
  if (!sql) {
    unavailable = true;
  } else {
    try {
      rows = (await sql`
        SELECT id, created_at, kind, restaurant_id, message
        FROM feedback
        ORDER BY created_at DESC
        LIMIT 200
      `) as FeedbackRow[];
    } catch {
      unavailable = true;
    }
  }

  return (
    <AdminFrame current="notes">
      <h1 className="mt-8 font-heading text-3xl font-semibold tracking-tight">Notes</h1>
      {unavailable ? (
        <p className="mt-6 text-sm">Feedback is not available right now.</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm">No notes yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/15">
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">Kind</th>
                <th className="py-2 pr-4 font-medium">Place</th>
                <th className="py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-black/10 align-top">
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {timeFormat.format(new Date(row.created_at))}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">{kindLabel(row.kind)}</td>
                  <td className="py-3 pr-4">{restaurantName(row.restaurant_id)}</td>
                  <td className="py-3 whitespace-pre-wrap">{row.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminFrame>
  );
}
