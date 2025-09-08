"use client";

import { Search, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import BackgroundMeteors from '@/components/ui/backgroundmeteors';
import { Logo } from '@/components/ui/logo';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <BackgroundMeteors>
      <nav className="relative w-full">
        {/* Content */}
        <div className="flex items-center justify-between px-4 md:px-12 py-4 md:py-6 relative z-50 max-w-[2100px] mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-white p-1.5 ring-1 ring-white/80 shadow-sm">
              <Logo size="md" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-white font-medium hover:text-purple-300 transition-colors"
            >
              Home
            </button>
            <Link href="/dashboard" className="text-white font-medium hover:text-purple-300 transition-colors">
              Dashboard
            </Link>
            <button 
              onClick={() => scrollToSection('features')}
              className="text-white font-medium hover:text-purple-300 transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-white font-medium hover:text-purple-300 transition-colors"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-white font-medium hover:text-purple-300 transition-colors"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('ourteams')}
              className="text-white font-medium hover:text-purple-300 transition-colors"
            >
              Team
            </button>
            <Link href="/Pricing" className="text-white font-medium hover:text-purple-300 transition-colors">
              Full Pricing
            </Link>
          </div>

          {/* Search and Auth */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 rounded-full bg-gray-100 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all w-48"
              />
            </div>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonTrigger: "hover:opacity-80 transition-opacity"
                  }
                }}
              />
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="text-white font-medium hover:text-purple-300 transition-colors">
                Login
              </Link>
              <Link
                href="/sign-up"
                className="bg-purple-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-purple-700 transition-colors"
              >
                Sign-up
              </Link>
            </SignedOut>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Menu */}
          {isMenuOpen && typeof window !== 'undefined' && createPortal((
            <div className="md:hidden fixed inset-0 z-[2147483647]">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsMenuOpen(false)}
              />
              {/* Panel */}
              <div className="absolute left-0 right-0 top-16 bg-white border-t border-gray-200 shadow-xl">
                <div className="p-4 space-y-4">
                <button 
                  onClick={() => {
                    scrollToSection('home');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-700 font-medium hover:text-purple-600"
                >
                  Home
                </button>
                <Link href="/dashboard" className="block py-2 text-gray-700 font-medium hover:text-purple-600">
                  Dashboard
                </Link>
                <button 
                  onClick={() => {
                    scrollToSection('features');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-700 font-medium hover:text-purple-600"
                >
                  Features
                </button>
                <button 
                  onClick={() => {
                    scrollToSection('how-it-works');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-700 font-medium hover:text-purple-600"
                >
                  How It Works
                </button>
                <button 
                  onClick={() => {
                    scrollToSection('pricing');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-700 font-medium hover:text-purple-600"
                >
                  Pricing
                </button>
                <button 
                  onClick={() => {
                    scrollToSection('ourteams');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-700 font-medium hover:text-purple-600"
                >
                  Team
                </button>
                <Link href="/Pricing" className="block py-2 text-gray-700 font-medium hover:text-purple-600">
                  Full Pricing
                </Link>

                <div className="border-t border-gray-200 my-2"></div>
                
                <SignedIn>
                  <div className="flex items-center justify-center py-2">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
                <SignedOut>
                  <Link href="/sign-in" className="block py-2 text-gray-700 font-medium hover:text-purple-600">
                    Login
                  </Link>
                  <Link
                    href="/sign-up"
                    className="block py-2 text-gray-700 font-medium bg-purple-50 rounded-lg text-center mt-2"
                  >
                    Sign-up
                  </Link>
                </SignedOut>
                </div>
              </div>
            </div>
          ), document.body)}
        </div>
      </nav>
    </BackgroundMeteors>
  );
}
