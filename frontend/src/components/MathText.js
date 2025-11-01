import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/**
 * Component to render text with inline LaTeX formulas
 * Detects LaTeX between $ signs and renders them properly
 * Also preserves Unicode characters for chemical notation (σ, π, ₀, ₁, etc.)
 * Example: "The value of $x^2$ is..." will render x² properly
 * Example: "σ-π bond in R-CH(OH)-CH₃" will display correctly
 */
const MathText = ({ text, className = "" }) => {
  if (!text) return null;

  // Convert to string if not already
  const textStr = String(text);

  // Split text by LaTeX delimiters (both inline $ and display $$)
  // Pattern: matches $$...$$ (display) or $...$ (inline)
  const parts = [];
  let lastIndex = 0;
  
  // Regex to find LaTeX expressions
  // Matches: $$...$$  or $...$
  const latexRegex = /\$\$([\s\S]+?)\$\$|\$(.+?)\$/g;
  
  let match;
  while ((match = latexRegex.exec(textStr)) !== null) {
    // Add text before LaTeX
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: textStr.substring(lastIndex, match.index)
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
  if (lastIndex < textStr.length) {
    parts.push({
      type: 'text',
      content: textStr.substring(lastIndex)
    });
  }
  
  // If no LaTeX found, return plain text with proper encoding
  if (parts.length === 0) {
    return (
      <span 
        className={className}
        style={{ 
          unicodeBidi: 'plaintext',
          whiteSpace: 'pre-wrap'
        }}
      >
        {textStr}
      </span>
    );
  }
  
  // Render parts
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <span 
              key={index}
              style={{ 
                unicodeBidi: 'plaintext',
                whiteSpace: 'pre-wrap'
              }}
            >
              {part.content}
            </span>
          );
        } else if (part.type === 'inline') {
          try {
            return <InlineMath key={index} math={part.content} />;
          } catch (error) {
            console.error('LaTeX rendering error:', error);
            // Fallback to plain text if LaTeX fails
            return <span key={index} className="text-red-600">${part.content}$</span>;
          }
        } else if (part.type === 'display') {
          try {
            return <div key={index}><BlockMath math={part.content} /></div>;
          } catch (error) {
            console.error('LaTeX rendering error:', error);
            // Fallback to plain text if LaTeX fails
            return <div key={index} className="text-red-600">$${part.content}$$</div>;
          }
        }
        return null;
      })}
    </span>
  );
};

export default MathText;
