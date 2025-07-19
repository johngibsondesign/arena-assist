import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  description: string;
}

const navigationItems: NavItem[] = [
  {
    path: '/',
    label: 'Home',
    icon: '🏠',
    description: 'Dashboard & Match Summary',
  },
  {
    path: '/champions',
    label: 'Champions',
    icon: '🏆',
    description: 'Champion Tier List & Stats',
  },
  {
    path: '/voice',
    label: 'Voice',
    icon: '🎤',
    description: 'Voice Chat & Communication',
  },
  {
    path: '/augments',
    label: 'Augments',
    icon: '⚡',
    description: 'Augment Analysis & Tips',
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: '⚙️',
    description: 'Configuration & API Keys',
  },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const { sidebarCollapsed } = state.ui;

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  return (
    <div
      className={`bg-dark-800/80 border-r border-primary-500/20 transition-all duration-300 flex flex-col backdrop-blur-sm ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-primary-500/20">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="rounded-icon w-8 h-8">
              <span className="text-white font-bold text-xs">AA</span>
            </div>
            <span className="font-bold text-gradient">Arena Assist</span>
          </div>
        )}
        
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-400 hover:text-primary-400 transition-colors rounded-lg hover:bg-primary-500/10"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 pt-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-left transition-all duration-200 border-r-4 rounded-l-lg ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/20 to-transparent border-primary-500 text-primary-400 shadow-lg shadow-primary-500/10'
                      : 'border-transparent text-slate-400 hover:text-primary-400 hover:bg-primary-500/5 hover:border-primary-500/30'
                  }`
                }
              >
                <span className="text-xl mr-3 flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {item.description}
                    </div>
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Status Panel */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-primary-500/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Game Status</span>
              <div className="flex items-center space-x-2">
                <div className={state.game.isInGame ? 'status-in-game' : 'status-offline'}></div>
                <span className="text-xs font-medium">
                  {state.game.isInGame ? 'In Game' : 'Not Playing'}
                </span>
              </div>
            </div>
            
            {state.game.champion && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Champion</span>
                <span className="text-primary-400 font-medium">
                  {state.game.champion}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-dark-700">
              <div className="text-xs text-slate-500">
                Recent: {state.matches.length} matches
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed status indicator */}
      {sidebarCollapsed && (
        <div className="p-3 border-t border-primary-500/20">
          <div className="flex flex-col items-center space-y-3">
            <div className={state.game.isInGame ? 'status-in-game' : 'status-offline'}></div>
            <div className="text-xs text-slate-500 rotate-90 whitespace-nowrap origin-center font-medium">
              {state.matches.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 