export interface RiotApiConfig {
  apiKey: string;
  region: string;
}

export interface MatchData {
  matchId: string;
  gameMode: string;
  gameDuration: number;
  participants: Participant[];
  teams: Team[];
}

export interface Participant {
  puuid: string;
  summonerName: string;
  championName: string;
  championId: number;
  teamId: number;
  kills: number;
  deaths: number;
  assists: number;
  items: number[];
  placement?: number;
  augments?: string[];
}

export interface Team {
  teamId: number;
  win: boolean;
  placement?: number;
}

export interface SummonerData {
  puuid: string;
  summonerLevel: number;
  profileIconId: number;
  name: string;
  id: string;
  accountId: string;
  revisionDate: number;
}

export class RiotApiService {
  private config: RiotApiConfig;
  private baseUrl: string;

  constructor(config: RiotApiConfig) {
    this.config = config;
    this.baseUrl = `https://${config.region}.api.riotgames.com`;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-Riot-Token': this.config.apiKey,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (response.status === 404) {
          throw new Error('Resource not found');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Riot API request failed:', error);
      throw error;
    }
  }

  async getSummonerByName(summonerName: string): Promise<SummonerData> {
    const endpoint = `/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
    return await this.makeRequest(endpoint);
  }

  async getSummonerByPuuid(puuid: string): Promise<SummonerData> {
    const endpoint = `/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    return await this.makeRequest(endpoint);
  }

  async getMatchHistory(puuid: string, count: number = 10): Promise<string[]> {
    const endpoint = `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}&queue=1700`; // 1700 = Arena queue ID
    return await this.makeRequest(endpoint);
  }

  async getMatchData(matchId: string): Promise<MatchData> {
    const endpoint = `/lol/match/v5/matches/${matchId}`;
    const data = await this.makeRequest(endpoint);
    
    return {
      matchId: data.metadata.matchId,
      gameMode: data.info.gameMode,
      gameDuration: data.info.gameDuration,
      participants: data.info.participants.map((p: any) => ({
        puuid: p.puuid,
        summonerName: p.summonerName,
        championName: p.championName,
        championId: p.championId,
        teamId: p.teamId,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5].filter(item => item > 0),
        placement: p.placement,
        augments: p.augments || [],
      })),
      teams: data.info.teams.map((t: any) => ({
        teamId: t.teamId,
        win: t.win,
        placement: t.placement,
      })),
    };
  }

  async getArenaMatchHistory(puuid: string, count: number = 10): Promise<MatchData[]> {
    try {
      const matchIds = await this.getMatchHistory(puuid, count);
      const matches = await Promise.all(
        matchIds.map(matchId => this.getMatchData(matchId))
      );
      
      return matches.filter(match => match.gameMode === 'CHERRY'); // Arena game mode
    } catch (error) {
      console.error('Failed to fetch arena match history:', error);
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple request to check if API key is valid
      await this.makeRequest('/lol/status/v4/platform-data');
      return true;
    } catch (error) {
      console.error('Riot API connection test failed:', error);
      return false;
    }
  }

  // Helper method to get champion synergy data (mock implementation)
  async getChampionSynergy(champion1: string, champion2: string): Promise<{
    synergy: number;
    recommendation: string;
  }> {
    // In a real implementation, this would query match data to calculate synergy
    const mockSynergies: Record<string, Record<string, number>> = {
      'Milio': { 'Kayle': 85, 'Jinx': 78, 'Graves': 65 },
      'Kayle': { 'Milio': 85, 'Lulu': 82, 'Senna': 71 },
      'Jinx': { 'Milio': 78, 'Lulu': 79, 'Thresh': 68 },
    };

    const synergy = mockSynergies[champion1]?.[champion2] || Math.floor(Math.random() * 40) + 60;
    
    let recommendation = '';
    if (synergy >= 80) {
      recommendation = 'Excellent synergy! Focus on coordinated plays and team fights.';
    } else if (synergy >= 70) {
      recommendation = 'Good synergy. Play around each other\'s strengths.';
    } else if (synergy >= 60) {
      recommendation = 'Decent synergy. Focus on individual performance.';
    } else {
      recommendation = 'Low synergy. Play safe and avoid risky plays.';
    }

    return { synergy, recommendation };
  }
} 