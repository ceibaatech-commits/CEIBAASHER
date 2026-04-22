import React, { useState } from 'react';

const buildPageList = (currentPage, totalPages, maxVisible = 5) => {
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  return { start, end };
};

const PageButton = ({ page, current, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-lg transition-colors text-sm ${
      current === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'
    }`}
    data-testid={`pagination-page-${page}`}
  >
    {page}
  </button>
);

export const UserPagination = ({ currentPage, setCurrentPage, totalPages, indexOfFirstUser, indexOfLastUser, totalCount }) => {
  const [goToPage, setGoToPage] = useState('');

  if (totalPages <= 1) return null;

  const { start, end } = buildPageList(currentPage, totalPages);

  const tryGo = () => {
    const page = parseInt(goToPage, 10);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setGoToPage('');
    }
  };

  const pageNumberEls = [];
  if (start > 1) {
    pageNumberEls.push(
      <PageButton key={1} page={1} current={currentPage} onClick={() => setCurrentPage(1)} />
    );
    if (start > 2) {
      pageNumberEls.push(<span key="dots1" className="px-2 text-gray-400">...</span>);
    }
  }
  for (let i = start; i <= end; i++) {
    pageNumberEls.push(
      <PageButton key={i} page={i} current={currentPage} onClick={() => setCurrentPage(i)} />
    );
  }
  if (end < totalPages) {
    if (end < totalPages - 1) {
      pageNumberEls.push(<span key="dots2" className="px-2 text-gray-400">...</span>);
    }
    pageNumberEls.push(
      <PageButton key={totalPages} page={totalPages} current={currentPage} onClick={() => setCurrentPage(totalPages)} />
    );
  }

  return (
    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, totalCount)} of {totalCount} users
          <span className="ml-2 text-gray-400">({totalPages} pages)</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            data-testid="pagination-first"
          >First</button>

          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            data-testid="pagination-prev"
          >Prev</button>

          <div className="flex items-center gap-1">{pageNumberEls}</div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            data-testid="pagination-next"
          >Next</button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            data-testid="pagination-last"
          >Last</button>

          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-500">Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={goToPage}
              onChange={(e) => setGoToPage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') tryGo(); }}
              placeholder={currentPage.toString()}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="pagination-goto-input"
            />
            <button
              onClick={tryGo}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              data-testid="pagination-goto-btn"
            >Go</button>
          </div>
        </div>
      </div>
    </div>
  );
};
