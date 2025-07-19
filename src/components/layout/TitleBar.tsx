import React, { useState, useEffect } from 'react';

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial state
    if (window.electronAPI?.windowControls) {
      window.electronAPI.windowControls.isMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.windowControls.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.windowControls.maximize().then(() => {
      // Update state after maximize/restore
      window.electronAPI?.windowControls.isMaximized().then(setIsMaximized);
    });
  };

  const handleClose = () => {
    window.electronAPI?.windowControls.close();
  };

  return (
    <div className="h-8 bg-dark-900/95 border-b border-primary-500/20 flex items-center justify-between px-4 select-none backdrop-blur-sm drag-region">
      {/* Left side - App info */}
      <div className="flex items-center space-x-3 pointer-events-none">
        <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500"></div>
        <span className="text-xs font-medium text-slate-300">Arena Assist</span>
      </div>

      {/* Right side - Window controls */}
      <div className="flex items-center space-x-1 pointer-events-auto">
        <button
          onClick={handleMinimize}
          className="w-8 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors duration-150"
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>

        <button
          onClick={handleMaximize}
          className="w-8 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors duration-150"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="0.5">
              <rect x="2" y="2" width="6" height="6" />
              <rect x="0" y="0" width="6" height="6" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="0.5">
              <rect x="0" y="0" width="10" height="10" />
            </svg>
          )}
        </button>

        <button
          onClick={handleClose}
          className="w-8 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/80 rounded transition-colors duration-150"
          title="Close to tray"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="0.5">
            <line x1="0" y1="0" x2="10" y2="10" />
            <line x1="10" y1="0" x2="0" y2="10" />
          </svg>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .drag-region {
            -webkit-app-region: drag;
          }
          .pointer-events-auto {
            -webkit-app-region: no-drag;
          }
        `
      }} />
    </div>
  );
} 