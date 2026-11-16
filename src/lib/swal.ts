import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const theme = {
  background: "#0a0a0a",
  color: "#ffffff",
  confirmButtonColor: "#ffffff",
  cancelButtonColor: "#333333",
  customClass: {
    popup: "icash-swal",
    confirmButton: "icash-swal-confirm",
    title: "icash-swal-title",
    htmlContainer: "icash-swal-text",
  },
  buttonsStyling: true,
} as const;

export function notifySuccess(title: string, text?: string) {
  return Swal.fire({
    ...theme,
    icon: "success",
    title,
    text,
    confirmButtonText: "OK",
  });
}

export function notifyError(title: string, text?: string) {
  return Swal.fire({
    ...theme,
    icon: "error",
    title,
    text,
    confirmButtonText: "OK",
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function confirmStep(input: {
  title: string;
  html: string;
  yes: string;
  close: string;
}) {
  const result = await Swal.fire({
    ...theme,
    icon: "question",
    title: input.title,
    html: input.html,
    showCancelButton: true,
    confirmButtonText: input.yes,
    cancelButtonText: input.close,
    confirmButtonColor: "#e11d2e",
    reverseButtons: true,
    allowOutsideClick: false,
    customClass: {
      ...theme.customClass,
      cancelButton: "icash-swal-cancel",
    },
  });
  return result.isConfirmed;
}

export async function confirmReceived(input: {
  title: string;
  lead: string;
  method: string;
  trxId: string;
  yes: string;
  next: string;
  close: string;
  title2: string;
  lead2: string;
}) {
  const first = await confirmStep({
    title: input.title,
    html: `<p>${escapeHtml(input.lead)}</p>
      <p class="icash-swal-method">${escapeHtml(input.method)}</p>`,
    yes: input.next,
    close: input.close,
  });
  if (!first) return false;
  return confirmStep({
    title: input.title2,
    html: `<p>${escapeHtml(input.lead2)}</p>
      <p class="icash-swal-trx">${escapeHtml(input.trxId || "—")}</p>`,
    yes: input.yes,
    close: input.close,
  });
}
