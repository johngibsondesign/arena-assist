import { supabaseService } from './supabaseService';

export interface DuoQueueStats {
  id: number;
  champion1Id: string;
  champion2Id: string;
  tierRank: 'S' | 'A' | 'B' | 'C' | 'D';
  tierPosition: number;
  score: number;
  winRate: number;
  top2Rate: number;
  avgPlacement: number;
  pickRate: number;
  synergyDescription?: string;
  strengths?: string;
  weaknesses?: string;
  playstyleNotes?: string;
  updatedAt: string;
}

export interface ChampionDuoData {
  champion: string;
  bestPartners: DuoQueueStats[];
  totalDuos: number;
  avgWinRate: number;
  topTierCount: number;
}

class DuoQueueService {
  // Get all duo queue stats, optionally filtered by tier
  async getAllDuoStats(tierFilter?: string): Promise<DuoQueueStats[]> {
    try {
      let query = supabaseService.supabase
        .from('arena_duo_queue_stats')
        .select('*')
        .order('tier_rank', { ascending: true })
        .order('tier_position', { ascending: true });

      if (tierFilter && tierFilter !== 'ALL') {
        query = query.eq('tier_rank', tierFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching duo queue stats:', error);
        return [];
      }

      return data?.map(this.mapDatabaseToDuoStats) || [];
    } catch (error) {
      console.error('Failed to fetch duo queue stats:', error);
      return [];
    }
  }

  // Get duo stats for a specific champion
  async getDuoStatsForChampion(championId: string): Promise<DuoQueueStats[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('arena_duo_queue_pairs') // Use the view to get both directions
        .select('*')
        .eq('champion_1_id', championId)
        .order('score', { ascending: false });

      if (error) {
        console.error('Error fetching champion duo stats:', error);
        return [];
      }

      return data?.map(this.mapDatabaseToDuoStats) || [];
    } catch (error) {
      console.error('Failed to fetch champion duo stats:', error);
      return [];
    }
  }

  // Get top duo partners for a specific champion
  async getTopPartnersForChampion(championId: string, limit: number = 5): Promise<DuoQueueStats[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('arena_duo_queue_pairs')
        .select('*')
        .eq('champion_1_id', championId)
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top partners:', error);
        return [];
      }

      return data?.map(this.mapDatabaseToDuoStats) || [];
    } catch (error) {
      console.error('Failed to fetch top partners:', error);
      return [];
    }
  }

  // Get stats for a specific duo pair
  async getDuoStats(champion1: string, champion2: string): Promise<DuoQueueStats | null> {
    try {
      // Ensure consistent ordering (alphabetical)
      const [champ1, champ2] = [champion1, champion2].sort();

      const { data, error } = await supabaseService.supabase
        .from('arena_duo_queue_stats')
        .select('*')
        .eq('champion_1_id', champ1)
        .eq('champion_2_id', champ2)
        .single();

      if (error) {
        console.error('Error fetching duo stats:', error);
        return null;
      }

      return data ? this.mapDatabaseToDuoStats(data) : null;
    } catch (error) {
      console.error('Failed to fetch duo stats:', error);
      return null;
    }
  }

  // Get champion summary data for duo queue tab
  async getChampionDuoSummary(): Promise<ChampionDuoData[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('arena_duo_queue_stats')
        .select('champion_1_id, champion_2_id, tier_rank, win_rate, score');

      if (error) {
        console.error('Error fetching champion duo summary:', error);
        return [];
      }

      // Process data to create champion summaries
      const championMap = new Map<string, {
        duos: any[];
        totalWinRate: number;
        topTierCount: number;
      }>();

      data?.forEach(duo => {
        // Add for champion 1
        if (!championMap.has(duo.champion_1_id)) {
          championMap.set(duo.champion_1_id, { duos: [], totalWinRate: 0, topTierCount: 0 });
        }
        const champ1Data = championMap.get(duo.champion_1_id)!;
        champ1Data.duos.push(duo);
        champ1Data.totalWinRate += duo.win_rate;
        if (duo.tier_rank === 'S' || duo.tier_rank === 'A') champ1Data.topTierCount++;

        // Add for champion 2
        if (!championMap.has(duo.champion_2_id)) {
          championMap.set(duo.champion_2_id, { duos: [], totalWinRate: 0, topTierCount: 0 });
        }
        const champ2Data = championMap.get(duo.champion_2_id)!;
        champ2Data.duos.push(duo);
        champ2Data.totalWinRate += duo.win_rate;
        if (duo.tier_rank === 'S' || duo.tier_rank === 'A') champ2Data.topTierCount++;
      });

      // Convert to ChampionDuoData array
      const result: ChampionDuoData[] = [];
      championMap.forEach((data, champion) => {
        result.push({
          champion,
          bestPartners: [], // Will be filled separately if needed
          totalDuos: data.duos.length,
          avgWinRate: data.totalWinRate / data.duos.length,
          topTierCount: data.topTierCount
        });
      });

      return result.sort((a, b) => b.avgWinRate - a.avgWinRate);
    } catch (error) {
      console.error('Failed to fetch champion duo summary:', error);
      return [];
    }
  }

  // Search duos by champion name
  async searchDuos(searchTerm: string): Promise<DuoQueueStats[]> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from('arena_duo_queue_stats')
        .select('*')
        .or(`champion_1_id.ilike.%${searchTerm}%,champion_2_id.ilike.%${searchTerm}%`)
        .order('score', { ascending: false });

      if (error) {
        console.error('Error searching duos:', error);
        return [];
      }

      return data?.map(this.mapDatabaseToDuoStats) || [];
    } catch (error) {
      console.error('Failed to search duos:', error);
      return [];
    }
  }

  // Update or insert duo stats (for data management)
  async upsertDuoStats(duoStats: Omit<DuoQueueStats, 'id' | 'updatedAt'>): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .from('arena_duo_queue_stats')
        .upsert({
          champion_1_id: duoStats.champion1Id,
          champion_2_id: duoStats.champion2Id,
          tier_rank: duoStats.tierRank,
          tier_position: duoStats.tierPosition,
          score: duoStats.score,
          win_rate: duoStats.winRate,
          top_2_rate: duoStats.top2Rate,
          avg_placement: duoStats.avgPlacement,
          pick_rate: duoStats.pickRate,
          synergy_description: duoStats.synergyDescription,
          strengths: duoStats.strengths,
          weaknesses: duoStats.weaknesses,
          playstyle_notes: duoStats.playstyleNotes
        }, {
          onConflict: 'champion_1_id,champion_2_id'
        });

      if (error) {
        console.error('Error upserting duo stats:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to upsert duo stats:', error);
      return false;
    }
  }

  // Helper method to map database row to DuoQueueStats interface
  private mapDatabaseToDuoStats(row: any): DuoQueueStats {
    return {
      id: row.id,
      champion1Id: row.champion_1_id,
      champion2Id: row.champion_2_id,
      tierRank: row.tier_rank,
      tierPosition: row.tier_position,
      score: row.score,
      winRate: row.win_rate,
      top2Rate: row.top_2_rate,
      avgPlacement: row.avg_placement,
      pickRate: row.pick_rate,
      synergyDescription: row.synergy_description,
      strengths: row.strengths,
      weaknesses: row.weaknesses,
      playstyleNotes: row.playstyle_notes,
      updatedAt: row.updated_at
    };
  }

  // Helper method to get champion image URL
  getChampionImageUrl(championId: string): string {
    return `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${championId}.png`;
  }

  // Helper method to get tier color
  getTierColor(tier: string): string {
    switch (tier) {
      case 'S': return 'text-red-400';
      case 'A': return 'text-orange-400';
      case 'B': return 'text-yellow-400';
      case 'C': return 'text-green-400';
      case 'D': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  }

  // Helper method to get tier background color
  getTierBgColor(tier: string): string {
    switch (tier) {
      case 'S': return 'bg-red-900/20 border-red-400';
      case 'A': return 'bg-orange-900/20 border-orange-400';
      case 'B': return 'bg-yellow-900/20 border-yellow-400';
      case 'C': return 'bg-green-900/20 border-green-400';
      case 'D': return 'bg-blue-900/20 border-blue-400';
      default: return 'bg-gray-900/20 border-gray-400';
    }
  }
}

export const duoQueueService = new DuoQueueService();
export default duoQueueService;
