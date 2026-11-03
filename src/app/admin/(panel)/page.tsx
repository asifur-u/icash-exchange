import { AdminDashboard } from "@/components/admin-dashboard";
import { listAdmins } from "@/lib/admins";
import { depositAccounts } from "@/lib/deposit";
import { requireAdmin } from "@/lib/guard";
import { deliveryProviders } from "@/lib/deliver";
import { DESK_FEE_PERCENT } from "@/lib/desk-fee";
import { icashPublicConfig } from "@/lib/icash";
import { adminRecipients } from "@/lib/notify";
import { getAdminSnapshot } from "@/lib/orders";
import { listSells } from "@/lib/sells";
import { paymentMode } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [snapshot, sells, me, staff] = await Promise.all([
    getAdminSnapshot(),
    listSells(),
    requireAdmin(),
    listAdmins(),
  ]);
  return (
    <AdminDashboard
      snapshot={snapshot}
      sells={sells}
      me={me}
      staff={staff}
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
        icash: {
          ...icashPublicConfig(),
          email: { provider: deliveryProviders().email, admin: adminRecipients() },
        },
      }}
    />
  );
}
