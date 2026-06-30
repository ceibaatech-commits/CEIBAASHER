import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Code2, Trophy, Calendar, MapPin, DollarSign, Clock,
  Heart, MessageCircle, Share2, Users, Bookmark, ChevronRight, Award
} from 'lucide-react';
import MathText from './MathText';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const POST_TYPE_CONFIG = {
  job:        { icon: Briefcase, color: 'bg-blue-100 text-blue-700 border-blue-200',   accent: 'from-blue-500 to-indigo-600',  label: 'Job Opening',  actionLabel: 'Apply Now',    actionColor: 'bg-blue-600 hover:bg-blue-700' },
  internship: { icon: Briefcase, color: 'bg-blue-100 text-blue-700 border-blue-200',   accent: 'from-blue-500 to-indigo-600',  label: 'Internship',   actionLabel: 'Apply Now',    actionColor: 'bg-blue-600 hover:bg-blue-700' },
  quiz:       { icon: Code2,     color: 'bg-violet-100 text-violet-700 border-violet-200', accent: 'from-violet-500 to-purple-600', label: 'MCQ Quiz',  actionLabel: 'Attempt Quiz', actionColor: 'bg-violet-600 hover:bg-violet-700' },
  hackathon:  { icon: Trophy,    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', accent: 'from-emerald-500 to-teal-600', label: 'Hackathon', actionLabel: 'Register',     actionColor: 'bg-emerald-600 hover:bg-emerald-700' },
  event:      { icon: Calendar,  color: 'bg-amber-100 text-amber-700 border-amber-200', accent: 'from-amber-500 to-orange-600', label: 'Campus Event', actionLabel: 'Register',     actionColor: 'bg-amber-600 hover:bg-amber-700' },
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export { POST_TYPE_CONFIG };

export default function FeedCard({ post, liked, bookmarked, onLike, onBookmark, onShare, onOpenComments }) {
  const config = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.job;
  const Icon = config.icon;
  const linkTo = post.post_type === 'quiz' ? `/quiz-recruit/${post.id}` : post.post_type === 'hackathon' ? `/hackathon/${post.id}` : `/apply/${post.id}`;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden" data-testid={`post-card-${post.id}`}>
      <div className={`h-1 bg-gradient-to-r ${config.accent}`} />
      <div className="flex items-center gap-3 px-5 pt-4 pb-2">
        <Link to={`/company/${post.company_slug || post.company_id}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 ring-2 ring-slate-200">
            {post.company_logo ? <img src={post.company_logo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-sm">{(post.company_name || '?')[0]}</div>}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/company/${post.company_slug || post.company_id}`} className="text-slate-900 font-semibold text-sm hover:text-blue-600 transition-colors">{post.company_name}</Link>
          <p className="text-slate-400 text-xs">{timeAgo(post.created_at)}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.color}`}>
          <Icon className="w-3.5 h-3.5" />{config.label}
        </span>
      </div>
      <div className="px-5 pb-3">
        <Link to={linkTo}><h3 className="text-slate-900 font-bold text-lg leading-snug group-hover:text-blue-600 transition-colors">{post.title}</h3></Link>
        {post.description && <p className="text-slate-500 text-sm mt-1.5 line-clamp-2 leading-relaxed">{post.description}</p>}
        <PostMetadataChips post={post} />
        {post.post_type === 'hackathon' && <PrizeDisplay prizes={post.prizes} />}
      </div>
      <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button onClick={() => onLike(post.id)} className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`} data-testid={`like-btn-${post.id}`}>
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /> <span>{post.likes_count || 0}</span>
          </button>
          <button onClick={() => onOpenComments(post.id)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-500 transition-colors" data-testid={`comment-btn-${post.id}`}>
            <MessageCircle className="w-4 h-4" /> <span>{post.comments_count || 0}</span>
          </button>
          <button onClick={() => onShare(post)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-500 transition-colors" data-testid={`share-btn-${post.id}`}>
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={() => onBookmark(post.id)} className={`flex items-center gap-1.5 text-xs transition-colors ${bookmarked ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`} data-testid={`bookmark-btn-${post.id}`}>
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
        <Link to={linkTo} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${config.actionColor}`} data-testid={`action-${post.id}`}>
          {config.actionLabel} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

const PostMetadataChips = ({ post }) => (
  <div className="flex flex-wrap gap-2 mt-3">
    {post.location && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600"><MapPin className="w-3 h-3" /> {post.location}</span>}
    {post.salary && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600"><DollarSign className="w-3 h-3" /> {post.salary}</span>}
    {post.role_type && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600"><Briefcase className="w-3 h-3" /> {post.role_type}</span>}
    {post.air_filter && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-medium"><Award className="w-3 h-3" /> AIR &le; {post.air_filter.toLocaleString()}</span>}
    {post.time_limit && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700"><Clock className="w-3 h-3" /> {post.time_limit} min</span>}
    {post.num_questions && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700"><Code2 className="w-3 h-3" /> {post.num_questions} Qs</span>}
    {post.team_size > 1 && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700"><Users className="w-3 h-3" /> Team of {post.team_size}</span>}
    {post.event_type && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700"><Calendar className="w-3 h-3" /> {post.event_type}</span>}
    {post.deadline && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500"><Clock className="w-3 h-3" /> {post.deadline}</span>}
  </div>
);

const PrizeDisplay = ({ prizes }) => {
  if (!prizes) return null;
  return (
    <div className="flex gap-2 mt-3">
      {prizes.first && <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl py-2 text-center"><span className="text-amber-600 text-xs font-bold block">1st</span><span className="text-slate-800 text-xs font-semibold">&#8377;{prizes.first}</span></div>}
      {prizes.second && <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 text-center"><span className="text-slate-500 text-xs font-bold block">2nd</span><span className="text-slate-800 text-xs font-semibold">&#8377;{prizes.second}</span></div>}
      {prizes.third && <div className="flex-1 bg-orange-50 border border-orange-200 rounded-xl py-2 text-center"><span className="text-orange-600 text-xs font-bold block">3rd</span><span className="text-slate-800 text-xs font-semibold">&#8377;{prizes.third}</span></div>}
    </div>
  );
};
