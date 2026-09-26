import Link from "next/link";

import { logout } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export function AdminFrame({
  current,
  children,
}: {
  current: "notes" | "usage";
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex rounded-full border border-border bg-card p-1 text-sm">
          <Link
            href="/admin"
            className={cn(
              "rounded-full px-3 py-1.5",
              current === "notes" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            Notes
          </Link>
          <Link
            href="/admin/analytics"
            className={cn(
              "rounded-full px-3 py-1.5",
              current === "usage" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            Usage
          </Link>
        </nav>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-border px-3 py-1.5 text-sm"
          >
            Log out
          </button>
        </form>
      </div>
      {children}
    </main>
  );
}
