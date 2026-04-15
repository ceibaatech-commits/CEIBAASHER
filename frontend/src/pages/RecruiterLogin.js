import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function RecruiterLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Welcome back to the Partner Portal");
      navigate('/recruiter/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 sm:p-4">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[70%] lg:w-[40%] h-[30%] rounded-full bg-blue-100/50 blur-[80px] lg:blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[70%] lg:w-[40%] h-[30%] rounded-full bg-amber-100/50 blur-[80px] lg:blur-[120px]" />
      </div>

      {/* Main Card */}
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white sm:rounded-3xl shadow-2xl overflow-hidden relative z-10 border-0 sm:border border-slate-200 min-h-screen sm:min-h-0">
        
        {/* Left Side: Brand & Features (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-12 text-white relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-white p-2 rounded-xl shadow-sm">
                 <img src="/ceibaa-logo.png" alt="Ceibaa" className="h-7 w-auto object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight"> Partner Desk For <span className="text-blue-400">Recruiter</span></span>
            </div>
            
            <h2 className="text-4xl font-bold leading-tight mb-6">
              Hire the top <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-400">1% Talent</span> based on merit.
            </h2>
            
            <ul className="space-y-5">
              {[{ icon: Star, text: "Access verified AIR rankings" }, { icon: Zap, text: "Conduct automated MCQ challenges" }, { icon: ShieldCheck, text: "Review identity-verified profiles" }].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="p-1 rounded-full bg-white/10 text-amber-400">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative pt-8 border-t border-white/10 text-slate-400 text-xs italic">
            © 2026 Ceibaa Technologies. Mind Vs Mind.
          </div>
        </div>

        {/* Right Side: Login Form - The Fix is here (justify-start on mobile) */}
        <div className="flex flex-col justify-start lg:justify-center bg-white p-6 sm:p-8 lg:p-16 overflow-y-auto">
          
          {/* Mobile Header with more breathing room */}
          <div className="flex flex-col items-center lg:hidden mt-4 mb-8">
            <div className="bg-slate-900 p-2.5 rounded-2xl shadow-xl mb-4">
               <img src="/ceibaa-logo.png" alt="Ceibaa" className="h-6 w-auto" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest">
              <Lock className="w-3 h-3" /> Partner Portal
            </div>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Recruiter Login</h1>
            <p className="text-slate-500 text-sm">Enter your credentials to manage your desk</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Segmented Email Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Business Email</label>
              <div className="flex h-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                <div className="flex items-center justify-center w-12 bg-slate-100 border-r border-slate-200">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="admin@company.com"
                  className="flex-1 px-4 bg-transparent text-slate-900 text-base outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* Segmented Password Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot Password?</button>
              </div>
              <div className="flex h-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                <div className="flex items-center justify-center w-12 bg-slate-100 border-r border-slate-200">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 relative flex items-center">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    className="w-full px-4 bg-transparent text-slate-900 text-base outline-none"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In to Portal <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-12 pt-6 border-t border-slate-100 text-center pb-8">
            <p className="text-slate-500 text-sm">
              Don't have a partner account? <br className="sm:hidden" />
              <a href="mailto:partner@ceibaa.in" className="text-blue-600 font-bold hover:underline ml-1">
                Contact Ceibaa Partner Desk
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}