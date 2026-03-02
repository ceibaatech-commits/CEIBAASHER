import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Youtube, Linkedin } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';

const FooterLink = ({ to, children }) => (
  <Link to={to} className="text-gray-400 hover:text-white transition-colors text-sm text-left block">
    {children}
  </Link>
);

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="hidden md:block bg-gradient-to-r from-gray-900 via-slate-900 to-black text-white mt-auto border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Top Grid: Brand + Quick Links + Exams + Contact */}
        <div className="grid grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img src="/ceibaa-logo.png" alt="Ceibaa Logo" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-gray-400 text-sm">
              India's premier live quiz battle platform. Free MCQs, NCERT solutions & interactive quizzes for CBSE Class 6-12, JEE, NEET, SSC, Banking & more.
            </p>
            <div>
              <p className="text-xs text-gray-500 mb-2 font-semibold">Follow Us</p>
              <div className="flex space-x-3">
                <a href="https://www.instagram.com/ceibaaapp/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg" title="Follow us on Instagram">
                  <Instagram className="w-5 h-5 text-white" />
                </a>
                <a href="https://twitter.com/ceibaaapp" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black hover:bg-gray-800 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg border border-gray-700" title="Follow us on X">
                  <FaXTwitter className="w-5 h-5 text-white" />
                </a>
                <a href="https://www.linkedin.com/company/ceibaa/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-700 hover:bg-blue-800 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg" title="Connect on LinkedIn">
                  <Linkedin className="w-5 h-5 text-white" />
                </a>
                <a href="https://www.youtube.com/@ceibaa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg" title="Subscribe on YouTube">
                  <Youtube className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-cyan-400">Quick Links</h4>
            <ul className="space-y-2">
              <li><FooterLink to="/about">About Us</FooterLink></li>
              <li><FooterLink to="/faq">FAQs</FooterLink></li>
              <li><FooterLink to="/contact">Contact Us</FooterLink></li>
              <li><FooterLink to="/teachers">Earn as Teacher</FooterLink></li>
              <li><FooterLink to="/leaderboard">Leaderboard</FooterLink></li>
              <li><FooterLink to="/divya">AI Tutor - Divya</FooterLink></li>
              <li><FooterLink to="/sitemap">Sitemap</FooterLink></li>
            </ul>
          </div>

          {/* Exam Categories */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-purple-400">Popular Exams</h4>
            <ul className="space-y-2">
              <li><FooterLink to="/exam/JEE">JEE Main & Advanced</FooterLink></li>
              <li><FooterLink to="/exam/NEET">NEET UG</FooterLink></li>
              <li><FooterLink to="/exam/UPSC">UPSC CSE</FooterLink></li>
              <li><FooterLink to="/exam/SSC_CGL">SSC CGL</FooterLink></li>
              <li><FooterLink to="/exam/SBI_PO">SBI PO</FooterLink></li>
              <li><FooterLink to="/exam/IBPS_PO">IBPS PO</FooterLink></li>
              <li><FooterLink to="/exam/NDA">NDA</FooterLink></li>
              <li><FooterLink to="/exam/CTET">CTET</FooterLink></li>
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
                  <a href="tel:+917303151699" className="text-gray-400 hover:text-white transition-colors text-sm block">+91 73031 51699</a>
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
            <a href="tel:+917303151699" className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-4 py-2 rounded-lg font-semibold transition-all text-sm flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" /> Call Now
            </a>
          </div>
        </div>

        {/* SEO Content Band: CBSE Classes */}
        <div className="mt-10 pt-8 border-t border-gray-800">
          <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Free CBSE Chapter-wise MCQs & NCERT Solutions</h4>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-y-4 gap-x-6">
            {/* Class 6 */}
            <div>
              <Link to="/chapter-tests/6" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mb-1 block">Class 6 MCQs</Link>
              <div className="space-y-0.5">
                <FooterLink to="/chapter-tests/6/mathematics---ganita-prakash">Class 6 Maths MCQs</FooterLink>
                <FooterLink to="/chapter-tests/6/science---curiosity">Class 6 Science MCQs</FooterLink>
                <FooterLink to="/chapter-tests/6/english---poorvi">Class 6 English MCQs</FooterLink>
                <FooterLink to="/chapter-tests/6/hindi---malhar">Class 6 Hindi MCQs</FooterLink>
              </div>
            </div>
            {/* Class 7 */}
            <div>
              <Link to="/chapter-tests/7" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mb-1 block">Class 7 MCQs</Link>
              <div className="space-y-0.5">
                <FooterLink to="/chapter-tests/7/mathematics---ganita-prakash">Class 7 Maths MCQs</FooterLink>
                <FooterLink to="/chapter-tests/7/science---curiosity">Class 7 Science MCQs</FooterLink>
                <FooterLink to="/chapter-tests/7/english---poorvi">Class 7 English MCQs</FooterLink>
                <FooterLink to="/chapter-tests/7/hindi---malhar">Class 7 Hindi MCQs</FooterLink>
              </div>
            </div>
            {/* Class 8 */}
            <div>
              <Link to="/chapter-tests/8" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mb-1 block">Class 8 MCQs</Link>
              <div className="space-y-0.5">
                <FooterLink to="/chapter-tests/8/mathematics">Class 8 Maths MCQs</FooterLink>
                <FooterLink to="/chapter-tests/8/science">Class 8 Science MCQs</FooterLink>
                <FooterLink to="/chapter-tests/8/english---poorvi">Class 8 English MCQs</FooterLink>
                <FooterLink to="/chapter-tests/8/social-science">Class 8 SST MCQs</FooterLink>
              </div>
            </div>
            {/* Class 9 */}
            <div>
              <Link to="/chapter-tests/9" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mb-1 block">Class 9 MCQs</Link>
              <div className="space-y-0.5">
                <FooterLink to="/chapter-tests/9/mathematics">Class 9 Maths MCQs</FooterLink>
                <FooterLink to="/chapter-tests/9/science">Class 9 Science MCQs</FooterLink>
                <FooterLink to="/chapter-tests/9/english-beehive">Class 9 English MCQs</FooterLink>
                <FooterLink to="/chapter-tests/9/hindi-kshitij">Class 9 Hindi MCQs</FooterLink>
              </div>
            </div>
            {/* Class 10 */}
            <div>
              <Link to="/chapter-tests/10" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mb-1 block">Class 10 MCQs</Link>
              <div className="space-y-0.5">
                <FooterLink to="/chapter-tests/10/mathematics">Class 10 Maths MCQs</FooterLink>
                <FooterLink to="/chapter-tests/10/science">Class 10 Science MCQs</FooterLink>
                <FooterLink to="/chapter-tests/10/english-first-flight">Class 10 English MCQs</FooterLink>
                <FooterLink to="/chapter-tests/10/social-science">Class 10 SST MCQs</FooterLink>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Content Band: Competitive Exams */}
        <div className="mt-6 pt-6 border-t border-gray-800/50">
          <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Free Mock Tests & Quizzes</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {[
              { name: 'JEE Main', id: 'JEE' }, { name: 'NEET', id: 'NEET' }, { name: 'CUET', id: 'CUET' },
              { name: 'GATE', id: 'GATE' }, { name: 'CAT', id: 'CAT' }, { name: 'CLAT', id: 'CLAT' },
              { name: 'UPSC', id: 'UPSC' }, { name: 'SSC CGL', id: 'SSC_CGL' }, { name: 'SSC CHSL', id: 'SSC_CHSL' },
              { name: 'SBI PO', id: 'SBI_PO' }, { name: 'SBI Clerk', id: 'SBI_CLERK' },
              { name: 'IBPS PO', id: 'IBPS_PO' }, { name: 'IBPS Clerk', id: 'IBPS_CLERK' },
              { name: 'NDA', id: 'NDA' }, { name: 'CDS', id: 'CDS' }, { name: 'AFCAT', id: 'AFCAT' },
              { name: 'CTET', id: 'CTET' }, { name: 'UPTET', id: 'UPTET' },
              { name: 'RBI Grade B', id: 'RBI_GRADE_B' }, { name: 'Agniveer', id: 'Agniveer' },
              { name: 'BCA', id: 'BCA' }, { name: 'GMAT', id: 'GMAT' },
              { name: 'Class 11 Science', path: '/chapter-tests/class-11/science' },
              { name: 'Class 12 Science', path: '/chapter-tests/class-12/science' },
            ].map(exam => (
              <Link
                key={exam.id || exam.name}
                to={exam.path || `/exam/${exam.id}`}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {exam.name} Mock Test
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 Ceibaa. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</Link>
              <Link to="/sitemap" className="text-gray-400 hover:text-white transition-colors text-sm">Sitemap</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
