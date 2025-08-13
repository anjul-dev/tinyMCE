import React, {
  useRef,
  useState,
  useEffect,
  type MouseEvent,
  // type KeyboardEvent,
} from "react";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import plugins from "suneditor/src/plugins";

// Type definitions
interface SunEditorCore {
  getSelection(): Selection | null;
  execCommand(command: string, showDefaultUI: boolean, value?: string): void;
  getContents(): string;
  context: {
    element: {
      wysiwyg: HTMLElement;
      toolbar: HTMLElement;
    };
  };
}

interface SunEditorInstance {
  core?: SunEditorCore;
  getContents?(): string;
  getSelection?(): Selection | null;
}

interface UploadResult {
  url: string;
  name: string;
  size: number;
}

interface UploadHandler {
  (result: { result: UploadResult[] }): void;
}

interface CustomButtonHandlers {
  [key: string]: (editor: SunEditorInstance) => void;
}

interface ButtonEventHandlers {
  btn: HTMLElement;
  handler: (event: Event) => void;
}

const SunEditorComponent: React.FC = () => {
  const editorInstanceRef = useRef<SunEditorInstance | null>(null);
  const toolbarRef = useRef<HTMLElement | null>(null);
  const selectionHandlerRef = useRef<(() => void) | null>(null);
  const customBtnHandlersRef = useRef<CustomButtonHandlers>({});
  const previewRef = useRef<HTMLDivElement | null>(null);

  const [content, setContent] = useState<string>("");
  const [isEditorReady, setIsEditorReady] = useState<boolean>(false);

  // ---------- Helpers ----------
  const escapeHtml = (str: string = ""): string =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const rgbToHex = (rgb: string): string => {
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

  const getSelectedCell = (
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

  const getSelectedHoverBox = (
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
  const scrollToAnchor = (anchorId: string): void => {
    const el = document.getElementById(anchorId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerY =
      rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2;
    window.scrollTo({ top: centerY, behavior: "smooth" });

    // highlight
    el.classList.add("anchor-highlight");
    setTimeout(() => el.classList.remove("anchor-highlight"), 2000);
  };

  // place caret after a node (useful after inserting interactive inline widgets)
  const setCaretAfter = (node: Node): void => {
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

  // ---------- Custom buttons ----------
  const customButtonHandlers: CustomButtonHandlers = {
    hoverArea: (editor: SunEditorInstance) => {
      const core = editor.core as SunEditorCore;
      const id = `hover-box-${Date.now()}`;
      const hoverBoxHTML = `
        <div id="${id}" class="hover-box" contenteditable="true" style="min-height:50px; margin: 0;">
          <p>Click here to edit your hover content...</p>
        </div>
        <p><br></p>
      `;
      core.execCommand("insertHTML", false, hoverBoxHTML);

      // Better caret positioning after insertion
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.add("hover-box");
          // Position caret in the paragraph after the hover box
          const nextP = el.nextElementSibling;
          if (nextP && nextP.tagName === "P") {
            const range = document.createRange();
            const sel = window.getSelection();
            range.setStart(nextP, 0);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
      }, 50); // Increased timeout
    },

    hoverBoxBgColor: (editor: SunEditorInstance) => {
      const core = editor.core || editor;
      const hoverBox = getSelectedHoverBox(core);
      if (!hoverBox) {
        alert(
          "Place the caret or select text inside a hover box and try again."
        );
        return;
      }
      const currentBg = getComputedStyle(hoverBox).backgroundColor;
      const input = document.createElement("input");
      input.type = "color";
      try {
        input.value = rgbToHex(currentBg || "#C9CADa");
      } catch {
        input.value = "#C9CADa";
      }
      input.style.position = "fixed";
      input.style.top = "-22px";
      input.style.left = "65%";
      input.style.transform = "translate(-50%, -50%)";
      input.style.zIndex = "9999"; // keep on top
      input.style.border = "none";
      input.style.width = "80px";
      input.style.height = "50px";
      input.style.cursor = "pointer";
      input.style.background = "transparent";
      document.body.appendChild(input);

      const onInput = (ev: Event) => {
        const target = ev.target as HTMLInputElement;
        const color = target.value;
        hoverBox.style.backgroundColor = color;
      };
      const cleanup = () => {
        input.removeEventListener("input", onInput);
        input.removeEventListener("change", cleanup);
        if (input.parentElement) input.parentElement.removeChild(input);
      };
      input.addEventListener("input", onInput);
      input.addEventListener("change", cleanup);
      input.click();
    },

    // ABBR: short form + full form tooltip (hover & click)
    abbr: (editor: SunEditorInstance) => {
      const core = editor.core as SunEditorCore;
      const sel = core.getSelection && core.getSelection();
      const selectedText = (sel && sel.toString()) || "";

      if (!selectedText) {
        alert("Please select the short form text first (like 'PDF').");
        return;
      }

      const fullForm = prompt(`Enter the full form for "${selectedText}":`);
      if (!fullForm) return;

      const abbrHtml = `
        <span class="abbr-tooltip" tabindex="0" data-full="${escapeHtml(
          fullForm
        )}">
          <span class="abbr-short">${escapeHtml(selectedText)}</span>
          <span class="abbr-full" role="note" aria-hidden="true">${escapeHtml(
            fullForm
          )}</span>
        </span>
        &nbsp;
      `;

      core.execCommand("insertHTML", false, abbrHtml);

      // move caret after inserted abbr so user can continue typing
      setTimeout(() => {
        // the last inserted abbr is likely the last .abbr-tooltip in wysiwyg
        const wysiwyg = core.context?.element?.wysiwyg;
        if (wysiwyg) {
          const last = wysiwyg.querySelector(".abbr-tooltip:last-of-type");
          if (last) setCaretAfter(last);
        }
      }, 30);
    },

    anchor: (editor: SunEditorInstance) => {
      const core = editor.core as SunEditorCore;
      const id = prompt("Enter anchor ID (e.g., table1):");
      if (!id) return;
      const clean = id.trim().replace(/[^a-zA-Z0-9-_]/g, "");
      if (!clean) return;

      // Insert only the invisible marker
      const html = `<span id="${clean}" class="anchor-point" data-anchor-id="${clean}" tabindex="-1" aria-hidden="true"></span>&nbsp;`;
      core.execCommand("insertHTML", false, html);
    },

    anchorLink: (editor: SunEditorInstance) => {
      const core = editor.core as SunEditorCore;
      const selText =
        (core.getSelection && core.getSelection()?.toString()) || "";
      const text = selText || prompt("Enter link text:");
      if (!text) return;
      const anchorId = prompt("Enter anchor ID to link to:");
      if (!anchorId) return;
      const clean = anchorId.trim().replace(/[^a-zA-Z0-9-_]/g, "");
      if (!clean) return;
      const html = `<a href="#${clean}" class="anchor-link">${escapeHtml(
        text
      )}</a>&nbsp;`;
      core.execCommand("insertHTML", false, html);
    },

    cellBgColor: (editor: SunEditorInstance) => {
      const core = editor.core || editor;
      const cell = getSelectedCell(core);
      if (!cell) {
        alert(
          "Place the caret or select text inside a table cell and try again."
        );
        return;
      }
      const currentBg = getComputedStyle(cell).backgroundColor;
      const input = document.createElement("input");
      input.type = "color";
      try {
        input.value = rgbToHex(currentBg || "#ffffff");
      } catch {
        input.value = "#ffffff";
      }
      input.style.position = "fixed";
      input.style.top = "-22px";
      input.style.left = "65%";
      input.style.transform = "translate(-50%, -50%)";
      input.style.zIndex = "9999"; // keep on top
      input.style.border = "none";
      input.style.width = "80px";
      input.style.height = "50px";
      input.style.cursor = "pointer";
      input.style.background = "transparent";
      document.body.appendChild(input);

      const onInput = (ev: Event) => {
        const target = ev.target as HTMLInputElement;
        const color = target.value;

        // Set both style attribute and bgcolor attribute for better compatibility
        cell.style.backgroundColor = color;
        cell.setAttribute("bgcolor", color);

        // Also ensure the style attribute is preserved
        const currentStyle = cell.getAttribute("style") || "";
        const styleWithoutBg = currentStyle.replace(
          /background-color\s*:[^;]*(;|$)/gi,
          ""
        );
        cell.setAttribute(
          "style",
          `${styleWithoutBg}background-color: ${color};`.replace(/^;+/, "")
        );
      };
      const cleanup = () => {
        input.removeEventListener("input", onInput);
        input.removeEventListener("change", cleanup);
        if (input.parentElement) input.parentElement.removeChild(input);
      };
      input.addEventListener("input", onInput);
      input.addEventListener("change", cleanup);
      input.click();
    },
  };

  customBtnHandlersRef.current = customButtonHandlers;

  const custumStyle = `
  <style>
    p, h1, h2, h3, h4, h5, h6, span, div { margin: 0; padding: 0; }
    .sun-editor-editable p { margin: 0 !important; margin-bottom: 0 !important; }
    .sun-editor-editable div { margin: 0 !important; }
    .abbr-tooltip { position: relative; display: inline-block; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
    .abbr-tooltip .abbr-short { font-weight: 600; }
    .abbr-tooltip .abbr-full {
      visibility: hidden;
      opacity: 0;
      transition: opacity .18s ease, transform .18s ease;
      transform: translateY(4px);
      position: absolute;
      left: 50%;
      top: calc(100% + 8px);
      transform: translateX(-50%) translateY(4px);
      white-space: nowrap;
      padding: 6px 10px;
      border-radius: 6px;
      box-shadow: 0 6px 14px rgba(0,0,0,0.18);
      background: #222;
      color: #fff;
      z-index: 9999;
      pointer-events:none;
      font-size: 13px;
    }
    .abbr-tooltip:hover .abbr-full { visibility: visible; opacity: 1; transform: translateX(50%) translateY(50%); pointer-events:auto; }
    .abbr-tooltip.show-full .abbr-full { visibility: visible; opacity: 1; transform: translateX(50%) translateY(50%); pointer-events:auto; }

    /* anchor visuals */
    .anchor-point {
      display: inline-block;
      width: 1;
      height: 1;
      background-color: black;
      overflow: hidden;
      padding: 10px;
      margin: 0;
      border: none;
      box-shadow: 0 0 0 6px rgba(25,118,210,0.12), 0 6px 16px rgba(0,0,0,0.12);
    }

    .anchor-link { color:#1976d2; text-decoration:underline; cursor:pointer; }

    .anchor-highlight {
      transition: box-shadow .25s ease, transform .25s ease;
      box-shadow: 0 0 0 6px rgba(25,118,210,0.12), 0 6px 16px rgba(0,0,0,0.12);
      transform: translateY(-2px);
      border-radius: 8px;
    }

    /* hover box & table styles kept */
    .hover-box {
      background-color: #C9CADa;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      border-radius: 2px;
      padding: 6px !important;
      margin: 0 !important;
    }
    .hover-box p { margin: 0 !important; }
    .sun-editor-editable table { width:100%; border-collapse:collapse; border:2px solid #ccc; }
    .sun-editor-editable th, .sun-editor-editable td { border:2px solid #ccc; padding:8px; }
  </style>
`;
  // ---------- Submit / preview click ----------
  const handleSubmit = (): void => {
    const inst = editorInstanceRef.current;
    if (!inst) return;

    // Try to get raw HTML directly from the WYSIWYG element
    const core = (inst.core as SunEditorCore) || inst;
    const wysiwyg = core?.context?.element?.wysiwyg;

    let html = "";

    if (wysiwyg) {
      // Get innerHTML directly from the WYSIWYG editor (unfiltered)
      html = wysiwyg.innerHTML;
      console.log("Raw WYSIWYG content:", html);
    } else {
      // Fallback to the filtered content
      html =
        (inst.getContents && inst.getContents()) ||
        (inst.core && inst.core.getContents && inst.core.getContents()) ||
        "";
      console.log("Filtered content:", html);
    }

    const styledHtml = `${custumStyle}<div class="sun-editor-editable">${html}</div>`;

    setContent(styledHtml);
    console.log("Content submitted:", html);
  };

  // preview click: intercept anchor links and center anchor
  const handlePreviewClick = (e: MouseEvent<HTMLDivElement>): void => {
    const target = e.target as HTMLElement;
    const link = target.closest("a");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (href.startsWith("#")) {
      e.preventDefault();
      const anchorId = href.substring(1);
      scrollToAnchor(anchorId);
      // window.location.href = `#${anchorId}`; // fallback to normal anchor link behavior
    }
  };

  // ---------- Editor ready: attach handlers for toolbar, selection watcher ----------
  const handleEditorReady = (sunEditor: SunEditorInstance): void => {
    editorInstanceRef.current = sunEditor;
    setIsEditorReady(true);
    const core = (sunEditor.core as SunEditorCore) || sunEditor;
    if (core?.context?.element?.wysiwyg) {
      core.context.element.wysiwyg.addEventListener("keydown", (e) => {
        if (e.key === "Backspace") {
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return;

          const range = sel.getRangeAt(0);
          if (!range.collapsed) return; // Only handle when nothing is selected

          // Check if we're at the start of a text node or element
          if (range.startOffset === 0) {
            const container = range.startContainer;
            let previousSibling = null;

            if (container.nodeType === Node.TEXT_NODE) {
              // If we're in a text node, check the previous sibling of the parent
              previousSibling = container.parentNode?.previousSibling;
            } else {
              // If we're in an element, check its previous sibling
              previousSibling = container.previousSibling;
            }

            // Check if the previous element is a hover box
            if (
              previousSibling &&
              previousSibling.nodeType === Node.ELEMENT_NODE &&
              (previousSibling as Element).classList?.contains("hover-box")
            ) {
              e.preventDefault();
              previousSibling.remove();
            }
          }
        }
      });
    }

    // Keep previous behavior: after inserting table add a blank paragraph
    if (core?.context?.element?.wysiwyg) {
      core.context.element.wysiwyg.addEventListener("input", () => {
        const sel = core.getSelection();
        if (!sel) return;
        const anchorNode = sel.anchorNode as Element | null;
        const table = anchorNode?.closest?.("table");
        if (table) {
          const nextSibling = table.nextSibling as Element | null;
          if (!nextSibling || nextSibling.tagName?.toLowerCase() !== "p") {
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            table.parentNode?.insertBefore(p, table.nextSibling);
          }
        }
      });
    }
  };

  // Attach toolbar buttons and selectionchange watcher
  useEffect(() => {
    if (!isEditorReady || !editorInstanceRef.current) return;

    const editor = editorInstanceRef.current;
    const core = (editor.core as SunEditorCore) || editor;
    const toolbar = core.context.element.toolbar;
    const editorWysiwyg = core.context.element.wysiwyg;
    toolbarRef.current = toolbar;

    const btnMap: { [key: string]: HTMLElement | null } = {
      hoverArea: toolbar.querySelector(
        '[data-command="hoverArea"], [title="Insert Hover Info Box"]'
      ),
      hoverBoxBgColor: toolbar.querySelector(
        '[data-command="hoverBoxBgColor"], [title="Set Hover Box Background Color"]'
      ),
      abbr: toolbar.querySelector(
        '[data-command="abbr"], [title="Insert Abbreviation with Tooltip"]'
      ),
      anchor: toolbar.querySelector(
        '[data-command="anchor"], [title="Insert Anchor Point"]'
      ),
      anchorLink: toolbar.querySelector(
        '[data-command="anchorLink"], [title="Insert Link to Anchor"]'
      ),
      cellBgColor: toolbar.querySelector(
        '[data-command="cellBgColor"], [title="Set Cell Background Color"]'
      ),
    };

    const attached: ButtonEventHandlers[] = [];
    Object.keys(btnMap).forEach((name) => {
      const btn = btnMap[name];
      if (!btn) return;
      const handler = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (customBtnHandlersRef.current[name]) {
          customBtnHandlersRef.current[name](editor);
        }
      };
      btn.addEventListener("click", handler);
      attached.push({ btn, handler });
    });

    if (btnMap.cellBgColor) {
      (btnMap.cellBgColor as HTMLButtonElement).style.display = "none";
      (btnMap.cellBgColor as HTMLButtonElement).disabled = true;
    }

    if (btnMap.hoverBoxBgColor) {
      (btnMap.hoverBoxBgColor as HTMLButtonElement).style.display = "none";
      (btnMap.hoverBoxBgColor as HTMLButtonElement).disabled = true;
    }

    const onSelectionChange = (): void => {
      try {
        const sel = window.getSelection();
        const node = sel ? sel.anchorNode || sel.focusNode : null;
        const insideEditor =
          node &&
          (node.nodeType === 3
            ? editorWysiwyg.contains(node.parentElement)
            : editorWysiwyg.contains(node as Node));
        const cell = insideEditor ? getSelectedCell(core) : null;
        const hoverBox = insideEditor ? getSelectedHoverBox(core) : null;

        if (btnMap.cellBgColor) {
          const cellBgBtn = btnMap.cellBgColor as HTMLButtonElement;
          if (cell) {
            cellBgBtn.style.display = "";
            cellBgBtn.disabled = false;
          } else {
            cellBgBtn.style.display = "none";
            cellBgBtn.disabled = true;
          }
        }

        if (btnMap.hoverBoxBgColor) {
          const hoverBoxBgBtn = btnMap.hoverBoxBgColor as HTMLButtonElement;
          if (hoverBox) {
            hoverBoxBgBtn.style.display = "";
            hoverBoxBgBtn.disabled = false;
          } else {
            hoverBoxBgBtn.style.display = "none";
            hoverBoxBgBtn.disabled = true;
          }
        }
      } catch {
        // ignore
      }
    };

    const handleBackspaceDelete = (e) => {
      if (e.key === "Backspace") {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        if (!range.collapsed) return;

        const startContainer = range.startContainer;
        const startOffset = range.startOffset;

        // Only proceed if we're at the beginning of a text node or empty position
        if (startContainer.nodeType === Node.TEXT_NODE && startOffset !== 0)
          return;

        // Get all hover boxes in the editor
        const allHoverBoxes = editorWysiwyg.querySelectorAll(".hover-box");

        // Check each hover box to see if cursor is right after it
        for (let hoverBox of allHoverBoxes) {
          const nextSibling = hoverBox.nextSibling;

          // Check various scenarios where cursor might be positioned after hover box
          if (
            // Cursor is in the next text node after hover box
            (nextSibling === startContainer && startOffset === 0) ||
            // Cursor is in a paragraph that immediately follows hover box
            (nextSibling &&
              nextSibling.contains &&
              nextSibling.contains(startContainer) &&
              startOffset === 0) ||
            // Cursor is in an element right after hover box
            (startContainer.nodeType === Node.ELEMENT_NODE &&
              startContainer.previousElementSibling === hoverBox &&
              startOffset === 0)
          ) {
            e.preventDefault();
            e.stopPropagation();
            hoverBox.remove();
            return false;
          }
        }
      }
    };

    editorWysiwyg.addEventListener("keydown", handleBackspaceDelete, true);

    document.addEventListener("selectionchange", onSelectionChange);
    selectionHandlerRef.current = onSelectionChange;

    return () => {
      attached.forEach(({ btn, handler }) =>
        btn.removeEventListener("click", handler)
      );
      document.removeEventListener("selectionchange", onSelectionChange);
      selectionHandlerRef.current = null;
      editorWysiwyg.removeEventListener("keydown", handleBackspaceDelete, true);
    };
  }, [isEditorReady]);

  // ---------- Delegated click handlers for abbr toggle (both editor & preview) ----------
  useEffect(() => {
    // show/hide abbr tooltips on click, and keep hover working
    const onDocClick = (e: Event): void => {
      const target = e.target as Element;
      const clickedAbbr = target.closest && target.closest(".abbr-tooltip");
      if (clickedAbbr) {
        // prevent normal caret placement inside the abbr
        e.preventDefault();
        e.stopPropagation();

        // close others
        document.querySelectorAll(".abbr-tooltip.show-full").forEach((el) => {
          if (el !== clickedAbbr) el.classList.remove("show-full");
        });

        // toggle this one
        clickedAbbr.classList.toggle("show-full");

        // if this abbr is inside the editor wysiwyg, put caret after it
        const core =
          editorInstanceRef.current &&
          ((editorInstanceRef.current.core as SunEditorCore) ||
            editorInstanceRef.current);
        const wysiwyg = core?.context?.element?.wysiwyg;
        if (wysiwyg && wysiwyg.contains(clickedAbbr)) {
          setTimeout(() => setCaretAfter(clickedAbbr), 10);
        }
        return;
      }

      // other clicks close any open abbrs
      document
        .querySelectorAll(".abbr-tooltip.show-full")
        .forEach((el) => el.classList.remove("show-full"));
    };

    const onKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (e.key === "Escape") {
        document
          .querySelectorAll(".abbr-tooltip.show-full")
          .forEach((el) => el.classList.remove("show-full"));
      }
    };

    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKeyDown as EventListener);
    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKeyDown as EventListener);
    };
  }, [isEditorReady]);

  // ---------- Image upload helper (unchanged) ----------
  const handleImageUploadBefore = (
    files: File[],
    info: object,
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

  // ---------- SunEditor options (keep your existing config) ----------
  const sunEditorOptions = {
    plugins,
    height: "500px",
    buttonList: [
      ["undo", "redo"],
      ["font", "fontSize", "formatBlock"],
      ["bold", "italic", "underline", "strike", "subscript", "superscript"],
      ["fontColor", "hiliteColor"],
      ["align", "horizontalRule", "list", "lineHeight"],
      ["outdent", "indent"],
      ["table", "link", "image", "video"],
      ["showBlocks", "codeView", "preview"],
      ["fullScreen"],
      ["removeFormat"],
      [
        {
          name: "hoverArea",
          display: "command",
          title: "Insert Hover Info Box",
          innerHTML: '<span style="font-size:12px;padding:0 4px">HA</span>',
        },
        {
          name: "hoverBoxBgColor",
          display: "command",
          title: "Set Hover Box Background Color",
          innerHTML: '<span style="font-size:14px;padding:0 4px">🎨</span>',
        },
        {
          name: "abbr",
          display: "command",
          title: "Insert Abbreviation with Tooltip",
          innerHTML: '<span style="font-size:12px;padding:0 4px">Abbr</span>',
        },
        {
          name: "anchor",
          display: "command",
          title: "Insert Anchor Point",
          innerHTML: '<span style="font-size:14px;padding:0 4px">⚓</span>',
        },
        {
          name: "anchorLink",
          display: "command",
          title: "Insert Link to Anchor",
          innerHTML: '<span style="font-size:14px;padding:0 4px">🔗</span>',
        },
        {
          name: "cellBgColor",
          display: "command",
          title: "Set Cell Background Color",
          innerHTML: '<span style="font-size:14px;padding:0 4px">🎨</span>',
        },
      ],
    ] as Array<
      | string[]
      | Array<{
          name: string;
          display: string;
          title: string;
          innerHTML: string;
        }>
    >,
    formats: ["p", "div", "h1", "h2", "h3", "h4", "h5", "h6"] as const,
    defaultTag: "div",
    minHeight: "300px",
    showPathLabel: false,
    charCounter: true,
    maxCharCount: 2000,
    width: "auto",
    maxWidth: "100%",
    imageAccept: ".jpg, .jpeg, .png, .gif, .webp",
    imageMultipleFile: false,
    imageUploadUrl: null,
    // Preserve inline styles including background colors
    removeFormatTags: ["del", "ins"],
    pasteTagsWhitelist:
      "p|div|h[1-6]|ul|ol|li|table|thead|tbody|tr|th|td|a|b|strong|i|em|u|s|span|br",
    attributesWhitelist: {
      all: "style|class|id",
      table: "style|class|id|cellpadding|cellspacing|border",
      td: "style|class|id|colspan|rowspan|bgcolor",
      th: "style|class|id|colspan|rowspan|bgcolor",
      tr: "style|class|id|bgcolor",
      a: "href|target|style|class|id",
      span: "style|class|id|data-*",
      div: "style|class|id",
      p: "style|class|id",
    },
  };

  // ---------- Render ----------
  return (
    <div className="p-6 max-w-5xl mx-auto bg-white min-h-screen">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* ----- Abbr tooltip ----- */
          p, h1, h2, h3, h4, h5, h6, span, div, { margin: 0; padding: 0; }
          div p { margin: 0; }
          .sun-editor-editable p { margin: 0 !important; margin-bottom: 0 !important; }
          .sun-editor-editable div { margin: 0 !important; }
          .abbr-tooltip { position: relative; display: inline-block; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
          .abbr-tooltip .abbr-short { font-weight: 600; }
          .abbr-tooltip .abbr-full {
            visibility: hidden;
            opacity: 0;
            transition: opacity .18s ease, transform .18s ease;
            transform: translateY(4px);
            position: absolute;
            left: 50%;
            top: calc(100% + 8px);
            transform: translateX(-50%) translateY(4px);
            white-space: nowrap;
            padding: 6px 10px;
            border-radius: 6px;
            box-shadow: 0 6px 14px rgba(0,0,0,0.18);
            background: #222;
            color: #fff;
            z-index: 9999;
            pointer-events:none;
            font-size: 13px;
          }
          .abbr-tooltip:hover .abbr-full { visibility: visible; opacity: 1; transform: translateX(50%) translateY(50%); pointer-events:auto; }
          .abbr-tooltip.show-full .abbr-full { visibility: visible; opacity: 1; transform: translateX(50%) translateY(50%); pointer-events:auto; }

          /* anchor visuals */
          .anchor-point {
            display: inline-block;
            width: 1;
            height: 1;
            background-color: black;
            overflow: hidden;
            padding: 10px;
            margin: 0;
            border: none;
            box-shadow: 0 0 0 6px rgba(25,118,210,0.12), 0 6px 16px rgba(0,0,0,0.12);
          }

          .anchor-link { color:#1976d2; text-decoration:underline; cursor:pointer; }

          .anchor-highlight {
            transition: box-shadow .25s ease, transform .25s ease;
            box-shadow: 0 0 0 6px rgba(25,118,210,0.12), 0 6px 16px rgba(0,0,0,0.12);
            transform: translateY(-2px);
            border-radius: 8px;
          }

          /* hover box & table styles kept */
          .hover-box {
            background-color: #C9CADa;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            border-radius: 2px;
            padding: 6px !important;
          }
          .hover-box p { margin: 0; }
          .sun-editor-editable table { width:100%; border-collapse:collapse; border:2px solid #ccc; }
          .sun-editor-editable th, .sun-editor-editable td { border:2px solid #ccc; padding:8px; }
        `,
        }}
      />

      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Admin Content Editor (SunEditor)
      </h1>

      {!isEditorReady && (
        <div className="w-full h-[500px] bg-gray-200 animate-pulse rounded mb-4" />
      )}

      <div style={{ display: isEditorReady ? "block" : "none" }}>
        <SunEditor
          getSunEditorInstance={handleEditorReady}
          setOptions={sunEditorOptions}
          onImageUploadBefore={handleImageUploadBefore}
          height="500px"
          setDefaultStyle="font-family: Helvetica, Arial, sans-serif; font-size: 14px;"
        />
      </div>

      {isEditorReady && (
        <button
          onClick={handleSubmit}
          className="mt-5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Save & Preview
        </button>
      )}

      {content && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Preview:</h2>
          <div
            ref={previewRef}
            className="sun-editor-editable max-w-none border border-gray-300 rounded p-4"
            dangerouslySetInnerHTML={{ __html: content }}
            onClick={handlePreviewClick}
          />
        </div>
      )}
    </div>
  );
};

export default SunEditorComponent;
