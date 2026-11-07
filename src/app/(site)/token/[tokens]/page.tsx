import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TokenCheckout } from "@/components/token-checkout";
import { tokenPackByTokens } from "@/lib/token-packs";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tokens: string }>;
}): Promise<Metadata> {
  const { tokens } = await params;
  const pack = tokenPackByTokens(Number(tokens));
  if (!pack) return { title: "Buy tokens" };
  return { title: `${pack.tokens} tokens`, description: `Send ${pack.price} taka for ${pack.tokens} tokens.` };
}

export default async function TokenPage({ params }: { params: Promise<{ tokens: string }> }) {
  const { tokens } = await params;
  const pack = tokenPackByTokens(Number(tokens));
  if (!pack) notFound();
  return <TokenCheckout pack={pack} />;
}
