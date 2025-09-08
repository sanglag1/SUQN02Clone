'use client';

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

interface DropdownContextType {
  close: () => void;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function DropdownMenu({ trigger, children, align = 'right', className = '' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const close = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger}
      </div>
      
      {isOpen && (
        <DropdownContext.Provider value={{ close }}>
          <div 
            className={`absolute z-50 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
            role="menu"
            aria-orientation="vertical"
          >
            <div className="py-1 divide-y divide-gray-100">
              {children}
            </div>
          </div>
        </DropdownContext.Provider>
      )}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, className = '', disabled = false }: DropdownMenuItemProps) {
  const context = useContext(DropdownContext);
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (context) {
      context.close();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center ${className}`}
      role="menuitem"
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="border-t border-gray-200 my-1" />;
}
