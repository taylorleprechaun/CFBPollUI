import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 01-1.5 0V6.75a3.75 3.75 0 00-7.5 0v3h1.5a3 3 0 013 3v6.75a3 3 0 01-3 3H5.25a3 3 0 01-3-3v-6.75a3 3 0 013-3h8.25v-3c0-2.9 2.35-5.25 5.25-5.25z" />
    </svg>
  );
}

export function Layout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <header>
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
              <Link
                to={isAuthenticated ? '/admin' : '/login'}
                className="hover:bg-blue-800 p-2 rounded-md"
                aria-label={isAuthenticated ? 'Admin dashboard' : 'Admin login'}
              >
                {isAuthenticated ? <UnlockIcon /> : <LockIcon />}
              </Link>
            </div>
          </div>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
