import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useDocumentTitle } from '../hooks/use-document-title';
import { TRACK_RECORD_STAT_INFO } from '../lib/track-record-stat-info';

const STAT_ORDER = ['winner', 'spread', 'overUnder', 'marginRMSE', 'marginBias'] as const;

export function TrackRecordExplainedPage() {
  useDocumentTitle('Taylor Steinberg - Track Record Stats Explained');

  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    target?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/track-record" className="text-sm font-medium text-accent hover:underline">
        &larr; Back to Track Record
      </Link>

      <h1 className="text-3xl font-bold text-text-primary mt-4 mb-2">Understanding the Track Record Stats</h1>
      <p className="text-text-secondary leading-relaxed mb-8">
        Once a game is final, every prediction we made for it gets checked against what actually happened.
        Here&rsquo;s what each of these numbers actually means, in plain English.
      </p>

      {STAT_ORDER.map((key) => {
        const info = TRACK_RECORD_STAT_INFO[key];
        return (
          <section key={info.id} id={info.id} className="mb-8 scroll-mt-20">
            <h2 className="text-xl font-semibold text-text-primary mb-2">{info.label}</h2>
            <p className="text-text-secondary leading-relaxed">{info.description}</p>
          </section>
        );
      })}

      <section id="margin-worked-example" className="mb-8 scroll-mt-20">
        <h2 className="text-xl font-semibold text-text-primary mb-2">A Quick Example</h2>
        <p className="text-text-secondary leading-relaxed mb-4">
          Margin RMSE and Margin Bias both come from the same game-by-game miss. Here are three made-up games to
          show how that miss turns into each number.
        </p>
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-text-muted uppercase text-xs tracking-wider">
                <th scope="col" className="pb-2 pr-4">Game</th>
                <th scope="col" className="pb-2 pr-4">We picked them to win by</th>
                <th scope="col" className="pb-2 pr-4">They actually won by</th>
                <th scope="col" className="pb-2">Miss</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              <tr>
                <td className="pr-4 py-1">Game 1</td>
                <td className="pr-4 py-1">6</td>
                <td className="pr-4 py-1">3</td>
                <td className="py-1">3 &minus; 6 = &minus;3</td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Game 2</td>
                <td className="pr-4 py-1">3</td>
                <td className="pr-4 py-1">10</td>
                <td className="py-1">10 &minus; 3 = +7</td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Game 3</td>
                <td className="pr-4 py-1">10</td>
                <td className="pr-4 py-1">3</td>
                <td className="py-1">3 &minus; 10 = &minus;7</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-text-secondary leading-relaxed mt-4">
          For <strong>Margin RMSE</strong>, square each miss, average those squares together, then take the square
          root of that average: &radic;((3&sup2; + 7&sup2; + 7&sup2;) &divide; 3) = &radic;35.7 &asymp;{' '}
          <strong>6.0 points</strong>. That&rsquo;s our typical miss size.
        </p>
        <p className="text-text-secondary leading-relaxed">
          For <strong>Margin Bias</strong>, just average the misses directly, no squaring: (&minus;3 + 7 &minus; 7)
          &divide; 3 = <strong>&minus;1.0 points</strong>. In this small sample, our margins ran a little too
          confident on average.
        </p>
      </section>

      <section id="margin-quality-bands" className="mb-8 scroll-mt-20">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Where the Color Coding Comes From</h2>
        <p className="text-text-secondary leading-relaxed">
          When you turn on margin stats, Margin RMSE and Margin Bias get colored based on how good the number is:
          green when it&rsquo;s strong, yellow when it&rsquo;s middling, red when it&rsquo;s rough. Those colors
          aren&rsquo;t made-up cutoffs. They&rsquo;re based on how dozens of real, published computer rating systems
          actually perform each season, tracked at{' '}
          <a
            href="https://www.thepredictiontracker.com/ncaaresults.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            The Prediction Tracker
          </a>
          , pulled back a bit since this is meant as a personal benchmark rather than a contest against a pool of
          professional systems. Landing at a respectable rate earns green; falling well behind earns red.
        </p>
      </section>

      <section id="pick-accuracy-quality-bands" className="mb-8 scroll-mt-20">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Where the Winner, Spread, and Over/Under Colors Come From
        </h2>
        <p className="text-text-secondary leading-relaxed">
          Winner, Spread, and Over/Under get the same treatment on the By Season summary cards and in the weekly
          breakdown: green, yellow, or red based on the pick rate, using the same real-systems field and the same
          toned-down bar described above. All-Time stays plain, since it blends every season together and a single
          color band across that much history wouldn&rsquo;t mean much.
        </p>
      </section>
    </div>
  );
}

export default TrackRecordExplainedPage;
