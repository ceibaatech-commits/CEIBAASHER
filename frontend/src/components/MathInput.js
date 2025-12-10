import React, { useState, useRef } from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import MathToolbar from './MathToolbar';
import { Eye, EyeOff } from 'lucide-react';

const MathInput = ({ 
  value, 
  onChange, 
  placeholder = "Type your text with math...",
  showToolbar = true,
  multiline = false,
  rows = 3,
  className = ""
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef(null);

  const handleInsertMath = (latex, cursorOffset = 0) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = value || '';
    
    // Insert latex at cursor position, wrapped in $ signs
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + '$' + latex + '$' + after;
    
    onChange(newText);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      const newPos = start + latex.length + 2 + cursorOffset;
      input.focus();
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const renderPreview = (text) => {
    if (!text) return <span className="text-gray-400">Preview will appear here...</span>;
    
    // Split text by $ signs to find math expressions
    const parts = [];
    let lastIndex = 0;
    const regex = /\$([^$]+)\$/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before math
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      // Add math
      parts.push({ type: 'math', content: match[1] });
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }
    
    return (
      <span>
        {parts.map((part, idx) => {
          if (part.type === 'math') {
            try {
              return <InlineMath key={idx} math={part.content} />;
            } catch (err) {
              return <span key={idx} className="text-red-500 bg-red-50 px-1 rounded">{part.content}</span>;
            }
          }
          return <span key={idx}>{part.content}</span>;
        })}
      </span>
    );
  };

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {multiline ? (
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
      
      {showToolbar && <MathToolbar onInsert={handleInsertMath} />}
      
      {/* Preview Toggle and Display */}
      <div className="border-t border-gray-200">
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
        
        {showPreview && (
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 min-h-[40px]">
            <div className="text-sm">{renderPreview(value)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MathInput;
