import React, { useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";

const TinyEditor: React.FC = () => {
  const editorRef = useRef<any>(null);
  const [content, setContent] = useState<string>("");

  const handleSubmit = () => {
    if (editorRef.current) {
      const html = editorRef.current.getContent();
      console.log("Content submitted:", html);
      setContent(html); // Simulate API post
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Admin Content Editor
      </h1>

      {/* TinyMCE Editor */}
      <Editor
        apiKey="s39hbpjunpob6ul1ig3zabqmtgzcexd3crvc81fsr888uc7l" // your key
        onInit={(_, editor) => (editorRef.current = editor)}
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
          ],
          toolbar:
            "undo redo | formatselect | bold italic backcolor forecolor | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | removeformat | image | table | code",

          automatic_uploads: true,
          file_picker_types: "image",

          // For choosing an image from device
          file_picker_callback: (cb, value, meta) => {
            if (meta.filetype === "image") {
              const input = document.createElement("input");
              input.setAttribute("type", "file");
              input.setAttribute("accept", "image/*");

              input.onchange = function () {
                const file = input.files?.[0];
                const reader = new FileReader();

                reader.onload = function () {
                  const base64 = reader.result as string;
                  cb(base64, { title: file?.name });
                };

                if (file) {
                  reader.readAsDataURL(file);
                }
              };

              input.click();
            }
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
