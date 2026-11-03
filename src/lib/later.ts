import { after } from "next/server";

/** Runs slow side work (email, balance checks) after the response. Outside a request it just fires. */
export function later(task: () => Promise<unknown>) {
  const run = () =>
    task().catch((error) => {
      console.error("later_task_failed", (error as Error)?.message);
    });
  try {
    after(run);
  } catch {
    void run();
  }
}
