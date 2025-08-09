import React, { useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";

import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/plugins/table";
import "tinymce/plugins/code";
import "tinymce/plugins/image";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/anchor";
import "tinymce/plugins/fullscreen";

const TinyEditor: React.FC = () => {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const [content, setContent] = useState<string>("");
  const [isEditorReady, setIsEditorReady] = useState(false);

  const handleSubmit = () => {
    const editor = editorRef.current;
    if (editor) {
      const html = editor.getContent();
      console.log("Content submitted:", html);
      setContent(html);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "A" &&
      target.getAttribute("href")?.startsWith("#")
    ) {
      e.preventDefault();
      const anchorId = target.getAttribute("href")?.substring(1);
      if (anchorId) {
        const element = document.getElementById(anchorId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Admin Content Editor
      </h1>

      {!isEditorReady && (
        <div className="w-full h-[500px] bg-gray-200 animate-pulse rounded mb-4" />
      )}

      <div style={{ display: isEditorReady ? "block" : "none" }}>
        <Editor
          tinymceScriptSrc="/tinymce/tinymce.min.js"
          licenseKey="gpl"
          onInit={(_, editor) => {
            editorRef.current = editor;
            setIsEditorReady(true);
          }}
          init={{
            promotion: false,
            branding: false,
            onboarding: false,
            height: 500,
            menubar: true,
            plugins: [
              "table",
              "code",
              "image",
              "lists",
              "link",
              // "textcolor",
              // "colorpicker",
              "fullscreen",
              "anchor",
              // "color",
            ],
            toolbar:
              "undo redo | formatselect | bold italic backcolor forecolor | " +
              "alignleft aligncenter alignright alignjustify | " +
              "bullist numlist outdent indent | removeformat | image | table | code | fullscreen | abbr | anchor | anchorlink | hoverarea",
            automatic_uploads: true,
            file_picker_types: "image",
            file_picker_callback: (cb, _value, meta) => {
              if (meta.filetype === "image") {
                const input = document.createElement("input");
                input.setAttribute("type", "file");
                input.setAttribute("accept", "image/*");
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = reader.result as string;
                    cb(base64, { title: file.name });
                  };
                  reader.readAsDataURL(file);
                };
                input.click();
              }
            },
            setup: (editor) => {
              // Hover Area button
              editor.ui.registry.addButton("hoverarea", {
                text: "HoverArea",
                tooltip: "Insert Hover Info Box",
                onAction: () => {
                  // Create a unique ID for the hover box
                  const hoverBoxId = `hover-box-${Date.now()}`;

                  // Insert the hover box directly into the editor
                  const html = `
                    <div id="${hoverBoxId}" class="hover-box" contenteditable="true" style="min-height: 50px; cursor: text;">
                      <p>Click here to edit your hover content...</p>
                    </div>
                  `;

                  editor.insertContent(html);

                  // Focus on the newly created hover box
                  setTimeout(() => {
                    const hoverBox = editor
                      .getBody()
                      .querySelector(`#${hoverBoxId}`);
                    if (hoverBox) {
                      // Select all placeholder text so user can start typing immediately
                      editor.selection.select(hoverBox);
                      editor.selection.collapse(false);
                      // hoverBox.focus();
                    }
                  }, 100);
                },
              });

              // Abbreviation button
              editor.ui.registry.addButton("abbr", {
                text: "Abbr",
                tooltip: "Insert Abbreviation with Tooltip",
                onAction: () => {
                  const selectedText = editor.selection.getContent({
                    format: "text",
                  });
                  if (!selectedText) {
                    alert(
                      "Please select a short form text first (like 'PDF')."
                    );
                    return;
                  }
                  const fullForm = prompt(
                    `Enter the full form for "${selectedText}":`
                  );
                  if (fullForm) {
                    const html = `
                      <span class="abbr-tooltip">
                        ${selectedText}
                        <span class="abbr-tooltip-text">${fullForm}</span>
                      </span>`;
                    editor.insertContent(html);
                  }
                },
              });

              // Anchor point
              editor.ui.registry.addButton("anchor", {
                text: "⚓",
                tooltip: "Insert Anchor Point",
                onAction: () => {
                  const anchorId = prompt("Enter anchor ID (e.g., table1):");
                  if (anchorId && anchorId.trim()) {
                    const cleanId = anchorId
                      .trim()
                      .replace(/[^a-zA-Z0-9-_]/g, "");
                    if (cleanId) {
                      const html = `<span id="${cleanId}" class="anchor-point" data-anchor-id="${cleanId}">⚓ ${cleanId}</span>`;
                      editor.insertContent(html);
                    }
                  }
                },
              });

              // Anchor link
              editor.ui.registry.addButton("anchorlink", {
                text: "🔗",
                tooltip: "Insert Link to Anchor",
                onAction: () => {
                  const selectedText = editor.selection.getContent({
                    format: "text",
                  });
                  const linkText = selectedText || prompt("Enter link text:");
                  if (linkText) {
                    const anchorId = prompt("Enter anchor ID to link to:");
                    if (anchorId && anchorId.trim()) {
                      const cleanId = anchorId
                        .trim()
                        .replace(/[^a-zA-Z0-9-_]/g, "");
                      if (cleanId) {
                        const html = `<a href="#${cleanId}" class="anchor-link">${linkText}</a>`;
                        if (selectedText) editor.selection.setContent(html);
                        else editor.insertContent(html);
                      }
                    }
                  }
                },
              });

              // Anchor link behavior
              editor.on("click", (e) => {
                const target = e.target as HTMLElement;
                if (
                  target.tagName === "A" &&
                  target.getAttribute("href")?.startsWith("#")
                ) {
                  e.preventDefault();
                  const anchorId = target.getAttribute("href")?.substring(1);
                  if (anchorId) {
                    const anchorElement = editor
                      .getBody()
                      .querySelector(`#${anchorId}`);
                    if (anchorElement) {
                      anchorElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                      (anchorElement as HTMLElement).style.backgroundColor =
                        "#ffeb3b";
                      setTimeout(() => {
                        (anchorElement as HTMLElement).style.backgroundColor =
                          "";
                      }, 2000);
                    }
                  }
                }
              });
            },
            content_style: `
              body { font-family: Helvetica, Arial, sans-serif; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; border: 2px solid #ccc; }
              th, td { border: 2px solid #ccc; padding: 8px; }

              .abbr-tooltip {
                position: relative;
                display: inline-block;
                cursor: pointer;
                background: #fff;
                color: #000;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 500;
              }
              .abbr-tooltip-text {
                visibility: hidden;
                opacity: 0;
                transition: opacity 0.3s ease;
                position: absolute;
                bottom: 125%;
                left: 50%;
                transform: translateX(-50%);
                background-color: #333;
                color: #fff;
                padding: 6px 10px;
                border-radius: 6px;
                white-space: nowrap;
                z-index: 999;
                text-align: center;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                pointer-events: none;
              }
              .abbr-tooltip:hover .abbr-tooltip-text {
                visibility: visible;
                opacity: 1;
              }

              .anchor-point {
                display: inline-block;
                background: #e3f2fd;
                color: #1976d2;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                margin: 2px;
                border: 1px solid #bbdefb;
              }

              .anchor-link {
                color: #1976d2;
                text-decoration: underline;
                cursor: pointer;
              }
              .anchor-link:hover {
                color: #0d47a1;
                background-color: #e3f2fd;
              }

              .hover-box {
                background-color: #f0f4ff;
                border: 1px solid #c3dafe;
                padding: 10px;
                margin: 12px 0;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                font-size: 15px;
                color: #000;
                line-height: 1.6;
                position: relative;
                transition: border-color 0.2s ease;
              }
              .hover-box:hover {
                border-color: #1976d2;
              }
              .hover-box:focus {
                outline: none;
                border-color: #1976d2;
                box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
              }
              .hover-box p {
                margin: 0 0 8px 0;
              }
              .hover-box p:last-child {
                margin-bottom: 0;
              }
            `,
          }}
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
          <style>{`
            .abbr-tooltip { position: relative; display: inline-block; cursor: pointer; background: #fff; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 500; }
            .abbr-tooltip-text { visibility: hidden; opacity: 0; transition: opacity 0.3s ease; position: absolute; bottom: 125%; left: 50%; transform: translateX(-50%); background-color: #333; color: #fff; padding: 6px 10px; border-radius: 6px; white-space: nowrap; z-index: 999; text-align: center; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); pointer-events: none; }
            .abbr-tooltip:hover .abbr-tooltip-text { visibility: visible; opacity: 1; }
            .anchor-point { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin: 2px; border: 1px solid #bbdefb; }
            .anchor-link { color: #1976d2; text-decoration: underline; cursor: pointer; }
            .anchor-link:hover { color: #0d47a1; background-color: #e3f2fd; }
            .hover-box { background-color: #f0f4ff; border: 2px solid #c3dafe; padding: 16px; border-radius: 8px; margin: 12px 0; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); font-size: 15px; color: #000; line-height: 1.6; position: relative; transition: border-color 0.2s ease; }
            .hover-box:hover { border-color: #1976d2; }
            .hover-box:focus { outline: none; border-color: #1976d2; box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2); }
            .hover-box p { margin: 0 0 8px 0; }
            .hover-box p:last-child { margin-bottom: 0; }
          `}</style>
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Preview:</h2>
          <div
            className="prose prose-sm max-w-none border border-gray-300 rounded p-4"
            dangerouslySetInnerHTML={{ __html: content }}
            onClick={handlePreviewClick}
          />
        </div>
      )}
    </div>
  );
};

export default TinyEditor;
