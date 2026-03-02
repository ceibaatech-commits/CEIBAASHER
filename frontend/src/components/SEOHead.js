import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({
  title,
  description,
  keywords,
  canonical,
  type = 'website',
  image = 'https://ceibaa.in/og-image.png',
  jsonLd,
}) => {
  const siteName = 'Ceibaa';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Free MCQs, NCERT Solutions & Interactive Quizzes`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || 'Ceibaa offers free chapter-wise MCQs, NCERT solutions, interactive quizzes and 1v1 battles for CBSE Class 6-12, JEE, NEET, SSC, Banking and more.'} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || 'Free MCQs, NCERT solutions & interactive quizzes for CBSE, JEE, NEET and more.'} />
      <meta property="og:site_name" content={siteName} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || 'Free MCQs, NCERT solutions & interactive quizzes.'} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
