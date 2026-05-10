import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { Search, Users, Briefcase, CheckCircle2, Building2, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const INDUSTRIES = ['All', 'IT Services', 'Technology', 'E-Commerce', 'Fintech', 'Consulting', 'Healthcare'];

export default function DiscoverCompanies() {
  const { user, isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');

  // eslint-disable-next-line
  useEffect(() => { fetchCompanies(); }, [search, industry]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (industry) params.append('industry', industry);
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/companies?${params}`);
      setCompanies(data.companies || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="discover-page">
      <Header isLoggedIn={isAuthenticated?.()} user={user} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pt-12 pb-16 px-4">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(99,102,241,0.35), transparent 50%), radial-gradient(circle at 80% 30%, rgba(34,197,94,0.25), transparent 50%)' }} />
        <div className="max-w-5xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-white/90 font-medium">Verified Companies</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Companies</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Browse verified companies hiring on CEIBAA. Follow them to get job updates in your feed.
          </p>
        </div>
      </section>

      {/* Search + Filters */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies by name or industry..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="company-search-input"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          {/* Industry tabs */}
          <div className="flex flex-nowrap gap-1 mt-3 overflow-x-auto scrollbar-hide justify-center" style={{ WebkitOverflowScrolling: 'touch' }}>
            {INDUSTRIES.map(ind => (
              <button
                key={ind}
                onClick={() => setIndustry(ind === 'All' ? '' : ind)}
                data-testid={`industry-${ind.toLowerCase().replace(/\s/g, '-')}`}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  (ind === 'All' && !industry) || industry === ind
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >{ind}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-slate-200" />)}
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No companies found</p>
            <p className="text-sm mt-1">Try a different search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="companies-grid">
            {companies.map(company => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-indigo-600 to-emerald-500 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Want to list your company here?</h2>
          <p className="text-white/80 mb-6 text-sm sm:text-base">Create a recruiter account and start posting jobs, quizzes, and hackathons.</p>
          <Link to="/recruiter" className="inline-block bg-white text-indigo-700 font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all text-sm" data-testid="recruiter-signup-cta">
            Recruiter Portal
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function CompanyCard({ company }) {
  const isHiring = company.open_roles > 0;

  return (
    <Link to={`/company/${company.slug}`} data-testid={`company-card-${company.slug}`}>
      <div className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full">
        {/* Top accent */}
        <div className={`h-1.5 bg-gradient-to-r ${isHiring ? 'from-emerald-500 to-teal-500' : 'from-indigo-500 to-blue-500'}`} />

        <div className="p-5 flex flex-col flex-1">
          {/* Logo + Name */}
          <div className="flex items-start gap-4 mb-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 ring-1 ring-slate-200">
              <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-slate-900 font-bold text-lg group-hover:text-indigo-600 transition-colors truncate">{company.company_name}</h3>
                {company.verified_gst && <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />}
              </div>
              <p className="text-slate-500 text-sm">{company.industry}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-xs text-slate-500 mb-3">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {company.followers_count || 0} followers</span>
            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {company.open_roles || 0} open roles</span>
          </div>

          {/* Hiring badge */}
          {isHiring && (
            <span className="inline-flex items-center gap-1 self-start px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-600 font-semibold border border-emerald-200 mb-3">
              <TrendingUp className="w-3 h-3" /> Hiring now
            </span>
          )}

          {/* Verification badges */}
          <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-slate-100">
            {company.verified_email && <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-medium border border-blue-200">Email Verified</span>}
            {company.verified_mobile && <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-600 font-medium border border-emerald-200">Mobile Verified</span>}
            {company.verified_gst && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-600 font-medium border border-amber-200">GST Registered</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
