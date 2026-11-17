/** Parse an admin API body. HTML 502/504 pages must not crash as "Unexpected token <". */
export async function readResponseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      response.status === 504 || response.status === 502
        ? "iCash took too long. Wait, then retry once from History — do not approve twice."
        : "The desk sent an error page instead of JSON. Refresh and retry once.",
    );
  }
}
