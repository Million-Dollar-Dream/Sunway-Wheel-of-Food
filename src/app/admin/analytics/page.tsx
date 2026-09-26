import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminFrame } from "@/components/admin-frame";
import { UsageBoard } from "@/components/usage-board";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/admin-auth";
import { usageRangeStart, type UsageRange } from "@/lib/usage";
import { buildUsageReport } from "@/lib/usage-report";
import { listUsageSessions } from "@/lib/usage-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Usage",
  robots: { index: false, follow: false },
};

function rangeFrom(value: string | undefined): UsageRange {
  if (value === "month" || value === "all" || value === "week") return value;
  return "week";
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const jar = await cookies();
  if (!readAdminSession(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  const params = await searchParams;
  const range = rangeFrom(params.range);
  let unavailable = false;
  let report = buildUsageReport([], false);
  try {
    const rows = await listUsageSessions(usageRangeStart(range));
    if (!rows) unavailable = true;
    else report = buildUsageReport(rows, rows.length >= 2000);
  } catch {
    unavailable = true;
  }

  return (
    <AdminFrame current="usage">
      {unavailable ? (
        <p className="mt-8 text-sm">Usage is not available right now.</p>
      ) : (
        <UsageBoard range={range} report={report} />
      )}
    </AdminFrame>
  );
}
