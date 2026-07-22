import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  examName = '',
  canonical = window.location.href 
}) => {
  // Default values
  const defaultTitle = "Ceibaa 2026 - Test Series, MCQ & Free Practice Quizzes for 60+ Competitive Exams";
  const defaultDescription = "Master 60+ competitive exams with Ceibaa's free online test series, MCQs, and practice quizzes. Prepare for JEE 2026, NEET 2026, UPSC, SSC & more with live battles.";
  const defaultKeywords = "competitive exams 2026, test series, MCQ practice, free quiz, online mock tests, exam preparation";

  // Generate exam-specific title if examName is provided
  const pageTitle = examName 
    ? `${examName} 2026 - Test Series, MCQ & Free Practice Quizzes | Ceibaa`
    : title || defaultTitle;

  const pageDescription = examName
    ? `Prepare for ${examName} 2026 with free online test series, MCQs & practice quizzes on Ceibaa. Live multiplayer battles, comprehensive syllabus coverage, and real-time mock tests.`
    : description || defaultDescription;

  const pageKeywords = examName
    ? `${examName} 2026, ${examName} test series, ${examName} MCQ, ${examName} practice quiz, ${examName} mock test, ${examName} preparation, ${keywords || defaultKeywords}`
    : keywords || defaultKeywords;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      
      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      
      {/* Canonical */}
      <link rel="canonical" href={canonical} />
    </Helmet>
  );
};

export default SEO;
