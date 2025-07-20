import { apiKeys } from '../config/apiKeys';

export interface PlayerProfile {
  summonerName: string;
  profileIconId: number;
  summonerLevel: number;
  region: string;
  puuid: string;
  recentGames: ArenaMatch[];
  mostPlayedChampions: ChampionStat[];
}

export interface ArenaMatch {
  matchId: string;
  champion: string;
  championImage: string;
  placement: number;
  kills: number;
  deaths: number;
  assists: number;
  gameLength: string;
  timestamp: string;
}

export interface ChampionStat {
  name: string;
  image: string;
  gamesPlayed: number;
  winRate: number;
  avgPlacement: number;
  kda: number;
}

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface RiotSummoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  summonerLevel: number;
}

interface RiotMatch {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    queueId: number;
    participants: RiotParticipant[];
  };
}

interface RiotParticipant {
  puuid: string;
  championName: string;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  placement: number;
  subteamPlacement?: number;
}

class PlayerProfileService {
  private readonly ARENA_QUEUE_ID = 1700; // Arena queue ID
  private readonly DATA_DRAGON_VERSION = '14.1.1';
  
  // Regional routing for Account-v1 API
  private getAccountRegion(region: string): string {
    const regionMap: Record<string, string> = {
      'br1': 'americas',
      'la1': 'americas', 
      'la2': 'americas',
      'na1': 'americas',
      'oc1': 'americas',
      'eun1': 'europe',
      'euw1': 'europe',
      'tr1': 'europe',
      'ru': 'europe',
      'jp1': 'asia',
      'kr': 'asia',
      'ph2': 'sea',
      'sg2': 'sea',
      'th2': 'sea',
      'tw2': 'sea',
      'vn2': 'sea',
    };
    return regionMap[region] || 'americas';
  }

  // Regional routing for Match-v5 API
  private getMatchRegion(region: string): string {
    const regionMap: Record<string, string> = {
      'br1': 'americas',
      'la1': 'americas',
      'la2': 'americas', 
      'na1': 'americas',
      'oc1': 'sea',
      'eun1': 'europe',
      'euw1': 'europe',
      'tr1': 'europe',
      'ru': 'europe',
      'jp1': 'asia',
      'kr': 'asia',
      'ph2': 'sea',
      'sg2': 'sea',
      'th2': 'sea',
      'tw2': 'sea',
      'vn2': 'sea',
    };
    return regionMap[region] || 'americas';
  }

  private async makeRiotRequest(url: string): Promise<any> {
    const headers = {
      'X-Riot-Token': apiKeys.RIOT_API_KEY,
      'Content-Type': 'application/json',
    };

    try {
      console.log('Making Riot API request to:', url);
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Riot API key');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (response.status === 404) {
          throw new Error('Player not found');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Riot API response:', data);
      return data;
    } catch (error) {
      console.error('Riot API request failed:', error);
      throw error;
    }
  }

  async getPlayerProfile(gameName: string, tagLine: string, region: string = 'euw1'): Promise<PlayerProfile | null> {
    try {
      console.log(`Fetching profile for ${gameName}#${tagLine} on ${region}`);

      // Step 1: Get account info by riot ID
      const accountRegion = this.getAccountRegion(region);
      const accountUrl = `https://${accountRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
      const account: RiotAccount = await this.makeRiotRequest(accountUrl);

      // Step 2: Get summoner info by PUUID
      const summonerUrl = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${account.puuid}`;
      const summoner: RiotSummoner = await this.makeRiotRequest(summonerUrl);

      return this.buildPlayerProfile(summoner, account, region);
    } catch (error) {
      console.error('Failed to get player profile:', error);
      return null;
    }
  }

  // Method to get profile using LCU summoner data with proper PUUID handling
  async getPlayerProfileFromLcu(lcuSummoner: any, region?: string): Promise<PlayerProfile | null> {
    try {
      const effectiveRegion = region || lcuSummoner.region || 'euw1';
      console.log(`Fetching profile from LCU data for ${lcuSummoner.displayName} on ${effectiveRegion}`);

      // Convert LCU PUUID format to Riot API format (add dashes)
      const riotApiPuuid = this.convertPuuidToRiotApi(lcuSummoner.puuid);

      // Create account-like object from LCU data
      const account: RiotAccount = {
        puuid: riotApiPuuid,
        gameName: lcuSummoner.gameName || lcuSummoner.displayName,
        tagLine: lcuSummoner.tagLine || 'EUW' // Fallback tagline
      };

      // Create summoner-like object from LCU data
      const summoner: RiotSummoner = {
        id: lcuSummoner.summonerId.toString(),
        accountId: lcuSummoner.accountId?.toString() || '',
        puuid: riotApiPuuid,
        name: lcuSummoner.displayName,
        profileIconId: lcuSummoner.profileIconId,
        summonerLevel: lcuSummoner.summonerLevel
      };

      return this.buildPlayerProfile(summoner, account, effectiveRegion);
    } catch (error) {
      console.error('Failed to get player profile from LCU:', error);
      return null;
    }
  }

  // Utility to convert LCU PUUID format to Riot API format
  private convertPuuidToRiotApi(lcuPuuid: string): string {
    if (!lcuPuuid) return lcuPuuid;
    
    // If PUUID is 32 chars without dashes, add dashes for Riot API
    if (lcuPuuid.length === 32 && !lcuPuuid.includes('-')) {
      return [
        lcuPuuid.slice(0, 8),
        lcuPuuid.slice(8, 12),
        lcuPuuid.slice(12, 16),
        lcuPuuid.slice(16, 20),
        lcuPuuid.slice(20, 32)
      ].join('-');
    }
    
    return lcuPuuid;
  }

  // Private method to build player profile from summoner and account data
  private async buildPlayerProfile(summoner: RiotSummoner, account: RiotAccount, region: string): Promise<PlayerProfile> {
    // Get recent Arena matches
    const matchRegion = this.getMatchRegion(region);
    const matchHistoryUrl = `https://${matchRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${account.puuid}/ids?queue=${this.ARENA_QUEUE_ID}&start=0&count=20`;
    
    let matchIds: string[] = [];
    try {
      matchIds = await this.makeRiotRequest(matchHistoryUrl);
    } catch (error) {
      console.warn('Could not fetch match history:', error);
      // Continue without matches
    }

    // Get detailed match data for recent games
    const recentMatches: ArenaMatch[] = [];
    const championStats = new Map<string, { games: number, wins: number, placements: number[], kda: { kills: number, deaths: number, assists: number } }>();

    for (const matchId of matchIds.slice(0, 10)) {
      try {
        const matchUrl = `https://${matchRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const match: RiotMatch = await this.makeRiotRequest(matchUrl);

        // Skip non-arena matches
        if (match.info.queueId !== this.ARENA_QUEUE_ID) continue;

        const participant = match.info.participants.find(p => p.puuid === account.puuid);
        if (!participant) continue;

        const championName = participant.championName;
        const placement = participant.placement || participant.subteamPlacement || 8;
        const kills = participant.kills || 0;
        const deaths = participant.deaths || 0;
        const assists = participant.assists || 0;

        // Add to recent matches (limit to 5 for display)
          if (recentMatches.length < 5) {
            recentMatches.push({
              matchId: match.metadata.matchId,
              champion: championName,
              championImage: `https://ddragon.leagueoflegends.com/cdn/${this.DATA_DRAGON_VERSION}/img/champion/${championName}.png`,
              placement: placement,
              kills: kills,
              deaths: deaths,
              assists: assists,
              gameLength: this.formatGameDuration(match.info.gameDuration),
              timestamp: this.formatTimestamp(match.info.gameCreation),
            });
          }

          // Track champion statistics
          if (!championStats.has(championName)) {
            championStats.set(championName, {
              games: 0,
              wins: 0,
              placements: [],
              kda: { kills: 0, deaths: 0, assists: 0 }
            });
          }

          const stats = championStats.get(championName)!;
          stats.games += 1;
          stats.placements.push(placement);
          stats.kda.kills += kills;
          stats.kda.deaths += deaths;
          stats.kda.assists += assists;
          
          // Consider top 4 as wins in Arena
          if (placement <= 4) {
            stats.wins += 1;
          }

        } catch (matchError) {
          console.warn('Failed to fetch match:', matchId, matchError);
          continue;
        }
      }

      // Step 5: Calculate most played champions
      const mostPlayedChampions: ChampionStat[] = Array.from(championStats.entries())
        .map(([championName, stats]) => ({
          name: championName,
          image: `https://ddragon.leagueoflegends.com/cdn/${this.DATA_DRAGON_VERSION}/img/champion/${championName}.png`,
          gamesPlayed: stats.games,
          winRate: Math.round((stats.wins / stats.games) * 100),
          avgPlacement: Math.round((stats.placements.reduce((a, b) => a + b, 0) / stats.placements.length) * 10) / 10,
          kda: Math.round(((stats.kda.kills + stats.kda.assists) / Math.max(stats.kda.deaths, 1)) * 10) / 10,
        }))
        .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
        .slice(0, 3);

      return {
        summonerName: `${account.gameName}#${account.tagLine}`,
        profileIconId: summoner.profileIconId,
        summonerLevel: summoner.summonerLevel,
        region: region.toUpperCase(),
        puuid: account.puuid,
        recentGames: recentMatches,
        mostPlayedChampions: mostPlayedChampions,
      };
    }

  private formatGameDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  private formatTimestamp(timestamp: number): string {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
  }

  // Extract summoner name and tag from a teammate ID or summoner name
  parseTeammateName(teammateName: string): { gameName: string; tagLine: string } | null {
    try {
      // Handle "SummonerName#TAG" format
      if (teammateName.includes('#')) {
        const [gameName, tagLine] = teammateName.split('#');
        return { gameName: gameName.trim(), tagLine: tagLine.trim() };
      }
      
      // Handle legacy summoner names (pre-riot ID)
      // For now, we can't easily convert these to riot IDs without additional API calls
      // Return null to use mock data instead
      return null;
    } catch (error) {
      console.error('Failed to parse teammate name:', error);
      return null;
    }
  }
}

export const playerProfileService = new PlayerProfileService();
export default playerProfileService; 