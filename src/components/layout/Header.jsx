import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  ChevronDown,
  Sparkles,
  FileCheck,
  Database,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useHar } from '../../context/HarContext';

const ROUTE_NAMES = {
  '/': 'API Overview',
  '/overview': 'API Overview',
  '/har-upload': 'Upload HAR',
  '/api-explorer': 'API Explorer',
  '/request-inspector': 'Request Inspector',
  '/security-inspector': 'Security Inspector',
  '/api-flow-map': 'API Flow Map',
  '/ai-analyst': 'AI Analyst',
  '/reports': 'Reports',
};

export default function Header({ onOpenSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isLoaded,
    fileName,
    entries,
    saveStatus,
    lastSavedAt,
    storageError,
    requestClearAnalysis,
  } = useHar();

  const [searchVal, setSearchVal] = useState('');
  const [showSearchNotice, setShowSearchNotice] = useState(false);
  const searchInputRef = useRef(null);

  const currentPage = ROUTE_NAMES[location.pathname] || 'Dashboard';

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (isLoaded && searchVal.trim()) {
      navigate('/api-explorer', { state: { searchQuery: searchVal.trim() } });
    } else {
      setShowSearchNotice(true);
      setTimeout(() => setShowSearchNotice(false), 3000);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white/90 backdrop-blur-xl border-b border-[#DCE5FF] shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-40 flex items-center justify-between px-4 sm:px-6">
      {/* Left Area: Mobile Menu + Breadcrumbs + Search */}
      <div className="flex items-center gap-3 sm:gap-6 flex-1 max-w-2xl">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-secondary hover:bg-surface-container hover:text-navy-text"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-secondary whitespace-nowrap">
          <span>Workspaces</span>
          <span className="text-outline">/</span>
          <span>Default</span>
          <span className="text-outline">/</span>
          <span className="text-navy-text font-semibold">{currentPage}</span>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 hidden md:block">
          <form onSubmit={handleSearchSubmit}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search endpoints, HAR logs, findings (⌘K)..."
              className="w-full pl-9 pr-14 py-1.5 h-9 bg-surface rounded-lg text-sm text-navy-text placeholder:text-outline border border-[#DCE5FF]/60 focus:outline-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-outline bg-surface-container-low px-1.5 py-0.5 rounded border border-[#DCE5FF]/40 pointer-events-none">
              ⌘K
            </kbd>
          </form>

          {showSearchNotice && (
            <div className="absolute top-11 left-0 right-0 bg-white border border-[#DCE5FF] p-2.5 rounded-lg shadow-lg text-xs text-secondary z-50 flex items-center justify-between animate-fadeIn">
              <span>
                {isLoaded
                  ? `Searching ${entries.length} requests in active capture...`
                  : 'Awaiting HAR traffic data to perform index search.'}
              </span>
              <span className="text-primary-container font-medium">
                {isLoaded ? `${entries.length} indexed records` : '0 indexed records'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Workspace Status + Persistence Indicator + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 ml-3">
        {/* Persistence Status Indicator: Explicitly "Saved locally" or "Not saved" */}
        <div className="flex items-center gap-2">
          {isLoaded && saveStatus === 'saved' ? (
            <span
              title={`Analysis persisted in local IndexedDB at ${lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'recently'}. Survives browser refreshes.`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs font-semibold"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved locally</span>
            </span>
          ) : isLoaded && saveStatus === 'saving' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-mono text-xs font-semibold">
              <Loader2 className="w-3.5 h-3.5 text-primary-container animate-spin" />
              <span>Saving...</span>
            </span>
          ) : isLoaded && saveStatus === 'error' ? (
            <span
              title={storageError || 'Failed to save analysis to IndexedDB'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs font-semibold"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Storage Warning</span>
            </span>
          ) : (
            <span
              title="No persistent analysis stored in local IndexedDB"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-mono text-xs font-semibold"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Not saved</span>
            </span>
          )}

          {/* Clear Analysis Action Button (triggers confirmation dialog) */}
          {isLoaded && (
            <button
              onClick={requestClearAnalysis}
              title="Clear Analysis Session (with confirmation)"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-secondary hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Workspace Data Status Pill */}
        <div
          className={`hidden xl:flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs font-medium ${
            isLoaded
              ? 'bg-surface-container text-navy-text border border-[#DCE5FF]'
              : 'bg-secondary-fixed text-on-secondary-fixed'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLoaded ? 'bg-emerald-500' : 'bg-primary-container animate-pulse'
            }`}
          ></span>
          <span>
            {isLoaded ? `${fileName} • ${entries.length} Requests` : 'Workspace Empty • Ready for HAR'}
          </span>
        </div>

        {/* Icon Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              alert(
                isLoaded
                  ? `Capture Details:\n- File: ${fileName}\n- Requests: ${entries.length}\n- Engine: HAR 1.2 Local Sandbox`
                  : 'Notifications: No pending alerts. System is on telemetry standby.'
              )
            }
            className="relative p-2 rounded-lg text-secondary hover:bg-surface-container-low hover:text-navy-text transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span
              className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                isLoaded ? 'bg-emerald-500' : 'bg-outline'
              }`}
            ></span>
          </button>

          <button
            onClick={() =>
              alert(
                'API Lens Help:\n1. Upload .har files from Chrome, Firefox, Postman, or Charles Proxy.\n2. Telemetry is parsed client-side in memory.\n3. Local persistence: Analysis is saved locally in IndexedDB; credentials and authorization tokens are scrubbed before storage.'
              )
            }
            className="p-2 rounded-lg text-secondary hover:bg-surface-container-low hover:text-navy-text transition-colors"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile Cluster */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#DCE5FF]/60 cursor-pointer select-none">
          <div className="w-8 h-8 rounded-full bg-primary-container/10 border border-primary-container/20 text-primary-container flex items-center justify-center font-semibold text-xs">
            AC
          </div>
          <div className="hidden md:flex flex-col text-left leading-none">
            <span className="text-xs font-semibold text-navy-text">Alex Chen</span>
            <span className="text-[10px] text-secondary">SecOps Engineer</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-outline hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
