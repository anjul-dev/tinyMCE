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

    // Check if cursor is inside a hover box and handle deletion/exit
    let currentNode: Node | null = startContainer;
    while (currentNode) {
      if (currentNode.nodeType === Node.ELEMENT_NODE && 
          (currentNode as Element).classList?.contains("hover-box")) {
        const hoverBoxElement = currentNode as Element;
        
        // Check if we're at the very beginning of the hover box content
        const isAtBeginning = () => {
          const firstTextNode = hoverBoxElement.querySelector("p")?.firstChild ||
                                hoverBoxElement.firstChild;
          return (startContainer === firstTextNode && startOffset === 0) ||
                 (startContainer === hoverBoxElement && startOffset === 0);
        };
        
        if (isAtBeginning()) {
          e.preventDefault();
          e.stopPropagation();
          
          // Create a paragraph after the hover box if it doesn't exist
          let nextElement = hoverBoxElement.nextSibling;
          if (!nextElement || 
              (nextElement.nodeType === Node.ELEMENT_NODE && 
               (nextElement as Element).tagName !== 'P')) {
            const newP = document.createElement('p');
            newP.innerHTML = '<br>';
            hoverBoxElement.parentNode?.insertBefore(newP, hoverBoxElement.nextSibling);
            nextElement = newP;
          }
          
          // Position cursor in the next element
          if (nextElement) {
            const newRange = document.createRange();
            newRange.setStart(nextElement, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
          
          // Delete the hover box
          hoverBoxElement.remove();
          return false;
        }
        
        // Handle Ctrl+Backspace or when hover box is empty - delete entire hover box
        if (e.ctrlKey || hoverBoxElement.textContent?.trim() === "" || 
            hoverBoxElement.innerHTML.trim() === "<p><br></p>" ||
            hoverBoxElement.innerHTML.trim() === "<br>") {
          
          e.preventDefault();
          e.stopPropagation();
          
          // Create a paragraph after the hover box if it doesn't exist
          let nextElement = hoverBoxElement.nextSibling;
          if (!nextElement || 
              (nextElement.nodeType === Node.ELEMENT_NODE && 
               (nextElement as Element).tagName !== 'P')) {
            const newP = document.createElement('p');
            newP.innerHTML = '<br>';
            hoverBoxElement.parentNode?.insertBefore(newP, hoverBoxElement.nextSibling);
            nextElement = newP;
          }
          
          // Position cursor in the next element
          if (nextElement) {
            const newRange = document.createRange();
            newRange.setStart(nextElement, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
          
          // Delete the hover box
          hoverBoxElement.remove();
          return false;
        }
        
        break; // Found hover box parent, stop looking
      }
      currentNode = currentNode.parentNode;
    }

    // Enhanced function to find the closest hover box before current position
    const findPreviousHoverBox = (node: Node, offset: number): Element | null => {
      let current: Node | null = node;
      let currentOffset = offset;

      while (current) {
        if (current.nodeType === Node.TEXT_NODE && currentOffset === 0) {
          // Look at previous siblings
          let prev = current.previousSibling;
          while (prev) {
            if (prev.nodeType === Node.ELEMENT_NODE) {
              const element = prev as Element;
              if (element.classList?.contains("hover-box")) {
                return element;
              }
              // Check for hover box at the end of this element
              const lastHoverBox = element.querySelector(".hover-box:last-of-type");
              if (lastHoverBox && element.lastElementChild === lastHoverBox) {
                return lastHoverBox as Element;
              }
              return null;
            }
            prev = prev.previousSibling;
          }
          
          // Move up to parent
          current = current.parentNode;
          currentOffset = 0;
        }
        else if (current.nodeType === Node.ELEMENT_NODE && currentOffset === 0) {
          const element = current as Element;
          
          // Check previous siblings
          let prev = element.previousSibling;
          while (prev) {
            if (prev.nodeType === Node.ELEMENT_NODE) {
              const prevElement = prev as Element;
              if (prevElement.classList?.contains("hover-box")) {
                return prevElement;
              }
              return null;
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
          return null;
        }
      }
      
      return null;
    };

    // Find and delete hover box that should be deleted
    const hoverBoxToDelete = findPreviousHoverBox(startContainer, startOffset);
    
    if (hoverBoxToDelete) {
      e.preventDefault();
      e.stopPropagation();
      
      // Create a paragraph where the cursor should be positioned
      const newP = document.createElement('p');
      newP.innerHTML = '<br>';
      hoverBoxToDelete.parentNode?.insertBefore(newP, hoverBoxToDelete.nextSibling);
      
      // Position cursor in the new paragraph
      const newRange = document.createRange();
      newRange.setStart(newP, 0);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      
      // Delete the hover box
      hoverBoxToDelete.remove();
      
      return false;
    }
  }

  // Handle Escape key to exit hover box
  if (e.key === "Escape") {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const startContainer = range.startContainer;

    // Check if cursor is inside a hover box
    let currentNode: Node | null = startContainer;
    while (currentNode) {
      if (currentNode.nodeType === Node.ELEMENT_NODE && 
          (currentNode as Element).classList?.contains("hover-box")) {
        
        e.preventDefault();
        e.stopPropagation();
        
        const hoverBoxElement = currentNode as Element;
        
        // Find or create the next paragraph after hover box
        let nextElement = hoverBoxElement.nextSibling;
        
        // If next element doesn't exist or is not a paragraph, create one
        if (!nextElement || 
            (nextElement.nodeType === Node.ELEMENT_NODE && 
             (nextElement as Element).tagName !== 'P')) {
          const newP = document.createElement('p');
          newP.innerHTML = '<br>';
          hoverBoxElement.parentNode?.insertBefore(newP, nextElement);
          nextElement = newP;
        }
        
        // Position cursor at the beginning of the next element
        if (nextElement) {
          const newRange = document.createRange();
          if (nextElement.nodeType === Node.TEXT_NODE) {
            newRange.setStart(nextElement, 0);
          } else {
            newRange.setStart(nextElement, 0);
          }
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
        
        return false;
      }
      currentNode = currentNode.parentNode;
    }
  }
};