'use client';

import LogoutButton from '@/component/LogOutButton';
import React from 'react';
import { PlusCircle, Users, Briefcase, CreditCard } from 'lucide-react';

export default function BusinessDashboard() {
  // Sample data for demo (replace with API later)
  const stats = [
    { title: 'Open Jobs', value: 5 },
    { title: 'Proposals Received', value: 18 },
    { title: 'Active Contracts', value: 4 },
    { title: 'Payments in Escrow', value: '₹72,000' },
  ];

  const recentProposals = [
    { student: 'Aarav Patel', job: 'UI/UX Design Internship', status: 'Pending' },
    { student: 'Meera Shah', job: 'Web App Development', status: 'Accepted' },
    { student: 'Kabir Iyer', job: 'Marketing Campaign', status: 'Rejected' },
    { student: 'Ishita Verma', job: 'Data Analysis Project', status: 'Pending' },
  ];

  const activeContracts = [
    { student: 'Riya Kapoor', job: 'Logo Design', due: 'Sep 30, 2025', amount: '₹8,000' },
    { student: 'Aditya Menon', job: 'E-commerce Website', due: 'Oct 15, 2025', amount: '₹25,000' },
  ];

  const payments = [
    { contract: 'Mobile App Prototype', amount: '₹15,000', status: 'Released' },
    { contract: 'Content Marketing Campaign', amount: '₹12,000', status: 'In Escrow' },
  ];

  return (
    <div className="min-h-screen bg-[#3E3E55]/10 p-10">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header Section */}
        <div className="bg-[#3E3E55]/90 rounded-2xl shadow-lg p-10">
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Business Dashboard
          </h1>
          <p className="text-white/80 text-lg">
            Welcome back! Manage your job openings, proposals, contracts, and payments in one place.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-[#3E3E55]/80 rounded-2xl shadow-md p-8 flex flex-col items-center justify-center"
            >
              <h2 className="text-3xl font-bold text-white">{stat.value}</h2>
              <p className="text-white/70 text-lg">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-[#3E3E55]/80 rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <button className="flex flex-col items-center justify-center bg-[#3E3E55]/70 rounded-xl p-6 hover:bg-[#3E3E55]/90 transition">
              <PlusCircle className="text-white mb-2" size={32} />
              <span className="text-white">Post a Job</span>
            </button>
            <button className="flex flex-col items-center justify-center bg-[#3E3E55]/70 rounded-xl p-6 hover:bg-[#3E3E55]/90 transition">
              <Users className="text-white mb-2" size={32} />
              <span className="text-white">Browse Students</span>
            </button>
            <button className="flex flex-col items-center justify-center bg-[#3E3E55]/70 rounded-xl p-6 hover:bg-[#3E3E55]/90 transition">
              <Briefcase className="text-white mb-2" size={32} />
              <span className="text-white">Manage Openings</span>
            </button>
            <button className="flex flex-col items-center justify-center bg-[#3E3E55]/70 rounded-xl p-6 hover:bg-[#3E3E55]/90 transition">
              <CreditCard className="text-white mb-2" size={32} />
              <span className="text-white">Payments</span>
            </button>
          </div>
        </div>

        {/* Recent Proposals */}
        <div className="bg-[#3E3E55]/80 rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Recent Proposals
          </h2>
          <div className="space-y-4">
            {recentProposals.map((proposal, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-[#3E3E55]/60 rounded-xl p-5"
              >
                <div>
                  <p className="text-white font-medium text-lg">{proposal.student}</p>
                  <p className="text-white/70 text-sm">{proposal.job}</p>
                </div>
                <span
                  className={`px-4 py-2 text-sm rounded-lg font-medium ${
                    proposal.status === 'Accepted'
                      ? 'bg-green-500/30 text-green-200'
                      : proposal.status === 'Rejected'
                      ? 'bg-red-500/30 text-red-200'
                      : 'bg-yellow-500/30 text-yellow-200'
                  }`}
                >
                  {proposal.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Contracts */}
        <div className="bg-[#3E3E55]/80 rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Active Contracts
          </h2>
          <div className="space-y-4">
            {activeContracts.map((contract, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-[#3E3E55]/60 rounded-xl p-5"
              >
                <div>
                  <p className="text-white font-medium text-lg">{contract.student}</p>
                  <p className="text-white/70 text-sm">{contract.job}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-sm">Due: {contract.due}</p>
                  <p className="text-white font-medium">{contract.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payments */}
        <div className="bg-[#3E3E55]/80 rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Payments
          </h2>
          <div className="space-y-4">
            {payments.map((payment, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-[#3E3E55]/60 rounded-xl p-5"
              >
                <p className="text-white font-medium">{payment.contract}</p>
                <div className="text-right">
                  <p className="text-white">{payment.amount}</p>
                  <p
                    className={`text-sm ${
                      payment.status === 'Released'
                        ? 'text-green-300'
                        : 'text-yellow-300'
                    }`}
                  >
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="flex justify-end">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
