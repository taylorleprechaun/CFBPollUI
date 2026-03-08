import { useEffect, useState } from 'react';

import { Link, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/auth-context';
import { usePageVisibility } from '../../hooks/use-page-visibility';
import { CloseIcon, GitHubIcon, LinkedInIcon, LockIcon, MenuIcon, TwitterIcon, UnlockIcon } from '../ui/icons';
import { ThemeToggle } from '../ui/theme-toggle';

const DESKTOP_LINK_BASE = 'px-4 py-1.5 rounded-full text-sm font-medium transition-colors';
const DESKTOP_LINK_ACTIVE = `${DESKTOP_LINK_BASE} bg-nav-active text-white`;
const DESKTOP_LINK_INACTIVE = `${DESKTOP_LINK_BASE} text-white/80 hover:bg-nav-hover hover:text-white`;

const MOBILE_LINK_BASE = 'block px-3 py-2 rounded-md text-base font-medium transition-colors';
const MOBILE_LINK_ACTIVE = `${MOBILE_LINK_BASE} bg-nav-active text-white`;
const MOBILE_LINK_INACTIVE = `${MOBILE_LINK_BASE} text-white/80 hover:bg-nav-hover hover:text-white`;

interface NavLink {
  label: string;
  to: string;
}

function isActiveLink(pathname: string, linkTo: string): boolean {
  if (linkTo === '/') return pathname === '/';
  return pathname.startsWith(linkTo);
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
    <div className="min-h-screen bg-page-bg overflow-x-hidden flex flex-col">
      <header className="sticky top-0 z-40">
        <nav className="bg-nav-bg/95 backdrop-blur-md text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link to="/" className="text-xl font-bold tracking-tight">
                  CFB Poll
                </Link>
                <div className="hidden md:flex space-x-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={isActiveLink(location.pathname, link.to) ? DESKTOP_LINK_ACTIVE : DESKTOP_LINK_INACTIVE}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <ThemeToggle />
                <Link
                  to={isAuthenticated ? '/admin' : '/login'}
                  className="hover:bg-nav-hover p-2 rounded-md transition-colors"
                  aria-label={isAuthenticated ? 'Admin dashboard' : 'Admin login'}
                >
                  {isAuthenticated ? <UnlockIcon /> : <LockIcon />}
                </Link>
                <button
                  type="button"
                  className="md:hidden hover:bg-nav-hover p-2 rounded-md transition-colors"
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
            <div className="md:hidden border-t border-white/20 px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={isActiveLink(location.pathname, link.to) ? MOBILE_LINK_ACTIVE : MOBILE_LINK_INACTIVE}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </header>
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-4">
          <span className="text-sm text-text-muted">Taylor Steinberg</span>
          <div className="flex items-center gap-3">
            <a href="https://github.com/taylorleprechaun" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-text-muted hover:text-text-primary transition-colors">
              <GitHubIcon className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/in/taylor-steinberg-a86994111/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-text-muted hover:text-text-primary transition-colors">
              <LinkedInIcon className="w-5 h-5" />
            </a>
            <a href="https://twitter.com/TaylorLeprechau" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-text-muted hover:text-text-primary transition-colors">
              <TwitterIcon className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
