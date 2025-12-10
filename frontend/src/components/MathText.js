import React from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Helper component to render text with math equations
const MathText = ({ text, className = "" }) => {
  if (!text) return null;
  
  // Split text by $ signs to find math expressions
  const parts = [];
  let lastIndex = 0;
  const regex = /\$([^$]+)\$/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before math
    if (match.index > lastIndex) {
      parts.push({ 
        type: 'text', 
        content: text.substring(lastIndex, match.index),
        key: `text-${lastIndex}`
      });
    }
    // Add math
    parts.push({ 
      type: 'math', 
      content: match[1],
      key: `math-${match.index}`
    });
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ 
      type: 'text', 
      content: text.substring(lastIndex),
      key: `text-${lastIndex}`
    });
  }
  
  // If no math found, return plain text
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }
  
  return (
    <span className={className}>
      {parts.map((part) => {
        if (part.type === 'math') {
          try {
            return <InlineMath key={part.key} math={part.content} />;
          } catch (err) {
            // If LaTeX is invalid, show original text
            return <span key={part.key} className="text-red-500 bg-red-50 px-1 rounded" title="Invalid math syntax">${part.content}$</span>;
          }
        }
        return <span key={part.key}>{part.content}</span>;
      })}
    </span>
  );
};

export default MathText;
