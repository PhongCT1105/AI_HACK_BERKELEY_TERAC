// Shared evidence cleanup so legacy rows without evidence_text_clean still render safely.
export function cleanEvidenceText(raw: string | null | undefined): string {
  if (!raw) return "";

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Not JSON — treat as plain text below.
  }

  let text: string;
  if (Array.isArray(parsed)) {
    const sentences = parsed
      .map((item) => {
        if (item && typeof item === "object" && "sentence" in (item as Record<string, unknown>)) {
          return String((item as Record<string, unknown>).sentence ?? "").trim();
        }
        return null;
      })
      .filter((sentence): sentence is string => Boolean(sentence))
      .slice(0, 5);
    text = sentences.map((sentence) => `• ${sentence}`).join("\n");
  } else {
    text = String(raw).replace(/"href"\s*:\s*\[[^\]]*\]\s*,?/g, "");
    text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }

  return text.slice(0, 1200);
}
