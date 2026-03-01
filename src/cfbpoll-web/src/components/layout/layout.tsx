import { useEffect, useState } from 'react';

import { Link, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/auth-context';
import { usePageVisibility } from '../../hooks/use-page-visibility';
import { CloseIcon, LockIcon, MenuIcon, UnlockIcon } from '../ui/icons';

const DESKTOP_LINK_CLASS = 'hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium';
const MOBILE_LINK_CLASS = 'hover:bg-blue-800 block px-3 py-2 rounded-md text-base font-medium';

interface NavLink {
  label: string;
  to: string;
}

export function Layout() {
  const { isAuthenticated } = useAuth();
  const { allTimeEnabled, pollLeadersEnabled } = usePageVisibility();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks: NavLink[] = [
    { label: 'Home', to: '/' },
    { label: 'Rankings', to: '/rankings' },
    { label: 'Team Details', to: '/team-details' },
    ...(allTimeEnabled ? [{ label: 'All-Time', to: '/all-time' }] : []),
    ...(pollLeadersEnabled ? [{ label: 'Leaders', to: '/poll-leaders' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <header>
        <nav className="bg-blue-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link to="/" className="text-xl font-bold">
                  CFB Poll
                </Link>
                <div className="hidden md:flex space-x-4">
                  {navLinks.map((link) => (
                    <Link key={link.to} to={link.to} className={DESKTOP_LINK_CLASS}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <Link
                  to={isAuthenticated ? '/admin' : '/login'}
                  className="hover:bg-blue-800 p-2 rounded-md"
                  aria-label={isAuthenticated ? 'Admin dashboard' : 'Admin login'}
                >
                  {isAuthenticated ? <UnlockIcon /> : <LockIcon />}
                </Link>
                <button
                  type="button"
                  className="md:hidden hover:bg-blue-800 p-2 rounded-md ml-1"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
              </div>
            </div>
          </div>
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-blue-800 px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} className={MOBILE_LINK_CLASS}>
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
