import React, { useState, useRef, useEffect } from 'react';
import type { ColorPickerProps } from './types';

const ColorPicker: React.FC<ColorPickerProps> = ({ 
  onColorSelect, 
  currentColor = '#000000',
  type = 'text'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(currentColor);
  const pickerRef = useRef<HTMLDivElement>(null);

  const predefinedColors = [
    // Grays
    '#000000', '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529',
    // Reds
    '#dc3545', '#c82333', '#bd2130', '#b02a37', '#a71e2a', '#861c23', '#721c24', '#571c23', '#4c1c23', '#3d1c23',
    // Pinks
    '#e83e8c', '#d63384', '#c1356d', '#ab296a', '#8b2252', '#6f1942', '#5a1a3a', '#4a1a32', '#3d1a2a', '#2f1a22',
    // Purples
    '#6f42c1', '#5a32a3', '#4c2889', '#3d1f6b', '#2e1a4d', '#1f152f', '#1a1228', '#150f21', '#100c1a', '#0b0913',
    // Indigos
    '#6610f2', '#520dc2', '#3d0a91', '#2d0760', '#1d042f', '#1a0428', '#170421', '#14041a', '#110413', '#0e040c',
    // Blues
    '#007bff', '#0056b3', '#004085', '#002a57', '#001429', '#001122', '#000e1b', '#000b14', '#00080d', '#000506',
    // Cyans
    '#17a2b8', '#138496', '#0f6674', '#0b4a52', '#072d30', '#062528', '#051d20', '#041518', '#030d10', '#020508',
    // Teals
    '#20c997', '#1ea085', '#1a7a6b', '#165451', '#122e37', '#0f272d', '#0c2023', '#091919', '#06120f', '#030b0b',
    // Greens
    '#28a745', '#1e7e34', '#155724', '#0c3d14', '#032304', '#021e03', '#011902', '#001401', '#000f01', '#000a00',
    // Limes
    '#ffc107', '#e0a800', '#c19b00', '#a28e00', '#838100', '#6a6800', '#514f00', '#383600', '#1f1d00', '#060400',
    // Yellows
    '#ffc107', '#e0a800', '#c19b00', '#a28e00', '#838100', '#6a6800', '#514f00', '#383600', '#1f1d00', '#060400',
    // Oranges
    '#fd7e14', '#e8690b', '#d35400', '#be4d00', '#a94600', '#943f00', '#7f3800', '#6a3100', '#552a00', '#402300',
    // Reds (lighter)
    '#f8d7da', '#f1b0b7', '#ea868f', '#e35d6b', '#dc3545', '#c82333', '#bd2130', '#b02a37', '#a71e2a', '#861c23'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleColorSelect = (color: string) => {
    setCustomColor(color);
    onColorSelect(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onColorSelect(color);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        className="p-2 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
        title={`${type === 'text' ? 'Text' : 'Background'} Color`}
      >
        <div 
          className="w-4 h-4 rounded border border-gray-300"
          style={{ backgroundColor: currentColor }}
        />
        <span className="text-xs">Color</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-[280px]">
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Custom Color:
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Predefined Colors:
            </label>
            <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
              {predefinedColors.map((color, index) => (
                <button
                  key={index}
                  className="w-6 h-6 border border-gray-300 rounded cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => handleColorSelect('transparent')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Transparent
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker; 