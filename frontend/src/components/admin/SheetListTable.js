import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet, Trash2, ExternalLink,
  Search, Upload, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';

export const SheetListTable = ({
  sheets, loading, onRefresh, onImport, onTestSheet, onDelete
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState('');
  const sheetsPerPage = 100;

  const filteredSheets = sheets.filter(sheet => {
    const q = searchQuery.toLowerCase();
    return (
      sheet.exam_name?.toLowerCase().includes(q) ||
      sheet.class_name?.toLowerCase().includes(q) ||
      sheet.subject?.toLowerCase().includes(q) ||
      sheet.syllabus_topic?.toLowerCase().includes(q) ||
      sheet.chapter?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredSheets.length / sheetsPerPage);
  const indexOfLast = currentPage * sheetsPerPage;
  const indexOfFirst = indexOfLast - sheetsPerPage;
  const currentSheets = filteredSheets.slice(indexOfFirst, indexOfLast);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const goTo = (page) => {
    if (page >= 1 && page <= totalPages) { setCurrentPage(page); setGoToPage(''); }
  };

  return (
    <>
      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="sheet-search"
            />
          </div>
          <button onClick={onRefresh} className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" data-testid="sheet-refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Sheets Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Hierarchy</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Questions</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sheet Link</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Loading sheets...</p>
                  </td>
                </tr>
              ) : filteredSheets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No sheets found. Add your first sheet!</p>
                  </td>
                </tr>
              ) : (
                currentSheets.map((sheet, index) => (
                  <tr key={sheet.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        sheet.type === 'exam' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {sheet.type === 'exam' ? 'Exam' : 'Class'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {sheet.type === 'exam' ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">{sheet.exam_name}</p>
                            <p className="text-gray-600">{sheet.syllabus_topic} &rarr; {sheet.subject}</p>
                            {sheet.sub_topic && <p className="text-gray-500 text-xs">&rarr; {sheet.sub_topic}</p>}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">{sheet.class_name}</p>
                            <p className="text-gray-600">{sheet.subject} &rarr; {sheet.chapter}</p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {sheet.questions_imported ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-green-700">{sheet.question_count || 0} questions</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            <span className="text-orange-700">Not imported</span>
                          </div>
                        )}
                        {sheet.last_import && (
                          <p className="text-xs text-gray-500 mt-1">Last: {new Date(sheet.last_import).toLocaleDateString()}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a href={sheet.sheet_link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">View Sheet</span>
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => onImport(sheet.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Import Questions">
                          <Upload className="w-4 h-4" />
                        </button>
                        <button onClick={() => onTestSheet(sheet.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Test Sheet">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(sheet.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredSheets.length)} of {filteredSheets.length} sheets
                <span className="ml-2 text-gray-400">({totalPages} pages)</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button onClick={() => goTo(1)} disabled={currentPage === 1} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm">First</button>
                <button onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm">Prev</button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const maxV = 5;
                    let start = Math.max(1, currentPage - Math.floor(maxV / 2));
                    let end = Math.min(totalPages, start + maxV - 1);
                    if (end - start + 1 < maxV) start = Math.max(1, end - maxV + 1);
                    if (start > 1) {
                      pages.push(<button key={1} onClick={() => goTo(1)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">1</button>);
                      if (start > 2) pages.push(<span key="d1" className="px-2 text-gray-400">...</span>);
                    }
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button key={i} onClick={() => goTo(i)} className={`px-3 py-2 rounded-lg text-sm ${currentPage === i ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}>{i}</button>
                      );
                    }
                    if (end < totalPages) {
                      if (end < totalPages - 1) pages.push(<span key="d2" className="px-2 text-gray-400">...</span>);
                      pages.push(<button key={totalPages} onClick={() => goTo(totalPages)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">{totalPages}</button>);
                    }
                    return pages;
                  })()}
                </div>
                <button onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm">Next</button>
                <button onClick={() => goTo(totalPages)} disabled={currentPage === totalPages} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm">Last</button>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm text-gray-500">Go to:</span>
                  <input type="number" min="1" max={totalPages} value={goToPage} onChange={(e) => setGoToPage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') goTo(parseInt(goToPage)); }}
                    placeholder={currentPage.toString()} className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                  <button onClick={() => goTo(parseInt(goToPage))} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Go</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
