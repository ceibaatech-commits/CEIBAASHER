import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Users, Briefcase, MapPin, CheckCircle2, Building2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function DiscoverCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');

  useEffect(() => { fetchCompanies(); }, [search, industry]);

  const fetchCompanies = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (industry) params.append('industry', industry);
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/companies?${params}`);
      setCompanies(data.companies || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const industries = ['All', 'IT Services', 'Technology', 'E-Commerce', 'Fintech', 'Consulting', 'Healthcare'];

  return (
    <div className="min-h-screen bg-[#0d0f14]" data-testid="discover-page">
      <div className="border-b border-[#252a3d] bg-[#141720]">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-[#e8eaf0] text-3xl font-bold">Discover Companies</h1>
          <p className="text-[#8892b0] mt-2">Browse verified companies hiring on CEIBAA</p>
          <div className="relative mt-6 max-w-xl">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8892b0]" />
            <input
              type="text"
              placeholder="Search companies by name or industry..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="company-search-input"
              className="w-full pl-10 pr-4 py-3 bg-[#1a1e2e] border border-[#252a3d] rounded-xl text-[#e8eaf0] placeholder-[#8892b0]/50 focus:outline-none focus:border-[#4f7cff] transition-colors"
            />
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
            {industries.map(ind => (
              <button
                key={ind}
                onClick={() => setIndustry(ind === 'All' ? '' : ind)}
                data-testid={`industry-${ind.toLowerCase().replace(/\s/g, '-')}`}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  (ind === 'All' && !industry) || industry === ind
                    ? 'bg-[#4f7cff] text-white'
                    : 'bg-[#1a1e2e] text-[#8892b0] border border-[#252a3d] hover:text-[#e8eaf0]'
                }`}
              >{ind}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="bg-[#1a1e2e] border border-[#252a3d] rounded-xl h-48 animate-pulse" />)}
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={48} className="mx-auto text-[#252a3d] mb-4" />
            <p className="text-[#8892b0]">No companies found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map(company => (
              <Link key={company.id} to={`/company/${company.slug}`} data-testid={`company-card-${company.slug}`}>
                <div className="group bg-[#1a1e2e] border border-[#252a3d] rounded-xl p-5 hover:border-[#4f7cff]/50 transition-all duration-300 hover:translate-y-[-2px]">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#141720]">
                      <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#e8eaf0] font-semibold text-lg group-hover:text-[#4f7cff] transition-colors truncate">{company.company_name}</h3>
                        {company.verified_gst && <CheckCircle2 size={16} className="text-[#4f7cff] flex-shrink-0" />}
                      </div>
                      <p className="text-[#8892b0] text-sm">{company.industry}</p>
                      <div className="flex gap-4 mt-3 text-xs text-[#8892b0]">
                        <span className="flex items-center gap-1"><Users size={12} /> {company.followers_count || 0} followers</span>
                        <span className="flex items-center gap-1"><Briefcase size={12} /> {company.open_roles || 0} open roles</span>
                      </div>
                      {company.open_roles > 0 && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-[#22c55e]/20 text-[#22c55e] font-medium">Hiring now</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    {company.verified_email && <span className="px-2 py-0.5 rounded text-[10px] bg-[#4f7cff]/10 text-[#4f7cff]">Email Verified</span>}
                    {company.verified_mobile && <span className="px-2 py-0.5 rounded text-[10px] bg-[#22c55e]/10 text-[#22c55e]">Mobile Verified</span>}
                    {company.verified_gst && <span className="px-2 py-0.5 rounded text-[10px] bg-[#f59e0b]/10 text-[#f59e0b]">GST Registered</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
