import React, { useState, useRef, useEffect } from 'react';
import type { ResizableElementProps } from './types';

const ResizableElement: React.FC<ResizableElementProps> = ({ 
  children, 
  width = 'auto', 
  height = 'auto', 
  onResize,
  minWidth = 100,
  minHeight = 50
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startSize = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const handleMouseDown = (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    startPos.current = { x: e.clientX, y: e.clientY };
    
    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) {
      startSize.current = { width: rect.width, height: rect.height };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !elementRef.current) return;

      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      
      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;

      switch (resizeDirection) {
        case 'se':
          newWidth = Math.max(minWidth, startSize.current.width + deltaX);
          newHeight = Math.max(minHeight, startSize.current.height + deltaY);
          break;
        case 'sw':
          newWidth = Math.max(minWidth, startSize.current.width - deltaX);
          newHeight = Math.max(minHeight, startSize.current.height + deltaY);
          break;
        case 'ne':
          newWidth = Math.max(minWidth, startSize.current.width + deltaX);
          newHeight = Math.max(minHeight, startSize.current.height - deltaY);
          break;
        case 'nw':
          newWidth = Math.max(minWidth, startSize.current.width - deltaX);
          newHeight = Math.max(minHeight, startSize.current.height - deltaY);
          break;
      }

      setCurrentWidth(`${newWidth}px`);
      setCurrentHeight(`${newHeight}px`);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        setResizeDirection(null);
        onResize?.(currentWidth, currentHeight);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, currentWidth, currentHeight, onResize, minWidth, minHeight]);

  return (
    <div
      ref={elementRef}
      className="relative group inline-block"
      style={{ 
        width: currentWidth, 
        height: currentHeight,
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`
      }}
    >
      {children}
      
      {/* Resize handles */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Southeast handle */}
        <div
          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'se')}
        />
        
        {/* Southwest handle */}
        <div
          className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 cursor-sw-resize opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'sw')}
        />
        
        {/* Northeast handle */}
        <div
          className="absolute top-0 right-0 w-3 h-3 bg-blue-500 cursor-ne-resize opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'ne')}
        />
        
        {/* Northwest handle */}
        <div
          className="absolute top-0 left-0 w-3 h-3 bg-blue-500 cursor-nw-resize opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'nw')}
        />
      </div>

      {/* Size indicator */}
      {isResizing && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded z-50">
          {Math.round(parseFloat(currentWidth))} × {Math.round(parseFloat(currentHeight))}
        </div>
      )}
    </div>
  );
};

export default ResizableElement; 