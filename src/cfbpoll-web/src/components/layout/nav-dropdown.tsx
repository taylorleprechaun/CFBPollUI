import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { isActiveLink } from '../../lib/route-utils';

export interface NavItem {
  label: string;
  to: string;
}

interface NavDropdownProps {
  isActive: boolean;
  items: NavItem[];
  label: string;
}

const BUTTON_BASE = 'px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1';
const BUTTON_ACTIVE = `${BUTTON_BASE} bg-nav-active text-white`;
const BUTTON_INACTIVE = `${BUTTON_BASE} text-white/80 hover:bg-nav-hover hover:text-white`;

const LINK_BASE = 'block px-4 py-2 text-sm transition-colors whitespace-nowrap';
const LINK_ACTIVE = `${LINK_BASE} bg-nav-active text-white`;
const LINK_INACTIVE = `${LINK_BASE} text-white/80 hover:bg-nav-hover hover:text-white`;

export function NavDropdown({ isActive, items, label }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={isActive ? BUTTON_ACTIVE : BUTTON_INACTIVE}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-nav-bg/95 backdrop-blur-md rounded-lg shadow-lg border border-white/10 py-1 z-50 min-w-36">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={isActiveLink(location.pathname, item.to) ? LINK_ACTIVE : LINK_INACTIVE}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
