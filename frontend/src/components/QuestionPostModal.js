import React, { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';
import MathInput from './MathInput';
import { toast } from 'sonner';

const QuestionPostModal = ({ isOpen, onClose, onSubmit, user }) => {
  const [questionText, setQuestionText] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async () => {
    if (!questionText.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setCreating(true);
    try {
      await onSubmit(questionText);
      setQuestionText('');
      onClose();
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create question post');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Create Comprehensive Question</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Question
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Ask a comprehensive question that will be answered in the comments. You can use mathematical equations using the toolbar below.
            </p>
            <MathInput
              value={questionText}
              onChange={setQuestionText}
              placeholder="Type your question here... Use $ signs for math: $x^2 + y^2 = z^2$"
              showToolbar={true}
              multiline={true}
              rows={6}
              className="w-full"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> This question will appear on your feed and can be answered by others in the comments section. Perfect for long-form questions, discussion topics, or problems that require detailed explanations.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={creating}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!questionText.trim() || creating}
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Post Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionPostModal;
