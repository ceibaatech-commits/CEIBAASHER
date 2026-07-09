import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;

const EDUCATION_CATEGORIES = {
  undergraduate: [
    { id: 'ug_engineering', name: 'Engineering' },
    { id: 'ug_science_medical', name: 'Science & Medical' },
    { id: 'ug_commerce', name: 'Commerce' },
    { id: 'ug_liberal_arts', name: 'Liberal Arts & Science' },
    { id: 'ug_law', name: 'Law' },
    { id: 'ug_hotel_management', name: 'Hotel & Tourism Management' },
    { id: 'ug_fashion_design', name: 'Fashion & Design' },
    { id: 'ug_nursing', name: 'Nursing' },
    { id: 'ug_agriculture', name: 'Agriculture' },
    { id: 'ug_journalism', name: 'Mass Communication & Journalism' }
  ],
  postgraduate: [
    { id: 'pg_mba', name: 'MBA' },
    { id: 'pg_engineering', name: 'M.Tech & Engineering' },
    { id: 'pg_law', name: 'LL.M & Law' },
    { id: 'pg_science', name: 'M.Sc & Research' }
  ],
  diploma: [
    { id: 'diploma_polytechnic', name: 'Polytechnic Diploma' }
  ]
};

const EducationProfileSettings = ({ isOpen, onClose, currentProfile, onSave, token }) => {
  const [step, setStep] = useState(currentProfile ? 'details' : 'level');
  const [selectedLevel, setSelectedLevel] = useState(currentProfile?.education_level || null);
  const [selectedCategory, setSelectedCategory] = useState(currentProfile?.education_category || null);
  const [formData, setFormData] = useState({
    specific_program: currentProfile?.specific_program || '',
    year_of_study: currentProfile?.year_of_study || '',
    institution: currentProfile?.institution || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

    if (!formData.specific_program.trim()) {
      setError('Please enter your specific program/degree');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const educationProfile = {
        education_level: selectedLevel,
        education_category: selectedCategory,
        specific_program: formData.specific_program,
        year_of_study: formData.year_of_study,
        institution: formData.institution
      };

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
        setSuccess(true);
        toast.success('Education profile updated successfully!');

        setTimeout(() => {
          if (onSave) {
            onSave(educationProfile);
          }
          onClose?.();
        }, 1500);
      }
    } catch (err) {
      console.error('Error updating education profile:', err);
      setError(err.response?.data?.detail || 'Failed to update education profile');
      toast.error('Failed to update education profile');
    } finally {
      setLoading(false);
    }
  };

  const categories = selectedLevel ? EDUCATION_CATEGORIES[selectedLevel] : [];
  const selectedCategoryObj = selectedCategory
    ? categories.find(c => c.id === selectedCategory)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Education Profile</DialogTitle>
          <DialogDescription>
            {step === 'level' && 'Select your education level'}
            {step === 'category' && 'Choose your field of study'}
            {step === 'details' && 'Provide additional details'}
          </DialogDescription>
        </DialogHeader>

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Education profile updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Level */}
        {step === 'level' && (
          <div className="space-y-3">
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
                  {level === 'undergraduate' && "Bachelor's degree programs"}
                  {level === 'postgraduate' && "Master's degree programs"}
                  {level === 'diploma' && "Diploma programs"}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Category */}
        {step === 'category' && (
          <div className="space-y-3">
            <button
              onClick={() => setStep('level')}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4"
            >
              ← Change level
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="w-full p-4 border-2 border-gray-200 rounded-lg text-left hover:border-indigo-500 hover:bg-indigo-50 transition-all"
              >
                <div className="font-semibold text-gray-900">{category.name}</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Details */}
        {step === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setStep('category')}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4"
            >
              ← Change category
            </button>

            <div className="space-y-2">
              <Label htmlFor="specific_program">Specific Program/Degree *</Label>
              <input
                id="specific_program"
                name="specific_program"
                type="text"
                placeholder="e.g., B.Tech - Computer Science"
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
                placeholder="e.g., IIT Delhi"
                value={formData.institution}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EducationProfileSettings;
