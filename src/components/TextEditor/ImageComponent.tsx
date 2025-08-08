import React, { useState, useRef } from 'react';
import { Transforms, Element as SlateElement } from 'slate';
import { Edit3, Trash2, Download, Copy } from 'lucide-react';
import type { ImageComponentProps } from './types';
import ResizableElement from './ResizableElement';

const ImageComponent: React.FC<ImageComponentProps> = ({ element, attributes, children, editor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    url: element.url || '',
    alt: element.alt || '',
    title: element.title || ''
  });
  const imageRef = useRef<HTMLImageElement>(null);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    Transforms.setNodes(editor, editData, { 
      match: n => SlateElement.isElement(n) && n.type === 'image' 
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      url: element.url || '',
      alt: element.alt || '',
      title: element.title || ''
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    Transforms.removeNodes(editor, { match: n => SlateElement.isElement(n) && n.type === 'image' });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(element.url || '');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = element.url || '';
    link.download = element.alt || 'image';
    link.click();
  };

  if (isEditing) {
    return (
      <div {...attributes} className="inline-block">
        <div contentEditable={false} className="border-2 border-blue-300 p-4 bg-blue-50 rounded-lg min-w-[300px]">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Image URL:</label>
              <input
                value={editData.url}
                onChange={(e) => setEditData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full p-2 border rounded text-sm"
                placeholder="Enter image URL..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alt Text:</label>
              <input
                value={editData.alt}
                onChange={(e) => setEditData(prev => ({ ...prev, alt: e.target.value }))}
                className="w-full p-2 border rounded text-sm"
                placeholder="Enter alt text..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title:</label>
              <input
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border rounded text-sm"
                placeholder="Enter title..."
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Save
              </button>
              <button 
                onClick={handleCancel}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div {...attributes} className="inline-block">
      <div contentEditable={false} className="relative group">
        <ResizableElement 
          width={element.width || '300px'} 
          height={element.height || 'auto'}
          onResize={(width, height) => {
            Transforms.setNodes(editor, { width, height }, { 
              match: n => SlateElement.isElement(n) && n.type === 'image' 
            });
          }}
          minWidth={50}
          minHeight={30}
        >
          <img 
            ref={imageRef}
            src={element.url} 
            alt={element.alt || ''} 
            title={element.title || element.alt || ''}
            className="max-w-full h-auto rounded border cursor-pointer"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              display: 'block'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden absolute inset-0 bg-gray-200 border-2 border-dashed border-gray-400 rounded flex items-center justify-center">
            <span className="text-gray-500 text-sm">Image not found</span>
          </div>
        </ResizableElement>

        {/* Image controls */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-300 rounded shadow-lg p-1">
          <div className="flex gap-1">
            <button
              onClick={handleEdit}
              className="p-1 hover:bg-gray-100 rounded"
              title="Edit Image"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={handleCopyUrl}
              className="p-1 hover:bg-gray-100 rounded"
              title="Copy URL"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={handleDownload}
              className="p-1 hover:bg-gray-100 rounded"
              title="Download"
            >
              <Download size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-100 rounded text-red-600"
              title="Delete Image"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Image info overlay */}
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {element.width} × {element.height}
        </div>
      </div>
      {children}
    </div>
  );
};

export default ImageComponent; 