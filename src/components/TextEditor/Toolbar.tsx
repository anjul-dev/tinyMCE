import React, { useState, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List,
  ListOrdered,
  RemoveFormatting,
  Table,
  Code,
  Maximize,
  Link,
  Anchor,
  Save,
  Eye,
  FileImage,
  Superscript,
  Subscript,
  Underline,
  Strikethrough,
  Type
} from 'lucide-react';
import type { ToolbarProps } from './types';
import { 
  isMarkActive, 
  toggleMark, 
  isBlockActive, 
  toggleBlock,
  createTable,
  insertImage,
  insertLink,
  insertAnchor,
  insertHoverArea,
  addMark
} from './utils';
import { Transforms, Editor } from 'slate';
import ColorPicker from './ColorPicker';

const TableModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onInsert: (rows: number, cols: number) => void;
}> = ({ isOpen, onClose, onInsert }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Insert Table</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rows:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Columns:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={cols}
              onChange={(e) => setCols(parseInt(e.target.value) || 1)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => onInsert(rows, cols)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Insert Table
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const Toolbar: React.FC<ToolbarProps> = ({ 
  editor, 
  onImageUpload, 
  onToggleFullscreen, 
  onSave,
  onTogglePreview,
  onToggleCode,
  isFullscreen,
  isPreview,
  isCodeView 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<'text' | 'bg' | null>(null);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  const insertTable = (rows: number, cols: number) => {
    const table = createTable(rows, cols);
    Transforms.insertNodes(editor, table);
    Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] });
    setShowTableModal(false);
  };

  const insertLinkHandler = () => {
    const url = prompt('Enter URL:');
    if (url) {
      insertLink(editor, url);
    }
  };

  const insertAnchorHandler = () => {
    const id = prompt('Enter anchor ID:');
    if (id) {
      insertAnchor(editor, id);
    }
  };

  const insertAnchorLink = () => {
    const anchorId = prompt('Enter anchor ID to link to:');
    if (anchorId) {
      const link = {
        type: 'link',
        href: `#${anchorId}`,
        children: [{ text: `Go to ${anchorId}` }]
      };
      Transforms.insertNodes(editor, link);
    }
  };

  const insertHoverAreaHandler = () => {
    const text = prompt('Enter display text:') || 'Hover text';
    const hoverContent = prompt('Enter hover content:') || 'Hover content';
    insertHoverArea(editor, text, hoverContent);
  };

  const setFontSize = (size: string) => {
    addMark(editor, 'fontSize', size);
    setShowFontSizePicker(false);
  };

  const clearFormatting = () => {
    Editor.removeMark(editor, 'bold');
    Editor.removeMark(editor, 'italic');
    Editor.removeMark(editor, 'underline');
    Editor.removeMark(editor, 'superscript');
    Editor.removeMark(editor, 'subscript');
    Editor.removeMark(editor, 'strikethrough');
    Editor.removeMark(editor, 'color');
    Editor.removeMark(editor, 'backgroundColor');
    Editor.removeMark(editor, 'fontSize');
  };

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];

  return (
    <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 bg-gray-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {/* Block Format Dropdown */}
      <select
        className="p-2 border rounded hover:bg-gray-200 text-sm"
        onChange={(e) => {
          const format = e.target.value;
          if (format) {
            toggleBlock(editor, format);
          }
        }}
        value=""
      >
        <option value="">Format</option>
        <option value="paragraph">Paragraph</option>
        <option value="heading-one">Heading 1</option>
        <option value="heading-two">Heading 2</option>
        <option value="heading-three">Heading 3</option>
        <option value="block-quote">Quote</option>
      </select>

      {/* Font Size */}
      <div className="relative">
        <button
          className="p-2 rounded hover:bg-gray-200 text-sm flex items-center gap-1"
          onClick={() => setShowFontSizePicker(!showFontSizePicker)}
          title="Font Size"
        >
          <Type size={16} />
          <span>Size</span>
        </button>
        {showFontSizePicker && (
          <div className="absolute top-full left-0 z-10 bg-white border border-gray-300 rounded shadow-lg p-2 min-w-[120px]">
            {fontSizes.map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm"
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-gray-400 mx-1"></div>
      
      {/* Text formatting buttons */}
      <button
        className={`p-2 rounded hover:bg-gray-200 ${isMarkActive(editor, 'bold') ? 'bg-gray-300' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'bold');
        }}
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </button>

      <button
        className={`p-2 rounded hover:bg-gray-200 ${isMarkActive(editor, 'italic') ? 'bg-gray-300' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'italic');
        }}
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </button>

      <button
        className={`p-2 rounded hover:bg-gray-200 ${isMarkActive(editor, 'underline') ? 'bg-gray-300' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'underline');
        }}
        title="Underline (Ctrl+U)"
      >
        <Underline size={16} />
      </button>

      <button
        className={`p-2 rounded hover:bg-gray-200 ${isMarkActive(editor, 'strikethrough') ? 'bg-gray-300' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'strikethrough');
        }}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>

      <button
        className={`p-2 rounded hover:bg-gray-200 ${isMarkActive(editor, 'superscript') ? 'bg-gray-300' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'superscript');
        }}
        title="Superscript"
      >
        <Superscript size={16} />
      </button>

      <button
        className={`p-2 rounded hover:bg-gray-200 ${isMarkActive(editor, 'subscript') ? 'bg-gray-300' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'subscript');
        }}
        title="Subscript"
      >
        <Subscript size={16} />
      </button>

      <div className="w-px h-6 bg-gray-400 mx-1"></div>

      {/* Color buttons */}
      <ColorPicker 
        onColorSelect={(color) => {
          addMark(editor, 'color', color);
        }}
        type="text"
      />

      <ColorPicker 
        onColorSelect={(color) => {
          addMark(editor, 'backgroundColor', color);
        }}
        type="background"
      />

      <div className="w-px h-6 bg-gray-400 mx-1"></div>

      {/* Alignment */}
      <button
        className={`p-2 rounded hover:bg-gray-200 ${isBlockActive(editor, 'left', 'align') ? 'bg-gray-300' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, 'left');
        }}
        title="Align Left"
      >
        <AlignLeft size={16} />
      </button>

      <button
        className={`p-2 rounded hover:bg-gray-200 ${isBlockActive(editor, 'center', 'align') ? 'bg-gray-300' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, 'center');
        }}
        title="Align Center"
      >
        <AlignCenter size={16} />
      </button>

      <button
        className={`p-2 rounded hover:bg-gray-200 ${isBlockActive(editor, 'right', 'align') ? 'bg-gray-300' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, 'right');
        }}
        title="Align Right"
      >
        <AlignRight size={16} />
      </button>

      <button
        className={`p-2 rounded hover:bg-gray-200 ${isBlockActive(editor, 'justify', 'align') ? 'bg-gray-300' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, 'justify');
        }}
        title="Justify"
      >
        <AlignJustify size={16} />
      </button>

      <div className="w-px h-6 bg-gray-400 mx-1"></div>

      {/* Lists */}
      <button
        className={`p-2 rounded hover:bg-gray-200 ${isBlockActive(editor, 'bulleted-list') ? 'bg-gray-300' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, 'bulleted-list');
        }}
        title="Bulleted List"
      >
        <List size={16} />
      </button>

      <button
        className={`p-2 rounded hover:bg-gray-200 ${isBlockActive(editor, 'numbered-list') ? 'bg-gray-300' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, 'numbered-list');
        }}
        title="Numbered List"
      >
        <ListOrdered size={16} />
      </button>

      <div className="w-px h-6 bg-gray-400 mx-1"></div>

      {/* Insert elements */}
      <button
        className="p-2 rounded hover:bg-gray-200"
        onClick={handleImageClick}
        title="Insert Image"
      >
        <FileImage size={16} />
      </button>

      <button
        className="p-2 rounded hover:bg-gray-200"
        onClick={() => setShowTableModal(true)}
        title="Insert Table"
      >
        <Table size={16} />
      </button>

      <button
        className="p-2 rounded hover:bg-gray-200"
        onClick={insertLinkHandler}
        title="Insert Link"
      >
        <Link size={16} />
      </button>

      <button
        className="p-2 rounded hover:bg-gray-200"
        onClick={insertAnchorHandler}
        title="Insert Anchor"
      >
        <Anchor size={16} />
      </button>

      <button
        className="p-2 rounded hover:bg-gray-200 text-sm px-2"
        onClick={insertAnchorLink}
        title="Link to Anchor"
      >
        AL
      </button>

      <button
        className="p-2 rounded hover:bg-gray-200 text-sm px-2"
        onClick={insertHoverAreaHandler}
        title="Insert Hover Area"
      >
        HVR
      </button>

      <div className="w-px h-6 bg-gray-400 mx-1"></div>

      {/* Utility buttons */}
      <button
        className="p-2 rounded hover:bg-gray-200"
        onClick={clearFormatting}
        title="Clear Formatting"
      >
        <RemoveFormatting size={16} />
      </button>

      <div className="w-px h-6 bg-gray-400 mx-1"></div>

      {/* View toggles */}
      <button
        className={`p-2 rounded hover:bg-gray-200 ${isCodeView ? 'bg-gray-300' : ''}`}
        onClick={onToggleCode}
        title="Code View"
      >
        <Code size={16} />
      </button>

      <button
        className={`p-2 rounded hover:bg-gray-200 ${isFullscreen ? 'bg-gray-300' : ''}`}
        onClick={onToggleFullscreen}
        title="Fullscreen"
      >
        <Maximize size={16} />
      </button>

      <button
        className={`p-2 rounded hover:bg-gray-200 ${isPreview ? 'bg-gray-300' : ''}`}
        onClick={onTogglePreview}
        title="Preview"
      >
        <Eye size={16} />
      </button>

      <button
        className="p-2 rounded hover:bg-gray-200 bg-blue-100"
        onClick={onSave}
        title="Save"
      >
        <Save size={16} />
      </button>

      <TableModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onInsert={insertTable}
      />
    </div>
  );
};

export default Toolbar; 