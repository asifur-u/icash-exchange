import { AdminDashboard } from "@/components/admin-dashboard";
import { depositAccounts } from "@/lib/deposit";
import { DESK_FEE_PERCENT } from "@/lib/desk-fee";
import { getAdminSnapshot } from "@/lib/orders";
import { listSells } from "@/lib/sells";
import { paymentMode } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [snapshot, sells] = await Promise.all([getAdminSnapshot(), listSells()]);
  return (
    <AdminDashboard
      snapshot={snapshot}
      sells={sells}
      desk={{
        paymentMode: paymentMode(),
        feePercent: DESK_FEE_PERCENT,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
        deposits: depositAccounts().map((account) => ({
          id: account.id,
          label: account.label,
          hint: account.hint,
          number: account.number,
          name: account.name,
          note: account.note,
        })),
      }}
    />
  );
}
