import React from 'react';

const MathToolbar = ({ onInsert }) => {
  const mathSymbols = [
    { label: '√', latex: '\\sqrt{}', cursorOffset: -1 },
    { label: 'x²', latex: '^2', cursorOffset: 0 },
    { label: 'x³', latex: '^3', cursorOffset: 0 },
    { label: 'xⁿ', latex: '^{}', cursorOffset: -1 },
    { label: '∫', latex: '\\int ', cursorOffset: 0 },
    { label: '∑', latex: '\\sum ', cursorOffset: 0 },
    { label: 'π', latex: '\\pi', cursorOffset: 0 },
    { label: '±', latex: '\\pm', cursorOffset: 0 },
    { label: '×', latex: '\\times', cursorOffset: 0 },
    { label: '÷', latex: '\\div', cursorOffset: 0 },
    { label: '≤', latex: '\\leq', cursorOffset: 0 },
    { label: '≥', latex: '\\geq', cursorOffset: 0 },
    { label: '≠', latex: '\\neq', cursorOffset: 0 },
    { label: '∞', latex: '\\infty', cursorOffset: 0 },
    { label: 'α', latex: '\\alpha', cursorOffset: 0 },
    { label: 'β', latex: '\\beta', cursorOffset: 0 },
    { label: 'θ', latex: '\\theta', cursorOffset: 0 },
    { label: 'Σ', latex: '\\Sigma', cursorOffset: 0 },
    { label: 'a/b', latex: '\\frac{}{}', cursorOffset: -3 },
    { label: '( )', latex: '\\left( \\right)', cursorOffset: -7 },
  ];

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-2">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs font-medium text-gray-600 mr-2">Math Symbols:</span>
        <div className="flex flex-wrap gap-1">
          {mathSymbols.map((symbol, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onInsert(symbol.latex, symbol.cursorOffset)}
              className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-400 text-sm font-medium transition-colors"
              title={`Insert ${symbol.label}`}
            >
              {symbol.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Tip: Use $ signs to wrap math: $x^2 + y^2 = z^2$ or use buttons above
      </p>
    </div>
  );
};

export default MathToolbar;
