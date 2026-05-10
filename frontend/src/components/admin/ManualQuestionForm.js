import React from 'react';
import { Upload, RefreshCw, Plus } from 'lucide-react';

/**
 * Manual question entry form for admin's ExamSheetManager.
 *
 * Lets admins type a single MCQ by hand (with optional question/option
 * images) instead of importing from a Google Sheet or OCR.
 *
 * Extracted from ExamSheetManager.js (Feb 25, 2026) to keep the parent
 * component focused on data orchestration.
 *
 * All state and handlers stay in the parent — this is a presentational
 * shell. Props mirror the parent's existing wiring.
 */
const ManualQuestionForm = ({
  manualQuestion,
  setManualQuestion,
  uploadingQuestionImage,
  uploadingOptionImage,
  handleQuestionImageUpload,
  removeQuestionImage,
  handleOptionImageUpload,
  removeOptionImage,
  handleManualQuestionSubmit,
  loading,
}) => (
  <div className="space-y-5 bg-green-50 p-5 rounded-xl border border-green-200" data-testid="manual-question-form">
    <h4 className="font-bold text-green-800 flex items-center gap-2">
      <span className="text-lg">✏️</span> Add Question Manually with Image Support
    </h4>

    {/* Question Text */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Question Text *
      </label>
      <textarea
        value={manualQuestion.question}
        onChange={(e) => setManualQuestion({ ...manualQuestion, question: e.target.value })}
        placeholder="Enter your question here... Use $ for math: $x^2 + y^2 = z^2$"
        rows={3}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        required
      />
    </div>

    {/* Question Image Upload */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Question Image (Optional)
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleQuestionImageUpload(e.target.files[0])}
          className="hidden"
          id="manual-question-image"
          disabled={uploadingQuestionImage}
        />
        {manualQuestion.question_image_preview ? (
          <div className="relative inline-block">
            <img
              src={manualQuestion.question_image_preview}
              alt="Question"
              className="max-h-40 rounded-lg shadow"
            />
            <button
              type="button"
              onClick={removeQuestionImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ) : (
          <label htmlFor="manual-question-image" className="cursor-pointer">
            {uploadingQuestionImage ? (
              <div className="text-green-600">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>Uploading...</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <Upload className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">Click to add image to question</p>
                <p className="text-xs text-gray-400">Diagrams, graphs, figures</p>
              </div>
            )}
          </label>
        )}
      </div>
    </div>

    {/* Options */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Answer Options *
      </label>
      <div className="space-y-3">
        {['A', 'B', 'C', 'D'].map((letter, idx) => (
          <div key={letter} className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                manualQuestion.correctAnswer === idx
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {letter}
            </div>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={manualQuestion.options[idx]}
                onChange={(e) => {
                  const newOptions = [...manualQuestion.options];
                  newOptions[idx] = e.target.value;
                  setManualQuestion({ ...manualQuestion, options: newOptions });
                }}
                placeholder={`Option ${letter}`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {/* Option Image */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleOptionImageUpload(e.target.files[0], idx)}
                  className="hidden"
                  id={`option-image-${idx}`}
                  disabled={uploadingOptionImage === idx}
                />
                {manualQuestion.option_image_previews[idx] ? (
                  <div className="relative inline-block">
                    <img
                      src={manualQuestion.option_image_previews[idx]}
                      alt={`Option ${letter}`}
                      className="h-16 rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeOptionImage(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor={`option-image-${idx}`}
                    className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                  >
                    {uploadingOptionImage === idx ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    Add image
                  </label>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setManualQuestion({ ...manualQuestion, correctAnswer: idx })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                manualQuestion.correctAnswer === idx
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
              }`}
            >
              {manualQuestion.correctAnswer === idx ? '✓ Correct' : 'Set Correct'}
            </button>
          </div>
        ))}
      </div>
    </div>

    {/* Explanation */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Explanation (Optional)
      </label>
      <textarea
        value={manualQuestion.explanation}
        onChange={(e) => setManualQuestion({ ...manualQuestion, explanation: e.target.value })}
        placeholder="Explain why this answer is correct..."
        rows={2}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>

    {/* Submit Manual Question Button */}
    <button
      type="button"
      onClick={handleManualQuestionSubmit}
      disabled={loading || !manualQuestion.question.trim()}
      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      <Plus className="w-5 h-5" />
      {loading ? 'Adding Question...' : 'Add This Question'}
    </button>
  </div>
);

export default ManualQuestionForm;
