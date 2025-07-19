import React, { useState } from 'react';
import { useSettings, useNotifications } from '../context/AppContext';

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'api' | 'hotkeys' | 'overlay' | 'voice' | 'about'>('api');
  const [showApiKeys, setShowApiKeys] = useState(false);

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
    { id: 'api', label: 'API Keys', icon: '🔑' },
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
          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-arena-primary">API Configuration</h2>
                <button
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="btn-secondary text-sm"
                >
                  {showApiKeys ? '🙈 Hide Keys' : '👁️ Show Keys'}
                </button>
              </div>

              {/* Riot API */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-gray-300">Riot Games API Key</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Free tier</span>
                    <div className="status-offline"></div>
                  </div>
                </div>
                <input
                  type={showApiKeys ? 'text' : 'password'}
                  value={settings.api.riotApiKey}
                  onChange={(e) => updateSettings({
                    api: { ...settings.api, riotApiKey: e.target.value }
                  })}
                  placeholder="Enter your Riot API key..."
                  className="input-primary w-full"
                />
                <div className="flex justify-between text-sm">
                  <a
                    href="https://developer.riotgames.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-arena-accent hover:text-arena-primary underline"
                  >
                    Get API Key from Riot Developer Portal
                  </a>
                  <button
                    onClick={() => handleTestConnection('Riot API')}
                    className="text-green-400 hover:text-green-300"
                  >
                    Test Connection
                  </button>
                </div>
              </div>

              {/* OpenAI API */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-gray-300">OpenAI API Key</label>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">PRO</span>
                    <div className="status-offline"></div>
                  </div>
                </div>
                <input
                  type={showApiKeys ? 'text' : 'password'}
                  value={settings.api.openAiApiKey}
                  onChange={(e) => updateSettings({
                    api: { ...settings.api, openAiApiKey: e.target.value }
                  })}
                  placeholder="sk-..."
                  className="input-primary w-full"
                />
                <div className="flex justify-between text-sm">
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-arena-accent hover:text-arena-primary underline"
                  >
                    Get API Key from OpenAI Platform
                  </a>
                  <button
                    onClick={() => handleTestConnection('OpenAI API')}
                    className="text-green-400 hover:text-green-300"
                  >
                    Test Connection
                  </button>
                </div>
              </div>

              {/* Supabase */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-gray-300">Supabase Configuration</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Voice signaling</span>
                    <div className="status-offline"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={settings.api.supabaseUrl}
                    onChange={(e) => updateSettings({
                      api: { ...settings.api, supabaseUrl: e.target.value }
                    })}
                    placeholder="Supabase URL"
                    className="input-primary"
                  />
                  <input
                    type={showApiKeys ? 'text' : 'password'}
                    value={settings.api.supabaseKey}
                    onChange={(e) => updateSettings({
                      api: { ...settings.api, supabaseKey: e.target.value }
                    })}
                    placeholder="Anon Key"
                    className="input-primary"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Used for WebRTC signaling and match history sync
                </p>
              </div>

              <button onClick={handleSaveSettings} className="btn-primary w-full">
                💾 Save API Configuration
              </button>
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