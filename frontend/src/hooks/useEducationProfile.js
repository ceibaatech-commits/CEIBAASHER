import { useAuth } from '../context/AuthContext';
import { useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = window.location.origin;

/**
 * Hook for managing user's education profile
 * Provides utilities to get, update, and manage education profile data
 */
export const useEducationProfile = () => {
  const { user, updateUser } = useAuth();

  /**
   * Get user's education profile
   */
  const getEducationProfile = useCallback(async (userId) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/user/${userId}/education-profile`
      );
      if (response.data.success) {
        return response.data.education_profile;
      }
    } catch (err) {
      console.error('Error fetching education profile:', err);
    }
    return null;
  }, []);

  /**
   * Set/update user's education profile
   */
  const setEducationProfile = useCallback(async (educationProfile) => {
    try {
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
        updateUser({
          education_profile: educationProfile,
          education_profile_completed_at: new Date().toISOString()
        });
        return true;
      }
    } catch (err) {
      console.error('Error setting education profile:', err);
    }
    return false;
  }, [updateUser]);

  /**
   * Check if user has completed education profile
   */
  const hasEducationProfile = useCallback(() => {
    return user?.education_profile !== null && user?.education_profile !== undefined;
  }, [user]);

  /**
   * Get education level from profile
   */
  const getEducationLevel = useCallback(() => {
    return user?.education_profile?.education_level || null;
  }, [user]);

  /**
   * Get education category from profile
   */
  const getEducationCategory = useCallback(() => {
    return user?.education_profile?.education_category || null;
  }, [user]);

  /**
   * Get specific program from profile
   */
  const getSpecificProgram = useCallback(() => {
    return user?.education_profile?.specific_program || null;
  }, [user]);

  /**
   * Get year of study from profile
   */
  const getYearOfStudy = useCallback(() => {
    return user?.education_profile?.year_of_study || null;
  }, [user]);

  /**
   * Get institution from profile
   */
  const getInstitution = useCallback(() => {
    return user?.education_profile?.institution || null;
  }, [user]);

  return {
    educationProfile: user?.education_profile || null,
    getEducationProfile,
    setEducationProfile,
    hasEducationProfile,
    getEducationLevel,
    getEducationCategory,
    getSpecificProgram,
    getYearOfStudy,
    getInstitution
  };
};

export default useEducationProfile;
