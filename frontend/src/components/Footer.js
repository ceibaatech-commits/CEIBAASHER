import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Youtube, Linkedin } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-gradient-to-r from-gray-900 via-slate-900 to-black text-white mt-auto border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img 
                src="/ceibaa-logo.png" 
                alt="Ceibaa Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="text-gray-400 text-sm">
              India's premier live quiz battle platform. Master competitive exams through engaging multiplayer battles.
            </p>
            
            {/* Social Media Links */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-semibold">Follow Us</p>
              <div className="flex space-x-3">
                <a 
                  href="https://www.instagram.com/ceibaaapp" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg"
                  title="Follow us on Instagram"
                >
                  <Instagram className="w-5 h-5 text-white" />
                </a>
                <a 
                  href="https://x.com/Ceibaaapp" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-black hover:bg-gray-900 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg border border-gray-700"
                  title="Follow us on X (Twitter)"
                >
                  <FaXTwitter className="w-5 h-5 text-white" />
                </a>
                <a 
                  href="https://www.linkedin.com/company/ceibaa/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg"
                  title="Connect on LinkedIn"
                >
                  <Linkedin className="w-5 h-5 text-white" />
                </a>
                <a 
                  href="https://www.youtube.com/@CeibaaTech-n7o" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg"
                  title="Subscribe on YouTube"
                >
                  <Youtube className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-cyan-400">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => navigate('/about')}
                  className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/faq')}
                  className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                >
                  FAQs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/contact')}
                  className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Exam Categories */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-purple-400">Exam Categories</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => navigate('/exam/JEE')}
                  className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                >
                  JEE Main & Advanced
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/exam/NEET')}
                  className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                >
                  NEET UG
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/exam/UPSC')}
                  className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                >
                  UPSC CSE
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/exam/SSC')}
                  className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                >
                  SSC Exams
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/exam/Banking')}
                  className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                >
                  Banking Exams
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/exam/Agniveer')}
                  className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                >
                  Agniveer Exam
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/exam/Agriculture')}
                  className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                >
                  Agriculture Exams
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/exam/RPSC')}
                  className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                >
                  RPSC Statistical Officer
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-pink-400">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-cyan-400" />
                </div>
                <a href="mailto:support@ceibaa.in" className="text-gray-400 hover:text-white transition-colors text-sm">
                  support@ceibaa.in
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <a 
                    href="tel:+917303151699" 
                    className="text-gray-400 hover:text-white transition-colors text-sm block"
                  >
                    +91 73031 51699
                  </a>
                  <span className="text-gray-500 text-xs">9 AM - 6 PM IST</span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-gray-400 text-sm">India</span>
              </li>
            </ul>
            <a 
              href="tel:+917303151699"
              className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-4 py-2 rounded-lg font-semibold transition-all text-sm flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2025 Ceibaa. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <button onClick={() => navigate('/privacy')} className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</button>
              <button onClick={() => navigate('/terms')} className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</button>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Refund Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
