import type { SunEditorOptions } from "suneditor/src/options";
import plugins from "suneditor/src/plugins";

// Add this helper function to create the color picker
export const createColorPicker = (
  currentColor: string,
  onColorChange: (color: string) => void
) => {
  // Preset colors
  const presetColors = [
    "#ffffff",
    "#f8f9fa",
    "#e9ecef",
    "#dee2e6",
    "#ced4da",
    "#adb5bd",
    "#6c757d",
    "#495057",
    "#343a40",
    "#212529",
    "#000000",
    "#fff3cd",
    "#ffeaa7",
    "#fdcb6e",
    "#e17055",
    "#d63031",
    "#74b9ff",
    "#0984e3",
    "#6c5ce7",
    "#a29bfe",
    "#fd79a8",
    "#e84393",
    "#00b894",
    "#00cec9",
    "#55a3ff",
    "#ff7675",
    "#fd79a8",
    "#fdcb6e",
    "#e17055",
    "#00b894",
    "#74b9ff",
    "#a29bfe",
  ];

  const pickerDiv = document.createElement("div");
  pickerDiv.className = "color-picker-popup";
  pickerDiv.innerHTML = `
    <div class="color-picker-content">
      <div class="preset-colors">
        ${presetColors
          .map(
            (color) =>
              `<div class="color-swatch" data-color="${color}" style="background-color: ${color}"></div>`
          )
          .join("")}
      </div>
      <div class="custom-color-section">
        <input type="color" class="custom-color-input" value="${currentColor}" />
        <button class="apply-btn">Apply</button>
        <button class="cancel-btn">Cancel</button>
      </div>
    </div>
  `;

  // Styling
  pickerDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    padding: 16px;
    min-width: 280px;
  `;

  document.body.appendChild(pickerDiv);

  // Event handlers
  const presetColorDivs = pickerDiv.querySelectorAll(".color-swatch");
  const customColorInput = pickerDiv.querySelector(
    ".custom-color-input"
  ) as HTMLInputElement;
  const applyBtn = pickerDiv.querySelector(".apply-btn") as HTMLButtonElement;
  const cancelBtn = pickerDiv.querySelector(".cancel-btn") as HTMLButtonElement;

  let selectedColor = currentColor;

  presetColorDivs.forEach((div) => {
    div.addEventListener("click", () => {
      selectedColor = (div as HTMLElement).dataset.color || "#ffffff";
      onColorChange(selectedColor);
      cleanup();
    });
  });

  customColorInput.addEventListener("input", (e) => {
    selectedColor = (e.target as HTMLInputElement).value;
  });

  applyBtn.addEventListener("click", () => {
    onColorChange(selectedColor);
    cleanup();
  });

  cancelBtn.addEventListener("click", cleanup);

  function cleanup() {
    if (pickerDiv.parentElement) {
      pickerDiv.parentElement.removeChild(pickerDiv);
    }
  }

  // Close on outside click
  setTimeout(() => {
    document.addEventListener(
      "click",
      (e) => {
        if (!pickerDiv.contains(e.target as Node)) {
          cleanup();
        }
      },
      { once: true }
    );
  }, 100);
};

export const editorStyles = `
    /* ----- Abbr tooltip ----- */
    p, h1, h2, h3, h4, h5, h6, span, div, { margin: 0; padding: 0; }
    div p { margin: 0; }
    // Add to your existing inline styles
    .color-picker-content { }
    .preset-colors { display: grid; grid-template-columns: repeat(11, 1fr); gap: 4px; margin-bottom: 12px; }
    .color-swatch { 
    width: 20px; 
    height: 20px; 
    border-radius: 4px; 
    cursor: pointer; 
    border: 2px solid #ddd;
    transition: transform 0.1s;
    }
    .color-swatch:hover { transform: scale(1.1); border-color: #007bff; }
    .custom-color-section { 
    display: flex; 
    gap: 8px; 
    align-items: center; 
    padding-top: 8px; 
    border-top: 1px solid #eee;
    }
    .custom-color-input { width: 60px; height: 30px; border: none; cursor: pointer; }
    .apply-btn, .cancel-btn { 
    padding: 4px 12px; 
    border: 1px solid #ddd; 
    background: white; 
    cursor: pointer; 
    border-radius: 4px;
    }
    .apply-btn { background: #007bff; color: white; }
    .apply-btn:hover { background: #0056b3; }
    .cancel-btn:hover { background: #f8f9fa; }
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
`;

// ---------- SunEditor options (keep your existing config) ----------
export const sunEditorOptions: SunEditorOptions = {
  plugins,
  height: "200px",
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
      {
        name: "previewBtn",
        display: "command",
        title: "Preview Section",
        innerHTML: '<span style="font-size:14px;padding:0 4px">👁️</span>',
      },
      {
        name: "SaveBtn",
        display: "command",
        title: "Save Button",
        innerHTML: '<span style="font-size:14px;padding:2px 4px">Save</span>',
      },
      {
        name: "disableBtn",
        display: "command",
        title: "Toggle Editor",
        innerHTML: '<span style="font-size:14px;padding:2px 4px">🚫</span>',
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
  formats: ["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"],
  defaultTag: "div",
  minHeight: "200px",
  showPathLabel: false,
  charCounter: true,
  maxCharCount: 2000,
  width: "auto",
  maxWidth: "100%",
  imageAccept: ".jpg, .jpeg, .png, .gif, .webp",
  imageMultipleFile: false,
  imageUploadUrl: undefined,
  // Preserve inline styles including background colors
  // removeFormatTags: ["del", "ins"],
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
