"use client";
import Link from "next/link";
import { useState } from "react";

const BusinessNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-[#1B1B2F] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/business" className="text-2xl font-bold text-purple-500">
            BizPortal
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link href="/business" className="hover:text-purple-400">
              Home
            </Link>
            <Link href="/business/browse-students" className="hover:text-purple-400">
              Browse Students
            </Link>
            <Link href="/business/post-job" className="hover:text-purple-400">
              Post Job
            </Link>
            <Link href="/business/profile" className="hover:text-purple-400">
              Profile
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#1B1B2F] px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/business"
            className="block px-3 py-2 rounded-md hover:bg-purple-500/20"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/business/browse-students"
            className="block px-3 py-2 rounded-md hover:bg-purple-500/20"
            onClick={() => setIsOpen(false)}
          >
            Browse Students
          </Link>
          <Link
            href="/business/post-job"
            className="block px-3 py-2 rounded-md hover:bg-purple-500/20"
            onClick={() => setIsOpen(false)}
          >
            Post Job
          </Link>
          <Link
            href="/business/profile"
            className="block px-3 py-2 rounded-md hover:bg-purple-500/20"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>
        </div>
      )}
    </nav>
  );
};

export default BusinessNavbar;
