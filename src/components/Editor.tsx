import React, { useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";

const TinyEditor: React.FC = () => {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const [content, setContent] = useState<string>("");

  const handleSubmit = () => {
    const editor = editorRef.current;
    if (editor) {
      const html = editor.getContent();
      console.log("Content submitted:", html);
      setContent(html);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Admin Content Editor
      </h1>

      {/* TinyMCE Editor */}
      <Editor
        apiKey="s39hbpjunpob6ul1ig3zabqmtgzcexd3crvc81fsr888uc7l"
        onInit={(_, editor) => {
          editorRef.current = editor;
        }}
        init={{
          onboarding: false,
          height: 500,
          menubar: true,
          plugins: [
            "table",
            "code",
            "image",
            "lists",
            "link",
            "textcolor",
            "colorpicker",
            "fullscreen",
          ],
          toolbar:
            "undo redo | formatselect | bold italic backcolor forecolor | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | removeformat | image | table | code | fullscreen | abbr",
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
            editor.ui.registry.addButton("abbr", {
              text: "Abbr",
              tooltip: "Insert Abbreviation with Tooltip",
              onAction: () => {
                const selectedText = editor.selection.getContent({ format: "text" });
                if (!selectedText) {
                  alert("Please select a short form text first (like 'PDF').");
                  return;
                }
                const fullForm = prompt(`Enter the full form for "${selectedText}":`);
                if (fullForm) {
                  const html = `<span title="${fullForm}" style="text-decoration: underline;">${selectedText}</span>`;
                  editor.insertContent(html);
                }
              },
            });
          },
          content_style: `
            body {
              font-family: Helvetica, Arial, sans-serif;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #ccc;
            }
            th, td {
              border: 2px solid #ccc;
              padding: 8px;
            }
          `,
        }}
      />

      <button
        onClick={handleSubmit}
        className="mt-5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Save & Preview
      </button>

      {/* Preview Section */}
      {content && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Preview:</h2>
          <div
            className="prose prose-sm max-w-none border border-gray-300 rounded p-4"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}
    </div>
  );
};

export default TinyEditor;
