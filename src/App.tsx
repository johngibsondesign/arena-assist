import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TitleBar from './components/layout/TitleBar';
import Home from './pages/Home';
import Champions from './pages/Champions';
import Voice from './pages/Voice';
import Augments from './pages/Augments';
import Settings from './pages/Settings';
import Overlay from './pages/Overlay';
import { AppProvider } from './context/AppContext';
import { HotkeyProvider } from './context/HotkeyContext';

function App() {
  const location = useLocation();
  const [isOverlay, setIsOverlay] = useState(false);

  useEffect(() => {
    // Check if we're in overlay mode
    const isOverlayRoute = location.pathname === '/overlay' || location.hash === '#/overlay';
    setIsOverlay(isOverlayRoute);
    
    // Set body class for overlay styling
    if (isOverlayRoute) {
      document.body.classList.add('overlay-mode');
    } else {
      document.body.classList.remove('overlay-mode');
    }
  }, [location]);

  if (isOverlay) {
    return (
      <AppProvider>
        <div className="overlay-container">
          <Routes>
            <Route path="/overlay" element={<Overlay />} />
          </Routes>
        </div>
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <HotkeyProvider>
        <div className="min-h-screen bg-dark-900 text-slate-200 flex flex-col">
          {/* Custom Title Bar */}
          <TitleBar />
          
          <div className="flex flex-1 min-h-0">
            {/* Sidebar Navigation */}
            <Sidebar />
            
            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0">
            {/* Header */}
              <header className="h-16 bg-dark-800/50 border-b border-primary-500/20 flex items-center px-6 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center space-x-4">
                <div className="rounded-icon w-10 h-10">
                  <span className="text-white font-bold text-sm">AA</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gradient">Arena Assist</h1>
                  <p className="text-xs text-slate-400">League of Legends Arena Helper</p>
                </div>
              </div>
              
              {/* Status indicators */}
              <div className="ml-auto flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="status-offline"></div>
                  <span className="text-sm text-gray-400">LCU: Disconnected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="status-offline"></div>
                  <span className="text-sm text-gray-400">Voice: Disconnected</span>
                </div>
              </div>
            </header>
            
            {/* Page Content */}
              <div className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/champions" element={<Champions />} />
                <Route path="/voice" element={<Voice />} />
                <Route path="/augments" element={<Augments />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
          </main>
          </div>
        </div>
      </HotkeyProvider>
    </AppProvider>
  );
}

export default App; 