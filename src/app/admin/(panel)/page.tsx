import { AdminDashboard } from "@/components/admin-dashboard";
import { getAdminSnapshot } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const snapshot = await getAdminSnapshot();
  return <AdminDashboard snapshot={snapshot} />;
}
