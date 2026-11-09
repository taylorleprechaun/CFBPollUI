import { useEffect, useId, useMemo, useState } from 'react';

import { SELECT_BASE } from './button-styles';

const NO_EXCLUDED_OPTIONS: string[] = [];

interface SearchableSelectProps {
  disabled?: boolean;
  excludedOptions?: string[];
  label: string;
  onChange: (value: string | null) => void;
  options: string[];
  placeholder?: string;
  value: string | null;
}

export function SearchableSelect({
  disabled = false,
  excludedOptions = NO_EXCLUDED_OPTIONS,
  label,
  onChange,
  options,
  placeholder = 'Search...',
  value,
}: SearchableSelectProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const inputId = useId();
  const listboxId = useId();

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return options.filter(
      (option) => !excludedOptions.includes(option) && option.toLowerCase().includes(normalizedQuery)
    );
  }, [excludedOptions, options, query]);

  const activeOptionId = isOpen && filteredOptions.length > 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  useEffect(() => {
    if (!activeOptionId) return;
    document.getElementById(activeOptionId)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeOptionId]);

  function close() {
    setIsOpen(false);
    setQuery('');
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      close();
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setActiveIndex(0);
    setIsOpen(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          open();
          return;
        }
        setActiveIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        return;
      case 'Enter':
        if (isOpen && filteredOptions[activeIndex]) {
          event.preventDefault();
          select(filteredOptions[activeIndex]);
        }
        return;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          close();
        }
        return;
    }
  }

  function open() {
    setActiveIndex(0);
    setIsOpen(true);
  }

  function select(option: string) {
    onChange(option);
    close();
  }

  return (
    <div className="relative" onBlur={handleBlur}>
      <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          disabled={disabled}
          value={isOpen ? query : value ?? ''}
          placeholder={value ?? placeholder}
          onChange={handleInputChange}
          onClick={() => !isOpen && open()}
          onFocus={open}
          onKeyDown={handleKeyDown}
          className={`w-56 px-3 py-2 ${SELECT_BASE}`}
        />
        {value !== null && !disabled && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => onChange(null)}
            className="px-2 py-1 text-text-muted hover:text-text-primary"
          >
            &times;
          </button>
        )}
      </div>
      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-1 w-56 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-text-muted">No matches</li>
          ) : (
            filteredOptions.map((option, index) => (
              <li
                key={option}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={option === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(option)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`px-3 py-2 text-sm cursor-pointer ${
                  index === activeIndex ? 'bg-surface-alt text-text-primary' : 'text-text-secondary'
                } ${option === value ? 'font-semibold' : ''}`}
              >
                {option}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
