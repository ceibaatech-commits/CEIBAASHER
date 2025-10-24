import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import StunningCeibaaLogo from './StunningCeibaaLogo';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-slate-900 to-black text-white mt-auto border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <CeibaaLogo size="sm" showText={true} />
            <p className="text-gray-400 text-sm">
              India's premier live quiz battle platform. Master competitive exams through engaging multiplayer battles.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-400 rounded-full flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-pink-600 rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-cyan-400">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">How It Works</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">FAQs</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Contact Us</a></li>
            </ul>
          </div>

          {/* Exam Categories */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-purple-400">Exam Categories</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">JEE Main & Advanced</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">NEET UG</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">UPSC CSE</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">SSC Exams</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Banking Exams</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Defence Exams</a></li>
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
