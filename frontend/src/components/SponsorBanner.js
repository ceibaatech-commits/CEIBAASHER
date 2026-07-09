import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, Globe } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const normalizeScope = (value) => {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\s_/]+/g, '-')
    .replace(/[^a-z0-9()\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const SponsorBanner = ({ scopeKey, scopeKeys = [] }) => {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizedScopeKeys = Array.from(new Set([
    ...(Array.isArray(scopeKeys) ? scopeKeys : []),
    scopeKey,
  ].map(normalizeScope).filter(Boolean)));

  useEffect(() => {
    if (normalizedScopeKeys.length === 0) {
      setLoading(false);
      return;
    }
    fetchMatch(normalizedScopeKeys);
    // eslint-disable-next-line
  }, [scopeKey, JSON.stringify(scopeKeys)]);

  const fetchMatch = async (candidateKeys) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/sponsors/match`, {
        scope_keys: candidateKeys,
      });
      if (res.data.success && res.data.match) {
        setMatch(res.data.match);
        // Record impression
        const assignmentId = res.data.match.assignment.id;
        axios.post(`${BACKEND_URL}/api/sponsors/assignments/${assignmentId}/impression`).catch(err => {
          console.error('Error logging sponsor impression:', err);
        });
      } else {
        setMatch(null);
      }
    } catch (err) {
      console.error('Error fetching sponsor match:', err);
      setMatch(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = () => {
    if (!match) return;
    const assignmentId = match.assignment.id;
    // Record click
    axios.post(`${BACKEND_URL}/api/sponsors/assignments/${assignmentId}/click`).catch(err => {
      console.error('Error logging sponsor click:', err);
    });
  };

  if (loading || !match) return null;

  const { sponsor } = match;

  return (
    <a
      href={sponsor.link_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleBannerClick}
      data-testid="sponsor-banner"
      className="block bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-y-0.5 transition-all outline-none"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
            {sponsor.logo_url ? (
              <img src={sponsor.logo_url} alt="" className="max-w-full max-h-full object-contain" />
            ) : (
              <Globe className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">
              This Quiz is Powered By
            </p>
            <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-tight mt-0.5">
              {sponsor.name}
            </h4>
            {sponsor.description && (
              <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                {sponsor.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-slate-400 hover:text-purple-600 transition-colors">
          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </a>
  );
};

export default SponsorBanner;
