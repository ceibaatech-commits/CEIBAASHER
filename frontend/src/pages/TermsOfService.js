import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const TermsOfService = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogin = () => navigate('/login');
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
      
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: December 2024</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing and using Ceibaa ("the Platform"), you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="text-gray-600 leading-relaxed">
                Ceibaa is an exam preparation platform that provides:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li>Practice quizzes and mock tests for competitive exams</li>
                <li>Capazoo social features for community engagement</li>
                <li>Live quiz battles and multiplayer competitions</li>
                <li>Study materials and resources</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
              <p className="text-gray-600 leading-relaxed">
                To access certain features, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Notifying us immediately of any unauthorized access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Conduct</h2>
              <p className="text-gray-600 leading-relaxed">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li>Use the platform for any illegal or unauthorized purpose</li>
                <li>Share or distribute quiz content without permission</li>
                <li>Attempt to gain unauthorized access to other accounts</li>
                <li>Post offensive, harmful, or inappropriate content</li>
                <li>Use automated tools to access the platform</li>
                <li>Cheat or manipulate quiz results</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                All content on the platform, including quizzes, questions, designs, and logos, is the property of Ceibaa 
                or its content suppliers and is protected by intellectual property laws. You may not reproduce, distribute, 
                or create derivative works without explicit permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Disclaimer of Warranties</h2>
              <p className="text-gray-600 leading-relaxed">
                The platform is provided "as is" without warranties of any kind. We do not guarantee that the service will 
                be uninterrupted, secure, or error-free. Quiz results and performance metrics are for educational purposes only.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                Ceibaa shall not be liable for any indirect, incidental, special, or consequential damages arising from 
                your use of the platform or inability to access the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the platform after changes 
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                For questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-gray-600 mt-2">
                Email: <a href="mailto:support@ceibaa.com" className="text-blue-600 hover:underline">support@ceibaa.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;
