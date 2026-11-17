/** Parse an admin API body. HTML 502/504 pages must not crash as "Unexpected token <". */
export async function readResponseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      "The desk timed out talking to iCash. Wait a few seconds, then retry from History — do not approve twice.",
    );
  }
}
