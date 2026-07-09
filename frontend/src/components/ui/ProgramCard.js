import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Users, Clock, DollarSign, BookOpen, GraduationCap } from 'lucide-react';

const EDUCATION_LEVEL_MAP = {
  undergraduate: { label: 'UG', color: 'bg-blue-100 text-blue-700' },
  postgraduate: { label: 'PG', color: 'bg-purple-100 text-purple-700' },
  diploma: { label: 'Diploma', color: 'bg-orange-100 text-orange-700' }
};

const CATEGORY_COLORS = {
  ug_engineering: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ug_science_medical: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ug_commerce: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  ug_liberal_arts: 'bg-pink-50 text-pink-700 border-pink-200',
  ug_law: 'bg-red-50 text-red-700 border-red-200',
  ug_hotel_management: 'bg-amber-50 text-amber-700 border-amber-200',
  ug_fashion_design: 'bg-rose-50 text-rose-700 border-rose-200',
  ug_nursing: 'bg-teal-50 text-teal-700 border-teal-200',
  ug_agriculture: 'bg-lime-50 text-lime-700 border-lime-200',
  ug_journalism: 'bg-violet-50 text-violet-700 border-violet-200',
  pg_mba: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  pg_engineering: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  pg_law: 'bg-red-50 text-red-700 border-red-200',
  pg_science: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  diploma_polytechnic: 'bg-orange-50 text-orange-700 border-orange-200'
};

const CATEGORY_LABELS = {
  ug_engineering: 'Engineering',
  ug_science_medical: 'Science & Medical',
  ug_commerce: 'Commerce',
  ug_liberal_arts: 'Liberal Arts',
  ug_law: 'Law',
  ug_hotel_management: 'Hotel Mgmt',
  ug_fashion_design: 'Fashion',
  ug_nursing: 'Nursing',
  ug_agriculture: 'Agriculture',
  ug_journalism: 'Media',
  pg_mba: 'MBA',
  pg_engineering: 'M.Tech',
  pg_law: 'LL.M',
  pg_science: 'M.Sc',
  diploma_polytechnic: 'Polytechnic'
};

const ProgramCard = ({ program, onSelect, layout = 'grid' }) => {
  if (!program) return null;

  const educationLevels = program.education_level || [];
  const educationCategories = program.education_categories || [];
  const thumbnail = program.thumbnail || program.cover_image_url;

  if (layout === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-indigo-500">
        <CardContent className="p-0">
          <div className="flex gap-4 p-4">
            {thumbnail && (
              <img
                src={thumbnail}
                alt={program.title}
                className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{program.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{program.short_description}</p>
              
              {/* Education badges */}
              <div className="flex flex-wrap gap-2 mt-2">
                {educationLevels.map(level => (
                  <Badge key={level} variant="secondary" className="text-xs">
                    {EDUCATION_LEVEL_MAP[level]?.label || level}
                  </Badge>
                ))}
                {educationCategories.slice(0, 2).map(cat => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {CATEGORY_LABELS[cat] || cat}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                {program.seats_left !== undefined && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {program.seats_left} seats
                  </span>
                )}
                {program.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {program.duration}
                  </span>
                )}
                {program.price && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {program.price}
                  </span>
                )}
              </div>
            </div>
            <Button
              onClick={() => onSelect?.(program.id)}
              size="sm"
              variant="outline"
              className="flex-shrink-0"
            >
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all cursor-pointer overflow-hidden h-full flex flex-col">
      {/* Image */}
      {thumbnail && (
        <div className="relative h-40 overflow-hidden bg-gray-100">
          <img
            src={thumbnail}
            alt={program.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            {educationLevels.map(level => (
              <Badge
                key={level}
                className={EDUCATION_LEVEL_MAP[level]?.color || 'bg-gray-100 text-gray-700'}
              >
                {EDUCATION_LEVEL_MAP[level]?.label || level}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2">{program.title}</CardTitle>
        <CardDescription className="line-clamp-2">{program.short_description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {/* Categories */}
        {educationCategories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {educationCategories.slice(0, 3).map(category => (
              <Badge
                key={category}
                variant="outline"
                className={`text-xs border ${CATEGORY_COLORS[category] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
              >
                {CATEGORY_LABELS[category] || category}
              </Badge>
            ))}
          </div>
        )}

        {/* Info row */}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
          {program.seats_left !== undefined && (
            <div className="text-center">
              <Users className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
              <span>{program.seats_left} left</span>
            </div>
          )}
          {program.duration && (
            <div className="text-center">
              <Clock className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
              <span>{program.duration}</span>
            </div>
          )}
          {program.price && (
            <div className="text-center">
              <DollarSign className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
              <span>{program.price}</span>
            </div>
          )}
        </div>

        {/* Highlights */}
        {program.highlights && program.highlights.length > 0 && (
          <div className="space-y-1">
            {program.highlights.slice(0, 2).map((highlight, idx) => (
              <div key={idx} className="text-xs text-gray-700 flex gap-2">
                <span className="text-indigo-600">•</span>
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        )}

        {/* Button */}
        <Button
          onClick={() => onSelect?.(program.id)}
          className="w-full mt-auto bg-indigo-600 hover:bg-indigo-700"
        >
          Learn More
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProgramCard;
