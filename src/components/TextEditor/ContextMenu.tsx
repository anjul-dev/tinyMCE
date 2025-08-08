import React, { useRef, useEffect } from 'react';
import type { ContextMenuProps } from './types';

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, 
  y, 
  onClose, 
  options,
  visible 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  // Adjust position to keep menu within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-300 shadow-lg rounded-lg py-1 z-50 min-w-[200px] max-w-[300px]"
      style={{ 
        left: adjustedX, 
        top: adjustedY,
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => {
            option.onClick();
            onClose();
          }}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm transition-colors"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
        >
          {option.icon && (
            <span className="flex-shrink-0 w-4 h-4">
              {option.icon}
            </span>
          )}
          <span className="flex-1">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ContextMenu; 