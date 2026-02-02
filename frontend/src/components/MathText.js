import React from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Helper to render text segments with clickable hashtags and mentions
const renderTextWithLinks = (text, onHashtagClick, onMentionClick) => {
  if (!text) return null;
  
  // Regex to match hashtags and @mentions
  const linkRegex = /(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex, match.index)}
        </span>
      );
    }
    
    const matchedText = match[0];
    
    if (matchedText.startsWith('#')) {
      // Hashtag
      parts.push(
        <button
          key={`hashtag-${match.index}`}
          onClick={(e) => {
            e.stopPropagation();
            onHashtagClick && onHashtagClick(matchedText.substring(1));
          }}
          className="text-blue-500 hover:text-blue-600 hover:underline font-medium transition-colors"
        >
          {matchedText}
        </button>
      );
    } else if (matchedText.startsWith('@')) {
      // Mention
      parts.push(
        <button
          key={`mention-${match.index}`}
          onClick={(e) => {
            e.stopPropagation();
            onMentionClick && onMentionClick(matchedText.substring(1));
          }}
          className="text-blue-500 hover:text-blue-600 hover:underline font-medium transition-colors"
        >
          {matchedText}
        </button>
      );
    }
    
    lastIndex = match.index + matchedText.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
      </span>
    );
  }
  
  return parts.length > 0 ? parts : text;
};

// Helper component to render text with math equations, hashtags, and mentions
const MathText = ({ text, className = "", onHashtagClick, onMentionClick }) => {
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
  
  // If no math found, render with hashtag/mention support
  if (parts.length === 0) {
    return (
      <span className={className}>
        {renderTextWithLinks(text, onHashtagClick, onMentionClick)}
      </span>
    );
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
        // Render text with clickable hashtags and mentions
        return (
          <span key={part.key}>
            {renderTextWithLinks(part.content, onHashtagClick, onMentionClick)}
          </span>
        );
      })}
    </span>
  );
};

export default MathText;
