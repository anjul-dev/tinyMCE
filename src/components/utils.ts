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

  // Replace your handleBackspaceDelete function with this comprehensive version:

export const handleBackspaceDelete = (e: KeyboardEvent) => {
  if (e.key === "Backspace") {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (!range.collapsed) return; // Only handle when nothing is selected

    const startContainer = range.startContainer;
    const startOffset = range.startOffset;

    // Helper function to find the closest hover box before current position
    const findPreviousHoverBox = (node: Node, offset: number): Element | null => {
      let current: Node | null = node;
      let currentOffset = offset;

      while (current) {
        // If we're in a text node at the beginning
        if (current.nodeType === Node.TEXT_NODE && currentOffset === 0) {
          // Check previous sibling
          let prev = current.previousSibling;
          while (prev) {
            if (prev.nodeType === Node.ELEMENT_NODE) {
              const element = prev as Element;
              if (element.classList?.contains("hover-box")) {
                return element;
              }
              // If it's another element, check if it contains a hover box at the end
              const lastHoverBox = element.querySelector(".hover-box:last-of-type");
              if (lastHoverBox && element.lastElementChild === lastHoverBox) {
                return lastHoverBox as Element;
              }
              return null; // Found non-hover-box element, stop searching
            }
            prev = prev.previousSibling;
          }
          
          // Move up to parent
          current = current.parentNode;
          currentOffset = 0;
        }
        // If we're in an element at the beginning
        else if (current.nodeType === Node.ELEMENT_NODE && currentOffset === 0) {
          const element = current as Element;
          
          // Check if this element itself follows a hover box
          let prev = element.previousSibling;
          while (prev) {
            if (prev.nodeType === Node.ELEMENT_NODE) {
              const prevElement = prev as Element;
              if (prevElement.classList?.contains("hover-box")) {
                return prevElement;
              }
              return null; // Found non-hover-box element
            }
            // Skip empty text nodes
            if (prev.nodeType === Node.TEXT_NODE && prev.textContent?.trim() === '') {
              prev = prev.previousSibling;
              continue;
            }
            return null;
          }
          
          // Check previous element sibling of parent
          const prevElementSibling = element.previousElementSibling;
          if (prevElementSibling?.classList?.contains("hover-box")) {
            return prevElementSibling;
          }
          
          // Move up to parent
          current = current.parentNode;
          currentOffset = 0;
        }
        else {
          // Not at the beginning, no hover box to delete
          return null;
        }
      }
      
      return null;
    };

    // Find the hover box that should be deleted
    const hoverBoxToDelete = findPreviousHoverBox(startContainer, startOffset);
    
    if (hoverBoxToDelete) {
      e.preventDefault();
      e.stopPropagation();
      
      // Position cursor after the hover box before deleting it
      const range = document.createRange();
      range.setStartAfter(hoverBoxToDelete);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      
      // Delete the hover box
      hoverBoxToDelete.remove();
      
      return false;
    }

    // Additional check: if cursor is actually inside a hover box content
    // and we're at the very beginning, delete the hover box instead of editing it
    let parentHoverBox = startContainer.parentNode;
    while (parentHoverBox && parentHoverBox.nodeType === Node.ELEMENT_NODE) {
      if ((parentHoverBox as Element).classList?.contains("hover-box")) {
        // Check if we're at the very beginning of the hover box content
        const hoverBoxElement = parentHoverBox as Element;
        const firstChild = hoverBoxElement.firstChild;
        
        if (firstChild && 
            ((firstChild === startContainer && startOffset === 0) ||
             (firstChild.nodeType === Node.ELEMENT_NODE && 
              firstChild.contains(startContainer) && startOffset === 0))) {
          
          e.preventDefault();
          e.stopPropagation();
          
          // Position cursor before the hover box
          const range = document.createRange();
          range.setStartBefore(hoverBoxElement);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          
          // Delete the hover box
          hoverBoxElement.remove();
          
          return false;
        }
        break;
      }
      parentHoverBox = parentHoverBox.parentNode;
    }
  }
};