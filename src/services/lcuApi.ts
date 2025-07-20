export interface GameflowSession {
  phase: string;
  gameData?: GameData;
}

export interface GameData {
  gameId: number;
  gameMode: string;
  gameType: string;
  mapId: number;
  queue: {
    id: number;
    name: string;
    type: string;
  };
  playerChampionSelections: PlayerSelection[];
}

export interface PlayerSelection {
  cellId: number;
  championId: number;
  championName?: string;
  summonerId: number;
  puuid: string;
  selectedSkinId?: number;
  spell1Id?: number;
  spell2Id?: number;
  teamId?: number;
}

export interface CurrentSummoner {
  puuid: string;
  summonerId: number;
  displayName: string;
  internalName: string;
  profileIconId: number;
  summonerLevel: number;
  region?: string; // Will be detected from client
}

export class LcuApiService {
  private baseUrl = 'https://127.0.0.1'; // Will be set dynamically
  private port: number | null = null;
  private credentials: string | null = null;
  private isClientConnected = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private currentRegion: string | null = null;
  
  // Callbacks
  public onClientStatusChange: ((connected: boolean) => void) | null = null;
  public onGamePhaseChange: ((phase: string, gameData?: GameData) => void) | null = null;

  constructor() {
    this.detectClient();
    this.startPolling();
  }

  // PUUID format conversion utility
  private convertPuuidFormat(puuid: string, toRiotApi: boolean = false): string {
    if (!puuid) return puuid;
    
    if (toRiotApi) {
      // Convert LCU format to Riot API format (add dashes)
      if (puuid.length === 32 && !puuid.includes('-')) {
        return [
          puuid.slice(0, 8),
          puuid.slice(8, 12),
          puuid.slice(12, 16),
          puuid.slice(16, 20),
          puuid.slice(20, 32)
        ].join('-');
      }
    } else {
      // Convert Riot API format to LCU format (remove dashes)
      if (puuid.includes('-')) {
        return puuid.replace(/-/g, '');
      }
    }
    
    return puuid;
  }

  // Detect region from client data
  private async detectRegion(): Promise<string | null> {
    try {
      if (!this.isClientConnected || !this.port || !this.credentials) {
        return null;
      }

      const response = await this.makeRequest('/lol-rso-auth/v1/authorization');
      if (response && response.currentPlatformId) {
        // Map platform IDs to regions
        const platformToRegion: { [key: string]: string } = {
          'NA1': 'na1',
          'EUW1': 'euw1',
          'EUNE1': 'eun1',
          'KR': 'kr',
          'JP1': 'jp1',
          'BR1': 'br1',
          'LA1': 'la1',
          'LA2': 'la2',
          'OC1': 'oc1',
          'TR1': 'tr1',
          'RU': 'ru'
        };
        
        this.currentRegion = platformToRegion[response.currentPlatformId] || response.currentPlatformId.toLowerCase();
        return this.currentRegion;
      }
    } catch (error) {
      console.error('Error detecting region:', error);
    }
    
    return null;
  }

  private async detectClient(): Promise<void> {
    try {
      console.log('Detecting League of Legends client...');
      
      // Try to find the League client process and extract credentials
      const clientInfo = await this.findLeagueProcess();
      if (clientInfo) {
        this.port = clientInfo.port;
        this.credentials = clientInfo.credentials;
        this.baseUrl = `https://127.0.0.1:${this.port}`;
        console.log('League client detected on port:', this.port);
      } else {
        console.log('League client not found');
      }
    } catch (error) {
      console.error('Failed to detect League client:', error);
    }
  }

  private async findLeagueProcess(): Promise<{ port: number; credentials: string } | null> {
    try {
      // Use Node.js child_process to find League client
      const { exec } = require('child_process');
      
      return new Promise((resolve) => {
        // Look for LeagueClientUx.exe process on Windows
        exec('wmic process where "name=\'LeagueClientUx.exe\'" get CommandLine /format:list', (error: any, stdout: string) => {
          if (error) {
            console.log('Could not find League client process:', error.message);
            resolve(null);
            return;
          }

          const lines = stdout.split('\n');
          for (const line of lines) {
            if (line.includes('--app-port=')) {
              const portMatch = line.match(/--app-port=(\d+)/);
              const tokenMatch = line.match(/--remoting-auth-token=([a-zA-Z0-9_-]+)/);
              
              if (portMatch && tokenMatch) {
                const port = parseInt(portMatch[1]);
                const token = tokenMatch[1];
                const credentials = 'Basic ' + btoa(`riot:${token}`);
                
                resolve({ port, credentials });
                return;
              }
            }
          }
          resolve(null);
        });
      });
    } catch (error) {
      console.error('Error finding League process:', error);
      return null;
    }
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      // Periodically try to detect client if not connected
      if (!this.credentials || !this.port) {
        await this.detectClient();
      }

      const wasConnected = this.isClientConnected;
      this.isClientConnected = await this.isClientRunning();
      
      if (wasConnected !== this.isClientConnected && this.onClientStatusChange) {
        this.onClientStatusChange(this.isClientConnected);
        
        // When client connects, detect region
        if (this.isClientConnected) {
          await this.detectRegion();
        }
      }
      
      if (this.isClientConnected) {
        try {
          const gameflow = await this.getGameflowSession();
          if (gameflow && this.onGamePhaseChange) {
            this.onGamePhaseChange(gameflow.phase, gameflow.gameData);
          }
        } catch (error) {
          // Ignore errors during polling
        }
      }
    }, 5000); // Poll every 5 seconds
  }

  public async refreshClientDetection(): Promise<boolean> {
    await this.detectClient();
    return this.isClientConnected;
  }

  public getConnectionStatus(): { connected: boolean; port: number | null } {
    return {
      connected: this.isClientConnected,
      port: this.port
    };
  }

  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async makeRequest(endpoint: string): Promise<any> {
    if (!this.credentials || !this.port) {
      throw new Error('LCU credentials not available - League client not detected');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': this.credentials,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      // In Electron, we need to handle self-signed certificates
      const https = require('https');
      const agent = new https.Agent({
        rejectUnauthorized: false
      });

      const response = await fetch(url, { 
        headers,
        // @ts-ignore - Electron specific
        agent: agent
      });
      
      if (!response.ok) {
        throw new Error(`LCU API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('LCU API request failed:', error);
      throw error;
    }
  }

  async isClientRunning(): Promise<boolean> {
    try {
      await this.makeRequest('/lol-summoner/v1/current-summoner');
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCurrentSummoner(): Promise<CurrentSummoner | null> {
    try {
      const data = await this.makeRequest('/lol-summoner/v1/current-summoner');
      
      // Ensure region is detected
      if (!this.currentRegion) {
        await this.detectRegion();
      }
      
      return {
        puuid: data.puuid,
        summonerId: data.summonerId,
        displayName: data.displayName,
        internalName: data.internalName,
        profileIconId: data.profileIconId,
        summonerLevel: data.summonerLevel,
        region: this.currentRegion || undefined,
      };
    } catch (error) {
      console.error('Failed to get current summoner:', error);
      return null;
    }
  }

  async getGameflowSession(): Promise<GameflowSession | null> {
    try {
      const data = await this.makeRequest('/lol-gameflow/v1/session');
      return {
        phase: data.phase,
        gameData: data.gameData ? {
          gameId: data.gameData.gameId,
          gameMode: data.gameData.gameMode,
          gameType: data.gameData.gameType,
          mapId: data.gameData.mapId,
          queue: data.gameData.queue,
          playerChampionSelections: data.gameData.playerChampionSelections || [],
        } : undefined,
      };
    } catch (error) {
      console.error('Failed to get gameflow session:', error);
      return null;
    }
  }

  async isInArenaGame(): Promise<boolean> {
    try {
      const session = await this.getGameflowSession();
      if (!session?.gameData) return false;
      
      // Arena queue ID is 1700
      return session.gameData.queue.id === 1700 && 
             (session.phase === 'InProgress' || session.phase === 'GameStart');
    } catch (error) {
      return false;
    }
  }

  async getArenaTeammate(): Promise<string | null> {
    try {
      const session = await this.getGameflowSession();
      if (!session?.gameData) return null;

      const currentSummoner = await this.getCurrentSummoner();
      if (!currentSummoner) return null;

      const selections = session.gameData.playerChampionSelections;
      const currentPlayer = selections.find(p => p.puuid === currentSummoner.puuid);
      
      if (!currentPlayer) return null;

      // Find teammate (same team, different player)
      const teammate = selections.find(p => 
        p.teamId === currentPlayer.teamId && 
        p.puuid !== currentSummoner.puuid
      );

      return teammate ? `Player${teammate.cellId}` : null; // In reality, would get actual name
    } catch (error) {
      console.error('Failed to get arena teammate:', error);
      return null;
    }
  }

  async getCurrentChampion(): Promise<string | null> {
    try {
      const session = await this.getGameflowSession();
      if (!session?.gameData) return null;

      const currentSummoner = await this.getCurrentSummoner();
      if (!currentSummoner) return null;

      const selections = session.gameData.playerChampionSelections;
      const currentPlayer = selections.find(p => p.puuid === currentSummoner.puuid);
      
      return currentPlayer?.championName || null;
    } catch (error) {
      console.error('Failed to get current champion:', error);
      return null;
    }
  }

  async getArenaMatchHistory(): Promise<any[]> {
    try {
      const currentSummoner = await this.getCurrentSummoner();
      if (!currentSummoner) return [];

      // Get match history for Arena mode (queue 1700)
      const data = await this.makeRequest(`/lol-match-history/v1/products/lol/${currentSummoner.puuid}/matches?begIndex=0&endIndex=20`);
      
      // Filter for Arena games
      return data.games?.filter((game: any) => game.queueId === 1700) || [];
    } catch (error) {
      console.error('Failed to get Arena match history:', error);
      return [];
    }
  }

  async getChampionStats(): Promise<any[]> {
    try {
      const currentSummoner = await this.getCurrentSummoner();
      if (!currentSummoner) return [];

      // Get ranked stats for champions
      const data = await this.makeRequest(`/lol-ranked/v1/current-ranked-stats`);
      return data.champions || [];
    } catch (error) {
      console.error('Failed to get champion stats:', error);
      return [];
    }
  }

  async getInGameData(): Promise<{
    isInGame: boolean;
    gameMode: string | null;
    champion: string | null;
    teammate: string | null;
  }> {
    try {
      const isInArena = await this.isInArenaGame();
      
      if (!isInArena) {
        return {
          isInGame: false,
          gameMode: null,
          champion: null,
          teammate: null,
        };
      }

      const [champion, teammate] = await Promise.all([
        this.getCurrentChampion(),
        this.getArenaTeammate(),
      ]);

      return {
        isInGame: true,
        gameMode: 'Arena',
        champion,
        teammate,
      };
    } catch (error) {
      console.error('Failed to get in-game data:', error);
      return {
        isInGame: false,
        gameMode: null,
        champion: null,
        teammate: null,
      };
    }
  }

  // Public method to get formatted PUUID for Riot API
  public getPuuidForRiotApi(puuid: string): string {
    return this.convertPuuidFormat(puuid, true);
  }

  // Public method to get current region
  public getCurrentRegion(): string | null {
    return this.currentRegion;
  }

  // Public method to force region detection
  public async refreshRegion(): Promise<string | null> {
    return await this.detectRegion();
  }

  // Polling method to continuously check game state
  startGameStatePolling(callback: (data: any) => void, intervalMs: number = 5000): () => void {
    let isPolling = true;
    
    const poll = async () => {
      if (!isPolling) return;
      
      try {
        const gameData = await this.getInGameData();
        callback(gameData);
      } catch (error) {
        console.error('Game state polling error:', error);
      }
      
      if (isPolling) {
        setTimeout(poll, intervalMs);
      }
    };

    poll();
    
    return () => {
      isPolling = false;
    };
  }
}

// Create and export singleton instance
export const lcuApiService = new LcuApiService(); 