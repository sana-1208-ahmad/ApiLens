import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Network,
  ArrowLeftRight,
  ShieldCheck,
  GitFork,
  Sparkles,
  BarChart3,
  BookOpen,
  Settings,
  ChevronsUpDown,
  X,
  Layers,
} from 'lucide-react';

export const NAV_ITEMS = [
  {
    name: 'Overview',
    path: '/',
    exact: true,
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'HAR Upload',
    path: '/har-upload',
    icon: UploadCloud,
    badge: 'Ready',
  },
  {
    name: 'API Explorer',
    path: '/api-explorer',
    icon: Network,
    badge: null,
  },
  {
    name: 'Request Inspector',
    path: '/request-inspector',
    icon: ArrowLeftRight,
    badge: null,
  },
  {
    name: 'Security Inspector',
    path: '/security-inspector',
    icon: ShieldCheck,
    badge: null,
  },
  {
    name: 'API Flow Map',
    path: '/api-flow-map',
    icon: GitFork,
    badge: null,
  },
  {
    name: 'AI Analyst',
    path: '/ai-analyst',
    icon: Sparkles,
    badge: 'BYOK',
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: BarChart3,
    badge: null,
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const isItemActive = (item) => {
    if (item.exact) {
      return location.pathname === '/' || location.pathname === '/overview';
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-navy-text/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-[#DCE5FF] z-50 flex flex-col justify-between shadow-card transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo / Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#F2F4FD]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-base shadow-sm">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy-text text-base tracking-tight font-sans">
                    API Lens
                  </span>
                  <span className="font-mono text-[10px] bg-surface-container text-secondary px-1.5 py-0.5 rounded font-semibold">
                    v1.4.0
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-secondary hover:bg-surface-container hover:text-navy-text"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Section Label */}
          <div className="px-5 pt-5 pb-2">
            <span className="font-mono text-[11px] text-outline uppercase tracking-wider font-semibold">
              Navigation
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-3">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024 && onClose) onClose();
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-container text-white font-semibold shadow-sm'
                      : 'text-secondary hover:bg-surface-container-low hover:text-navy-text'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-secondary'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-semibold ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-lavender text-primary-container'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Lower Utility & Workspace Section */}
        <div className="p-3 border-t border-[#F2F4FD] flex flex-col gap-2 bg-white">
          <div className="flex flex-col gap-0.5">
            <a
              href="#docs"
              onClick={(e) => {
                e.preventDefault();
                alert('API Lens Documentation: Complete guides on HAR capture, OWASP API security checks, and schema synthesis.');
              }}
              className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm text-secondary hover:bg-surface-container-low hover:text-navy-text transition-colors font-medium"
            >
              <BookOpen className="w-4 h-4 text-secondary" />
              <span>Documentation</span>
            </a>

            <a
              href="#settings"
              onClick={(e) => {
                e.preventDefault();
                alert('Workspace Settings: Local data retention, PII redaction rules, and API token management.');
              }}
              className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm text-secondary hover:bg-surface-container-low hover:text-navy-text transition-colors font-medium"
            >
              <Settings className="w-4 h-4 text-secondary" />
              <span>Settings</span>
            </a>
          </div>

          {/* Workspace Pill */}
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-[#DCE5FF]/40 flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer group">
            <div className="flex flex-col overflow-hidden">
              <span className="font-mono text-[10px] text-outline leading-tight uppercase tracking-wider">
                Workspace
              </span>
              <span className="text-sm font-semibold text-navy-text truncate">
                Production API
              </span>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-outline group-hover:text-navy-text shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
