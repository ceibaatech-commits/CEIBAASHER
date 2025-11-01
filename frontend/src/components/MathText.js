import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/**
 * Component to render text with inline LaTeX formulas
 * Detects LaTeX between $ signs and renders them properly
 * Example: "The value of $x^2$ is..." will render x² properly
 */
const MathText = ({ text, className = "" }) => {
  if (!text) return null;

  // Split text by LaTeX delimiters (both inline $ and display $$)
  // Pattern: matches $$...$$ (display) or $...$ (inline)
  const parts = [];
  let lastIndex = 0;
  
  // Regex to find LaTeX expressions
  // Matches: $$...$$  or $...$
  const latexRegex = /\$\$([\s\S]+?)\$\$|\$(.+?)\$/g;
  
  let match;
  while ((match = latexRegex.exec(text)) !== null) {
    // Add text before LaTeX
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    
    // Add LaTeX (display or inline)
    if (match[1]) {
      // Display math ($$...$$)
      parts.push({
        type: 'display',
        content: match[1]
      });
    } else if (match[2]) {
      // Inline math ($...$)
      parts.push({
        type: 'inline',
        content: match[2]
      });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
  
  // If no LaTeX found, return plain text
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }
  
  // Render parts
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        } else if (part.type === 'inline') {
          try {
            return <InlineMath key={index} math={part.content} />;
          } catch (error) {
            console.error('LaTeX rendering error:', error);
            return <span key={index} className="text-red-600">${part.content}$</span>;
          }
        } else if (part.type === 'display') {
          try {
            return <div key={index}><BlockMath math={part.content} /></div>;
          } catch (error) {
            console.error('LaTeX rendering error:', error);
            return <div key={index} className="text-red-600">$${part.content}$$</div>;
          }
        }
        return null;
      })}
    </span>
  );
};

export default MathText;
