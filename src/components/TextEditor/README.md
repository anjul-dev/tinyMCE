# Enhanced Rich Text Editor

A comprehensive, modular rich text editor built with Slate.js and React, featuring advanced table operations, image handling, color pickers, and more.

## Features

### 🎨 Text Formatting
- **Bold, Italic, Underline, Strikethrough**
- **Superscript and Subscript**
- **Text and Background Color Picker**
- **Font Size Selection**
- **Text Alignment (Left, Center, Right, Justify)**
- **Clear Formatting**

### 📋 Lists and Blocks
- **Bulleted and Numbered Lists**
- **Headings (H1, H2, H3)**
- **Block Quotes**
- **Paragraphs**

### 📊 Advanced Tables
- **Add/Remove Rows and Columns**
- **Merge and Unmerge Cells**
- **Cell Background Colors**
- **Cell Alignment**
- **Cell Selection and Multi-selection**
- **Resizable Tables**
- **Context Menu Operations**
- **Double-click to edit cells**

### 🖼️ Image Handling
- **Drag and Drop Image Upload**
- **Image Resizing**
- **Image Editing (URL, Alt, Title)**
- **Copy Image URL**
- **Download Images**
- **Delete Images**

### 🔗 Links and Anchors
- **External Links**
- **Internal Anchor Links**
- **Smooth Scrolling to Anchors**
- **Hover Areas with Tooltips**

### 🎯 Advanced Features
- **Fullscreen Mode**
- **Preview Mode**
- **Code View (JSON)**
- **Keyboard Shortcuts**
- **Undo/Redo**
- **Save Functionality**
- **HTML Output for Backend**

## Installation

```bash
npm install slate slate-react slate-history lucide-react
```

## Usage

```tsx
import { RichTextEditor } from './components/TextEditor';

function App() {
  const handleSave = (content) => {
    console.log('Content saved:', content);
    // Implement your save logic
  };

  const handleHtmlChange = (html) => {
    console.log('HTML for backend:', html);
    // Send this HTML to your backend
  };

  return (
    <RichTextEditor 
      onSave={handleSave}
      onHtmlChange={handleHtmlChange}
      placeholder="Start creating your content..."
    />
  );
}
```

## Table Operations

### How to Use Tables:
1. **Insert Table**: Click the table button in the toolbar
2. **Edit Cells**: Double-click any cell to edit its content
3. **Right-click Menu**: Right-click on any cell for options:
   - Add Row Above/Below
   - Add Column Left/Right
   - Remove Row/Column
   - Cell Background Color
   - Cell Alignment (Left/Center/Right)
   - Merge/Unmerge Cells
   - Delete Table

### Cell Selection:
- **Click and drag** to select multiple cells
- **Selected cells** will be highlighted in blue
- **Merge selected cells** via right-click menu

### Cell Editing:
- **Double-click** any cell to enter edit mode
- **Type your content** in the cell
- **Press Enter** or click outside to save
- **Escape** to cancel editing

## Components

### Core Components

- **`RichTextEditor`** - Main editor component
- **`Toolbar`** - Comprehensive formatting toolbar
- **`TableComponent`** - Advanced table with merge/split operations
- **`ImageComponent`** - Image handling with resize and edit
- **`ColorPicker`** - Color selection with predefined colors
- **`ResizableElement`** - Resizable wrapper for images and tables
- **`ContextMenu`** - Context menu for table operations

### Utility Functions

- **`utils.ts`** - All utility functions for editor operations
- **`types.ts`** - TypeScript type definitions

## Keyboard Shortcuts

- **Ctrl/Cmd + B** - Bold
- **Ctrl/Cmd + I** - Italic
- **Ctrl/Cmd + U** - Underline
- **Enter** - New paragraph
- **Shift + Enter** - Line break

## Color Picker

The color picker includes:
- **Custom color input**
- **Predefined color palette**
- **Text and background color options**
- **Transparent option**

## Image Features

- **Drag corners to resize**
- **Hover for controls**
- **Edit image properties**
- **Copy URL**
- **Download image**
- **Delete image**

## HTML Output

The editor generates clean HTML that you can send to your backend:

```tsx
const handleHtmlChange = (html: string) => {
  // Send to your backend API
  fetch('/api/save-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html })
  });
};
```

## Customization

### Props

```tsx
interface EditorProps {
  initialValue?: CustomElement[];
  onChange?: (value: CustomElement[]) => void;
  onSave?: (value: CustomElement[]) => void;
  onHtmlChange?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}
```

### Styling

The editor uses Tailwind CSS classes and can be customized by:
- Overriding CSS classes
- Using the `className` prop
- Modifying component styles

## File Structure

```
src/components/TextEditor/
├── index.ts              # Main exports
├── types.ts              # TypeScript types
├── utils.ts              # Utility functions
├── Editor.tsx            # Main editor component
├── Toolbar.tsx           # Toolbar component
├── TableComponent.tsx    # Table component
├── ImageComponent.tsx    # Image component
├── ColorPicker.tsx       # Color picker component
├── ResizableElement.tsx  # Resizable wrapper
├── ContextMenu.tsx       # Context menu component
└── README.md            # This file
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- **slate** - Core editor framework
- **slate-react** - React bindings
- **slate-history** - Undo/redo functionality
- **lucide-react** - Icons
- **react** - React framework

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use in your projects! 