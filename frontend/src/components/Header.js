import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, LogOut, Menu, X, Flame, User, LayoutDashboard, ChevronDown, Home, Zap, BookOpen, Users, Search, GraduationCap, TreePine, Mic, Swords, MessageSquare, Briefcase, KeyRound, Settings as SettingsIcon } from 'lucide-react';
import axios from 'axios';
import NotificationBell from './NotificationBell';
import InboxDropdown from './InboxDropdown';
import NavbarSearch from './NavbarSearch';
import '../styles/navbar-search.css';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = window.location.origin;

const Header = ({ isLoggedIn: propIsLoggedIn, user: propUser, onLogin, onLogout }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const mobileMenuRef = React.useRef(null);
  
  // Use auth context as primary source, fall back to props
  const auth = useAuth();
  const contextUser = auth?.user;
  const contextIsLoggedIn = auth?.isAuthenticated ? auth.isAuthenticated() : !!contextUser;
  const contextLogout = auth?.logout;
  
  // Prefer context over props
  const user = contextUser || propUser;
  const isLoggedIn = contextIsLoggedIn || propIsLoggedIn || false;
  
  // Handle logout - use context logout or prop callback
  const handleLogout = () => {
    if (contextLogout) {
      contextLogout();
    } else if (onLogout) {
      onLogout();
    } else {
      // Fallback: clear localStorage manually
      localStorage.removeItem('ceibaa_user');
      window.location.href = '/';
    }
  };
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  // ────────────── Desktop nav config (responsive collapse) ──────────────
  // Single source of truth for the desktop nav. We render the first N items
  // inline based on viewport (Tailwind responsive utilities) and stuff the
  // remaining ones into a "More ▾" dropdown.
  const NAV_ITEMS = React.useMemo(() => ([
    { label: 'Home',            path: '/',           icon: Home,          tint: 'text-cyan-500',    hover: 'hover:text-cyan-600',    underline: 'bg-cyan-600' },
    { label: 'Victory Lane',    path: '/victory-lane', icon: Trophy,      tint: 'text-amber-500',   hover: 'hover:text-amber-600',   underline: 'bg-amber-500' },
    { label: 'Skill Drills',    path: '/chapter-tests', icon: Zap,        tint: 'text-blue-500',    hover: 'hover:text-blue-600',    underline: 'bg-blue-500' },
    { label: 'Courses',         path: '/courses',    icon: GraduationCap, tint: 'text-indigo-500',  hover: 'hover:text-indigo-600',  underline: 'bg-indigo-500' },
    { label: 'The Headhunt',    path: '/jobs',       icon: Briefcase,     tint: 'text-orange-500',  hover: 'hover:text-orange-600',  underline: 'bg-orange-500' },
    { label: 'Join Battle Room',path: '/join-room',  icon: Swords,        tint: 'text-rose-500',    hover: 'hover:text-rose-600',    underline: 'bg-rose-500' },
    { label: 'Divya Tutor',     path: '/divya',      icon: Mic,           tint: 'text-purple-500',  hover: 'hover:text-purple-600',  underline: 'bg-purple-600' },
  ]), []);

  const [moreOpen, setMoreOpen] = React.useState(false);
  React.useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e) => {
      if (!e.target.closest('[data-more-menu-container]')) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [moreOpen]);

  // Lock body scroll when mobile menu is open (stronger approach for mobile)
  React.useEffect(() => {
    if (mobileMenuOpen) {
      // Lock body scroll but allow menu scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      // Cleanup
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('.mobile-menu-toggle')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 shadow-sm border-b border-gray-200" style={{ background: '#ffffff', color: '#1f2937', height: '72px' }}>
        <div className="max-w-[1600px] mx-auto h-full px-4 md:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center h-full gap-4 lg:gap-6">
          {/* ────────── LEFT: Logo & Brand ────────── */}
          <div
            className="cursor-pointer flex items-center flex-shrink-0"
            onClick={() => navigate('/')}
            data-testid="header-logo"
          >
            <img
              src="/ceibaa-logo.png"
              alt="Ceibaa Logo"
              className="max-h-10 w-auto object-contain"
            />
          </div>

          {/* ────────── CENTER: Desktop Navigation (responsive collapse) ────────── */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-5 min-w-0" aria-label="Primary">
            {NAV_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              // Visibility tiers:
              //   ≥1024 (lg) : first 3
              //   ≥1280 (xl) : first 5
              //   ≥1440 (2xl): all 7
              let visibilityCls = '';
              if (idx >= 5) visibilityCls = 'hidden 2xl:inline-flex';
              else if (idx >= 3) visibilityCls = 'hidden xl:inline-flex';
              else visibilityCls = 'inline-flex';

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`${visibilityCls} group relative flex-shrink-0 items-center gap-1.5 whitespace-nowrap px-1 py-2 text-sm font-medium text-gray-700 ${item.hover} transition-colors`}
                  data-testid={`header-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.tint}`} />
                  <span>{item.label}</span>
                  <span className={`absolute bottom-0 left-0 h-0.5 w-0 ${item.underline} transition-all duration-200 group-hover:w-full`} />
                </button>
              );
            })}

            {/* "More ▾" — collapses overflow items per viewport */}
            <div className="relative" data-more-menu-container>
              {/* Show "More" when at least one nav item is hidden:
                  - <xl (1280): hides items at idx >=3 ⇒ "More" visible
                  - <2xl (1440): hides items at idx >=5 ⇒ "More" visible
                  - ≥2xl: hide "More" */}
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className="inline-flex 2xl:hidden flex-shrink-0 items-center gap-1 whitespace-nowrap px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                data-testid="header-nav-more"
              >
                More
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                  role="menu"
                  data-testid="header-nav-more-menu"
                >
                  {NAV_ITEMS.map((item, idx) => {
                    const Icon = item.icon;
                    // Only show items that are HIDDEN inline at the current viewport.
                    // We use Tailwind responsive utilities to inverse-mirror the
                    // inline list above.
                    let cls = '';
                    if (idx >= 5) cls = 'flex 2xl:hidden'; // hidden until 2xl inline → in More otherwise
                    else if (idx >= 3) cls = 'flex xl:hidden'; // hidden until xl inline → in More on lg
                    else cls = 'hidden'; // first 3 are always inline at lg+

                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => { setMoreOpen(false); navigate(item.path); }}
                        className={`${cls} w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50`}
                        role="menuitem"
                        data-testid={`header-nav-more-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${item.tint}`} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* ────────── RIGHT: Search + Auth/Profile ────────── */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-auto lg:ml-0">
            {/* Navbar Search — collapsed to icon by default; expands to input on click */}
            <div className="hidden md:block">
              <NavbarSearch />
            </div>
            
            {isLoggedIn && user ? (
              <>
                {/* Notifications Bell - Only for logged-in users */}
                <NotificationBell />

                {/* Inbox Dropdown - Only for logged-in users */}
                <InboxDropdown user={user} />

                {/* User Profile Avatar with Dropdown (Desktop) - Only for logged-in users */}
                <div className="hidden md:block relative profile-dropdown-container">
                  <button 
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus:outline-none"
                  >
                    {/* Profile Avatar */}
                    {user.profile_picture || user.avatar ? (
                      <img
                        src={user.profile_picture || user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-cyan-500 transition-all object-cover cursor-pointer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-300 hover:border-cyan-500 transition-all cursor-pointer">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileDropdown && (
                    <div className="fixed right-4 top-16 w-56 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden animate-fade-in" style={{ zIndex: 9999 }}>
                      {/* User Info Header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-cyan-50 to-purple-50 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          {user.profile_picture || user.avatar ? (
                            <img
                              src={user.profile_picture || user.avatar}
                              alt={user.name}
                              className="w-12 h-12 rounded-full border-2 border-cyan-400 object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-2 border-cyan-400">
                              {user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-800 truncate">{user.name}</p>
                            <p className="text-xs text-gray-600 truncate">{user.email}</p>
                          </div>
                        </div>
                        {/* Stats */}
                        <div className="flex items-center justify-center space-x-4 mt-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                            <span className="text-gray-700">{user.rating || 1200}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span className="text-gray-700">{user.streak || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate(`/profile/${user?.username || user?.id}`);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left text-gray-700"
                        >
                          <LayoutDashboard className="w-4 h-4 text-cyan-600" />
                          <span className="font-medium text-sm">Dashboard</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate('/profile/board');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left text-gray-700"
                        >
                          <Trophy className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-sm">My Board</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate('/jobs');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left text-gray-700"
                        >
                          <Briefcase className="w-4 h-4 text-orange-600" />
                          <span className="font-medium text-sm">The Headhunt</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate('/messages');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left text-gray-700"
                          data-testid="dropdown-messages-link"
                        >
                          <MessageSquare className="w-4 h-4 text-cyan-600" />
                          <span className="font-medium text-sm">Messages</span>
                        </button>

                        <div className="border-t border-gray-200 my-1"></div>

                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate('/settings');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left text-gray-700"
                          data-testid="dropdown-settings-link"
                        >
                          <SettingsIcon className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-sm">Settings</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate('/settings');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left text-gray-700"
                          data-testid="dropdown-change-password-link"
                        >
                          <KeyRound className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-sm">Change Password</span>
                        </button>

                        <div className="border-t border-gray-200 my-1"></div>
                        
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            handleLogout();
                            navigate('/');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-medium text-sm">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {/* Auth Buttons for Guests - Hidden on mobile, visible on desktop */}
            {!isLoggedIn && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2 text-sm font-semibold text-gray-700 hover:text-cyan-600 hover:bg-gray-50 rounded-lg transition-colors"
                  data-testid="header-login-btn"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-5 py-2 text-sm font-bold text-white rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 shadow-md shadow-cyan-500/20 transition-all"
                  data-testid="header-signup-btn"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-toggle md:hidden p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Backdrop */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 top-[72px]"
            onClick={() => setMobileMenuOpen(false)}
            onTouchMove={(e) => e.preventDefault()}
            style={{ touchAction: 'none' }}
          />
        )}

        {/* Mobile Menu - Improved Design */}
        {mobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden fixed inset-x-0 top-[72px] bg-white shadow-2xl z-50 border-t border-gray-200"
          >
            {/* Mobile User Profile Section - Compact */}
            {isLoggedIn && user && (
              <div 
                onClick={() => { navigate('/profile/board'); setMobileMenuOpen(false); }}
                className="px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 cursor-pointer active:bg-gray-200"
              >
                <div className="flex items-center space-x-3">
                  {user.profile_picture || user.avatar ? (
                    <img
                      src={user.profile_picture || user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-xl border-2 border-white object-cover shadow"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">@{user.username || user.email?.split('@')[0]}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                </div>
              </div>
            )}

            {/* Navigation Links - Compact */}
            <nav className="py-1">
              <button 
                onClick={() => { navigate('/'); setMobileMenuOpen(false); }} 
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                <Home className="w-4 h-4" />
                <span className="font-medium text-sm">Home</span>
              </button>
              
              <button 
                onClick={() => { navigate('/victory-lane'); setMobileMenuOpen(false); }} 
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                <Trophy className="w-4 h-4" />
                <span className="font-medium text-sm">Victory Lane</span>
              </button>
              
              <button 
                onClick={() => { navigate('/chapter-tests'); setMobileMenuOpen(false); }} 
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span className="font-medium text-sm">Skill Drills</span>
              </button>
              
              <button 
                onClick={() => { navigate('/courses'); setMobileMenuOpen(false); }} 
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="font-medium text-sm">Courses</span>
              </button>
              
              <button 
                onClick={() => { navigate('/jobs'); setMobileMenuOpen(false); }} 
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-800 hover:bg-orange-50 hover:text-orange-600 transition-all"
              >
                <Briefcase className="w-4 h-4" />
                <span className="font-medium text-sm">The Headhunt</span>
              </button>
              
              <button 
                onClick={() => { navigate('/join-room'); setMobileMenuOpen(false); }} 
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                <Users className="w-4 h-4" />
                <span className="font-medium text-sm">Join Battle Room</span>
              </button>
              
              <button 
                onClick={() => { navigate('/divya'); setMobileMenuOpen(false); }} 
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-800 hover:bg-purple-50 hover:text-purple-600 transition-all"
                data-testid="mobile-divya-tutor-link"
              >
                <Mic className="w-4 h-4" />
                <span className="font-medium text-sm">Divya Tutor</span>
              </button>

              {/* Guest Auth Buttons */}
              {!isLoggedIn && (
                <div className="px-4 py-2 space-y-2 border-t border-gray-200 mt-1">
                  <button 
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} 
                    className="w-full flex items-center justify-center space-x-2 border-2 border-cyan-500 text-cyan-600 py-2 rounded-lg font-semibold text-sm hover:bg-cyan-50 transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span>Login</span>
                  </button>
                  <button 
                    onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }} 
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-2 rounded-lg font-semibold text-sm hover:from-cyan-600 hover:to-purple-700 transition-all shadow"
                  >
                    Sign Up Free
                  </button>
                </div>
              )}

              {/* Logged-in User Actions */}
              {isLoggedIn && user && (
                <div className="border-t border-gray-200 mt-1 pt-1">
                  <button 
                    onClick={() => { navigate(`/profile/${user?.username || user?.id}`); setMobileMenuOpen(false); }} 
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="font-medium text-sm">Dashboard</span>
                  </button>
                  
                  <button 
                    onClick={() => { handleLogout(); navigate('/'); setMobileMenuOpen(false); }} 
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium text-sm">Logout</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>

    </>
  );
};

export default Header;
