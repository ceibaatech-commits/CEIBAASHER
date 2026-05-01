import React from 'react';
import { MapPin, Calendar, Trophy, Award, Gift } from 'lucide-react';

/**
 * Profile card shown at the top of the user Dashboard.
 * Extracted from Dashboard.js for maintainability. Pure presentational —
 * takes `profile` and a handful of callbacks; no internal state.
 */
const DashboardProfileCard = ({
  profile,
  onEditProfile,
  onShare,
  onShowFollowers,
  onShowFollowing,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Profile Info Section */}
      <div className="px-6 py-6">
        {/* Avatar, User Info & Edit Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              <img
                src={profile.profile_picture || `https://ui-avatars.com/api/?name=${profile.name}&background=random&size=200`}
                alt={profile.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-purple-100 shadow-lg object-cover"
              />
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-500">@{profile.username}</p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onEditProfile}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 font-semibold shadow-lg text-sm"
            >
              Edit Profile
            </button>
            <button
              onClick={onShare}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-semibold shadow-lg text-sm flex items-center justify-center gap-1.5"
              data-testid="share-earn-button-dashboard"
            >
              <Gift className="w-4 h-4" />
              Share & Earn
            </button>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-gray-700">{profile.bio}</p>
        )}

        {/* Location & Joined Date */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          {profile.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.joined_at && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(profile.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Exam Focus Tags */}
        {profile.exam_focus && profile.exam_focus.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.exam_focus.map(exam => (
              <span
                key={exam}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold"
              >
                🎯 {exam}
              </span>
            ))}
          </div>
        )}

        {/* Badges */}
        {(profile.badges?.isTeacher || profile.badges?.isProfessor || profile.badges?.isOfficial || profile.badges?.isInstitute ||
          profile.isTeacher || profile.isProfessor || profile.isOfficial || profile.isInstitute) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(profile.badges?.isTeacher || profile.isTeacher) && (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border-2 border-blue-200 shadow-sm"
                title="Teacher Badge"
              >
                <Trophy className="w-4 h-4 mr-1.5" />
                Teacher
              </span>
            )}
            {(profile.badges?.isProfessor || profile.isProfessor) && (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 border-2 border-indigo-200 shadow-sm"
                title="Professor Badge"
              >
                <Trophy className="w-4 h-4 mr-1.5" />
                Professor
              </span>
            )}
            {(profile.badges?.isOfficial || profile.isOfficial) && (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-600 text-white border-2 border-gray-700 shadow-sm"
                title="Official Badge"
              >
                <Award className="w-4 h-4 mr-1.5 fill-white" />
                Official
              </span>
            )}
            {(profile.badges?.isInstitute || profile.isInstitute) && (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold text-white border-2 shadow-sm"
                style={{ backgroundColor: '#8B2E2E', borderColor: '#6B1E1E' }}
                title="Institute Badge"
              >
                <Trophy className="w-4 h-4 mr-1.5" />
                Institute
              </span>
            )}
          </div>
        )}

        {/* Stats Row - Properly Aligned */}
        <div className="mt-6 flex items-center justify-start gap-8 border-t border-gray-200 pt-6">
          <div className="flex flex-col items-center">
            <p className="text-2xl font-bold text-gray-900">{profile.posts_count || 0}</p>
            <p className="text-gray-600 text-sm">Posts</p>
          </div>
          <button
            onClick={onShowFollowers}
            className="flex flex-col items-center hover:opacity-70 transition-opacity"
          >
            <p className="text-2xl font-bold text-gray-900">{profile.followers_count || 0}</p>
            <p className="text-gray-600 text-sm">Followers</p>
          </button>
          <button
            onClick={onShowFollowing}
            className="flex flex-col items-center hover:opacity-70 transition-opacity"
          >
            <p className="text-2xl font-bold text-gray-900">{profile.following_count || 0}</p>
            <p className="text-gray-600 text-sm">Following</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardProfileCard;
