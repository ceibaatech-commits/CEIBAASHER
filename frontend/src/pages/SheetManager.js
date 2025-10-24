import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Plus, Trash2, Check, X, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SheetManager = () => {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  const [formData, setFormData] = useState({
    exam_id: 'NEET',
    subject: '',
    topic: '',
    sheet_url: '',
    sheet_name: ''
  });

  const exams = ['NEET', 'JEE', 'UPSC', 'SSC', 'Banking', 'Agriculture', 'RPSC', 'Defence'];

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/sheets/list`);
      if (response.data.success) {
        setSheets(response.data.sheets);
      }
    } catch (error) {
      console.error('Error fetching sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/sheets/add`, formData);
      if (response.data.success) {
        alert('Sheet mapping added successfully!');
        setShowAddForm(false);
        setFormData({ exam_id: 'NEET', subject: '', topic: '', sheet_url: '', sheet_name: '' });
        fetchSheets();
      }
    } catch (error) {
      alert('Error adding sheet: ' + error.message);
    }
  };

  const handleDelete = async (sheet) => {
    if (window.confirm(`Delete sheet mapping for ${sheet.exam_id} > ${sheet.subject} > ${sheet.topic}?`)) {
      try {
        await axios.delete(`${API_URL}/api/sheets/delete/${sheet.exam_id}/${sheet.subject}/${sheet.topic}`);
        fetchSheets();
      } catch (error) {
        alert('Error deleting sheet: ' + error.message);
      }
    }
  };

  const testSheetAccess = async () => {
    setTestResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/sheets/test`, {
        sheet_url: formData.sheet_url
      });
      setTestResult(response.data);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileSpreadsheet className="w-8 h-8 text-green-600 mr-3" />
                Google Sheets Manager
              </h1>
              <p className="text-gray-600 mt-2">Configure question banks for each exam topic</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Add Sheet</span>
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Sheet Mapping</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
                  <select
                    value={formData.exam_id}
                    onChange={(e) => setFormData({ ...formData, exam_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    required
                  >
                    {exams.map(exam => (
                      <option key={exam} value={exam}>{exam}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Physics"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g., Mechanics"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Google Sheet URL</label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={formData.sheet_url}
                    onChange={(e) => setFormData({ ...formData, sheet_url: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={testSheetAccess}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    Test Access
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}>
                  {testResult.success ? (
                    <div className="flex items-center text-green-800">
                      <Check className="w-5 h-5 mr-2" />
                      <span>Sheet accessible! Found {testResult.row_count} rows</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-800">
                      <X className="w-5 h-5 mr-2" />
                      <span>Error: {testResult.error}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Add Mapping
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setTestResult(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sheets List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Configured Sheets ({sheets.length})</h2>
          
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : sheets.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No sheet mappings configured yet</p>
              <p className="text-sm text-gray-500 mt-2">Click "Add Sheet" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sheets.map((sheet, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-green-400 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-lg text-gray-900">{sheet.exam_id}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-blue-600 font-semibold">{sheet.subject}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-purple-600 font-semibold">{sheet.topic}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <ExternalLink className="w-4 h-4" />
                      <a 
                        href={sheet.sheet_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 truncate"
                      >
                        {sheet.sheet_url}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(sheet)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors ml-4"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-3">📝 How to Use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Create a Google Sheet with your questions in this format: <code className="bg-white px-2 py-1 rounded">QUESTION NUMBER | Question | A | B | C | D | Answer | Explanation</code></li>
            <li>Make the sheet public (Anyone with the link can view)</li>
            <li>Copy the sheet URL and add it here with Exam/Subject/Topic mapping</li>
            <li>Test access to verify the sheet is readable</li>
            <li>Students will now get questions from your Google Sheet when they start a quiz for that topic!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SheetManager;
