import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Building2, Zap, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const EDUCATION_LEVEL_LABELS = {
  undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate',
  diploma: 'Diploma'
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

const CATEGORY_COLORS = {
  ug_engineering: 'bg-blue-100 text-blue-800',
  ug_science_medical: 'bg-green-100 text-green-800',
  ug_commerce: 'bg-purple-100 text-purple-800',
  ug_liberal_arts: 'bg-yellow-100 text-yellow-800',
  ug_law: 'bg-indigo-100 text-indigo-800',
  ug_hotel_management: 'bg-orange-100 text-orange-800',
  ug_fashion_design: 'bg-pink-100 text-pink-800',
  ug_nursing: 'bg-red-100 text-red-800',
  ug_agriculture: 'bg-emerald-100 text-emerald-800',
  ug_journalism: 'bg-cyan-100 text-cyan-800',
  pg_mba: 'bg-slate-100 text-slate-800',
  pg_engineering: 'bg-teal-100 text-teal-800',
  pg_law: 'bg-violet-100 text-violet-800',
  pg_science: 'bg-fuchsia-100 text-fuchsia-800',
  diploma_polytechnic: 'bg-amber-100 text-amber-800'
};

const DashboardEducationProfile = ({ educationProfile, onEditClick }) => {
  const navigate = useNavigate();

  if (!educationProfile) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Complete Your Education Profile</CardTitle>
                <CardDescription>Help us personalize your learning experience</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            Set up your education profile to discover programs and content tailored to your qualification level and field of study.
          </p>
          <Button 
            onClick={() => navigate('/education-onboarding')}
            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
          >
            Set Up Profile <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const categoryColor = CATEGORY_COLORS[educationProfile.education_category] || 'bg-gray-100 text-gray-800';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Education Profile</CardTitle>
              <CardDescription>Your qualification and field of study</CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onEditClick}
          >
            Edit
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Education Level & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              EDUCATION LEVEL
            </div>
            <Badge variant="secondary" className="text-base font-semibold">
              {EDUCATION_LEVEL_LABELS[educationProfile.education_level] || educationProfile.education_level}
            </Badge>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              FIELD OF STUDY
            </div>
            <Badge className={`${categoryColor} text-base font-semibold border-0`}>
              {CATEGORY_NAMES[educationProfile.education_category] || educationProfile.education_category}
            </Badge>
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          {educationProfile.specific_program && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">PROGRAM/DEGREE</div>
              <p className="text-sm font-medium text-gray-900">{educationProfile.specific_program}</p>
            </div>
          )}

          {educationProfile.year_of_study && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">YEAR OF STUDY</div>
              <p className="text-sm font-medium text-gray-900">{educationProfile.year_of_study}</p>
            </div>
          )}

          {educationProfile.institution && (
            <div className="sm:col-span-2">
              <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                INSTITUTION
              </div>
              <p className="text-sm font-medium text-gray-900">{educationProfile.institution}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/programs')}
            className="flex-1"
          >
            Explore Programs
          </Button>
          <Button 
            onClick={() => navigate('/programs')}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            Find Courses <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardEducationProfile;
