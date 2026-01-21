import React, { useState } from 'react';
import axios from 'axios';

const API_URL = window.location.origin;

const TestSheets = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testTopic = async (exam, subject, topic) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/test/quiz/simulate-start/${exam}/${encodeURIComponent(subject)}/${encodeURIComponent(topic)}`
      );
      setTestResult(response.data);
    } catch (error) {
      setTestResult({ error: error.message });
    }
    setLoading(false);
  };

  const testTopics = [
    { exam: 'JEE', subject: 'Inorganic Chemistry', topic: 'Periodic Table' },
    { exam: 'JEE', subject: 'Inorganic Chemistry', topic: 'Chemical Bonding' },
    { exam: 'JEE', subject: 'Inorganic Chemistry', topic: 'Coordination Compounds' },
    { exam: 'JEE', subject: 'Inorganic Chemistry', topic: 'Metallurgy' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-white mb-6">
            🧪 Google Sheets Integration Test
          </h1>
          
          <p className="text-white/80 mb-8">
            Click any topic below to verify questions are loading from your uploaded Google Sheets
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {testTopics.map((t, idx) => (
              <button
                key={idx}
                onClick={() => testTopic(t.exam, t.subject, t.topic)}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 
                         text-white font-semibold py-4 px-6 rounded-xl shadow-lg 
                         transform hover:scale-105 transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-left">
                  <div className="text-sm opacity-80">{t.subject}</div>
                  <div className="text-lg">{t.topic}</div>
                </div>
              </button>
            ))}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
              <p className="text-white mt-4">Testing...</p>
            </div>
          )}

          {testResult && !loading && (
            <div className="bg-black/30 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-4">
                {testResult.error ? '❌ Error' : '✅ Test Result'}
              </h2>
              
              {testResult.error ? (
                <div className="text-red-400 font-mono text-sm">
                  {testResult.error}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/60 text-sm">Exam</div>
                      <div className="text-white font-semibold">{testResult.exam_id}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/60 text-sm">Subject</div>
                      <div className="text-white font-semibold">{testResult.subject}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/60 text-sm">Topic</div>
                      <div className="text-white font-semibold">{testResult.topic}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/60 text-sm">Questions Found</div>
                      <div className="text-white font-bold text-2xl">{testResult.questions_fetched}</div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${testResult.will_use_google_sheets ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">
                        {testResult.will_use_google_sheets ? '✅' : '❌'}
                      </div>
                      <div>
                        <div className="text-white font-bold">
                          {testResult.will_use_google_sheets ? 'Using Google Sheets' : 'Using Demo Data'}
                        </div>
                        <div className="text-white/70 text-sm">
                          {testResult.will_use_google_sheets 
                            ? 'Questions are loading from your uploaded sheet!' 
                            : 'No sheet found or sheet is empty/inaccessible'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {testResult.sample_question && (
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/60 text-sm mb-2">Sample Question:</div>
                      <div className="text-white font-medium">{testResult.sample_question}</div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setTestResult(null)}
                className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                Test Another Topic
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/60 text-sm">
              💡 <strong>Tip:</strong> If you see "Using Demo Data", it means either:
              <br />• No Google Sheet is mapped for that topic
              <br />• The sheet URL is inaccessible (404/private)
              <br />• The sheet format is incorrect
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSheets;
