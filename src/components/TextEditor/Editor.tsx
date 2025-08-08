import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  createEditor,
  Element as SlateElement,
  Transforms,
  Editor,
  Range,
  Path,
  Point,
} from "slate";
import type { Descendant } from "slate";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import type { RenderElementProps, RenderLeafProps } from "slate-react";
import { withHistory } from "slate-history";
import { useSlateStatic } from "slate-react";
import type { CustomElement, EditorProps } from "./types";
import Toolbar from "./Toolbar";
import TableComponent from "./TableComponent";
import ImageComponent from "./ImageComponent";
import { isHotkey, serializeToHtml } from "./utils";

// Leaf component for text formatting
const Leaf: React.FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
  let style: React.CSSProperties = {};

  if (leaf.color) style.color = leaf.color;
  if (leaf.backgroundColor) style.backgroundColor = leaf.backgroundColor;
  if (leaf.fontSize) style.fontSize = leaf.fontSize;

  if (leaf.bold) children = <strong>{children}</strong>;
  if (leaf.italic) children = <em>{children}</em>;
  if (leaf.underline) children = <u>{children}</u>;
  if (leaf.superscript) children = <sup>{children}</sup>;
  if (leaf.subscript) children = <sub>{children}</sub>;
  if (leaf.strikethrough) children = <del>{children}</del>;
  if (leaf.code)
    children = <code className="bg-gray-100 px-1 rounded">{children}</code>;

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
};

// Element component for block-level elements
const Element: React.FC<RenderElementProps> = ({
  attributes,
  children,
  element,
}) => {
  const editor = useSlateStatic();
  const style: React.CSSProperties = {
    textAlign: element.align || "left",
    fontSize: element.fontSize,
  };

  const scrollToAnchor = (anchorId: string) => {
    const anchorElement = document.getElementById(anchorId);
    if (anchorElement) {
      anchorElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  switch (element.type) {
    case "paragraph":
      return (
        <p {...attributes} style={style}>
          {children}
        </p>
      );
    case "heading-one":
      return (
        <h1 {...attributes} style={style}>
          {children}
        </h1>
      );
    case "heading-two":
      return (
        <h2 {...attributes} style={style}>
          {children}
        </h2>
      );
    case "heading-three":
      return (
        <h3 {...attributes} style={style}>
          {children}
        </h3>
      );
    case "block-quote":
      return (
        <blockquote
          {...attributes}
          style={style}
          className="border-l-4 border-gray-300 pl-4 italic"
        >
          {children}
        </blockquote>
      );
    case "bulleted-list":
      return (
        <ul {...attributes} style={style}>
          {children}
        </ul>
      );
    case "numbered-list":
      return (
        <ol {...attributes} style={style}>
          {children}
        </ol>
      );
    case "list-item":
      return (
        <li {...attributes} style={style}>
          {children}
        </li>
      );
    case "image":
      return (
        <ImageComponent
          element={element}
          attributes={attributes}
          children={children}
          editor={editor}
        />
      );
    case "table":
      return (
        <TableComponent
          element={element}
          attributes={attributes}
          children={children}
          editor={editor}
        />
      );
    case "link":
      const isAnchorLink = element.href?.startsWith("#");
      return (
        <a
          {...attributes}
          href={element.href}
          target={element.target}
          className="text-blue-600 underline hover:text-blue-800 cursor-pointer"
          onClick={
            isAnchorLink
              ? (e) => {
                  e.preventDefault();
                  scrollToAnchor(element.href!.substring(1));
                }
              : undefined
          }
        >
          {children}
        </a>
      );
    case "anchor":
      return (
        <span
          {...attributes}
          id={element.id}
          className="bg-yellow-100 px-1 py-0.5 rounded border-l-2 border-yellow-400"
        >
          {children}
        </span>
      );
    case "abbr":
      return (
        <abbr
          {...attributes}
          title={element.definition}
          className="border-b border-dotted border-gray-600 cursor-help"
        >
          {children}
        </abbr>
      );
    case "hover-area":
      return (
        <span {...attributes} className="inline-block">
          <span
            className="inline-block bg-blue-50 border border-blue-200 px-3 py-2 rounded-md shadow-sm hover:shadow-md hover:bg-blue-100 transition-all duration-200 cursor-pointer"
            contentEditable={false}
            style={{
              minWidth: "120px",
              minHeight: "32px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {element.children[0]?.text || "Hover Area"}
          </span>
        </span>
      );
    default:
      return (
        <p {...attributes} style={style}>
          {children}
        </p>
      );
  }
};

// Custom editor with enhanced functionality
const withCustomElements = (editor: ReactEditor) => {
  const { insertBreak, deleteBackward, normalizeNode } = editor;

  editor.insertBreak = () => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const [match] = Array.from(
        Editor.nodes(editor, {
          match: (n) =>
            SlateElement.isElement(n) &&
            ["table", "image", "hover-area"].includes(n.type),
        })
      );

      if (match) {
        // Always insert a new paragraph after special elements
        const [, path] = match;
        const nextPath = Path.next(path);

        Transforms.insertNodes(
          editor,
          { type: "paragraph", children: [{ text: "" }] },
          { at: nextPath }
        );
        Transforms.select(editor, nextPath);
        return;
      }
    }
    insertBreak();
  };

  editor.deleteBackward = (unit) => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const [match] = Array.from(
        Editor.nodes(editor, {
          match: (n) =>
            SlateElement.isElement(n) &&
            ["table", "image", "hover-area"].includes(n.type),
        })
      );

      if (match) {
        const [, path] = match;
        const start = Editor.start(editor, path);
        if (Point.equals(selection.anchor, start)) {
          // Delete the element if cursor is at the start
          Transforms.removeNodes(editor, { match: (n) => n === match[0] });
          return;
        }
      }
    }
    deleteBackward(unit);
  };

  return editor;
};

// Main Editor Component
const RichTextEditor: React.FC<EditorProps> = ({
  initialValue = [],
  onChange,
  onSave,
  onHtmlChange,
  placeholder = "Start typing...",
  readOnly = false,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isCodeView, setIsCodeView] = useState(false);
  const [savedContent, setSavedContent] = useState<Descendant[] | null>(null);

  const defaultValue: Descendant[] =
    initialValue.length > 0
      ? initialValue
      : [
          {
            type: "paragraph",
            children: [
              {
                text: "Welcome to the enhanced rich text editor! Try all the features:",
              },
            ],
          },
          {
            type: "bulleted-list",
            children: [
              {
                type: "list-item",
                children: [{ text: "Right-click tables for editing options" }],
              },
              {
                type: "list-item",
                children: [
                  { text: "Resize images and tables by dragging corners" },
                ],
              },
              {
                type: "list-item",
                children: [
                  { text: "Create anchor links that scroll smoothly" },
                ],
              },
              {
                type: "list-item",
                children: [
                  { text: "Use color pickers for text and background" },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            children: [{ text: "Start editing below..." }],
          },
        ];

  const [value, setValue] = useState<Descendant[]>(defaultValue);
  const [codeValue, setCodeValue] = useState("");

  const editor = useMemo(
    () => withCustomElements(withHistory(withReact(createEditor()))),
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isCodeView) {
      setCodeValue(JSON.stringify(value, null, 2));
    }
  }, [value, isCodeView]);

  useEffect(() => {
    onChange?.(value as CustomElement[]);
    onHtmlChange?.(serializeToHtml(value as CustomElement[]));
  }, [value, onChange, onHtmlChange]);

  const renderElement = useCallback(
    (props: RenderElementProps) => <Element {...props} />,
    []
  );
  const renderLeaf = useCallback(
    (props: RenderLeafProps) => <Leaf {...props} />,
    []
  );

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const image = {
        type: "image",
        url,
        alt: file.name,
        width: "300px",
        height: "auto",
        children: [{ text: "" }],
      };

      Transforms.insertNodes(editor, image);
      Transforms.insertNodes(editor, {
        type: "paragraph",
        children: [{ text: "" }],
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSavedContent([...value]);
    onSave?.(value as CustomElement[]);
    setTimeout(() => {
      alert("Content saved successfully!");
    }, 500);
  };

  const handleCodeChange = (newCode: string) => {
    setCodeValue(newCode);
    try {
      const parsed = JSON.parse(newCode);
      setValue(parsed);
    } catch (error) {
      // Invalid JSON, don't update
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (isHotkey("mod+b", event)) {
      event.preventDefault();
      const { toggleMark } = require("./utils");
      toggleMark(editor, "bold");
    }
    if (isHotkey("mod+i", event)) {
      event.preventDefault();
      const { toggleMark } = require("./utils");
      toggleMark(editor, "italic");
    }
    if (isHotkey("mod+u", event)) {
      event.preventDefault();
      const { toggleMark } = require("./utils");
      toggleMark(editor, "underline");
    }
  };

  const containerClasses = `
    ${
      isFullscreen
        ? "fixed inset-0 z-50 bg-white"
        : "max-w-6xl mx-auto bg-white rounded-lg shadow-lg"
    }
  `;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 min-h-screen bg-gray-100 ${className}`}>
      <div className={containerClasses}>
        <Slate
          editor={editor}
          initialValue={value}
          value={value}
          onChange={setValue}
        >
          <Toolbar
            editor={editor}
            onImageUpload={handleImageUpload}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            onSave={handleSave}
            onTogglePreview={() => setIsPreview(!isPreview)}
            onToggleCode={() => setIsCodeView(!isCodeView)}
            isFullscreen={isFullscreen}
            isPreview={isPreview}
            isCodeView={isCodeView}
          />

          <div className="flex gap-4 p-4">
            <div
              className={`${
                isPreview ? "w-1/2" : "w-full"
              } transition-all duration-300 overflow-x-auto`}
            >
              {isCodeView ? (
                <textarea
                  value={codeValue}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full h-96 p-4 font-mono text-sm border rounded-lg bg-gray-50"
                  placeholder="JSON code view..."
                />
              ) : (
                <div className="min-w-full">
                  <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    placeholder={placeholder}
                    className="min-h-96 p-4 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    spellCheck
                    autoFocus
                    readOnly={readOnly}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              )}
            </div>

            {isPreview && (
              <div className="w-1/2 transition-all duration-300 overflow-x-auto">
                <div className="p-4 bg-white border rounded-lg min-h-96 min-w-full">
                  <h3 className="text-lg font-semibold mb-4">Preview</h3>
                  <div className="prose max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: serializeToHtml(value as CustomElement[]),
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {savedContent && (
            <div className="p-4 border-t bg-green-50">
              <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                <span>✓</span>
                Content Saved Successfully
              </h4>
              <div className="text-sm text-gray-600">
                Last saved: {new Date().toLocaleString()}
              </div>
            </div>
          )}
        </Slate>
      </div>
    </div>
  );
};

export default RichTextEditor;
