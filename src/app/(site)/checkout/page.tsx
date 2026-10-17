import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy checkout → account portal */
export default async function CheckoutRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; qty?: string }>;
}) {
  const query = await searchParams;
  const params = new URLSearchParams();
  if (query.product) params.set("product", query.product);
  params.set("qty", query.qty ?? "1");
  redirect(`/account/checkout?${params.toString()}`);
}
