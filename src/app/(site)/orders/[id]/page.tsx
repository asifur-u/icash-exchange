import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy order detail → account portal */
export default async function OrderRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const qs = t ? `?t=${encodeURIComponent(t)}` : "";
  redirect(`/account/orders/${id}${qs}`);
}
