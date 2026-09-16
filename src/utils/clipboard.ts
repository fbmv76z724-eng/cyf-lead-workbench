export async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall through to the legacy copy path when browser permission fails.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied =
    typeof document.execCommand === "function"
      ? document.execCommand("copy")
      : false;
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard unavailable");
  }
}
