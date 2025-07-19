import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LcuApiService } from '../services/lcuApi';

interface ArenaMatch {
  gameId: string;
  champion: string;
  championImage: string;
  placement: number;
  kills: number;
  deaths: number;
  assists: number;
  timestamp: string;
  gameLength: string;
  augments: string[];
}

interface ChampionWinRate {
  championId: string;
  championName: string;
  championImage: string;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  avgPlacement: number;
}

const lcuApi = new LcuApiService();

export default function Profile() {
  const { state, dispatch } = useApp();
  const [summonerData, setSummonerData] = useState<any>(null);
  const [arenaMatches, setArenaMatches] = useState<ArenaMatch[]>([]);
  const [championStats, setChampionStats] = useState<ChampionWinRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gamePhase, setGamePhase] = useState<string>('None');

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        setIsLoading(true);
        
        // Get current summoner
        const summoner = await lcuApi.getCurrentSummoner();
        if (summoner) {
          setSummonerData(summoner);
          
          // Update app state with summoner info
          dispatch({
            type: 'SET_GAME_STATE',
            payload: {
              summonerName: summoner.displayName,
              puuid: summoner.puuid,
            }
          });
          
          // Load Arena match history
          const matches = await lcuApi.getArenaMatchHistory();
          const processedMatches = await processArenaMatches(matches);
          setArenaMatches(processedMatches);
          
          // Calculate champion stats from match history
          const champStats = calculateChampionStats(processedMatches);
          setChampionStats(champStats);
        }
      } catch (error) {
        console.error('Failed to initialize profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up LCU callbacks
    lcuApi.onGamePhaseChange = (phase: string) => {
      setGamePhase(phase);
      dispatch({
        type: 'SET_GAME_STATE',
        payload: {
          gamePhase: phase,
          isInGame: phase === 'InProgress' || phase === 'GameStart',
        }
      });
    };

    initializeProfile();

    return () => {
      lcuApi.onGamePhaseChange = null;
    };
  }, [dispatch]);

  const processArenaMatches = async (matches: any[]): Promise<ArenaMatch[]> => {
    return matches.slice(0, 10).map(match => ({
      gameId: match.gameId?.toString() || '',
      champion: match.participants?.[0]?.championName || 'Unknown',
      championImage: `/assets/champions/${match.participants?.[0]?.championName || 'Unknown'}.jpg`,
      placement: match.participants?.[0]?.stats?.teamObjective || 8,
      kills: match.participants?.[0]?.stats?.kills || 0,
      deaths: match.participants?.[0]?.stats?.deaths || 0,
      assists: match.participants?.[0]?.stats?.assists || 0,
      timestamp: new Date(match.gameCreation).toLocaleDateString(),
      gameLength: formatGameLength(match.gameDuration),
      augments: match.participants?.[0]?.augments || [],
    }));
  };

  const calculateChampionStats = (matches: ArenaMatch[]): ChampionWinRate[] => {
    const champMap = new Map<string, { games: number; wins: number; placements: number[] }>();
    
    matches.forEach(match => {
      const existing = champMap.get(match.champion) || { games: 0, wins: 0, placements: [] };
      existing.games++;
      if (match.placement <= 4) existing.wins++; // Top 4 is considered a win
      existing.placements.push(match.placement);
      champMap.set(match.champion, existing);
    });

    return Array.from(champMap.entries())
      .map(([champion, stats]) => ({
        championId: champion.toLowerCase(),
        championName: champion,
        championImage: `/assets/champions/${champion}.jpg`,
        gamesPlayed: stats.games,
        wins: stats.wins,
        winRate: Math.round((stats.wins / stats.games) * 100),
        avgPlacement: Math.round(stats.placements.reduce((a, b) => a + b, 0) / stats.placements.length * 10) / 10,
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 6);
  };

  const formatGameLength = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPlacementColor = (placement: number): string => {
    if (placement === 1) return 'text-yellow-400';
    if (placement <= 2) return 'text-slate-300';
    if (placement <= 4) return 'text-amber-600';
    return 'text-slate-500';
  };

  const getGamePhaseDisplay = (phase: string): { text: string; color: string } => {
    switch (phase) {
      case 'ChampSelect':
        return { text: 'Champion Select', color: 'text-blue-400' };
      case 'InProgress':
      case 'GameStart':
        return { text: 'In Game', color: 'text-green-400' };
      case 'WaitingForStats':
        return { text: 'Post Game', color: 'text-purple-400' };
      case 'Lobby':
        return { text: 'In Lobby', color: 'text-yellow-400' };
      default:
        return { text: 'Menu', color: 'text-slate-400' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-slate-400">Loading profile...</span>
      </div>
    );
  }

  if (!summonerData) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-xl mb-4">❌ League Client Not Found</div>
        <p className="text-slate-400">Please make sure League of Legends is running and try again.</p>
      </div>
    );
  }

  const phaseDisplay = getGamePhaseDisplay(gamePhase);

  return (
    <div className="space-y-6">
      {/* Header with Summoner Info */}
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-2xl">
            👤
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary-400">{summonerData.displayName}</h1>
            <p className="text-slate-400">Level {summonerData.summonerLevel}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-slate-500">Status:</span>
              <span className={`text-sm font-medium ${phaseDisplay.color}`}>
                {phaseDisplay.text}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Arena Games</div>
            <div className="text-xl font-bold text-primary-400">{arenaMatches.length}</div>
          </div>
        </div>
      </div>

      {/* Champion Statistics */}
      <div className="bg-dark-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-primary-400 mb-4">🏆 Top Champions</h2>
        {championStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {championStats.map((champ) => (
              <div key={champ.championId} className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-600 flex items-center justify-center">
                    🛡️
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-200">{champ.championName}</h3>
                    <div className="text-sm text-slate-400">
                      {champ.gamesPlayed} games • {champ.winRate}% WR
                    </div>
                    <div className="text-xs text-slate-500">
                      Avg Placement: #{champ.avgPlacement}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">No Arena games found. Play some Arena matches to see your stats!</p>
        )}
      </div>

      {/* Recent Matches */}
      <div className="bg-dark-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-primary-400 mb-4">📊 Recent Arena Matches</h2>
        {arenaMatches.length > 0 ? (
          <div className="space-y-3">
            {arenaMatches.map((match, index) => (
              <div key={match.gameId || index} className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                      🛡️
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">{match.champion}</div>
                      <div className="text-sm text-slate-400">
                        {match.kills}/{match.deaths}/{match.assists} • {match.gameLength}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getPlacementColor(match.placement)}`}>
                      #{match.placement}
                    </div>
                    <div className="text-sm text-slate-500">{match.timestamp}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">No recent Arena matches found.</p>
        )}
      </div>
    </div>
  );
}
