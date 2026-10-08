const steps = [
  { n: "1", label: "Catalog", detail: "Pick a note" },
  { n: "2", label: "Buy", detail: "Set quantity" },
  { n: "3", label: "Deposit", detail: "Send and prove" },
  { n: "4", label: "Code", detail: "Read it on your order" },
];

export function ProcessSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {steps.map((step, index) => {
        const on = index + 1 === current;
        const done = index + 1 < current;
        return (
          <li
            key={step.n}
            className={`rounded-2xl px-4 py-4 ${on ? "bg-white text-black" : "bg-white/[0.06] text-white"}`}
          >
            <p className={`text-xs font-semibold ${on ? "text-black/50" : "text-white/40"}`}>
              {done ? "Done" : `Step ${step.n}`}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{step.label}</p>
            <p className={`mt-1 text-sm ${on ? "text-black/60" : "text-white/45"}`}>{step.detail}</p>
          </li>
        );
      })}
    </ol>
  );
}
