import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold">
                CFB Poll
              </Link>
              <div className="flex space-x-4">
                <Link
                  to="/"
                  className="hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/rankings"
                  className="hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Rankings
                </Link>
                <Link
                  to="/team-details"
                  className="hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Team Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
