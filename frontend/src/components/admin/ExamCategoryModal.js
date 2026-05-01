import React from 'react';
import { X, Save, Loader2 } from 'lucide-react';

const COLOR_OPTIONS = ['blue', 'green', 'red', 'purple', 'indigo', 'pink', 'yellow', 'orange', 'teal', 'cyan'];
const ICON_OPTIONS = ['📚', '📖', '🎓', '✏️', '📝', '🔬', '🧪', '🧮', '🌍', '💻', '📊', '🏆'];

/**
 * Create/Edit modal for Exam / Category / Chapter admin operations.
 * Extracted from ExamCategoryManager.js for maintainability.
 * Pure presentational — all state lives in the parent.
 */
const ExamCategoryModal = ({
  modalMode,
  modalType,
  formData,
  setFormData,
  onClose,
  onSubmit,
  saving,
  exams,
  categoriesForSelectedExam,
}) => {
  const showIconColor = modalType === 'exam' || modalType === 'category';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {modalMode === 'create' ? 'Create' : 'Edit'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter ${modalType} name`}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Optional description"
            />
          </div>

          {/* Exam-specific fields */}
          {modalType === 'exam' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                <input
                  type="number"
                  value={formData.duration || 180}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                <input
                  type="number"
                  value={formData.total_marks || 100}
                  onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Icon & Color */}
          {showIconColor && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`text-xl p-1 rounded ${formData.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-6 h-6 rounded-full bg-${color}-500 ${formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      style={{ backgroundColor: `var(--color-${color}-500, ${color})` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Parent selection for category */}
          {modalType === 'category' && modalMode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Exam *</label>
              <select
                required
                value={formData.exam_id || ''}
                onChange={(e) => setFormData({ ...formData, exam_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an exam</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>{exam.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Parent selection for chapter */}
          {modalType === 'chapter' && modalMode === 'create' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Exam *</label>
                <select
                  required
                  value={formData.exam_id || ''}
                  onChange={(e) => setFormData({ ...formData, exam_id: e.target.value, category_id: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an exam</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>{exam.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category *</label>
                <select
                  required
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.exam_id}
                >
                  <option value="">Select a category</option>
                  {categoriesForSelectedExam.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Sub-topics for chapter */}
          {modalType === 'chapter' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub-topics (comma separated)</label>
              <input
                type="text"
                value={(formData.sub_topics || []).join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  sub_topics: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Topic 1, Topic 2, Topic 3"
              />
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active !== false}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Active</label>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {modalMode === 'create' ? 'Create' : 'Update'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamCategoryModal;
