import React, { useState } from 'react';
import { useSettings, useNotifications } from '../context/AppContext';

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'general' | 'hotkeys' | 'overlay' | 'voice' | 'about'>('general');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [autoLaunchEnabled, setAutoLaunchEnabled] = useState(false);

  // Check auto-launch status on component mount
  React.useEffect(() => {
    const checkAutoLaunch = async () => {
      try {
        const enabled = await window.electronAPI?.getAutoLaunchEnabled();
        setAutoLaunchEnabled(enabled || false);
      } catch (error) {
        console.error('Failed to check auto-launch status:', error);
      }
    };
    
    if (window.electronAPI) {
      checkAutoLaunch();
    }
  }, []);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      addNotification({
        type: 'info',
        message: 'Checking for updates...',
      });

      const result = await window.electronAPI?.checkForUpdates();
      console.log('Update check response:', result);
      
      if (result?.error) {
        addNotification({
          type: 'error',
          message: `Update check failed: ${result.error}`,
        });
      } else if (result?.isDev) {
        addNotification({
          type: 'info',
          message: result.message || 'Update checking disabled in development mode',
        });
      } else if (result && result.updateInfo) {
        addNotification({
          type: 'success',
          message: `Update available: v${result.updateInfo.version}`,
        });
      } else {
        addNotification({
          type: 'success',
          message: 'You are running the latest version!',
        });
      }
    } catch (error) {
      console.error('Update check failed:', error);
      addNotification({
        type: 'error',
        message: 'Failed to check for updates. Please try again later.',
      });
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleToggleAutoLaunch = async () => {
    try {
      const newEnabled = !autoLaunchEnabled;
      await window.electronAPI?.setAutoLaunchEnabled(newEnabled);
      setAutoLaunchEnabled(newEnabled);
      
      addNotification({
        type: 'success',
        message: `Start with Windows ${newEnabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Failed to toggle auto-launch:', error);
      addNotification({
        type: 'error',
        message: 'Failed to update startup settings',
      });
    }
  };

  const handleSaveSettings = () => {
    addNotification({
      type: 'success',
      message: 'Settings saved successfully!',
    });
  };

  const handleTestConnection = async (service: string) => {
    addNotification({
      type: 'info',
      message: `Testing ${service} connection...`,
    });

    // Simulate API test
    setTimeout(() => {
      addNotification({
        type: 'success',
        message: `${service} connection successful!`,
      });
    }, 1500);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'hotkeys', label: 'Hotkeys', icon: '⌨️' },
    { id: 'overlay', label: 'Overlay', icon: '👁️' },
    { id: 'voice', label: 'Voice', icon: '🎤' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ];

  return (
    <div className="p-6 min-h-full">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-glow mb-2">Settings</h1>
          <p className="text-gray-400">Configure Arena Assist for optimal performance</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded transition-all ${
                activeTab === tab.id
                  ? 'bg-arena-primary text-arena-secondary font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-arena-primary">General Settings</h2>
              
              {/* Auto-Launch Setting */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">Start with Windows</h3>
                    <p className="text-sm text-gray-400">Automatically start Arena Assist when Windows starts</p>
                  </div>
                  <button
                    onClick={handleToggleAutoLaunch}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoLaunchEnabled ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoLaunchEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Update Check Button */}
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">App Updates</h3>
                    <p className="text-sm text-gray-400">Check for the latest version of Arena Assist</p>
                  </div>
                  <button
                    onClick={(e) => {
                      console.log('Update button clicked!', e);
                      handleCheckForUpdates();
                    }}
                    disabled={isCheckingUpdates}
                    className="btn-primary"
                    style={{ 
                      position: 'relative', 
                      zIndex: 1000, 
                      pointerEvents: 'auto',
                      backgroundColor: '#a855f7',
                      border: '2px solid #9333ea',
                      cursor: 'pointer'
                    }}
                  >
                    {isCheckingUpdates ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Checking...
                      </span>
                    ) : (
                      'Check for Updates'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hotkeys Tab */}
          {activeTab === 'hotkeys' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-arena-primary">Keyboard Shortcuts</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded">
                  <div>
                    <div className="font-medium">Augment Detection</div>
                    <div className="text-sm text-gray-400">Trigger OCR screen capture</div>
                  </div>
                  <kbd className="px-3 py-2 bg-arena-primary/20 text-arena-primary rounded font-mono">
                    {settings.hotkeys.augmentDetection}
                  </kbd>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded">
                  <div>
                    <div className="font-medium">Toggle Overlay</div>
                    <div className="text-sm text-gray-400">Show/hide augment overlay</div>
                  </div>
                  <kbd className="px-3 py-2 bg-arena-primary/20 text-arena-primary rounded font-mono">
                    {settings.hotkeys.overlayToggle}
                  </kbd>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded">
                  <div>
                    <div className="font-medium">Focus Main Window</div>
                    <div className="text-sm text-gray-400">Bring Arena Assist to front</div>
                  </div>
                  <kbd className="px-3 py-2 bg-arena-primary/20 text-arena-primary rounded font-mono">
                    {settings.hotkeys.mainWindow}
                  </kbd>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span>⚠️</span>
                  <span className="font-semibold text-yellow-400">Note</span>
                </div>
                <p className="text-sm text-gray-300">
                  Hotkey customization will be available in a future update. 
                  Current shortcuts are system-wide and work even when League is focused.
                </p>
              </div>
            </div>
          )}

          {/* Overlay Tab */}
          {activeTab === 'overlay' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-arena-primary">Overlay Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Enable Overlay</div>
                    <div className="text-sm text-gray-400">Show augment information on screen</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.overlay.enabled}
                      onChange={(e) => updateSettings({
                        overlay: { ...settings.overlay, enabled: e.target.checked }
                      })}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-arena-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Click Through</div>
                    <div className="text-sm text-gray-400">Allow clicks to pass through overlay</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.overlay.clickThrough}
                      onChange={(e) => updateSettings({
                        overlay: { ...settings.overlay, clickThrough: e.target.checked }
                      })}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-arena-primary"></div>
                  </label>
                </div>

                <div>
                  <div className="font-medium mb-2">Overlay Position</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">X Position</label>
                      <input
                        type="number"
                        value={settings.overlay.position.x}
                        onChange={(e) => updateSettings({
                          overlay: { 
                            ...settings.overlay, 
                            position: { 
                              ...settings.overlay.position, 
                              x: parseInt(e.target.value) || 0 
                            }
                          }
                        })}
                        className="input-primary w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Y Position</label>
                      <input
                        type="number"
                        value={settings.overlay.position.y}
                        onChange={(e) => updateSettings({
                          overlay: { 
                            ...settings.overlay, 
                            position: { 
                              ...settings.overlay.position, 
                              y: parseInt(e.target.value) || 0 
                            }
                          }
                        })}
                        className="input-primary w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={handleSaveSettings} className="btn-primary w-full">
                💾 Save Overlay Settings
              </button>
            </div>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-arena-primary">Voice Chat Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Enable Voice Chat</div>
                    <div className="text-sm text-gray-400">Allow WebRTC voice communication</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.voice.enabled}
                      onChange={(e) => updateSettings({
                        voice: { ...settings.voice, enabled: e.target.checked }
                      })}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-arena-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-Join Arena Games</div>
                    <div className="text-sm text-gray-400">Automatically connect when match starts</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.voice.autoJoin}
                      onChange={(e) => updateSettings({
                        voice: { ...settings.voice, autoJoin: e.target.checked }
                      })}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-arena-primary"></div>
                  </label>
                </div>
              </div>

              <button onClick={handleSaveSettings} className="btn-primary w-full">
                💾 Save Voice Settings
              </button>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-arena-primary">About Arena Assist</h2>
              
              <div className="space-y-6">
                <div className="text-center">
                  <div className="hexagon w-16 h-16 bg-arena-primary mx-auto mb-4 flex items-center justify-center">
                    <span className="text-arena-secondary font-bold text-2xl">AA</span>
                  </div>
                  <h3 className="text-2xl font-bold text-glow">Arena Assist</h3>
                  <p className="text-gray-400">Version 1.0.0</p>
                </div>

                <div className="bg-gray-800/30 p-4 rounded">
                  <h4 className="font-semibold mb-2">Features</h4>
                  <ul className="text-sm space-y-1 text-gray-300">
                    <li>• OCR-based augment detection with pick-rate analysis</li>
                    <li>• WebRTC voice chat for Arena teammates</li>
                    <li>• Champion synergy analysis and recommendations</li>
                    <li>• Match history tracking and statistics</li>
                    <li>• Always-on-top overlay for in-game assistance</li>
                  </ul>
                </div>

                <div className="bg-gray-800/30 p-4 rounded">
                  <h4 className="font-semibold mb-2">Technology Stack</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Frontend:</div>
                      <div>Electron + React + Tailwind</div>
                    </div>
                    <div>
                      <div className="text-gray-400">OCR:</div>
                      <div>Tesseract.js</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Voice:</div>
                      <div>WebRTC + Supabase</div>
                    </div>
                    <div>
                      <div className="text-gray-400">AI:</div>
                      <div>OpenAI GPT-4o</div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500">
                  <p>Made with ❤️ for the League of Legends community</p>
                  <p className="mt-2">
                    Not affiliated with Riot Games. League of Legends is a trademark of Riot Games, Inc.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 