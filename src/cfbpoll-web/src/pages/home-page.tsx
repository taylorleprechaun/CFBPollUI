import { useCallback } from 'react';
import { Link } from 'react-router-dom';

import { useCountUp } from '../hooks/use-count-up';
import { useDocumentTitle } from '../hooks/use-document-title';
import { useInView } from '../hooks/use-in-view';

const FEATURES = [
  {
    title: 'Win-Loss Record',
    description: 'Evaluates team performance through wins and losses across the season.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.707 6.707 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.67 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: 'Strength of Schedule',
    description: 'Weighted SOS accounts for the quality of opponents each team has faced.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 016.775-5.025.75.75 0 01.313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.64l3.318-3.319a.75.75 0 011.248.313 5.25 5.25 0 01-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 112.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0112 6.75zM4.117 19.125a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: 'Game Statistics',
    description: 'In-depth statistical analysis of offensive and defensive performance.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
      </svg>
    ),
  },
  {
    title: 'Success Rate',
    description: 'Measures how consistently teams achieve positive outcomes on each play.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
      </svg>
    ),
  },
];

const STATS = [
  { label: 'Seasons', numericValue: 24, suffix: '+' },
  { label: 'FBS Teams', numericValue: 130, suffix: '+' },
  { label: 'Data Since', numericValue: 2002, suffix: '' },
];

interface StatCardProps {
  label: string;
  numericValue: number;
  suffix: string;
}

function StatCard({ label, numericValue, suffix }: StatCardProps) {
  var { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  var count = useCountUp({ end: numericValue, enabled: inView });

  return (
    <div
      ref={ref}
      className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-md shadow-lg rounded-xl p-4 sm:p-6 text-center border border-white/20 dark:border-gray-700/40"
    >
      <div className="text-2xl sm:text-3xl font-extrabold text-accent">
        {count}{suffix}
      </div>
      <div className="text-sm sm:text-base text-text-secondary mt-1">{label}</div>
    </div>
  );
}

export function HomePage() {
  useDocumentTitle('Taylor Steinberg - Home');

  var { ref: featureGridRef, inView: featuresInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  var handleScrollToSection = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      var target = document.getElementById('how-it-works');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [],
  );

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 dark:from-gray-900 dark:via-blue-950 dark:to-slate-900 px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 animate-dot-drift" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-xl sm:text-2xl text-blue-200 dark:text-blue-300 font-medium tracking-wide uppercase mb-4">
            Taylor Steinberg&rsquo;s
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
            College Football Rankings
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 dark:text-blue-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            A data-driven rating system that evaluates FBS teams based on performance,
            strength of schedule, and advanced statistics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/rankings"
              className="inline-flex items-center gap-2 bg-white text-blue-900 dark:bg-blue-500 dark:text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              View Rankings
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              onClick={handleScrollToSection}
              className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-200"
            >
              Learn More &darr;
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {STATS.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              numericValue={stat.numericValue}
              suffix={stat.suffix}
            />
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2
          id="how-it-works"
          className="text-2xl sm:text-3xl font-bold text-text-primary text-center mb-4"
        >
          How It Works
        </h2>
        <p className="text-text-secondary text-center mb-12 max-w-prose mx-auto">
          Rankings are calculated using data from the College Football Data API,
          combining multiple factors into a single composite rating.
        </p>
        <div ref={featureGridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 ${
                featuresInView ? 'animate-fade-slide-up' : 'opacity-0'
              }`}
              style={featuresInView ? { animationDelay: `${index * 100}ms` } : undefined}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-3">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
