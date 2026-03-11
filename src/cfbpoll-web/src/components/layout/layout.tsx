import { useEffect, useState } from 'react';

import { Link, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/auth-context';
import { useDropdown } from '../../hooks/use-dropdown';
import { usePageVisibility } from '../../hooks/use-page-visibility';
import { isActiveLink } from '../../lib/route-utils';
import { CloseIcon, GitHubIcon, LinkedInIcon, LockIcon, MenuIcon, TwitterIcon, UnlockIcon } from '../ui/icons';
import { ThemeToggle } from '../ui/theme-toggle';
import { DROPDOWN_LINK_ACTIVE, DROPDOWN_LINK_INACTIVE, NavDropdown, type NavItem } from './nav-dropdown';

const DESKTOP_LINK_BASE = 'px-4 py-1.5 rounded-full text-sm font-medium transition-colors';
const DESKTOP_LINK_ACTIVE = `${DESKTOP_LINK_BASE} bg-nav-active text-white`;
const DESKTOP_LINK_INACTIVE = `${DESKTOP_LINK_BASE} text-white/80 hover:bg-nav-hover hover:text-white`;

const MOBILE_LINK_BASE = 'block px-3 py-2 rounded-md text-base font-medium transition-colors';
const MOBILE_LINK_ACTIVE = `${MOBILE_LINK_BASE} bg-nav-active text-white`;
const MOBILE_LINK_INACTIVE = `${MOBILE_LINK_BASE} text-white/80 hover:bg-nav-hover hover:text-white`;

const MOBILE_SUBLINK_BASE = 'block pl-6 pr-3 py-2 rounded-md text-sm font-medium transition-colors';
const MOBILE_SUBLINK_ACTIVE = `${MOBILE_SUBLINK_BASE} bg-nav-active text-white`;
const MOBILE_SUBLINK_INACTIVE = `${MOBILE_SUBLINK_BASE} text-white/80 hover:bg-nav-hover hover:text-white`;

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Snapshots', to: '/admin/snapshots' },
  { label: 'Predictions', to: '/admin/predictions' },
  { label: 'Settings', to: '/admin/settings' },
];

interface NavGroup {
  items: NavItem[];
  label: string;
}

function isGroupActive(pathname: string, items: NavItem[]): boolean {
  return items.some((item) => isActiveLink(pathname, item.to));
}

export function Layout() {
  const { isAuthenticated } = useAuth();
  const { allTimeEnabled, pollLeadersEnabled, seasonTrendsEnabled } = usePageVisibility();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const adminDropdown = useDropdown();
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen((prev) => prev ? false : prev);
  }, [location.pathname]);

  const rankingsGroup: NavGroup = {
    items: [
      { label: 'Rankings', to: '/rankings' },
      { label: 'Teams', to: '/team-details' },
      ...(seasonTrendsEnabled ? [{ label: 'Trends', to: '/season-trends' }] : []),
    ],
    label: 'Rankings',
  };

  const allTimeItems: NavItem[] = [
    ...(allTimeEnabled ? [{ label: 'All-Time', to: '/all-time' }] : []),
    ...(pollLeadersEnabled ? [{ label: 'Leaders', to: '/poll-leaders' }] : []),
  ];

  const allTimeGroup: NavGroup | null = allTimeItems.length > 0
    ? { items: allTimeItems, label: 'All-Time' }
    : null;

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
                  <Link
                    to="/"
                    className={isActiveLink(location.pathname, '/') ? DESKTOP_LINK_ACTIVE : DESKTOP_LINK_INACTIVE}
                  >
                    Home
                  </Link>
                  <NavDropdown
                    isActive={isGroupActive(location.pathname, rankingsGroup.items)}
                    items={rankingsGroup.items}
                    label={rankingsGroup.label}
                  />
                  {allTimeGroup && (
                    <NavDropdown
                      isActive={isGroupActive(location.pathname, allTimeGroup.items)}
                      items={allTimeGroup.items}
                      label={allTimeGroup.label}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <ThemeToggle />
                {isAuthenticated ? (
                  <div ref={adminDropdown.containerRef} className="relative">
                    <button
                      type="button"
                      onClick={adminDropdown.toggle}
                      className="hover:bg-nav-hover p-2 rounded-md transition-colors"
                      aria-label="Admin menu"
                      aria-expanded={adminDropdown.isOpen}
                      aria-haspopup="true"
                    >
                      <UnlockIcon />
                    </button>
                    {adminDropdown.isOpen && (
                      <div className="absolute top-full right-0 mt-1 bg-nav-bg/95 backdrop-blur-md rounded-lg shadow-lg border border-white/10 py-1 z-50 min-w-36">
                        {ADMIN_ITEMS.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={isActiveLink(location.pathname, item.to) ? DROPDOWN_LINK_ACTIVE : DROPDOWN_LINK_INACTIVE}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="hover:bg-nav-hover p-2 rounded-md transition-colors"
                    aria-label="Admin login"
                  >
                    <LockIcon />
                  </Link>
                )}
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
              <Link
                to="/"
                className={isActiveLink(location.pathname, '/') ? MOBILE_LINK_ACTIVE : MOBILE_LINK_INACTIVE}
              >
                Home
              </Link>
              <div className="pt-2 pb-1 px-3 text-xs font-semibold text-white/50 uppercase tracking-wider">
                {rankingsGroup.label}
              </div>
              {rankingsGroup.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={isActiveLink(location.pathname, item.to) ? MOBILE_SUBLINK_ACTIVE : MOBILE_SUBLINK_INACTIVE}
                >
                  {item.label}
                </Link>
              ))}
              {allTimeGroup && (
                <>
                  <div className="pt-2 pb-1 px-3 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    {allTimeGroup.label}
                  </div>
                  {allTimeGroup.items.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={isActiveLink(location.pathname, item.to) ? MOBILE_SUBLINK_ACTIVE : MOBILE_SUBLINK_INACTIVE}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
              {isAuthenticated && (
                <>
                  <div className="pt-2 pb-1 px-3 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Admin
                  </div>
                  {ADMIN_ITEMS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={isActiveLink(location.pathname, item.to) ? MOBILE_SUBLINK_ACTIVE : MOBILE_SUBLINK_INACTIVE}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
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
