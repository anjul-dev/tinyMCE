import { ReactEditor } from 'slate-react';

export type CustomElement = {
  type: string;
  align?: string;
  children: CustomText[];
  url?: string;
  alt?: string;
  title?: string;
  href?: string;
  target?: string;
  id?: string;
  abbr?: string;
  definition?: string;
  rows?: TableRow[];
  hoverContent?: string;
  backgroundColor?: string;
  isEditMode?: boolean;
  fontSize?: string;
  width?: string;
  height?: string;
  colSpan?: number;
  rowSpan?: number;
  isHeader?: boolean;
  isSelected?: boolean;
  isMerged?: boolean;
  mergedCells?: { row: number; col: number }[];
};

export type TableRow = {
  type: 'table-row';
  children: TableCell[];
  isHeader?: boolean;
};

export type TableCell = {
  type: 'table-cell';
  children: CustomText[];
  backgroundColor?: string;
  colSpan?: number;
  rowSpan?: number;
  align?: string;
  isHeader?: boolean;
  isSelected?: boolean;
  isMerged?: boolean;
  mergedCells?: { row: number; col: number }[];
};

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  superscript?: boolean;
  subscript?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  strikethrough?: boolean;
  code?: boolean;
};

export type EditorProps = {
  initialValue?: CustomElement[];
  onChange?: (value: CustomElement[]) => void;
  onSave?: (value: CustomElement[]) => void;
  onHtmlChange?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
};

export type ToolbarProps = {
  editor: ReactEditor;
  onImageUpload: (file: File) => void;
  onToggleFullscreen: () => void;
  onSave: () => void;
  onTogglePreview: () => void;
  onToggleCode: () => void;
  isFullscreen: boolean;
  isPreview: boolean;
  isCodeView: boolean;
};

export type TableModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (rows: number, cols: number) => void;
};

export type ColorPickerProps = {
  onColorSelect: (color: string) => void;
  currentColor?: string;
  type?: 'text' | 'background';
};

export type ContextMenuProps = {
  x: number;
  y: number;
  onClose: () => void;
  options: Array<{ label: string; onClick: () => void; icon?: React.ReactNode }>;
  visible: boolean;
};

export type ResizableElementProps = {
  children: React.ReactNode;
  width?: string;
  height?: string;
  onResize?: (width: string, height: string) => void;
  minWidth?: number;
  minHeight?: number;
};

export type TableComponentProps = {
  element: CustomElement;
  attributes: any;
  children: React.ReactNode;
  editor: ReactEditor;
};

export type ImageComponentProps = {
  element: CustomElement;
  attributes: any;
  children: React.ReactNode;
  editor: ReactEditor;
};

export type HoverAreaComponentProps = {
  element: CustomElement;
  attributes: any;
  children: React.ReactNode;
  editor: ReactEditor;
};

export type PreviewProps = {
  content: CustomElement[];
};

export type CellSelection = {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
};

export type TableState = {
  selectedCells: CellSelection | null;
  contextMenu: { x: number; y: number; visible: boolean };
  isResizing: boolean;
  mergeMode: boolean;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
} 