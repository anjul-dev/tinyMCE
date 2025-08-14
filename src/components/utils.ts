import type { SunEditorCore, SunEditorInstance, UploadHandler } from "./SunEditor.type";

export const escapeHtml = (str: string = ""): string =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const rgbToHex = (rgb: string): string => {
  const m = (rgb || "").match(/\d+/g);
  if (!m || m.length < 3) return "#ffffff";
  const r = parseInt(m[0], 10);
  const g = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
};

export const getSelectedCell = (
  editorCoreLike: SunEditorCore | SunEditorInstance
): HTMLTableCellElement | null => {
  try {
    const core =
      (editorCoreLike as SunEditorInstance).core ||
      (editorCoreLike as SunEditorCore);
    const selection =
      (typeof core.getSelection === "function" && core.getSelection()) ||
      (window.getSelection ? window.getSelection() : null);
    if (!selection) return null;
    let node: Node | null = selection.anchorNode || selection.focusNode;
    if (!node) return null;
    if (node.nodeType === 3) node = node.parentElement;
    if (!node) return null;
    const element = node as Element;
    return element.closest
      ? (element.closest("td, th") as HTMLTableCellElement)
      : null;
  } catch (err) {
    console.error("Error getting selected cell:", err);
    return null;
  }
};

export const getSelectedHoverBox = (
  editorCoreLike: SunEditorCore | SunEditorInstance
): HTMLElement | null => {
  try {
    const core =
      (editorCoreLike as SunEditorInstance).core ||
      (editorCoreLike as SunEditorCore);
    const selection =
      (typeof core.getSelection === "function" && core.getSelection()) ||
      (window.getSelection ? window.getSelection() : null);
    if (!selection) return null;
    let node: Node | null = selection.anchorNode || selection.focusNode;
    if (!node) return null;
    if (node.nodeType === 3) node = node.parentElement;
    if (!node) return null;
    const element = node as Element;
    return element.closest
      ? (element.closest(".hover-box") as HTMLElement)
      : null;
  } catch (err) {
    console.error("Error getting selected hover box:", err);
    return null;
  }
};

// scroll anchor to center of viewport and highlight briefly
export const scrollToAnchor = (anchorId: string): void => {
  // Try to find the anchor element by ID or data attribute
  let el = document.getElementById(anchorId);
  if (!el) {
    el = document.querySelector(`[data-anchor-id="${anchorId}"]`);
  }
  
  if (!el) return;
  
  const rect = el.getBoundingClientRect();
  const centerY = rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2;
  window.scrollTo({ top: centerY, behavior: "smooth" });

  // highlight
  el.classList.add("anchor-highlight");
  setTimeout(() => el.classList.remove("anchor-highlight"), 2000);
};

// place caret after a node (useful after inserting interactive inline widgets)
export const setCaretAfter = (node: Node): void => {
  if (!node) return;
  try {
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  } catch (e) {
    console.error("Error setting caret after node:", e);
    // ignore
  }
};
// ---------- Image upload helper (unchanged) ----------
  export const handleImageUploadBefore = (
    files: File[],
    _info: object,
    uploadHandler: UploadHandler
  ): undefined => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      uploadHandler({
        result: [
          { url: reader.result as string, name: file.name, size: file.size },
        ],
      });
    };
    reader.readAsDataURL(file);
    return undefined;
  };