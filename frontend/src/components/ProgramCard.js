import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Award, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const CATEGORY_COLORS = {
  ug_engineering: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  ug_science_medical: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  ug_commerce: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  ug_liberal_arts: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  ug_law: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  ug_hotel_management: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  ug_fashion_design: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  ug_nursing: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  ug_agriculture: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  ug_journalism: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  pg_mba: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  pg_engineering: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  pg_law: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300' },
  pg_science: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-300' },
  diploma_polytechnic: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' }
};

const CATEGORY_NAMES = {
  ug_engineering: 'Engineering',
  ug_science_medical: 'Science & Medical',
  ug_commerce: 'Commerce',
  ug_liberal_arts: 'Liberal Arts',
  ug_law: 'Law',
  ug_hotel_management: 'Hotel Management',
  ug_fashion_design: 'Fashion & Design',
  ug_nursing: 'Nursing',
  ug_agriculture: 'Agriculture',
  ug_journalism: 'Mass Communication',
  pg_mba: 'MBA',
  pg_engineering: 'M.Tech',
  pg_law: 'LL.M',
  pg_science: 'M.Sc',
  diploma_polytechnic: 'Polytechnic'
};

const EDUCATION_LEVEL_LABELS = {
  undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate',
  diploma: 'Diploma'
};

const ProgramCard = ({ program, variant = 'compact' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/programs/${program.slug || program.id}`);
  };

  const categoryColor = CATEGORY_COLORS[program.education_categories?.[0]] || 
                       CATEGORY_COLORS['ug_engineering'];
  const categoryName = CATEGORY_NAMES[program.education_categories?.[0]] || 
                      'General';

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col" onClick={handleClick}>
        <CardHeader className="pb-3">
          {/* Education Level & Category Badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            {program.education_level && program.education_level.length > 0 && program.education_level[0] !== 'all' && (
              <Badge variant="outline" className="text-xs">
                {EDUCATION_LEVEL_LABELS[program.education_level[0]] || program.education_level[0]}
              </Badge>
            )}
            <Badge 
              className={`text-xs ${categoryColor.bg} ${categoryColor.text} border ${categoryColor.border}`}
              variant="outline"
            >
              {categoryName}
            </Badge>
          </div>

          <CardTitle className="line-clamp-2 text-lg">{program.title}</CardTitle>
          <CardDescription className="line-clamp-2">{program.short_description}</CardDescription>
        </CardHeader>

        <CardContent className="flex-grow pb-3">
          <div className="space-y-2 text-sm">
            {/* Duration & Seats */}
            <div className="flex items-center justify-between text-gray-600">
              {program.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{program.duration}</span>
                </div>
              )}
              {program.seats_left !== undefined && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{program.seats_left} seats left</span>
                </div>
              )}
            </div>

            {/* Price */}
            {program.price && (
              <div className="text-lg font-bold text-indigo-600">
                ₹{program.price}
              </div>
            )}

            {/* Highlights */}
            {program.highlights && program.highlights.length > 0 && (
              <div className="pt-2 space-y-1">
                {program.highlights.slice(0, 2).map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span className="line-clamp-1">{highlight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        <div className="px-4 pb-4">
          <Button 
            onClick={handleClick}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            Learn More
          </Button>
        </div>
      </Card>
    );
  }

  // Expanded variant for detail page or larger displays
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Education Level & Category */}
      <div className="flex flex-wrap gap-3 mb-4">
        {program.education_level && program.education_level.length > 0 && (
          <div className="flex gap-2">
            {program.education_level.map(level => (
              <Badge key={level} variant="secondary" className="text-sm">
                {EDUCATION_LEVEL_LABELS[level] || level}
              </Badge>
            ))}
          </div>
        )}
        {program.education_categories && program.education_categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {program.education_categories.slice(0, 3).map(cat => {
              const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['ug_engineering'];
              return (
                <Badge 
                  key={cat}
                  className={`${colors.bg} ${colors.text} border ${colors.border}`}
                  variant="outline"
                >
                  {CATEGORY_NAMES[cat] || cat}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      <h2 className="text-3xl font-bold mb-2">{program.title}</h2>
      <p className="text-gray-600 mb-4">{program.short_description}</p>

      {/* Meta Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-y border-gray-200 mb-4">
        {program.duration && (
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="text-xs text-gray-500">Duration</div>
              <div className="font-semibold">{program.duration}</div>
            </div>
          </div>
        )}

        {program.mentor_name && (
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="text-xs text-gray-500">Mentor</div>
              <div className="font-semibold text-sm">{program.mentor_name}</div>
            </div>
          </div>
        )}

        {program.seats_left !== undefined && (
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="text-xs text-gray-500">Seats Available</div>
              <div className="font-semibold">{program.seats_left}/{program.seats_total}</div>
            </div>
          </div>
        )}

        {program.price && (
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="text-xs text-gray-500">Price</div>
              <div className="font-semibold text-lg text-indigo-600">₹{program.price}</div>
            </div>
          </div>
        )}
      </div>

      {/* Learning Outcomes */}
      {program.learning_outcomes && program.learning_outcomes.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Learning Outcomes
          </h3>
          <ul className="space-y-2">
            {program.learning_outcomes.slice(0, 5).map((outcome, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-indigo-600 font-bold mt-0.5">✓</span>
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prerequisites */}
      {program.prerequisites && program.prerequisites.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Prerequisites</h3>
          <ul className="space-y-1">
            {program.prerequisites.map((prereq, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                {prereq}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProgramCard;
