import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const REGIONS = [
  { code: 'euw1', name: 'EUW', continent: 'europe' },
  { code: 'na1', name: 'NA', continent: 'americas' },
  { code: 'kr', name: 'KR', continent: 'asia' },
  { code: 'eun1', name: 'EUNE', continent: 'europe' },
  { code: 'jp1', name: 'JP', continent: 'asia' },
  { code: 'br1', name: 'BR', continent: 'americas' },
  { code: 'la1', name: 'LAN', continent: 'americas' },
  { code: 'la2', name: 'LAS', continent: 'americas' },
  { code: 'oc1', name: 'OCE', continent: 'sea' },
  { code: 'tr1', name: 'TR', continent: 'europe' },
  { code: 'ru', name: 'RU', continent: 'europe' },
  { code: 'ph2', name: 'PH', continent: 'sea' },
  { code: 'sg2', name: 'SG', continent: 'sea' },
  { code: 'th2', name: 'TH', continent: 'sea' },
  { code: 'tw2', name: 'TW', continent: 'sea' },
  { code: 'vn2', name: 'VN', continent: 'sea' },
];

export default function Home() {
  const { state } = useApp();
  const [searchForm, setSearchForm] = useState({
    region: 'euw1',
    summonerName: '',
    tagline: ''
  });
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchForm.summonerName.trim() || !searchForm.tagline.trim()) {
      alert('Please enter both summoner name and tagline');
      return;
    }

    setIsSearching(true);
    try {
      // TODO: Implement player profile search using Riot API
      // This would make a request to account-v1 API with gameName#tagLine
      // Then redirect to a player profile page
      
      console.log('Searching for player:', {
        gameName: searchForm.summonerName,
        tagLine: searchForm.tagline,
        region: searchForm.region
      });
      
      // For now, show a placeholder message
      alert(`Searching for ${searchForm.summonerName}#${searchForm.tagline} on ${REGIONS.find(r => r.code === searchForm.region)?.name}...`);
      
    } catch (error) {
      console.error('Player search failed:', error);
      alert('Failed to find player. Please check the spelling and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-6 min-h-full">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-2xl">
              <span className="text-4xl font-bold text-white">⚡</span>
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                Arena Assist
              </h1>
              <p className="text-slate-400 text-xl">Your Arena Mode Companion</p>
            </div>
          </div>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Master League of Legends Arena with champion insights, optimal builds, and player lookup tools.
          </p>
        </div>

        {/* Player Search */}
        <div className="card">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-primary-400 mb-2">Player Lookup</h2>
            <p className="text-slate-400">Search for any player's Arena stats and match history</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Region Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Region
                </label>
                <select
                  value={searchForm.region}
                  onChange={(e) => setSearchForm({ ...searchForm, region: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                >
                  {REGIONS.map((region) => (
                    <option key={region.code} value={region.code}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Summoner Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Summoner Name
                </label>
                <input
                  type="text"
                  value={searchForm.summonerName}
                  onChange={(e) => setSearchForm({ ...searchForm, summonerName: e.target.value })}
                  placeholder="I Skada"
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tagline
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-mono">#</span>
                  <input
                    type="text"
                    value={searchForm.tagline}
                    onChange={(e) => setSearchForm({ ...searchForm, tagline: e.target.value })}
                    placeholder="2606"
                    className="w-full pl-8 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={isSearching}
                onClick={(e) => {
                  console.log('Search button clicked!', e);
                }}
                className="btn-primary px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  position: 'relative', 
                  zIndex: 1000, 
                  pointerEvents: 'auto',
                  backgroundColor: '#a855f7',
                  border: '2px solid #9333ea',
                  cursor: isSearching ? 'not-allowed' : 'pointer'
                }}
              >
                {isSearching ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>🔍</span>
                    <span>Search Player</span>
                  </div>
                )}
              </button>
            </div>

            <div className="text-center text-slate-500 text-sm">
              Example: <span className="text-primary-400 font-mono">I Skada#2606</span> on <span className="text-accent-400">EUW</span>
            </div>
          </form>
        </div>

        {/* Quick Navigation */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card hover:border-primary-500/50 transition-all duration-200 cursor-pointer"
               onClick={() => {
                 const event = new CustomEvent('navigate', { detail: '/champions' });
                 window.dispatchEvent(event);
               }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="text-lg font-semibold text-primary-400 mb-2">Champions</h3>
              <p className="text-slate-400 text-sm">Tier lists, builds & synergies</p>
            </div>
          </div>

          <div className="card hover:border-primary-500/50 transition-all duration-200 cursor-pointer"
               onClick={() => {
                 const event = new CustomEvent('navigate', { detail: '/augments' });
                 window.dispatchEvent(event);
               }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-primary-400 mb-2">Augments</h3>
              <p className="text-slate-400 text-sm">Optimal picks & strategies</p>
            </div>
          </div>

          <div className="card hover:border-primary-500/50 transition-all duration-200 cursor-pointer"
               onClick={() => {
                 const event = new CustomEvent('navigate', { detail: '/overlay' });
                 window.dispatchEvent(event);
               }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">👁️</span>
              </div>
              <h3 className="text-lg font-semibold text-primary-400 mb-2">Overlay</h3>
              <p className="text-slate-400 text-sm">In-game assistance</p>
            </div>
          </div>

          <div className="card hover:border-primary-500/50 transition-all duration-200 cursor-pointer"
               onClick={() => {
                 const event = new CustomEvent('navigate', { detail: '/settings' });
                 window.dispatchEvent(event);
               }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-primary-400 mb-2">Settings</h3>
              <p className="text-slate-400 text-sm">Configure your experience</p>
            </div>
          </div>
        </div>

        {/* Game Status */}
        {state.game.isInGame && (
          <div className="card bg-green-500/10 border-green-500/30">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-400">Arena Game Active</h3>
                <p className="text-slate-300">
                  Playing as <span className="text-primary-400 font-semibold">{state.game.currentChampion || 'Unknown Champion'}</span>
                  {state.game.summonerName && (
                    <span className="text-slate-400"> • {state.game.summonerName}</span>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <button 
                  className="btn-secondary px-4 py-2 text-sm"
                  onClick={() => window.electronAPI?.send('trigger-screen-capture')}
                >
                  📷 Detect Augments
                </button>
                <button 
                  className="btn-secondary px-4 py-2 text-sm"
                  onClick={() => window.electronAPI?.send('toggle-overlay')}
                >
                  👁️ Toggle Overlay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-primary-400 mb-4">Quick Actions</h3>
          
          <div className="grid md:grid-cols-2 gap-3">
            <button 
              className="btn-secondary py-3 flex items-center justify-center space-x-2"
              onClick={() => window.electronAPI?.send('trigger-screen-capture')}
            >
              <span>📷</span>
              <span>Detect Augments</span>
            </button>
            
            <button 
              className="btn-secondary py-3 flex items-center justify-center space-x-2"
              onClick={() => window.electronAPI?.send('toggle-overlay')}
            >
              <span>👁️</span>
              <span>Toggle Overlay</span>
            </button>
          </div>
        </div>

        {/* Hotkeys */}
        <div className="card">
          <h3 className="text-lg font-semibold text-primary-400 mb-4">Hotkeys</h3>
          
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <kbd className="px-3 py-2 bg-dark-800 border border-dark-600 rounded font-mono">F9</kbd>
              <span className="text-slate-400">Toggle Overlay</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <kbd className="px-3 py-2 bg-dark-800 border border-dark-600 rounded font-mono">F10</kbd>
              <span className="text-slate-400">Detect Augments</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <kbd className="px-3 py-2 bg-dark-800 border border-dark-600 rounded font-mono">F11</kbd>
              <span className="text-slate-400">Show/Hide App</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
} 