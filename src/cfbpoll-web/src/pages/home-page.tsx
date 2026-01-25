import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function HomePage() {
  useEffect(() => {
    document.title = 'Taylor Steinberg - Home';
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Taylor Steinberg's FBS Ratings
        </h1>
        <p className="text-gray-600 mb-4">
          This is a college football rating system that evaluates teams based on their performance
          throughout the season. My algorithm considers a number of key factors such as:
        </p>
        <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
          <li>Win-loss record</li>
          <li>Weighted strength of schedule (SOS)</li>
          <li>Game statistics</li>
          <li>Success Rate</li>
        </ul>
        <p className="text-gray-600 mb-6">
          The rankings are calculated using data from the College Football Data API.
          You can explore current and historical rankings from 2002 to the present.
        </p>
        <Link
          to="/rankings"
          className="inline-block bg-blue-900 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-800 transition-colors"
        >
          View Rankings
        </Link>
      </div>
    </div>
  );
}
