'use client';

import LogoutButton from '@/component/LogOutButton';
import React from 'react';

export default function BusinessDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Business Dashboard</h1>
          <div className="text-gray-600">
            <p><strong>Welcome to your business dashboard!</strong></p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Business Dashboard</h2>
          <p className="text-gray-600 mb-4">
            Here you can post opportunities, manage applications, and connect with talented students.
          </p>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
