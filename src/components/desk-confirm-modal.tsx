"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DESK_FEE_PERCENT } from "@/lib/desk-fee";

function taka(amount: number) {
  return `৳${new Intl.NumberFormat("en-IN").format(amount)}`;
}

export function DeskConfirmModal({
  open,
  onClose,
  onConfirm,
  productTitle,
  quantity,
  voucher,
  fee,
  total,
  loggedIn,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productTitle: string;
  quantity: number;
  voucher: number;
  fee: number;
  total: number;
  loggedIn: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/70 backdrop-blur-[6px]"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="desk-confirm-title"
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/12 bg-[#0f0f0f] shadow-[0_40px_120px_rgba(0,0,0,0.65)]"
          >
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Order summary
              </p>
              <h2
                id="desk-confirm-title"
                className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]"
              >
                Confirm what you pay
              </h2>
              <p className="mt-1 text-sm text-white/45">
                {productTitle} × {quantity}
              </p>
            </div>

            <div className="space-y-3 px-5 py-5 sm:px-6">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/55">Voucher</span>
                  <span className="font-semibold tabular-nums text-white">{taka(voucher)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/55">
                    Desk fee{" "}
                    <span className="text-white/35">· {DESK_FEE_PERCENT}%</span>
                  </span>
                  <span className="font-semibold tabular-nums text-white">{taka(fee)}</span>
                </div>
                <div className="my-3 h-px bg-white/10" />
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                      Total to pay
                    </p>
                    <p className="mt-1 text-xs text-white/40">bKash / Nagad / Rocket / Bank</p>
                  </div>
                  <p className="text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums text-white">
                    {taka(total)}
                  </p>
                </div>
              </div>

              <p className="text-center text-xs leading-relaxed text-white/40">
                Fee is added on top of the voucher. Deposit page will ask for this total.
              </p>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/10 bg-black/40 px-5 py-4 sm:flex-row sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="inline-flex h-12 flex-[1.4] items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                {loggedIn ? `Continue · ${taka(total)}` : "Sign in to continue"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
