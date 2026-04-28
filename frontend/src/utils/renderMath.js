import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

/**
 * Renders text with LaTeX/KaTeX support
 * Supports:
 * - Inline math: $...$
 * - Display math: $$...$$
 * 
 * @param {string} text - Text with LaTeX notation
 * @returns {JSX.Element}
 */
export const renderMathText = (text) => {
  // Handle null/undefined
  if (!text) return null;
  
  // Handle objects (like {id: "A", text: "..."}) - extract the text property
  if (typeof text === 'object') {
    // If it's an array of objects, extract text from each
    if (Array.isArray(text)) {
      return text.map((item, idx) => 
        <span key={item?.id || item?.text || `math-${idx}`}>{renderMathText(item)}</span>
      );
    }
    // If it's an object with text property, use that
    if (text.text) {
      text = text.text;
    } else {
      // Convert to string as fallback
      text = String(text);
    }
  }
  
  // Ensure text is a string
  if (typeof text !== 'string') {
    text = String(text);
  }
  
  const parts = [];
  let lastIndex = 0;
  
  // Match $$...$$ (display math) and $...$ (inline math)
  const regex = /\$\$(.*?)\$\$|\$(.*?)\$/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the math
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the math component
    if (match[1]) {
      // Display math ($$...$$)
      parts.push(<BlockMath key={match.index} math={match[1]} />);
    } else if (match[2]) {
      // Inline math ($...$)
      parts.push(<InlineMath key={match.index} math={match[2]} />);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? <>{parts}</> : text;
};

export default renderMathText;
