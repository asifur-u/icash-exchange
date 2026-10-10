import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const theme = {
  background: "#111111",
  color: "#f5f5f5",
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
