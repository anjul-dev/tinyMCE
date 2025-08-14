import React, {
  useRef,
  useState,
  useEffect,
  type MouseEvent,
  // type KeyboardEvent,
} from "react";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import { createColorPicker, editorStyles, sunEditorOptions } from "./helper";
import {
  escapeHtml,
  rgbToHex,
  getSelectedCell,
  getSelectedHoverBox,
  setCaretAfter,
  // scrollToAnchor,
  handleImageUploadBefore,
} from "./utils";
import type {
  ButtonEventHandlers,
  CustomButtonHandlers,
  SunEditorCore,
  SunEditorInstance,
} from "./SunEditor.type";
import type { default as SunEditorType } from "suneditor/src/lib/core";

const SunEditorComponent: React.FC = () => {
  const editorInstanceRef = useRef<SunEditorInstance | null>(null);
  const toolbarRef = useRef<HTMLElement | null>(null);
  const selectionHandlerRef = useRef<(() => void) | null>(null);
  const customBtnHandlersRef = useRef<CustomButtonHandlers>({});
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  const [content, setContent] = useState<string>("");
  const [isEditorReady, setIsEditorReady] = useState<boolean>(false);
  const [isEditorDisabled, setIsEditorDisabled] = useState<boolean>(false);

  // ---------- Custom buttons ----------
  const customButtonHandlers: CustomButtonHandlers = {
    previewBtn: () => {
      handleSubmit();
      setPreviewOpen(!previewOpen);
    },
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
      let currentColor;
      try {
        currentColor = rgbToHex(currentBg || "#C9CADa");
      } catch {
        currentColor = "#C9CADa";
      }

      createColorPicker(currentColor, (color) => {
        hoverBox.style.backgroundColor = color;
      });
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
      let currentColor;
      try {
        currentColor = rgbToHex(currentBg || "#ffffff");
      } catch {
        currentColor = "#ffffff";
      }

      createColorPicker(currentColor, (color) => {
        cell.style.backgroundColor = color;
        cell.setAttribute("bgcolor", color);
        const currentStyle = cell.getAttribute("style") || "";
        const styleWithoutBg = currentStyle.replace(
          /background-color\s*:[^;]*(;|$)/gi,
          ""
        );
        cell.setAttribute(
          "style",
          `${styleWithoutBg}background-color: ${color};`.replace(/^;+/, "")
        );
      });
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

      // Insert the anchor point with both id and data-anchor-id for better compatibility
      const html = `<span id="${clean}" class="anchor-point" data-anchor-id="${clean}" tabindex="-1" aria-hidden="true">⚓</span>&nbsp;`;
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
    disableBtn: () => {
      const newDisabledState = !isEditorDisabled;
      setIsEditorDisabled(newDisabledState);

      const editor = editorInstanceRef.current;
      if (editor) {
        const core = (editor.core as SunEditorCore) || editor;

        // Update button text dynamically
        const toolbar = core.context.element.toolbar;
        const disableBtn = toolbar.querySelector('[data-command="disableBtn"]');
        if (disableBtn) {
          const span = disableBtn.querySelector("span");
          if (span) {
            span.textContent = newDisabledState ? "✅" : "🚫";
          }
        }

        // Toggle editor functionality
        if (core?.context?.element?.wysiwyg) {
          core.context.element.wysiwyg.contentEditable =
            (!newDisabledState).toString();

          if (newDisabledState) {
            core.context.element.wysiwyg.style.backgroundColor = "#f5f5f5";
            core.context.element.wysiwyg.style.cursor = "not-allowed";
          } else {
            core.context.element.wysiwyg.style.backgroundColor = "";
            core.context.element.wysiwyg.style.cursor = "";
          }
        }
      }

      console.log(`Editor ${newDisabledState ? "disabled" : "enabled"}`);
    },

    SaveBtn: () => {
      console.log("Save button clicked");
      handleSubmit();
    },
  };

  customBtnHandlersRef.current = customButtonHandlers;

  const custumStyle = `
  <style>
    ${editorStyles}
  </style>
`;

  const handleContentChange = (content: string) => {
    // Auto-save the content
    setContent(content);
    
    console.log("Content auto-saved:", content);
  };
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
  // Update your existing handlePreviewClick function:
  const handlePreviewClick = (e: MouseEvent<HTMLDivElement>): void => {
    const target = e.target as HTMLElement;
    const link = target.closest("a.anchor-link");

    if (link) {
      e.preventDefault();
      e.stopPropagation();

      const href = link.getAttribute("href") || "";
      if (href.startsWith("#")) {
        const anchorId = href.substring(1);
        const previewContainer = previewRef.current;

        if (previewContainer) {
          // Look for the anchor within the preview container
          const anchorElement =
            previewContainer.querySelector(`#${anchorId}`) ||
            previewContainer.querySelector(`[data-anchor-id="${anchorId}"]`);

          if (anchorElement) {
            // Scroll within the preview container
            anchorElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });

            // Add highlight effect
            anchorElement.classList.add("anchor-highlight");
            setTimeout(() => {
              anchorElement.classList.remove("anchor-highlight");
            }, 2000);
          } else {
            console.log(`Anchor with ID "${anchorId}" not found in preview`);
          }
        }
      }
    }
  };

  // ---------- Editor ready: attach handlers for toolbar, selection watcher ----------
  const handleEditorReady = (sunEditor: SunEditorType): void => {
    editorInstanceRef.current = sunEditor as unknown as SunEditorInstance;
    setIsEditorReady(true);
    const core = (sunEditor.core as unknown as SunEditorCore) || sunEditor;
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
      // core.context.element.wysiwyg.addEventListener("click", (e) => {
      //   const target = e.target as HTMLElement;
      //   const link = target.closest("a.anchor-link");

      //   if (link) {
      //     e.preventDefault();
      //     e.stopPropagation();

      //     const href = link.getAttribute("href") || "";
      //     if (href.startsWith("#")) {
      //       const anchorId = href.substring(1);
      //       const wysiwyg = core.context.element.wysiwyg;

      //       // Look for the anchor within the editor
      //       const anchorElement =
      //         wysiwyg.querySelector(`#${anchorId}`) ||
      //         wysiwyg.querySelector(`[data-anchor-id="${anchorId}"]`);

      //       if (anchorElement) {
      //         // Scroll the anchor into view within the editor
      //         anchorElement.scrollIntoView({
      //           behavior: "smooth",
      //           block: "center",
      //           inline: "nearest",
      //         });

      //         // Add highlight effect
      //         anchorElement.classList.add("anchor-highlight");
      //         setTimeout(() => {
      //           anchorElement.classList.remove("anchor-highlight");
      //         }, 2000);
      //       } else {
      //         console.log(`Anchor with ID "${anchorId}" not found in editor`);
      //       }
      //     }
      //   }
      // });
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
      SaveBtn: toolbar.querySelector(
        '[data-command="SaveBtn"], [title="Save Button"]'
      ),
      disableBtn: toolbar.querySelector(
        '[data-command="disableBtn"], [title="Toggle Editor"]'
      ),
      previewBtn: toolbar.querySelector(
        '[data-command="previewBtn"], [title="Preview"]'
      ),
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

    const handleBackspaceDelete = (e: KeyboardEvent) => {
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
        for (const hoverBox of allHoverBoxes) {
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
              (startContainer as Element).previousElementSibling === hoverBox &&
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

  // ---------- Render ----------
  return (
    <div className="p-6 max-w-5xl mx-auto bg-white min-h-[200px]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          ${editorStyles}
        `,
        }}
      />

      {!isEditorReady && (
        <div className="w-full h-[200px] bg-gray-200 animate-pulse rounded mb-4" />
      )}

      <div style={{ display: isEditorReady ? "block" : "none" }}>
        <SunEditor
          getSunEditorInstance={handleEditorReady}
          setOptions={sunEditorOptions}
          onImageUploadBefore={handleImageUploadBefore}
          onChange={handleContentChange}
          height="200px"
          defaultValue="<p>Start typing your content here...</p>"
          setDefaultStyle="font-family: Helvetica, Arial, sans-serif; font-size: 14px;"
        />
      </div>

      {/* {isEditorReady && (
        <button
          onClick={handleSubmit}
          className="mt-5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Save & Preview  
        </button>
      )} */}

      {previewOpen && content && (
        <div className="absolute top-1/2 left-1/2 z-[9999999999] w-2xl bg-white border border-gray-300 rounded shadow-lg p-4 -translate-x-1/2 -translate-y-1/2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Preview:</h2>
            <button
              className="border border-gray-200 px-4 py-1 rounded-md text-white bg-red-800 transition"
              onClick={() => setPreviewOpen(false)}
            >
              close
            </button>
          </div>

          <div
            ref={previewRef}
            className="sun-editor-editable max-w-none border border-gray-300 rounded p-4 overflow-y-auto max-h-[300px]"
            dangerouslySetInnerHTML={{ __html: content }}
            onClick={handlePreviewClick}
          />
        </div>
      )}
    </div>
  );
};

export default SunEditorComponent;
