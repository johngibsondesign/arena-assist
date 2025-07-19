import React, { useState, useEffect, useRef } from 'react';
import { useApp, useSettings } from '../context/AppContext';
import webrtcService from '../services/webrtcService';
import { playerProfileService } from '../services/playerProfileService';

interface VoiceConnection {
  id: string;
  summonerName: string;
  connected: boolean;
  muted: boolean;
  speaking: boolean;
}

interface TeammateProfile {
  summonerName: string;
  summonerLevel: number;
  profileIconId: number;
  region: string;
  mostPlayedChampions: {
    name: string;
    image: string;
    gamesPlayed: number;
    winRate: number;
    avgPlacement: number;
  }[];
  recentGames: {
    champion: string;
    championImage: string;
    placement: number;
    kills: number;
    deaths: number;
    assists: number;
    timestamp: string;
    gameLength: string;
  }[];
}

export default function Voice() {
  const { state } = useApp();
  const { settings, updateSettings } = useSettings();
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [connections, setConnections] = useState<VoiceConnection[]>([]);
  
  // Audio controls
  const [isMuted, setIsMuted] = useState(false);
  const [micTesting, setMicTesting] = useState(false);
  
  // Device states
  const [selectedAudioInput, setSelectedAudioInput] = useState('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState('');
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  
  // Teammate profile
  const [teammateProfile, setTeammateProfile] = useState<TeammateProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Initialize WebRTC service
  useEffect(() => {
    console.log('Setting up WebRTC service callbacks...');
    
    webrtcService.onConnectionStateChange = (connected: boolean, roomId?: string) => {
      console.log('Connection state changed:', connected, roomId);
      setIsConnected(connected);
      setCurrentRoom(connected ? roomId || null : null);
      
      if (connected) {
        setConnections([
          { id: 'self', summonerName: state.game.summonerName || 'You', connected: true, muted: isMuted, speaking: false }
        ]);
      } else {
        setConnections([]);
        setTeammateProfile(null);
      }
    };
    
    webrtcService.onParticipantUpdate = (participants: any[]) => {
      console.log('Participants updated:', participants);
      const voiceConnections: VoiceConnection[] = participants.map(p => ({
        id: p.id,
        summonerName: p.summonerName || p.id,
        connected: p.connected || false,
        muted: p.muted || false,
        speaking: p.speaking || false,
      }));
      setConnections(voiceConnections);
      
      // Load teammate profile when someone connects
      const teammate = participants.find(p => p.id !== 'self' && p.connected);
      if (teammate && teammate.summonerName && teammate.summonerName !== 'Unknown') {
        loadTeammateProfile(teammate.summonerName);
      }
    };
    
    webrtcService.onDevicesChanged = (devices: any[]) => {
      console.log('Devices updated:', devices);
      setAvailableDevices([...devices]); // Create new array to trigger React re-render
    };

    // Initialize devices
    webrtcService.enumerateDevices();
    
    return () => {
      webrtcService.onConnectionStateChange = null;
      webrtcService.onParticipantUpdate = null;
      webrtcService.onDevicesChanged = null;
    };
  }, [state.game.summonerName, isMuted]);

  const loadTeammateProfile = async (summonerName: string) => {
    console.log('Loading teammate profile for:', summonerName);
    setIsLoadingProfile(true);
    
    try {
      // Use a fallback region if settings aren't loaded yet
      const region = settings?.riotApi?.region || 'euw1';
      const profile = await playerProfileService.getPlayerProfile(summonerName, region);
      console.log('Loaded teammate profile:', profile);
      setTeammateProfile(profile);
    } catch (error) {
      console.error('Failed to load teammate profile:', error);
      setTeammateProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const joinVoiceChat = async (roomId?: string) => {
    if (!state.game.summonerName) {
      console.log('No summoner name available');
      return;
    }
    
    setIsConnecting(true);
    try {
      console.log('Joining voice chat...');
      await webrtcService.joinRoom(roomId, state.game.summonerName);
    } catch (error) {
      console.error('Failed to join voice chat:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const leaveVoiceChat = async () => {
    console.log('Leaving voice chat...');
    await webrtcService.leaveRoom();
    setTeammateProfile(null);
  };

  const toggleMute = async () => {
    console.log('Toggling mute...');
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    await webrtcService.setMuted(newMutedState);
  };

  const testMicrophone = async () => {
    setMicTesting(true);
    // Simulate mic test
    setTimeout(() => {
      setMicTesting(false);
    }, 2000);
  };

  const handleVolumeChange = (type: 'mic' | 'speaker', value: number) => {
    const newSettings = { ...settings };
    if (type === 'mic') {
      newSettings.voice.micGain = value / 100;
    } else {
      newSettings.voice.speakerVolume = value / 100;
    }
    updateSettings(newSettings);
  };

  const handleDeviceChange = async (deviceType: string, deviceId: string) => {
    console.log(`Changing ${deviceType} device to:`, deviceId);
    
    if (deviceType === 'audioInput') {
      setSelectedAudioInput(deviceId);
      await webrtcService.setAudioInputDevice(deviceId);
    } else if (deviceType === 'audioOutput') {
      setSelectedAudioOutput(deviceId);
      await webrtcService.setAudioOutputDevice(deviceId);
    }
  };

  const getAudioInputDevices = () => {
    return availableDevices.filter(d => d.kind === 'audioinput') || [];
  };

  const getAudioOutputDevices = () => {
    return availableDevices.filter(d => d.kind === 'audiooutput') || [];
  };

  const getPlacementColor = (placement: number) => {
    if (placement === 1) return 'text-yellow-400'; // Gold
    if (placement === 2) return 'text-slate-300';  // Silver
    if (placement === 3) return 'text-amber-600';  // Bronze
    if (placement <= 6) return 'text-green-400';   // Good
    return 'text-red-400'; // Bad
  };

  const getPlacementIcon = (placement: number) => {
    if (placement === 1) return '🥇';
    if (placement === 2) return '🥈';
    if (placement === 3) return '🥉';
    if (placement <= 6) return '✅';
    return '❌';
  };

  if (!state?.ui?.initialized || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-slate-400">Loading voice services...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-400">🎤 Voice Chat</h1>
          <p className="text-slate-400 mt-1">Connect with your Arena teammate</p>
        </div>
        <div className="flex items-center space-x-4">
          {isConnected && (
            <div className="flex items-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Connected</span>
            </div>
          )}
        </div>
      </div>

      {/* Big Mute Button */}
      {currentRoom && (
        <div className="flex justify-center">
          <button
            onClick={toggleMute}
            className={`relative group w-20 h-20 rounded-full font-bold text-2xl transition-all duration-200 transform hover:scale-105 ${
              isMuted 
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500/30 hover:border-red-500' 
                : 'bg-green-500/20 text-green-400 border-2 border-green-500/50 hover:bg-green-500/30 hover:border-green-500'
            }`}
          >
            <span className="block">{isMuted ? '🔇' : '🎤'}</span>
            <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium ${
              isMuted ? 'text-red-400' : 'text-green-400'
            }`}>
              {isMuted ? 'MUTED' : 'LIVE'}
            </div>
          </button>
        </div>
      )}

      {/* Connection & Device Controls */}
      <div className="card">
        <h3 className="text-xl font-semibold text-primary-400 mb-6">🎧 Voice Settings</h3>
        
        {/* Current Room */}
        {currentRoom ? (
          <div className="space-y-6">
            <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-primary-400">Active Session</h4>
                  <p className="text-sm text-slate-300 font-mono">{currentRoom}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Participants</p>
                  <p className="text-lg font-semibold text-primary-400">{connections.length}</p>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={testMicrophone}
                disabled={micTesting}
                className="btn-secondary px-4 py-3 disabled:opacity-50"
              >
                {micTesting ? '🎤 Testing...' : '🎧 Test Mic'}
              </button>

              <button
                onClick={leaveVoiceChat}
                className="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-3 rounded-lg font-semibold hover:bg-red-500/30 transition-all"
              >
                🔴 Leave
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-400">Auto-join:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.voice.autoJoin}
                    onChange={(e) => updateSettings({
                      voice: { ...settings.voice, autoJoin: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center mx-auto">
              <span className="text-3xl">🎤</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-primary-400">Ready to Connect</h4>
              <p className="text-slate-400">Start an Arena game or join manually</p>
            </div>
            
            {state.game.summonerName ? (
              <button
                onClick={() => joinVoiceChat()}
                disabled={isConnecting}
                className="btn-primary px-8 py-4 text-lg"
              >
                {isConnecting ? 'Connecting...' : '🎤 Join Voice Chat'}
              </button>
            ) : (
              <p className="text-sm text-slate-400">Start an Arena game to enable voice chat</p>
            )}
          </div>
        )}

        {/* Audio Controls */}
        <div className="mt-8 pt-6 border-t border-dark-600">
          <h4 className="text-lg font-semibold text-slate-200 mb-4">🔊 Audio Levels</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-300">Microphone Gain</label>
                <span className="text-sm text-primary-400 font-mono">
                  {Math.round(settings.voice.micGain * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.voice.micGain * 100}
                onChange={(e) => handleVolumeChange('mic', parseInt(e.target.value))}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-300">Speaker Volume</label>
                <span className="text-sm text-primary-400 font-mono">
                  {Math.round(settings.voice.speakerVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.voice.speakerVolume * 100}
                onChange={(e) => handleVolumeChange('speaker', parseInt(e.target.value))}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* Device Selection */}
        <div className="mt-8 pt-6 border-t border-dark-600">
          <h4 className="text-lg font-semibold text-slate-200 mb-4">🎧 Device Selection</h4>
          <p className="text-sm text-slate-400 mb-4">Available devices: {availableDevices.length}</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Audio Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                🎤 Microphone ({getAudioInputDevices().length} available)
              </label>
              <select
                value={selectedAudioInput}
                onChange={(e) => {
                  console.log('Audio input changed to:', e.target.value);
                  handleDeviceChange('audioInput', e.target.value);
                }}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none cursor-pointer"
              >
                <option value="">System Default</option>
                {getAudioInputDevices().map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone (${device.deviceId.slice(0, 8)})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Audio Output */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                🔊 Speakers/Headphones ({getAudioOutputDevices().length} available)
              </label>
              <select
                value={selectedAudioOutput}
                onChange={(e) => {
                  console.log('Audio output changed to:', e.target.value);
                  handleDeviceChange('audioOutput', e.target.value);
                }}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none cursor-pointer"
              >
                <option value="">System Default</option>
                {getAudioOutputDevices().map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Speaker (${device.deviceId.slice(0, 8)})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Debug info */}
          <div className="mt-4 p-3 bg-dark-700/50 rounded-lg text-xs">
            <p className="text-slate-400 mb-1">Debug: Raw device count: {availableDevices.length}</p>
            <p className="text-slate-400 mb-1">Audio inputs: {getAudioInputDevices().length}, Audio outputs: {getAudioOutputDevices().length}</p>
            <button 
              onClick={() => webrtcService.enumerateDevices()} 
              className="mt-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded text-xs hover:bg-primary-500/30"
            >
              🔄 Refresh Devices
            </button>
          </div>
        </div>
      </div>

      {/* Teammate Profile */}
      {(isLoadingProfile || teammateProfile || connections.length > 1) && (
        <div className="card">
          <h3 className="text-xl font-semibold text-primary-400 mb-6">👤 Teammate Profile</h3>
          
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-slate-400">Loading teammate profile...</span>
            </div>
          ) : teammateProfile ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${teammateProfile.profileIconId}.png`}
                    alt="Profile Icon"
                    className="w-20 h-20 rounded-2xl border-2 border-primary-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/29.png';
                    }}
                  />
                  <div className="absolute -bottom-2 -right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    {teammateProfile.summonerLevel}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-primary-400">{teammateProfile.summonerName}</h4>
                  <p className="text-slate-400">{teammateProfile.region} • Level {teammateProfile.summonerLevel}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-slate-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>

              {/* Most Played Champions */}
              {teammateProfile.mostPlayedChampions.length > 0 && (
                <div>
                  <h5 className="font-semibold text-slate-200 mb-4">Most Played Arena Champions</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teammateProfile.mostPlayedChampions.slice(0, 6).map((champ, index) => (
                      <div key={index} className="bg-dark-700/50 rounded-lg p-4 border border-dark-600">
                        <div className="flex items-center space-x-3">
                          <img
                            src={champ.image}
                            alt={champ.name}
                            className="w-12 h-12 rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Aatrox.png';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h6 className="font-medium text-slate-200 truncate">{champ.name}</h6>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Games:</span>
                                <span className="text-primary-400">{champ.gamesPlayed}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Win Rate:</span>
                                <span className="text-green-400">{champ.winRate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Avg Placement:</span>
                                <span className="text-accent-400">{champ.avgPlacement}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Games */}
              {teammateProfile.recentGames.length > 0 && (
                <div>
                  <h5 className="font-semibold text-slate-200 mb-4">Recent Arena Games</h5>
                  <div className="space-y-3">
                    {teammateProfile.recentGames.slice(0, 5).map((game, index) => (
                      <div key={index} className="bg-dark-700/50 rounded-lg p-4 border border-dark-600">
                        <div className="flex items-center space-x-4">
                          <img
                            src={game.championImage}
                            alt={game.champion}
                            className="w-12 h-12 rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Aatrox.png';
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h6 className="font-medium text-slate-200">{game.champion}</h6>
                              <span className="text-xs text-slate-400">{game.timestamp}</span>
                            </div>
                            <div className="flex items-center space-x-4 mt-1 text-sm">
                              <div className={`flex items-center space-x-1 ${getPlacementColor(game.placement)}`}>
                                <span>{getPlacementIcon(game.placement)}</span>
                                <span className="font-semibold">#{game.placement}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-slate-400">
                                <span>{game.kills}/{game.deaths}/{game.assists}</span>
                                <span>•</span>
                                <span>{game.gameLength}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👤</span>
              </div>
              <h4 className="text-lg font-semibold text-slate-300 mb-2">No Teammate Connected</h4>
              <p className="text-slate-400 text-sm">Connect to voice chat to see your teammate's profile</p>
            </div>
          )}
        </div>
      )}

      {/* Participants */}
      {connections.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-primary-400 mb-4">
            Participants ({connections.length})
          </h3>
          
          <div className="space-y-3">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-4 bg-dark-700/50 rounded-lg border border-dark-600"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    connection.connected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="font-medium text-slate-200">{connection.summonerName}</span>
                  {connection.id === 'self' && (
                    <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                      You
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {connection.muted && (
                    <span className="text-red-400 text-sm">🔇</span>
                  )}
                  {connection.speaking && (
                    <div className="flex space-x-1">
                      <div className="w-1 h-3 bg-green-400 rounded animate-pulse"></div>
                      <div className="w-1 h-3 bg-green-400 rounded animate-pulse delay-100"></div>
                      <div className="w-1 h-3 bg-green-400 rounded animate-pulse delay-200"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="card">
        <h3 className="text-lg font-semibold text-accent-400 mb-3">💡 Tips</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <p>• Voice chat automatically connects when both players have Arena Assist</p>
          <p>• Teammate profiles show real Arena stats from Riot API</p>
          <p>• Use gameName#tagLine format for best profile loading</p>
          <p>• All communication is peer-to-peer encrypted</p>
          <p>• If devices aren't showing, try the refresh button or restart the app</p>
        </div>
      </div>

    </div>
  );
} 