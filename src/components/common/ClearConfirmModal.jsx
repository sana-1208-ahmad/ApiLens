import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import Button from './Button';
import { useHar } from '../../context/HarContext';

export default function ClearConfirmModal() {
  const {
    showClearModal,
    cancelClearAnalysis,
    confirmClearAnalysis,
    fileName,
    entries,
  } = useHar();

  if (!showClearModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-text/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-[#DCE5FF] shadow-2xl p-6 overflow-hidden">
        {/* Close icon button */}
        <button
          onClick={cancelClearAnalysis}
          className="absolute top-4 right-4 p-1 rounded-lg text-secondary hover:text-navy-text hover:bg-surface-container transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Warning Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-bold text-navy-text font-sans mb-1.5">
            Clear Analysis Session?
          </h3>

          <p className="text-xs text-secondary leading-relaxed mb-4 max-w-sm">
            This will permanently remove the current analysis session and delete all stored endpoint metrics and traffic logs from your browser's local <strong>IndexedDB</strong>.
          </p>

          {fileName && (
            <div className="w-full p-3 rounded-xl bg-surface-container-low border border-[#DCE5FF] mb-5 text-left flex items-center justify-between text-xs font-mono">
              <span className="text-secondary truncate max-w-[200px]">{fileName}</span>
              <span className="text-navy-text font-semibold">{entries.length} requests</span>
            </div>
          )}

          <div className="flex items-center gap-3 w-full">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={cancelClearAnalysis}
            >
              Cancel
            </Button>

            <button
              onClick={confirmClearAnalysis}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Analysis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
