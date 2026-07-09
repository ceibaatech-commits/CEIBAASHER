import React from 'react';
import { Edit2, BookOpen, GraduationCap, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const EDUCATION_LEVEL_LABELS = {
  undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate',
  diploma: 'Diploma'
};

const CATEGORY_LABELS = {
  ug_engineering: 'Engineering',
  ug_science_medical: 'Science & Medical',
  ug_commerce: 'Commerce',
  ug_liberal_arts: 'Liberal Arts & Science',
  ug_law: 'Law',
  ug_hotel_management: 'Hotel & Tourism Management',
  ug_fashion_design: 'Fashion & Design',
  ug_nursing: 'Nursing',
  ug_agriculture: 'Agriculture',
  ug_journalism: 'Mass Communication & Journalism',
  pg_mba: 'MBA',
  pg_engineering: 'M.Tech & Engineering',
  pg_law: 'LL.M & Law',
  pg_science: 'M.Sc & Research',
  diploma_polytechnic: 'Polytechnic Diploma'
};

const LEVEL_COLORS = {
  undergraduate: 'bg-blue-50 border-blue-200 text-blue-700',
  postgraduate: 'bg-purple-50 border-purple-200 text-purple-700',
  diploma: 'bg-orange-50 border-orange-200 text-orange-700'
};

const EducationProfileCard = ({ educationProfile, isEditable, onEdit }) => {
  if (!educationProfile) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="pt-8 text-center">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No education profile set</p>
          {isEditable && (
            <Button onClick={onEdit} variant="outline" size="sm">
              Set Up Education Profile
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const levelLabel = EDUCATION_LEVEL_LABELS[educationProfile.education_level] || educationProfile.education_level;
  const categoryLabel = CATEGORY_LABELS[educationProfile.education_category] || educationProfile.education_category;
  const levelColor = LEVEL_COLORS[educationProfile.education_level] || 'bg-gray-50 border-gray-200 text-gray-700';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Education Profile
          </CardTitle>
          <CardDescription>Your academic information</CardDescription>
        </div>
        {isEditable && (
          <Button onClick={onEdit} variant="outline" size="sm" className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Education Level */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg border ${levelColor}`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Education Level</p>
            <p className="text-lg font-semibold text-gray-900">{levelLabel}</p>
          </div>
        </div>

        {/* Field of Study */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Field of Study</p>
            <p className="text-lg font-semibold text-gray-900">{categoryLabel}</p>
          </div>
        </div>

        {/* Specific Program */}
        {educationProfile.specific_program && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-green-700">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Program/Degree</p>
              <p className="text-lg font-semibold text-gray-900">{educationProfile.specific_program}</p>
            </div>
          </div>
        )}

        {/* Year of Study */}
        {educationProfile.year_of_study && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Year of Study</p>
            <p className="text-gray-900">{educationProfile.year_of_study}</p>
          </div>
        )}

        {/* Institution */}
        {educationProfile.institution && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Institution</p>
              <p className="text-lg font-semibold text-gray-900">{educationProfile.institution}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EducationProfileCard;
