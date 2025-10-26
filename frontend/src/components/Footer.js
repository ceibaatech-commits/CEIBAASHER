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
            <div className="flex items-center space-x-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_prepchamp/artifacts/sd5j5kdo_IMG_1159-removebg-preview.png"
                alt="Ceibaa Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h3 className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Ceibaa
                </h3>
                <p className="text-xs text-cyan-300 font-bold tracking-wide">Neural Battle Arena</p>
              </div>
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
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">How It Works</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Blog</a></li>
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
                  onClick={() => navigate('/exam/Defence')}
                  className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                >
                  Defence Exams
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
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">support@ceibaa.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">+91 98765 43210</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">Bangalore, Karnataka, India</span>
              </li>
            </ul>
            <button className="mt-4 w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-4 py-2 rounded-lg font-semibold transition-all text-sm">
              Get Support
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2025 Ceibaa. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Refund Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
