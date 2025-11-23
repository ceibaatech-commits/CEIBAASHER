import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, ArrowLeft, PlayCircle, FileText, User, Building2 } from 'lucide-react';
import Header from '../components/Header';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BookDetails = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookDetails();
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/books/${bookId}`);
      if (response.data.success) {
        setBook(response.data.book);
        setChapters(response.data.book.chapters || []);
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (chapterId, chapterName) => {
    // Navigate to quiz page for this chapter
    navigate(`/books/${bookId}/chapters/${chapterId}/quiz`, {
      state: {
        bookName: book?.name,
        chapterName: chapterName
      }
    });
  };

  if (loading) {  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };


    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
        isLoggedIn={isAuthenticated()}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading book details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };


    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
        isLoggedIn={isAuthenticated()}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Book not found</p>
            <button
              onClick={() => navigate('/books')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Books
            </button>
          </div>
        </div>
      </div>
    );
  }  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        isLoggedIn={isAuthenticated()}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 py-8 mt-20">
        {/* Back Button */}
        <button
          onClick={() => navigate('/books')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Books
        </button>

        {/* Book Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Book Cover */}
            <div className="w-full md:w-48 h-64 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              {book.cover_image ? (
                <img
                  src={book.cover_image}
                  alt={book.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <BookOpen className="w-24 h-24 text-white/30" />
              )}
            </div>

            {/* Book Info */}
            <div className="flex-1">
              <div className="mb-2">
                {book.category && (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {book.category}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                {book.name}
              </h1>
              {book.author && (
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <User className="w-4 h-4" />
                  <span>by {book.author}</span>
                </div>
              )}
              {book.publisher && (
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Building2 className="w-4 h-4" />
                  <span>{book.publisher}</span>
                </div>
              )}
              {book.description && (
                <p className="text-gray-600 leading-relaxed mb-4">
                  {book.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{chapters.length} chapters</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Chapters</h2>

          {chapters.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No chapters available yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {chapter.chapter_number}
                        </span>
                        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {chapter.name}
                        </h3>
                      </div>
                      {chapter.description && (
                        <p className="text-sm text-gray-600 ml-11 line-clamp-2">
                          {chapter.description}
                        </p>
                      )}
                      <div className="ml-11 mt-2">
                        <span className="text-sm text-gray-500">
                          {chapter.question_count || 0} questions available
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartQuiz(chapter.id, chapter.name)}
                      disabled={!chapter.question_count || chapter.question_count === 0}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        chapter.question_count > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <PlayCircle className="w-5 h-5" />
                      <span className="hidden md:inline">Start Quiz</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
