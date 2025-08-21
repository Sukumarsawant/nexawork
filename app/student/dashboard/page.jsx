'use client'

import { useState } from 'react'
import { Bell, Search, User } from 'lucide-react'
import LogoutButton from '@/component/LogOutButton'

export default function StudentDashboard() {
  // Dummy data – replace with Supabase queries later
  const jobs = [
    { id: 1, title: 'Logo Design for Startup', budget: '₹3,000', skills: ['Design', 'Illustrator'], deadline: '3 days' },
    { id: 2, title: 'React Landing Page', budget: '₹8,000', skills: ['React', 'Tailwind'], deadline: '1 week' },
    { id: 3, title: 'Social Media Marketing', budget: '₹5,000', skills: ['Marketing', 'Canva'], deadline: '5 days' },
  ]

  const blogs = [
    { id: 1, title: 'Top 5 AI Tools for Students', link: '#' },
    { id: 2, title: 'Freelancing Tax Basics You Should Know', link: '#' },
    { id: 3, title: 'UI/UX Trends 2025', link: '#' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🔹 Navbar */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Freelance Hub</h1>

        {/* Search bar */}
        <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2 w-1/3">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search jobs, skills..."
            className="bg-transparent ml-2 w-full focus:outline-none"
          />
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-4">
          <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer">
            <User className="w-6 h-6 text-gray-700" />
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* 🔹 Main content */}
      <main className="grid grid-cols-12 gap-6 px-6 py-6">
        {/* Left / Center section */}
        <section className="col-span-8 space-y-6">
          {/* Jobs */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">New Job Postings</h2>
              <button className="text-blue-600 font-semibold hover:underline">View More</button>
            </div>

            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 hover:shadow transition cursor-pointer bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                  <p className="text-sm text-gray-600">Budget: {job.budget} | Deadline: {job.deadline}</p>
                  <div className="flex gap-2 mt-2">
                    {job.skills.map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="col-span-4 space-y-6">
          {/* Blogs */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Tech Trends</h2>
            <ul className="space-y-3">
              {blogs.map((blog) => (
                <li key={blog.id}>
                  <a href={blog.link} className="text-blue-600 hover:underline">
                    {blog.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Upload Project</button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Update Availability</button>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Check Wallet</button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
