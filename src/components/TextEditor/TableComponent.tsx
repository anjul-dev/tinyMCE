import React, { useState, useRef } from "react";
import { Transforms, Element as SlateElement } from "slate";
import {
  Plus,
  Minus,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Merge,
  Split,
  Trash2,
} from "lucide-react";
import type { TableComponentProps, TableState } from "./types";
import {
  addTableRow,
  removeTableRow,
  addTableColumn,
  removeTableColumn,
  mergeTableCells,
  unmergeTableCells,
  setCellBackgroundColor,
  setCellAlignment,
  getCellSelection,
} from "./utils";
import ContextMenu from "./ContextMenu";
import ResizableElement from "./ResizableElement";
import ColorPicker from "./ColorPicker";

const TableComponent: React.FC<TableComponentProps> = ({
  element,
  attributes,
  children,
  editor,
}) => {
  const [tableState, setTableState] = useState<TableState>({
    selectedCells: null,
    contextMenu: { x: 0, y: 0, visible: false },
    isResizing: false,
    mergeMode: false,
  });
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [cellContent, setCellContent] = useState<string>("");
  const [showColorPicker, setShowColorPicker] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContextMenu = (
    e: React.MouseEvent,
    rowIndex?: number,
    colIndex?: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // If right-clicking on a cell, set it as selected
    if (rowIndex !== undefined && colIndex !== undefined) {
      setSelectedCell({ row: rowIndex, col: colIndex });

      // If no cells are currently selected, start a selection from this cell
      if (!tableState.selectedCells) {
        setTableState((prev) => ({
          ...prev,
          selectedCells: {
            startRow: rowIndex,
            startCol: colIndex,
            endRow: rowIndex,
            endCol: colIndex,
          },
        }));
      }
    }

    setTableState((prev) => ({
      ...prev,
      contextMenu: {
        x: e.clientX,
        y: e.clientY,
        visible: true,
      },
    }));
  };

  const handleCellMouseDown = (rowIndex: number, colIndex: number) => {
    setIsSelecting(true);
    setSelectionStart({ row: rowIndex, col: colIndex });
    setTableState((prev) => ({
      ...prev,
      selectedCells: {
        startRow: rowIndex,
        startCol: colIndex,
        endRow: rowIndex,
        endCol: colIndex,
      },
    }));
  };

  const handleCellMouseEnter = (rowIndex: number, colIndex: number) => {
    if (isSelecting && selectionStart) {
      const selection = getCellSelection(selectionStart, {
        row: rowIndex,
        col: colIndex,
      });
      setTableState((prev) => ({
        ...prev,
        selectedCells: selection,
      }));
    }
  };

  const handleCellMouseUp = () => {
    setIsSelecting(false);
    setSelectionStart(null);
  };

  const isCellSelected = (rowIndex: number, colIndex: number) => {
    if (!tableState.selectedCells) return false;
    const { startRow, startCol, endRow, endCol } = tableState.selectedCells;
    return (
      rowIndex >= Math.min(startRow, endRow) &&
      rowIndex <= Math.max(startRow, endRow) &&
      colIndex >= Math.min(startCol, endCol) &&
      colIndex <= Math.max(startCol, endCol)
    );
  };

  const isCellInMergeSelection = (rowIndex: number, colIndex: number) => {
    if (!tableState.selectedCells) return false;
    const { startRow, startCol, endRow, endCol } = tableState.selectedCells;
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    return (
      rowIndex >= minRow &&
      rowIndex <= maxRow &&
      colIndex >= minCol &&
      colIndex <= maxCol
    );
  };

  const startCellEditing = (rowIndex: number, colIndex: number) => {
    const cell = element.rows?.[rowIndex]?.children[colIndex];
    const currentContent = cell?.children?.[0]?.text || "";
    setEditingCell({ row: rowIndex, col: colIndex });
    setCellContent(currentContent);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const saveCellContent = () => {
    if (editingCell) {
      handleCellContentChange(editingCell.row, editingCell.col, cellContent);
      setEditingCell(null);
      setCellContent("");
    }
  };

  const cancelCellEditing = () => {
    setEditingCell(null);
    setCellContent("");
  };

  const getContextMenuOptions = () => {
    const options: Array<{
      label: string;
      onClick: () => void;
      icon?: React.ReactNode;
    }> = [];

    // Check if we have a valid multi-cell selection for merging
    const hasValidMergeSelection =
      tableState.selectedCells &&
      (tableState.selectedCells.startRow !== tableState.selectedCells.endRow ||
        tableState.selectedCells.startCol !== tableState.selectedCells.endCol);

    if (hasValidMergeSelection) {
      options.push({
        label: "Merge Selected Cells",
        onClick: () => {
          if (tableState.selectedCells) {
            mergeTableCells(editor, element, tableState.selectedCells);
            setTableState((prev) => ({ ...prev, selectedCells: null }));
          }
        },
        icon: <Merge size={16} />,
      });
    }

    if (selectedCell) {
      const { row, col } = selectedCell;
      const cell = element.rows?.[row]?.children[col];

      options.push(
        {
          label: "Add Row Above",
          onClick: () => addTableRow(editor, element, row, "above"),
          icon: <Plus size={16} />,
        },
        {
          label: "Add Row Below",
          onClick: () => addTableRow(editor, element, row, "below"),
          icon: <Plus size={16} />,
        },
        {
          label: "Add Column Left",
          onClick: () => addTableColumn(editor, element, col, "left"),
          icon: <Plus size={16} />,
        },
        {
          label: "Add Column Right",
          onClick: () => addTableColumn(editor, element, col, "right"),
          icon: <Plus size={16} />,
        },
        {
          label: "Remove Row",
          onClick: () => removeTableRow(editor, element, row),
          icon: <Minus size={16} />,
        },
        {
          label: "Remove Column",
          onClick: () => removeTableColumn(editor, element, col),
          icon: <Minus size={16} />,
        },
        {
          label: "Cell Background Color",
          onClick: () => {
            console.log("Setting color picker for cell:", { row, col });
            console.log("Current showColorPicker state:", showColorPicker);
            setShowColorPicker({ row, col });
            console.log("Color picker should be set to:", { row, col });
            // Don't close the context menu immediately
            setTimeout(() => {
              console.log("showColorPicker after timeout:", showColorPicker);
            }, 100);
          },
          icon: <Palette size={16} />,
        },
        {
          label: "Align Left",
          onClick: () => setCellAlignment(editor, element, row, col, "left"),
          icon: <AlignLeft size={16} />,
        },
        {
          label: "Align Center",
          onClick: () => setCellAlignment(editor, element, row, col, "center"),
          icon: <AlignCenter size={16} />,
        },
        {
          label: "Align Right",
          onClick: () => setCellAlignment(editor, element, row, col, "right"),
          icon: <AlignRight size={16} />,
        }
      );

      if (cell?.isMerged) {
        options.push({
          label: "Unmerge Cell",
          onClick: () => unmergeTableCells(editor, element, row, col),
          icon: <Split size={16} />,
        });
      }
    }

    options.push({
      label: "Delete Table",
      onClick: () => {
        Transforms.removeNodes(editor, {
          match: (n) => SlateElement.isElement(n) && n.type === "table",
        });
      },
      icon: <Trash2 size={16} />,
    });

    return options;
  };

  const handleCellContentChange = (
    rowIndex: number,
    colIndex: number,
    content: string
  ) => {
    if (!element.rows) return;

    const newRows = [...element.rows];
    newRows[rowIndex].children[colIndex].children = [{ text: content }];

    Transforms.setNodes(
      editor,
      { rows: newRows },
      {
        match: (n) => SlateElement.isElement(n) && n.type === "table",
      }
    );
  };

  const handleCellBackgroundColor = (
    rowIndex: number,
    colIndex: number,
    color: string
  ) => {
    console.log("Setting cell background color:", {
      rowIndex,
      colIndex,
      color,
    });
    setCellBackgroundColor(editor, element, rowIndex, colIndex, color);
    setShowColorPicker(null);
  };

  // Close color picker when clicking outside
  const handleColorPickerClose = () => {
    setShowColorPicker(null);
  };

  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <ResizableElement
          width={element.width || "100%"}
          height={element.height || "auto"}
          onResize={(width, height) => {
            Transforms.setNodes(
              editor,
              { width, height },
              {
                match: (n) => SlateElement.isElement(n) && n.type === "table",
              }
            );
          }}
          minWidth={200}
          minHeight={100}
        >
          <table
            ref={tableRef}
            className="border-collapse w-full border-2 border-gray-400 shadow-lg"
            style={{
              borderSpacing: "0",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
            onContextMenu={handleContextMenu}
            onMouseUp={handleCellMouseUp}
            onMouseLeave={() => {
              setIsSelecting(false);
              setSelectionStart(null);
            }}
          >
            <tbody>
              {element.rows?.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`${
                    rowIndex === 0
                      ? "bg-gray-100 border-b-2 border-gray-500"
                      : ""
                  } hover:bg-gray-50`}
                >
                  {row.children.map((cell, colIndex) => {
                    const isSelected = isCellSelected(rowIndex, colIndex);
                    const isInMergeSelection = isCellInMergeSelection(
                      rowIndex,
                      colIndex
                    );
                    const isMerged = cell.isMerged && !cell.mergedCells;
                    const isEditing =
                      editingCell?.row === rowIndex &&
                      editingCell?.col === colIndex;

                    if (isMerged) return null; // Don't render merged cells

                    return (
                      <td
                        key={colIndex}
                        className={`border border-gray-400 p-3 min-h-[40px] min-w-[100px] transition-all duration-200 relative ${
                          isSelected
                            ? "bg-blue-200 border-blue-500 shadow-md border-2"
                            : isInMergeSelection
                            ? "bg-blue-100 border-blue-300 border-2"
                            : "hover:bg-gray-50"
                        } ${isMerged ? "bg-gray-100" : ""} ${
                          colIndex === 0 ? "border-l-2 border-l-gray-500" : ""
                        } ${rowIndex === 0 ? "font-semibold" : ""}`}
                        title={
                          isSelected
                            ? "Selected cell - Right-click for options"
                            : isInMergeSelection
                            ? "Part of merge selection - Right-click to merge"
                            : "Click and drag to select multiple cells, right-click for options"
                        }
                        data-bg-color={cell.backgroundColor || "none"}
                        onContextMenu={(e) =>
                          handleContextMenu(e, rowIndex, colIndex)
                        }
                        onMouseDown={() =>
                          handleCellMouseDown(rowIndex, colIndex)
                        }
                        onMouseEnter={() =>
                          handleCellMouseEnter(rowIndex, colIndex)
                        }
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startCellEditing(rowIndex, colIndex);
                        }}
                        style={{
                          backgroundColor:
                            cell.backgroundColor || "transparent",
                          textAlign: cell.align || "left",
                          fontWeight: rowIndex === 0 ? "600" : "normal",
                          width: "auto",
                          minWidth: "100px",
                          maxWidth: "300px",
                          wordWrap: "break-word",
                          overflow: "hidden",
                        }}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={cellContent}
                            onChange={(e) => setCellContent(e.target.value)}
                            onBlur={saveCellContent}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveCellContent();
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancelCellEditing();
                              }
                            }}
                            className="w-full h-full border-none outline-none bg-transparent"
                            autoFocus
                          />
                        ) : (
                          <span style={{ fontWeight: "normal" }}>
                            {(cell.children[0] as { text: string })?.text ||
                              "\u00A0"}
                          </span>
                        )}

                        {/* Color Picker for this cell */}
                        {showColorPicker?.row === rowIndex &&
                          showColorPicker?.col === colIndex && (
                            <div 
                              className="fixed z-[9999] bg-white border border-gray-300 rounded shadow-xl p-4"
                              style={{
                                top: tableState.contextMenu.y + 'px',
                                left: tableState.contextMenu.x + 'px',
                                minWidth: '200px',
                                maxHeight: '300px'
                              }}
                            >
                              <div className="mb-2 font-semibold text-sm">Choose Background Color</div>
                              
                              {/* Simple color grid */}
                              <div className="grid grid-cols-6 gap-2 mb-3">
                                {[
                                  '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6',
                                  '#ced4da', '#adb5bd', '#6c757d', '#495057',
                                  '#343a40', '#212529', '#000000', '#ff6b6b',
                                  '#ee5a24', '#feca57', '#48dbfb', '#0abde3',
                                  '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3',
                                  '#ff9f43', '#feca57', '#48dbfb', '#ff6348',
                                  '#2ed573', '#7bed9f', '#70a1ff', '#5352ed'
                                ].map((color) => (
                                  <button
                                    key={color}
                                    className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleCellBackgroundColor(rowIndex, colIndex, color)}
                                    title={color}
                                  />
                                ))}
                              </div>
                              
                              {/* Color input */}
                              <div className="mb-3">
                                <label className="block text-xs text-gray-600 mb-1">Custom Color:</label>
                                <input
                                  type="color"
                                  defaultValue={cell.backgroundColor || "#ffffff"}
                                  onChange={(e) => handleCellBackgroundColor(rowIndex, colIndex, e.target.value)}
                                  className="w-full h-8"
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCellBackgroundColor(rowIndex, colIndex, 'transparent')}
                                  className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                  Clear
                                </button>
                                <button
                                  onClick={handleColorPickerClose}
                                  className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded"
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </ResizableElement>

        <ContextMenu
          x={tableState.contextMenu.x}
          y={tableState.contextMenu.y}
          visible={tableState.contextMenu.visible}
          onClose={() => {
            setTableState((prev) => ({
              ...prev,
              contextMenu: { ...prev.contextMenu, visible: false },
            }));
            // Also close color picker when context menu closes
            setShowColorPicker(null);
          }}
          options={getContextMenuOptions()}
        />
      </div>
      {children}
    </div>
  );
};

export default TableComponent;