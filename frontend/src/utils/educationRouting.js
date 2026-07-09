/**
 * Utility functions for education-aware routing
 */

/**
 * Determine if user is in active studies (Class 12 or Undergrad years)
 * @param {Object} user - User object with education_profile
 * @returns {boolean} true if user is active student
 */
export const isActiveStudent = (user) => {
  if (!user?.education_profile) {
    // Default: assume user is active student (Class 12 or transitioning)
    return true;
  }
  
  const yearOfStudy = user.education_profile.year_of_study;
  
  // Active student: Class 12 (no profile) or in years 1-4
  const activeYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  return activeYears.includes(yearOfStudy);
};

/**
 * Get appropriate program page based on user education status
 * @param {Object} user - User object with education_profile
 * @returns {string} path to appropriate programs page (/courses or /programs)
 */
export const getProgramsPath = (user) => {
  return isActiveStudent(user) ? '/courses' : '/programs';
};

/**
 * Get page title based on user type
 * @param {Object} user - User object with education_profile
 * @returns {string} appropriate page title
 */
export const getProgramsPageTitle = (user) => {
  return isActiveStudent(user) 
    ? 'Career Programs & Courses' 
    : 'Educational Programs & Certifications';
};

/**
 * Get page subtitle based on user type
 * @param {Object} user - User object with education_profile
 * @returns {string} appropriate page subtitle
 */
export const getProgramsPageSubtitle = (user) => {
  if (isActiveStudent(user)) {
    return 'Go beyond textbooks. Research, intern, innovate — build skills that colleges and employers value.';
  }
  return 'Advance your career with specialized programs tailored to your qualification level.';
};
