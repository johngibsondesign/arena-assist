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
}

export class LcuApiService {
  private baseUrl = 'https://127.0.0.1:2999';
  private credentials: string | null = null;
  private isClientConnected = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  
  // Callbacks
  public onClientStatusChange: ((connected: boolean) => void) | null = null;
  public onGamePhaseChange: ((phase: string) => void) | null = null;

  constructor() {
    this.detectCredentials();
    this.startPolling();
  }

  private async detectCredentials(): Promise<void> {
    try {
      // In a real implementation, this would read from the League client process
      // For now, we'll simulate the detection
      console.log('Detecting LCU credentials...');
      
      // Mock credentials - in reality these come from the League client command line
      this.credentials = 'Basic ' + btoa('riot:' + 'mock-auth-token');
    } catch (error) {
      console.error('Failed to detect LCU credentials:', error);
    }
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      const wasConnected = this.isClientConnected;
      this.isClientConnected = await this.isClientRunning();
      
      if (wasConnected !== this.isClientConnected && this.onClientStatusChange) {
        this.onClientStatusChange(this.isClientConnected);
      }
      
      if (this.isClientConnected) {
        try {
          const gameflow = await this.getGameflowSession();
          if (gameflow && this.onGamePhaseChange) {
            this.onGamePhaseChange(gameflow.phase);
          }
        } catch (error) {
          // Ignore errors during polling
        }
      }
    }, 2000); // Poll every 2 seconds
  }

  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async makeRequest(endpoint: string): Promise<any> {
    if (!this.credentials) {
      throw new Error('LCU credentials not available');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': this.credentials,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      const response = await fetch(url, { 
        headers,
        // Disable SSL verification for LCU
        // @ts-ignore
        rejectUnauthorized: false,
      });
      
      if (!response.ok) {
        throw new Error(`LCU API error: ${response.status}`);
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
      return {
        puuid: data.puuid,
        summonerId: data.summonerId,
        displayName: data.displayName,
        internalName: data.internalName,
        profileIconId: data.profileIconId,
        summonerLevel: data.summonerLevel,
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