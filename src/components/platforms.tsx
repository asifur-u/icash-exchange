"use client";

import Image from "next/image";
import { Frame } from "@/components/frame";
import { useT } from "@/i18n/provider";

const payments = [
  { id: "bkash", label: "bKash", logo: "/payments/bkash.png" },
  { id: "nagad", label: "Nagad", logo: "/payments/nagad.png" },
  { id: "rocket", label: "Rocket", logo: "/payments/rocket.png" },
  { id: "bank", label: "Bank", line: "NPSB / BEFTN", logo: "/payments/bank.png" },
] as const;

export function Platforms() {
  const t = useT();

  return (
    <section className="relative overflow-hidden bg-black py-16 sm:py-24 md:py-32">
      <Frame>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{t("home.payRails")}</p>
          <h3 className="mt-3 display-soft text-[clamp(1.8rem,6vw,2.8rem)]">
            {t("home.payRailsLead")} <span className="accent-red">{t("home.payRailsAccent")}</span>
          </h3>
        </div>
      </Frame>

      <div className="relative mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3 px-5 sm:mt-10">
        {payments.map((method) => (
          <div
            key={method.id}
            className="flex w-[132px] flex-col items-center gap-2 rounded-[22px] border border-white/12 bg-black px-4 py-4 sm:w-[150px]"
          >
            <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-black sm:h-14 sm:w-14">
              <Image
                src={method.logo}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="h-full w-full object-contain"
              />
            </span>
            <span className="text-center">
              <span className="block text-sm font-semibold tracking-tight text-white">{method.label}</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-white/40">
                {"line" in method ? method.line : t("home.sendMoney")}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
