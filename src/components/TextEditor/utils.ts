import { Editor, Element as SlateElement, Transforms, Text } from 'slate';
import type { CustomElement, CustomText, TableRow, TableCell, CellSelection } from './types';

// Mark utilities
export const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format as keyof typeof marks] === true : false;
};

export const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const addMark = (editor: Editor, format: string, value: any) => {
  Editor.addMark(editor, format, value);
};

// Block utilities
export const isBlockActive = (editor: Editor, format: string, blockType = 'type') => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType as keyof CustomElement] === format,
    })
  );

  return !!match;
};

export const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(
    editor,
    format,
    format === 'left' || format === 'center' || format === 'right' || format === 'justify' ? 'align' : 'type'
  );

  const isList = format === 'bulleted-list' || format === 'numbered-list';

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      ['bulleted-list', 'numbered-list'].includes(n.type),
    split: true,
  });

  let newProperties: Partial<CustomElement>;
  if (format === 'left' || format === 'center' || format === 'right' || format === 'justify') {
    newProperties = {
      align: isActive ? undefined : format,
    };
  } else {
    newProperties = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    };
  }

  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

// HTML Conversion Utilities
export const serializeToHtml = (nodes: CustomElement[]): string => {
  const serializeNode = (node: CustomElement | CustomText): string => {
    if (Text.isText(node)) {
      let string = node.text;
      
      if (node.bold) string = `<strong>${string}</strong>`;
      if (node.italic) string = `<em>${string}</em>`;
      if (node.underline) string = `<u>${string}</u>`;
      if (node.strikethrough) string = `<del>${string}</del>`;
      if (node.superscript) string = `<sup>${string}</sup>`;
      if (node.subscript) string = `<sub>${string}</sub>`;
      if (node.code) string = `<code>${string}</code>`;
      
      if (node.color) string = `<span style="color: ${node.color}">${string}</span>`;
      if (node.backgroundColor) string = `<span style="background-color: ${node.backgroundColor}">${string}</span>`;
      if (node.fontSize) string = `<span style="font-size: ${node.fontSize}">${string}</span>`;
      
      return string;
    }

    const element = node as CustomElement;
    const children = element.children.map(serializeNode).join('');
    const style: string[] = [];
    
    if (element.align) style.push(`text-align: ${element.align}`);
    if (element.fontSize) style.push(`font-size: ${element.fontSize}`);
    
    const styleAttr = style.length > 0 ? ` style="${style.join('; ')}"` : '';

    switch (element.type) {
      case 'paragraph':
        return `<p${styleAttr}>${children}</p>`;
      case 'heading-one':
        return `<h1${styleAttr}>${children}</h1>`;
      case 'heading-two':
        return `<h2${styleAttr}>${children}</h2>`;
      case 'heading-three':
        return `<h3${styleAttr}>${children}</h3>`;
      case 'block-quote':
        return `<blockquote${styleAttr}>${children}</blockquote>`;
      case 'bulleted-list':
        return `<ul${styleAttr}>${children}</ul>`;
      case 'numbered-list':
        return `<ol${styleAttr}>${children}</ol>`;
      case 'list-item':
        return `<li${styleAttr}>${children}</li>`;
      case 'image': {
        const imgStyle = [];
        if (element.width) imgStyle.push(`width: ${element.width}`);
        if (element.height) imgStyle.push(`height: ${element.height}`);
        const imgStyleAttr = imgStyle.length > 0 ? ` style="${imgStyle.join('; ')}"` : '';
        return `<img src="${element.url || ''}" alt="${element.alt || ''}" title="${element.title || ''}"${imgStyleAttr} />`;
      }
      case 'table': {
        if (!element.rows) return '';
        const tableStyle = [];
        if (element.width) tableStyle.push(`width: ${element.width}`);
        if (element.height) tableStyle.push(`height: ${element.height}`);
        const tableStyleAttr = tableStyle.length > 0 ? ` style="${tableStyle.join('; ')}"` : '';
        
        const tableRows = element.rows.map(row => {
          const rowCells = row.children.map(cell => {
            const cellStyle = [];
            if (cell.backgroundColor) cellStyle.push(`background-color: ${cell.backgroundColor}`);
            if (cell.align) cellStyle.push(`text-align: ${cell.align}`);
            cellStyle.push('border: 1px solid #4a5568', 'padding: 12px');
            const cellStyleAttr = cellStyle.length > 0 ? ` style="${cellStyle.join('; ')}"` : '';
            const cellContent = cell.children.map(serializeNode).join('');
            const colspan = cell.colSpan && cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : '';
            const rowspan = cell.rowSpan && cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : '';
            return `<td${cellStyleAttr}${colspan}${rowspan}>${cellContent}</td>`;
          }).join('');
          return `<tr>${rowCells}</tr>`;
        }).join('');
        
        return `<table${tableStyleAttr} border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 2px solid #4a5568; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">${tableRows}</table>`;
      }
      case 'link': {
        const target = element.target || '_blank';
        return `<a href="${element.href || '#'}" target="${target}">${children}</a>`;
      }
      case 'anchor':
        return `<span id="${element.id || ''}" class="anchor">${children}</span>`;
      case 'abbr':
        return `<abbr title="${element.definition || ''}">${children}</abbr>`;
      case 'hover-area':
        return `<span title="${element.hoverContent || ''}" class="hover-area">${children}</span>`;
      default:
        return `<p${styleAttr}>${children}</p>`;
    }
  };

  return nodes.map(serializeNode).join('');
};

export const getHtmlOutput = (nodes: CustomElement[]): string => {
  const htmlContent = serializeToHtml(nodes);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Content</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        .anchor { background-color: #fff3cd; padding: 2px 4px; border-radius: 3px; border-left: 2px solid #ffc107; }
        .hover-area { background-color: #e1f5fe; padding: 2px 4px; border-radius: 3px; cursor: pointer; }
        table { border-collapse: collapse; width: 100%; border: 2px solid #333; }
        table td, table th { border: 1px solid #333; padding: 8px; text-align: left; }
        table td { background-color: #fff; }
        blockquote { border-left: 4px solid #ccc; padding-left: 16px; font-style: italic; }
        code { background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
        img { max-width: 100%; height: auto; }
        .prose { max-width: none; }
        .prose table { margin: 1rem 0; }
        .prose table td, .prose table th { border: 1px solid #333; padding: 8px; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
};

// Table utilities
export const createTable = (rows: number, cols: number): CustomElement => {
  const tableRows: TableRow[] = Array(rows).fill(null).map(() => ({
    type: 'table-row',
    children: Array(cols).fill(null).map(() => ({
      type: 'table-cell',
      children: [{ text: '' }]
    }))
  }));

  return {
    type: 'table',
    rows: tableRows,
    children: [{ text: '' }]
  };
};

export const addTableRow = (editor: Editor, tableElement: CustomElement, index: number, position: 'above' | 'below') => {
  if (!tableElement.rows) return;
  
  const newRow: TableRow = {
    type: 'table-row',
    children: Array(tableElement.rows[0]?.children.length || 3).fill(null).map(() => ({
      type: 'table-cell',
      children: [{ text: '' }]
    }))
  };
  
  const newRows = [...tableElement.rows];
  const insertIndex = position === 'above' ? index : index + 1;
  newRows.splice(insertIndex, 0, newRow);
  
  Transforms.setNodes(editor, { rows: newRows }, { 
    match: n => SlateElement.isElement(n) && n.type === 'table' 
  });
};

export const removeTableRow = (editor: Editor, tableElement: CustomElement, index: number) => {
  if (!tableElement.rows || tableElement.rows.length <= 1) return;
  
  const newRows = tableElement.rows.filter((_: any, i: number) => i !== index);
  
  Transforms.setNodes(editor, { rows: newRows }, { 
    match: n => SlateElement.isElement(n) && n.type === 'table' 
  });
};

export const addTableColumn = (editor: Editor, tableElement: CustomElement, index: number, position: 'left' | 'right') => {
  if (!tableElement.rows) return;
  
  const insertIndex = position === 'left' ? index : index + 1;
  const newRows = tableElement.rows.map((row: TableRow) => ({
    ...row,
    children: [
      ...row.children.slice(0, insertIndex),
      { type: 'table-cell', children: [{ text: '' }] },
      ...row.children.slice(insertIndex)
    ]
  }));
  
  Transforms.setNodes(editor, { rows: newRows }, { 
    match: n => SlateElement.isElement(n) && n.type === 'table' 
  });
};

export const removeTableColumn = (editor: Editor, tableElement: CustomElement, index: number) => {
  if (!tableElement.rows || tableElement.rows[0]?.children.length <= 1) return;
  
  const newRows = tableElement.rows.map((row: TableRow) => ({
    ...row,
    children: row.children.filter((_: any, i: number) => i !== index)
  }));
  
  Transforms.setNodes(editor, { rows: newRows }, { 
    match: n => SlateElement.isElement(n) && n.type === 'table' 
  });
};

export const mergeTableCells = (editor: Editor, tableElement: CustomElement, selection: CellSelection) => {
  if (!tableElement.rows) return;
  
  const { startRow, startCol, endRow, endCol } = selection;
  const newRows = [...tableElement.rows];
  
  // Calculate colspan and rowspan
  const colSpan = Math.abs(endCol - startCol) + 1;
  const rowSpan = Math.abs(endRow - startRow) + 1;
  
  // Collect content from all cells being merged
  let mergedContent = '';
  for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
    for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
      const cellText = (newRows[row].children[col].children[0] as { text: string })?.text || '';
      if (cellText.trim()) {
        mergedContent += (mergedContent ? ' ' : '') + cellText;
      }
    }
  }
  
  // Set the main cell (top-left)
  const mainRow = Math.min(startRow, endRow);
  const mainCol = Math.min(startCol, endCol);
  
  newRows[mainRow].children[mainCol] = {
    ...newRows[mainRow].children[mainCol],
    colSpan,
    rowSpan,
    isMerged: false, // This is the main cell
    children: [{ text: mergedContent }]
  };
  
  // Mark other cells as merged
  for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
    for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
      if (row === mainRow && col === mainCol) continue;
      
      newRows[row].children[col] = {
        ...newRows[row].children[col],
        isMerged: true,
        mergedCells: [{ row: mainRow, col: mainCol }],
        children: [{ text: '' }]
      };
    }
  }
  
  Transforms.setNodes(editor, { rows: newRows }, { 
    match: n => SlateElement.isElement(n) && n.type === 'table' 
  });
};

export const unmergeTableCells = (editor: Editor, tableElement: CustomElement, rowIndex: number, colIndex: number) => {
  if (!tableElement.rows) return;
  
  const cell = tableElement.rows[rowIndex]?.children[colIndex];
  if (!cell || !cell.isMerged) return;
  
  const newRows = [...tableElement.rows];
  
  // Reset the main cell
  newRows[rowIndex].children[colIndex] = {
    ...newRows[rowIndex].children[colIndex],
    colSpan: 1,
    rowSpan: 1,
    isMerged: false
  };
  
  // Reset merged cells
  for (let row = 0; row < newRows.length; row++) {
    for (let col = 0; col < newRows[row].children.length; col++) {
      const currentCell = newRows[row].children[col];
      if (currentCell.mergedCells?.some(mc => mc.row === rowIndex && mc.col === colIndex)) {
        newRows[row].children[col] = {
          ...currentCell,
          isMerged: false,
          mergedCells: undefined
        };
      }
    }
  }
  
  Transforms.setNodes(editor, { rows: newRows }, { 
    match: n => SlateElement.isElement(n) && n.type === 'table' 
  });
};

export const setCellBackgroundColor = (editor: Editor, tableElement: CustomElement, rowIndex: number, colIndex: number, color: string) => {
  if (!tableElement.rows) return;
  
  const newRows = [...tableElement.rows];
  newRows[rowIndex] = {
    ...newRows[rowIndex],
    children: newRows[rowIndex].children.map((cell: TableCell, cIdx: number) => {
      if (cIdx === colIndex) {
        return { 
          ...cell, 
          backgroundColor: color === 'transparent' ? undefined : color 
        };
      }
      return cell;
    })
  };
  
  Transforms.setNodes(editor, { rows: newRows }, { 
    match: n => SlateElement.isElement(n) && n.type === 'table' 
  });
};

export const setCellAlignment = (editor: Editor, tableElement: CustomElement, rowIndex: number, colIndex: number, align: string) => {
  if (!tableElement.rows) return;
  
  const newRows = tableElement.rows.map((row: TableRow, rIdx: number) => {
    if (rIdx === rowIndex) {
      return {
        ...row,
        children: row.children.map((cell: TableCell, cIdx: number) => {
          if (cIdx === colIndex) {
            return { ...cell, align };
          }
          return cell;
        })
      };
    }
    return row;
  });
  
  Transforms.setNodes(editor, { rows: newRows }, { 
    match: n => SlateElement.isElement(n) && n.type === 'table' 
  });
};

// Selection utilities
export const getCellSelection = (startCell: { row: number; col: number }, endCell: { row: number; col: number }): CellSelection => {
  return {
    startRow: Math.min(startCell.row, endCell.row),
    startCol: Math.min(startCell.col, endCell.col),
    endRow: Math.max(startCell.row, endCell.row),
    endCol: Math.max(startCell.col, endCell.col)
  };
};

// Element insertion utilities
export const insertImage = (editor: Editor, url: string, alt: string = '') => {
  const image = {
    type: 'image',
    url,
    alt,
    width: '300px',
    height: 'auto',
    children: [{ text: '' }]
  };
  
  Transforms.insertNodes(editor, image);
  Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] });
};

export const insertLink = (editor: Editor, url: string, text: string = url) => {
  const link = {
    type: 'link',
    href: url,
    target: '_blank',
    children: [{ text }]
  };
  Transforms.insertNodes(editor, link);
};

export const insertAnchor = (editor: Editor, id: string) => {
  const anchor = {
    type: 'anchor',
    id,
    children: [{ text: `[${id}]` }]
  };
  Transforms.insertNodes(editor, anchor);
};

export const insertHoverArea = (editor: Editor, text: string, hoverContent: string) => {
  const hoverArea = {
    type: 'hover-area',
    hoverContent,
    isEditMode: true,
    children: [{ text }]
  };
  Transforms.insertNodes(editor, hoverArea);
  Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] });
};

// Color utilities
export const isValidColor = (color: string): boolean => {
  const s = new Option().style;
  s.color = color;
  return s.color !== '';
};

export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

// Keyboard shortcuts
export const isHotkey = (hotkey: string, event: KeyboardEvent): boolean => {
  const keys = hotkey.split('+');
  const modifiers = {
    ctrl: event.ctrlKey,
    cmd: event.metaKey,
    shift: event.shiftKey,
    alt: event.altKey,
  };
  
  const key = keys[keys.length - 1];
  const requiredModifiers = keys.slice(0, -1);
  
  return (
    event.key.toLowerCase() === key.toLowerCase() &&
    requiredModifiers.every(mod => modifiers[mod as keyof typeof modifiers])
  );
};

// Validation utilities
export const validateTableStructure = (tableElement: CustomElement): boolean => {
  if (!tableElement.rows || tableElement.rows.length === 0) return false;
  
  const firstRowCols = tableElement.rows[0].children.length;
  return tableElement.rows.every(row => row.children.length === firstRowCols);
};

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '');
}; 