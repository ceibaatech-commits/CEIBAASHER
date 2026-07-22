import React from 'react';

/**
 * Partner logos — normalized so every mark reads at the same visual weight
 * regardless of its native aspect ratio. `scale` gives each brand a small
 * per-logo multiplier to compensate for SVGs that bake in extra whitespace
 * inside their viewBox (e.g. Salesforce cloud, Accenture ">").
 */
const partners = [
  { name: 'Salesforce',   logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',              scale: 1.15 },
  { name: 'Infosys',      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg',                     scale: 1.00 },
  { name: 'Google',       logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',                 scale: 0.90 },
  { name: 'TCS',          logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Tata_Consultancy_Services_old_logo.svg', scale: 1.15 },
  { name: 'Accenture',    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg',                        scale: 1.00 },
  { name: 'Flipkart',     logo: 'https://prismlife.com/img/logo_1.png',scale: 1.15 },
  { name: 'Delhivery',    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Delhivery_Logo_%282019%29.png',        scale: 0.80 },
  { name: 'Adani',        logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Adani_logo_2012.svg',                  scale: 1.05 },
  { name: 'Mahima Group', logo: 'https://mahimagroup.com/wp-content/uploads/2024/10/site-logo.svg',                         scale: 1.25 },
  { name: 'Capgemini',    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Capgemini_New_logo.svg/500px-Capgemini_New_logo.svg.png', scale: 0.95 },
];

const handleImgError = (e) => {
  const name = e.currentTarget.dataset.name || 'Partner';
  e.currentTarget.onerror = null;
  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f1f5f9&color=1e293b&size=200&bold=true&format=svg`;
};

const LogoTile = ({ name, logo, scale = 1 }) => (
  <div
    className="partner-tile flex-shrink-0 mx-4 sm:mx-8 flex items-center justify-center grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all"
    title={name}
    data-testid={`partner-${name.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <img
      src={logo}
      alt={`${name} logo`}
      data-name={name}
      onError={handleImgError}
      style={{ transform: `scale(${scale})` }}
      className="partner-tile__img block w-auto max-w-none object-contain"
      loading="lazy"
    />
  </div>
);

const PartnerBrandingSection = () => {
  const loop = [...partners, ...partners];

  return (
    <section className="bg-white border-b border-slate-200 py-10 sm:py-12" data-testid="partner-branding-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-slate-500">Trusted by</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">Our Partner Community</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl mx-auto px-2">
            Working with leading brands and institutions to bring you real-world internships, research opportunities, and career-ready programs.
          </p>
        </div>

        {/* Marquee row */}
        <div className="partner-marquee relative overflow-hidden" data-testid="partner-marquee">
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-white to-transparent z-10" />

          <div className="partner-marquee__track flex w-max py-3">
            {loop.map((p, i) => (
              <LogoTile key={`${p.name}-${i}`} {...p} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        /* Uniform tile: fixed row height gives every logo the same optical size,
           width flexes to the aspect ratio so nothing gets stretched. */
        .partner-tile { height: 56px; }
        .partner-tile__img { height: 30px; width: auto; }
        @media (min-width: 640px) {
          .partner-tile      { height: 72px; }
          .partner-tile__img { height: 40px; }
        }

        @keyframes partner-marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .partner-marquee__track {
          animation: partner-marquee-scroll 40s linear infinite;
          will-change: transform;
        }
        .partner-marquee:hover .partner-marquee__track {
          animation-play-state: paused;
        }
        @media (max-width: 640px) {
          .partner-marquee__track { animation-duration: 26s; }
        }
        @media (prefers-reduced-motion: reduce) {
          .partner-marquee__track { animation: none; }
        }
      `}</style>
    </section>
  );
};

export default PartnerBrandingSection;
