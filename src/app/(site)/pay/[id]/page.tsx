import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy pay → account portal */
export default async function PayRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const qs = t ? `?t=${encodeURIComponent(t)}` : "";
  redirect(`/account/pay/${id}${qs}`);
}
