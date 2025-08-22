"use client"
import { useState } from "react";
import Link from "next/link";
import { Menu, X, Home, Search, Users, User } from "lucide-react";
import Image from "next/image";

const StudentNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-[#1B1B2F]/70 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/student/dashboard" className="text-2xl font-bold text-purple-400">
             <Image src={'/Logo.png'} width={150} height={150} alt="logo"/>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-7 museo-moderno  items-center bg-[#3E3E55]/70 p-2 px-8 rounded-2xl">
            <Link href="/student/dashboard" className="flex items-center gap-1 hover:text-purple-400">
              <Home size={18} /> Home
            </Link>
            <Link href="/student/browse" className="flex items-center gap-1 hover:text-purple-400">
              <Search size={18} /> Browse
            </Link>
            <Link href="/student/community" className="flex items-center gap-1 hover:text-purple-400">
              <Users size={18} /> Community
            </Link>
           
          </div>
          <div>
          <Link href="/student/profile" className="flex items-center gap-1 border rounded-2xl p-1 hover:text-purple-400">
              <User size={22}/>
            </Link>
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#1B1B2F] px-4 pt-2 pb-4 space-y-2">
          <Link href="/student/dashboard" className="block py-2 px-3 rounded hover:bg-purple-500/20 flex items-center gap-1">
            <Home size={18} /> Home
          </Link>
          <Link href="/student/browse" className="block py-2 px-3 rounded hover:bg-purple-500/20 flex items-center gap-1">
            <Search size={18} /> Browse
          </Link>
          <Link href="/student/community" className="block py-2 px-3 rounded hover:bg-purple-500/20 flex items-center gap-1">
            <Users size={18} /> Community
          </Link>
          <Link href="/student/profile" className="block py-2 px-3 rounded hover:bg-purple-500/20 flex items-center gap-1">
            <User size={18} /> Profile
          </Link>
        </div>
      )}
    </nav>
  );
};

export default StudentNavbar;
