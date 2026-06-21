import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Upload, Plus, Trash2, Edit, RefreshCw, Download, AlertCircle, CheckCircle, X
} from 'lucide-react';

const BACKEND_URL = window.location.origin;

const ChapterUploadManager = () => {
  const [board, setBoard] = useState('cbse');
  const [classNames, setClassNames] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [chapters, setChapters] = useState([]);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState([
    { chapter_number: 1, chapter_name: '', total_questions: 50, difficulty: 'Medium', duration: 35 }
  ]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const boards = ['cbse', 'rbse', 'hbse', 'upboard', 'bseb', 'mpbse'];
  const classOptions = {
    cbse: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 (Science)', 'Class 11 (Commerce)', 'Class 11 (Humanities)', 'Class 12 (Science)', 'Class 12 (Commerce)', 'Class 12 (Humanities)'],
    rbse: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
    default: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
  };

  useEffect(() => {
    setClassNames(classOptions[board] || classOptions.default);
    setSelectedClass('');
    setSubjects([]);
    loadStats();
  }, [board]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      loadChapters();
    }
  }, [selectedClass, selectedSubject, board]);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/class-chapters/stats`);
      if (response.data.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadChapters = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/class-chapters/chapters`, {
        params: {
          board,
          class_name: selectedClass,
          subject: selectedSubject
        }
      });

      if (response.data.success) {
        setChapters(response.data.chapters);
      } else {
        setChapters([]);
      }
      setEditingChapterId(null);
      setEditForm(null);
    } catch (error) {
      console.error('Error loading chapters:', error);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChapterRow = () => {
    const lastNumber = formData.length > 0 ? Math.max(...formData.map(c => c.chapter_number)) : 0;
    setFormData([
      ...formData,
      { chapter_number: lastNumber + 1, chapter_name: '', total_questions: 50, difficulty: 'Medium', duration: 35 }
    ]);
  };

  const handleChapterChange = (index, field, value) => {
    const newData = [...formData];
    newData[index] = { ...newData[index], [field]: value };
    setFormData(newData);
  };

  const handleRemoveChapterRow = (index) => {
    setFormData(formData.filter((_, i) => i !== index));
  };

  const handleUploadChapters = async () => {
    if (!selectedClass || !selectedSubject) {
      setErrorMessage('Please select a class and subject');
      return;
    }

    // Validate all chapters have names
    if (formData.some(ch => !ch.chapter_name.trim())) {
      setErrorMessage('All chapters must have a name');
      return;
    }

    try {
      setUploading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await axios.post(
        `${BACKEND_URL}/api/admin/class-chapters/chapters`,
        {
          board,
          class_name: selectedClass,
          subject: selectedSubject,
          chapters: formData
        }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setShowForm(false);
        setFormData([{ chapter_number: 1, chapter_name: '', total_questions: 50, difficulty: 'Medium', duration: 35 }]);
        loadChapters();
        loadStats();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message;
      setErrorMessage(`Failed to upload chapters: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAllChapters = async () => {
    if (!window.confirm(`Are you sure you want to delete all chapters for ${selectedClass} ${selectedSubject}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(
        `${BACKEND_URL}/api/admin/class-chapters/chapters`,
        {
          data: {
            board,
            class_name: selectedClass,
            subject: selectedSubject
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage(`Deleted ${response.data.deleted_count} chapters`);
        loadChapters();
        loadStats();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      setErrorMessage('Failed to delete chapters');
    } finally {
      setLoading(false);
    }
  };

  const handleImportDefaults = async () => {
    if (!window.confirm('This will import all default chapters from hardcoded data into the database. Existing chapters will be overwritten. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/class-chapters/import-default`
      );

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        loadChapters();
        loadStats();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message;
      setErrorMessage(`Failed to import chapters: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const startEditChapter = (chapter) => {
    setEditingChapterId(chapter.id);
    setEditForm({
      chapter_name: chapter.chapter_name || '',
      chapter_number: chapter.chapter_number || 1,
      total_questions: chapter.total_questions ?? 50,
      difficulty: chapter.difficulty || 'Medium',
      duration: chapter.duration ?? 35
    });
  };

  const cancelEditChapter = () => {
    setEditingChapterId(null);
    setEditForm(null);
  };

  const saveEditChapter = async () => {
    if (!editingChapterId || !editForm) {
      return;
    }

    if (!editForm.chapter_name.trim()) {
      setErrorMessage('Chapter name cannot be empty');
      return;
    }

    try {
      setSavingEdit(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await axios.put(
        `${BACKEND_URL}/api/admin/class-chapters/chapters/${editingChapterId}`,
        {
          chapter_number: Number(editForm.chapter_number) || 1,
          chapter_name: editForm.chapter_name.trim(),
          total_questions: Number(editForm.total_questions) || 50,
          difficulty: editForm.difficulty,
          duration: Number(editForm.duration) || 35
        }
      );

      if (response.data.success) {
        setSuccessMessage('Chapter updated successfully');
        cancelEditChapter();
        loadChapters();
        loadStats();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message;
      setErrorMessage(`Failed to update chapter: ${errorMsg}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteChapter = async (chapter) => {
    if (!window.confirm(`Delete chapter "${chapter.chapter_name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(`${BACKEND_URL}/api/admin/class-chapters/chapters/${chapter.id}`);

      if (response.data.success) {
        setSuccessMessage('Chapter deleted successfully');
        if (editingChapterId === chapter.id) {
          cancelEditChapter();
        }
        loadChapters();
        loadStats();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message;
      setErrorMessage(`Failed to delete chapter: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 Class Chapter Manager</h1>
        <p className="text-gray-600">Upload and manage chapters for different boards and classes</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-600 font-semibold">Total Chapters</p>
            <p className="text-3xl font-bold text-blue-900">{stats.total_chapters}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-600 font-semibold">Boards Covered</p>
            <p className="text-3xl font-bold text-green-900">{stats.board_breakdown.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-purple-600 font-semibold">Classes Covered</p>
            <p className="text-3xl font-bold text-purple-900">{stats.class_breakdown.length}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Selection Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Board</label>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {boards.map(b => (
                <option key={b} value={b}>{b.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Class</option>
              {classNames.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Subject</option>
              {/* Subjects would be populated from API or config */}
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="History">History</option>
              <option value="Geography">Geography</option>
              <option value="Political Science">Political Science</option>
              <option value="Economics">Economics</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={!selectedClass || !selectedSubject}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            selectedClass && selectedSubject
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Add Chapters'}
        </button>

        <button
          onClick={handleImportDefaults}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Import Defaults
        </button>

        {chapters.length > 0 && (
          <button
            onClick={handleDeleteAllChapters}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </button>
        )}
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Upload Chapters for {selectedClass} - {selectedSubject}</h3>

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {formData.map((chapter, index) => (
              <div key={index} className="flex gap-3 items-end p-3 bg-gray-50 rounded-lg">
                <div className="w-16">
                  <label className="text-xs font-medium text-gray-600">Ch #</label>
                  <input
                    type="number"
                    value={chapter.chapter_number}
                    onChange={(e) => handleChapterChange(index, 'chapter_number', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    min="1"
                  />
                </div>

                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600">Chapter Name</label>
                  <input
                    type="text"
                    value={chapter.chapter_name}
                    onChange={(e) => handleChapterChange(index, 'chapter_name', e.target.value)}
                    placeholder="e.g., Matter in Our Surroundings"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div className="w-20">
                  <label className="text-xs font-medium text-gray-600">Questions</label>
                  <input
                    type="number"
                    value={chapter.total_questions}
                    onChange={(e) => handleChapterChange(index, 'total_questions', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    min="1"
                  />
                </div>

                <div className="w-24">
                  <label className="text-xs font-medium text-gray-600">Difficulty</label>
                  <select
                    value={chapter.difficulty}
                    onChange={(e) => handleChapterChange(index, 'difficulty', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>

                <div className="w-20">
                  <label className="text-xs font-medium text-gray-600">Duration (min)</label>
                  <input
                    type="number"
                    value={chapter.duration}
                    onChange={(e) => handleChapterChange(index, 'duration', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    min="5"
                  />
                </div>

                <button
                  onClick={() => handleRemoveChapterRow(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddChapterRow}
              className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>

            <button
              onClick={handleUploadChapters}
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Chapters
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Chapters List */}
      {selectedClass && selectedSubject && !showForm && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Chapters for {selectedClass} - {selectedSubject}</h3>
            {loading && <p className="text-sm text-gray-500 mt-2">Loading...</p>}
          </div>

          {chapters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Chapter #</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Questions</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Difficulty</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.map((chapter) => (
                    <tr key={chapter.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{chapter.chapter_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {editingChapterId === chapter.id ? (
                          <input
                            type="text"
                            value={editForm?.chapter_name || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, chapter_name: e.target.value }))}
                            className="w-full min-w-[220px] rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          />
                        ) : (
                          chapter.chapter_name
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {editingChapterId === chapter.id ? (
                          <input
                            type="number"
                            min="1"
                            value={editForm?.total_questions ?? 50}
                            onChange={(e) => setEditForm(prev => ({ ...prev, total_questions: e.target.value }))}
                            className="w-24 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          />
                        ) : (
                          chapter.total_questions
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editingChapterId === chapter.id ? (
                          <select
                            value={editForm?.difficulty || 'Medium'}
                            onChange={(e) => setEditForm(prev => ({ ...prev, difficulty: e.target.value }))}
                            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            chapter.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            chapter.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {chapter.difficulty}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {editingChapterId === chapter.id ? (
                          <input
                            type="number"
                            min="1"
                            value={editForm?.duration ?? 35}
                            onChange={(e) => setEditForm(prev => ({ ...prev, duration: e.target.value }))}
                            className="w-24 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          />
                        ) : (
                          `${chapter.duration} min`
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editingChapterId === chapter.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={saveEditChapter}
                              disabled={savingEdit}
                              className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {savingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEditChapter}
                              className="rounded border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => startEditChapter(chapter)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-900 font-medium"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(chapter)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No chapters found. {!showForm && 'Click "Add Chapters" to upload.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChapterUploadManager;
