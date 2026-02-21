import { Link } from 'react-router-dom';
import { GitHubIcon, LinkedInIcon, TwitterIcon } from '../components/ui/icons';
import { useDocumentTitle } from '../hooks/use-document-title';

export function HomePage() {
  useDocumentTitle('Taylor Steinberg - Home');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Taylor Steinberg's FBS Ratings
        </h1>
        <div className="max-w-prose">
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
        </div>
        <Link
          to="/rankings"
          className="inline-block bg-blue-900 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-800 transition-colors"
        >
          View Rankings
        </Link>
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200">
          <a
            href="https://github.com/taylorleprechaun"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <GitHubIcon className="w-6 h-6" />
          </a>
          <a
            href="https://www.linkedin.com/in/taylor-steinberg-a86994111/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-gray-500 hover:text-[#0A66C2] transition-colors"
          >
            <LinkedInIcon className="w-6 h-6" />
          </a>
          <a
            href="https://twitter.com/TaylorLeprechau"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            className="text-gray-500 hover:text-[#1DA1F2] transition-colors"
          >
            <TwitterIcon className="w-6 h-6" />
          </a>
        </div>
      </div>
    </div>
  );
}
