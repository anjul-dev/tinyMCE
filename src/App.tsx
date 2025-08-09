import { useState } from "react";
import { RichTextEditor } from "./components/TextEditor";
// import TinyEditor from "./components/Editor";

function App() {
  const [htmlOutput, setHtmlOutput] = useState<string>("");
  const [editorContent, setEditorContent] = useState<any>(null);

  const handleSave = (content: any) => {
    console.log("Content saved:", content);
  };

  const handleChange = (content: any) => {
    console.log("Content changed:", content);
    setEditorContent(content);
  };

  const handleHtmlChange = (html: string) => {
    console.log("HTML output:", html);
    setHtmlOutput(html);
  };

  return (
    // <>
    //   {/* <TinyEditor /> */}
    // </>
    <div className="min-h-screen bg-gray-50">
      <RichTextEditor
        onSave={handleSave}
        onChange={handleChange}
        onHtmlChange={handleHtmlChange}
        placeholder="Start creating your content..."
      />

      {/* Content Comparison */}
      {(htmlOutput || editorContent) && (
        <div className="max-w-6xl mx-auto mt-4 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Content Comparison</h3>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Editor Content (JSON) */}
            <div>
              <h4 className="font-semibold mb-2 text-blue-600">Editor Content (JSON)</h4>
              <div className="bg-gray-100 p-4 rounded border max-h-96 overflow-y-auto overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(editorContent, null, 2)}
                </pre>
              </div>
            </div>

            {/* HTML Output */}
            <div>
              <h4 className="font-semibold mb-2 text-green-600">HTML Output (for backend)</h4>
              <div className="bg-gray-100 p-4 rounded border max-h-96 overflow-y-auto overflow-x-auto">
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                  {htmlOutput}
                </pre>
              </div>
            </div>
          </div>

          {/* HTML Preview */}
          {htmlOutput && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-purple-600">HTML Preview (what backend receives)</h4>
              <div className="bg-white border rounded p-4 max-h-96 overflow-y-auto overflow-x-auto">
                <div className="min-w-full">
                  <div dangerouslySetInnerHTML={{ __html: htmlOutput }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
