import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;

// Education categories data - mirrors backend education_categories.py
const EDUCATION_CATEGORIES = {
  undergraduate: [
    { id: 'ug_engineering', name: 'Engineering', description: 'B.Tech, B.E., and other engineering programs' },
    { id: 'ug_science_medical', name: 'Science & Medical', description: 'B.Sc., MBBS, BDS, and other science programs' },
    { id: 'ug_commerce', name: 'Commerce', description: 'B.Com, BCA, and commerce-related programs' },
    { id: 'ug_liberal_arts', name: 'Liberal Arts & Science', description: 'B.A., B.Sc. in humanities and social sciences' },
    { id: 'ug_law', name: 'Law', description: 'B.L.L., LL.B., and legal studies' },
    { id: 'ug_hotel_management', name: 'Hotel & Tourism Management', description: 'B.Sc. in Hotel Management and related programs' },
    { id: 'ug_fashion_design', name: 'Fashion & Design', description: 'Design and fashion-related undergraduate programs' },
    { id: 'ug_nursing', name: 'Nursing', description: 'B.Sc Nursing and nursing programs' },
    { id: 'ug_agriculture', name: 'Agriculture', description: 'B.Sc Agriculture and agricultural sciences' },
    { id: 'ug_journalism', name: 'Mass Communication & Journalism', description: 'B.A/B.Sc in Mass Communication and Journalism' }
  ],
  postgraduate: [
    { id: 'pg_mba', name: 'MBA', description: 'Master of Business Administration programs' },
    { id: 'pg_engineering', name: 'M.Tech & Engineering', description: 'M.Tech, M.E., and postgraduate engineering programs' },
    { id: 'pg_law', name: 'LL.M & Law', description: 'LL.M., M.Phil in Law, and legal postgraduate programs' },
    { id: 'pg_science', name: 'M.Sc & Research', description: 'M.Sc., M.Phil, and research-oriented science programs' }
  ],
  diploma: [
    { id: 'diploma_polytechnic', name: 'Polytechnic Diploma', description: '3-year diploma in various engineering and technical fields' }
  ]
};

const EducationProfileOnboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('level');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    specific_program: '',
    year_of_study: '',
    institution: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // If user already has education profile, redirect
    if (user?.education_profile) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    setSelectedCategory(null);
    setStep('category');
    setError('');
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setStep('details');
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedLevel || !selectedCategory) {
      setError('Please select education level and category');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const educationProfile = {
        education_level: selectedLevel,
        education_category: selectedCategory,
        specific_program: formData.specific_program || '',
        year_of_study: formData.year_of_study || '',
        institution: formData.institution || ''
      };

      // Get token from authorization header
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('ceibaa_admin_token=') || row.startsWith('authorization='))
        ?.split('=')[1];

      const response = await axios.post(
        `${BACKEND_URL}/api/user/education-profile`,
        educationProfile,
        {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        }
      );

      if (response.data.success) {
        // Update auth context with education profile
        updateUser({
          education_profile: educationProfile,
          education_profile_completed_at: new Date().toISOString()
        });

        setCompleted(true);
        toast.success('Education profile set up successfully!');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      }
    } catch (err) {
      console.error('Error setting education profile:', err);
      setError(err.response?.data?.detail || 'Failed to save education profile. Please try again.');
      toast.error('Failed to save education profile');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard', { replace: true });
  };

  // Get categories for selected level
  const categories = selectedLevel ? EDUCATION_CATEGORIES[selectedLevel] : [];
  const selectedCategoryObj = selectedCategory 
    ? categories.find(c => c.id === selectedCategory)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Complete Your Education Profile
            </h1>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Skip for now
            </button>
          </div>
          <p className="text-gray-600">Help us personalize your learning experience</p>
        </div>

        {/* Completion screen */}
        {completed && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">All Set!</h2>
              <p className="text-green-700 mb-4">
                Your education profile has been created. Redirecting to dashboard...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Education Level */}
        {step === 'level' && !completed && (
          <Card>
            <CardHeader>
              <CardTitle>What's your education level?</CardTitle>
              <CardDescription>Select the level that best fits your current education</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {['undergraduate', 'postgraduate', 'diploma'].map(level => (
                <button
                  key={level}
                  onClick={() => handleLevelSelect(level)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg text-left hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                >
                  <div className="font-semibold text-gray-900">
                    {level === 'undergraduate' && 'Undergraduate'}
                    {level === 'postgraduate' && 'Postgraduate'}
                    {level === 'diploma' && 'Diploma'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {level === 'undergraduate' && 'Bachelor\'s degree programs'}
                    {level === 'postgraduate' && 'Master\'s degree programs'}
                    {level === 'diploma' && 'Diploma programs'}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Category Selection */}
        {step === 'category' && !completed && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setStep('level')}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  ← Change level
                </button>
              </div>
              <CardTitle>Select your field of study</CardTitle>
              <CardDescription>
                Choose the field that matches your education
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg text-left hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                >
                  <div className="font-semibold text-gray-900">{category.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{category.description}</div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Details */}
        {step === 'details' && !completed && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setStep('category')}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  ← Change category
                </button>
              </div>
              <CardTitle>Tell us more about your studies</CardTitle>
              <CardDescription>
                {selectedCategoryObj && `${selectedCategoryObj.name} (${selectedLevel})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-600">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="specific_program">Specific Program/Degree *</Label>
                  <input
                    id="specific_program"
                    name="specific_program"
                    type="text"
                    placeholder="e.g., B.Tech - Computer Science, MBA - Finance"
                    value={formData.specific_program}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year_of_study">Year of Study</Label>
                  <select
                    id="year_of_study"
                    name="year_of_study"
                    value={formData.year_of_study}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select year...</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution">Institution/University</Label>
                  <input
                    id="institution"
                    name="institution"
                    type="text"
                    placeholder="e.g., IIT Delhi, Delhi University"
                    value={formData.institution}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    className="flex-1"
                  >
                    Skip
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.specific_program}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {loading ? 'Saving...' : (
                      <>
                        Complete <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EducationProfileOnboarding;
