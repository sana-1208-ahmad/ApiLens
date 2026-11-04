import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ClearConfirmModal from '../common/ClearConfirmModal';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-app-bg text-navy-text">
      {/* Confirmation Dialog for Clearing Analysis Session */}
      <ClearConfirmModal />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Header */}
      <Header
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {/* Main Content Area */}
      <main className="lg:pl-64 pt-16 min-h-screen flex flex-col transition-all duration-300">
        <div className="flex-1 w-full">
          <Outlet />
        </div>

        {/* Global Footer info */}
        <footer className="mt-auto px-6 py-4 border-t border-[#DCE5FF]/60 bg-white/50 text-xs text-secondary flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>API Lens v1.4.0 • Client-side Local Persistence Engine</span>
          </div>
          <div className="text-outline text-[11px]">
            Understand APIs. Discover Hidden Insights. Identify Potential Risks.
          </div>
        </footer>
      </main>
    </div>
  );
}
