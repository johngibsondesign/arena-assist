import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { apiKeys } from '../config/apiKeys';

// Types matching the database schema
export interface ArenaChampion {
  id: string;
  name: string;
  image_url: string;
  pick_rate: number;
  win_rate: number;
  ban_rate: number;
  tier_score: number;
  tier_rank: string;
  games_count: number;
  kda: number;
  updated_at: string;
}

export interface ArenaDuo {
  id: number;
  champion1: string;
  champion2: string;
  champion1_image_url: string;
  champion2_image_url: string;
  pick_rate: number;
  win_rate: number;
  tier_score: number;
  updated_at: string;
}

export interface ArenaAugment {
  id: number;
  champion_id: string;
  augment_name: string;
  image_url: string;
  pick_rate: number;
  win_rate: number;
  augment_tier: 'prismatic' | 'gold' | 'silver';
  tier_rank: string;
  description: string;
  tier_position: number;
  updated_at: string;
}

export interface ArenaItem {
  id: number;
  champion_id: string;
  item_name: string;
  image_url: string;
  pick_rate: number;
  win_rate: number;
  item_category: string;
  buy_percentage: number;
  round_priority: number;
  updated_at: string;
}

export interface ArenaSkillOrder {
  id: number;
  champion_id: string;
  level_num: number;
  skill_key: string;
  skill_name: string;
  priority: number;
  pick_rate: number;
  updated_at: string;
}

export interface ArenaItemPurchaseOrder {
  id: number;
  champion_id: string;
  round_num: number;
  item_name: string;
  image_url: string;
  buy_percentage: number;
  priority: number;
  updated_at: string;
}

// Legacy interface for backward compatibility with existing components
export interface LiveAugment {
  id: string;
  apiName: string;
  displayName: string;
  description: string;
  tier: string;
  iconPath: string;
  name: string;
  pickRate: number;
  winRate: number;
  category: 'damage' | 'tank' | 'utility' | 'healing';
  keywords: string[];
}

class SupabaseService {
  private supabase: SupabaseClient;
  private isConnected: boolean = false;

  constructor() {
    if (!apiKeys.SUPABASE_URL || !apiKeys.SUPABASE_KEY) {
      console.error('⚠️  Supabase credentials not configured');
      throw new Error('Supabase URL and Key are required');
    }

    this.supabase = createClient(apiKeys.SUPABASE_URL, apiKeys.SUPABASE_KEY);
    this.testConnection();
  }

  private async testConnection(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('arena_champ_pickrates')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      this.isConnected = true;
      console.log('✅ Supabase connection successful');
    } catch (error) {
      console.error('❌ Supabase connection failed:', error);
      this.isConnected = false;
    }
  }

  // ── CHAMPIONS ──────────────────────────────────────────────────────────────

  async getTopChampions(limit: number = 50): Promise<ArenaChampion[]> {
    try {
      const { data, error } = await this.supabase
        .from('arena_champ_pickrates')
        .select('*')
        .order('tier_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top champions:', error);
      return [];
    }
  }

  async getChampion(championId: string): Promise<ArenaChampion | null> {
    try {
      const { data, error } = await this.supabase
        .from('arena_champ_pickrates')
        .select('*')
        .eq('id', championId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching champion ${championId}:`, error);
      return null;
    }
  }

  // ── DUOS ───────────────────────────────────────────────────────────────────

  async getTopDuos(limit: number = 30): Promise<ArenaDuo[]> {
    try {
      const { data, error } = await this.supabase
        .from('arena_duo_pickrates')
        .select('*')
        .order('tier_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top duos:', error);
      return [];
    }
  }

  // ── AUGMENTS ───────────────────────────────────────────────────────────────

  async getAllAugments(limit: number = 200): Promise<ArenaAugment[]> {
    try {
      const { data, error } = await this.supabase
        .from('arena_augment_pickrates')
        .select('*')
        .order('win_rate', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all augments:', error);
      return [];
    }
  }

  async getAugmentsByChampion(championId: string): Promise<ArenaAugment[]> {
    try {
      const { data, error } = await this.supabase
        .from('arena_augment_pickrates')
        .select('*')
        .eq('champion_id', championId)
        .order('tier_position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching augments for ${championId}:`, error);
      return [];
    }
  }

  async getAugmentsByTier(tier: 'prismatic' | 'gold' | 'silver', limit: number = 50): Promise<ArenaAugment[]> {
    try {
      const { data, error } = await this.supabase
        .from('arena_augment_pickrates')
        .select('*')
        .eq('augment_tier', tier)
        .order('win_rate', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${tier} augments:`, error);
      return [];
    }
  }

  async getBestAugments(limit: number = 20): Promise<ArenaAugment[]> {
    try {
      const { data, error } = await this.supabase
        .from('arena_augment_pickrates')
        .select('*')
        .in('tier_rank', ['S+', 'S'])
        .order('win_rate', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching best augments:', error);
      return [];
    }
  }

  // Convert database augments to legacy format for existing components
  convertAugmentsToLegacyFormat(augments: ArenaAugment[]): LiveAugment[] {
    return augments.map(aug => ({
      id: aug.id.toString(),
      apiName: aug.augment_name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      displayName: aug.augment_name,
      description: aug.description || 'No description available',
      tier: aug.tier_rank || 'B',
      iconPath: aug.image_url,
      name: aug.augment_name,
      pickRate: aug.pick_rate * 100, // Convert to percentage
      winRate: aug.win_rate * 100,   // Convert to percentage
      category: this.categorizeAugment(aug.augment_name, aug.description),
      keywords: this.extractKeywords(aug.augment_name, aug.description)
    }));
  }

  private categorizeAugment(name: string, description: string): 'damage' | 'tank' | 'utility' | 'healing' {
    const text = `${name} ${description}`.toLowerCase();
    
    if (text.match(/heal|regenerat|lifesteal|vampir|restore|recovery|soul siphon/)) {
      return 'healing';
    }
    if (text.match(/resist|armor|shield|defensive|tenacity|reduction|damage.*reduc|tank/)) {
      return 'tank';
    }
    if (text.match(/damage|attack|crit|penetrat|magic.*power|ability.*power|burn|execute|heavy hitter|lightning/)) {
      return 'damage';
    }
    return 'utility';
  }

  private extractKeywords(name: string, description: string): string[] {
    const text = `${name} ${description}`.toLowerCase();
    const keywords = new Set<string>();
    
    const patterns = [
      /damage/g, /heal/g, /shield/g, /armor/g, /magic resist/g, /attack speed/g,
      /critical/g, /penetration/g, /lifesteal/g, /movement speed/g, /ability power/g,
      /mana/g, /cooldown/g, /tenacity/g, /burn/g, /execute/g, /stun/g, /slow/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.add(match));
      }
    });
    
    return Array.from(keywords);
  }

  // ── ITEMS ──────────────────────────────────────────────────────────────────

  async getItemsByChampion(championId: string): Promise<ArenaItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('arena_item_pickrates')
        .select('*')
        .eq('champion_id', championId)
        .order('pick_rate', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching items for ${championId}:`, error);
      return [];
    }
  }

  async getItemsByCategory(category: string, limit: number = 30): Promise<ArenaItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('arena_item_pickrates')
        .select('*')
        .eq('item_category', category)
        .order('pick_rate', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${category} items:`, error);
      return [];
    }
  }

  // ── SKILL ORDER ────────────────────────────────────────────────────────────

  async getSkillOrderByChampion(championId: string): Promise<ArenaSkillOrder[]> {
    try {
      const { data, error } = await this.supabase
        .from('arena_skill_order')
        .select('*')
        .eq('champion_id', championId)
        .eq('priority', 1)
        .order('level_num', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching skill order for ${championId}:`, error);
      return [];
    }
  }

  // ── ITEM PURCHASE ORDER ────────────────────────────────────────────────────

  async getItemPurchaseOrderByChampion(championId: string): Promise<ArenaItemPurchaseOrder[]> {
    try {
      const { data, error } = await this.supabase
        .from('arena_item_purchase_order')
        .select('*')
        .eq('champion_id', championId)
        .order('round_num', { ascending: true })
        .order('priority', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching item purchase order for ${championId}:`, error);
      return [];
    }
  }

  // ── STATS & ANALYTICS ──────────────────────────────────────────────────────

  async getArenaStats(): Promise<{
    totalChampions: number;
    totalAugments: number;
    totalDuos: number;
    lastUpdated: string;
  }> {
    try {
      const [championsResult, augmentsResult, duosResult] = await Promise.all([
        this.supabase.from('arena_champ_pickrates').select('id'),
        this.supabase.from('arena_augment_pickrates').select('augment_name'),
        this.supabase.from('arena_duo_pickrates').select('id')
      ]);

      const champions = championsResult.data || [];
      const allAugments = augmentsResult.data || [];
      const duos = duosResult.data || [];

      // Get unique augment names
      const uniqueAugmentNames = new Set(allAugments.map(a => a.augment_name));
      const augments = Array.from(uniqueAugmentNames);

      // Get last updated time
      const { data: lastUpdate } = await this.supabase
        .from('arena_champ_pickrates')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);

      return {
        totalChampions: champions.length,
        totalAugments: augments.length, // Now counts unique augments
        totalDuos: duos.length,
        lastUpdated: lastUpdate?.[0]?.updated_at || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching arena stats:', error);
      return {
        totalChampions: 0,
        totalAugments: 0,
        totalDuos: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // ── CONNECTION STATUS ──────────────────────────────────────────────────────

  isReady(): boolean {
    return this.isConnected;
  }

  async healthCheck(): Promise<{ status: 'connected' | 'error'; message: string }> {
    try {
      const { error } = await this.supabase
        .from('arena_champ_pickrates')
        .select('id')
        .limit(1);

      if (error) throw error;
      
      return { status: 'connected', message: 'Database connection healthy' };
    } catch (error) {
      return { 
        status: 'error', 
        message: `Database connection failed: ${error}` 
      };
    }
  }

  // ── VOICE ROOM MANAGEMENT ─────────────────────────────────────────────────

  async createVoiceRoom(roomId: string, gameId: string, host: string): Promise<boolean> {
    try {
      await this.initialize();
      const { error } = await this.supabase
        .from('voice_rooms')
        .insert({
          id: roomId,
          game_id: gameId,
          host: host,
          participants: [host],
          active: true
        });

      if (error) {
        console.error('Error creating voice room:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to create voice room:', error);
      return false;
    }
  }

  async joinVoiceRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      await this.initialize();
      
      // Get current room
      const { data: room, error: fetchError } = await this.supabase
        .from('voice_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (fetchError || !room) {
        console.error('Room not found:', fetchError);
        return false;
      }

      // Add user to participants if not already present
      const updatedParticipants = room.participants.includes(userId) 
        ? room.participants 
        : [...room.participants, userId];

      const { error } = await this.supabase
        .from('voice_rooms')
        .update({ participants: updatedParticipants })
        .eq('id', roomId);

      if (error) {
        console.error('Error joining voice room:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to join voice room:', error);
      return false;
    }
  }

  async leaveVoiceRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      await this.initialize();
      
      // Get current room
      const { data: room, error: fetchError } = await this.supabase
        .from('voice_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (fetchError || !room) {
        return true; // Room doesn't exist, consider it left
      }

      const updatedParticipants = room.participants.filter((p: string) => p !== userId);

      if (updatedParticipants.length === 0) {
        // Delete empty room
        await this.supabase.from('voice_rooms').delete().eq('id', roomId);
      } else {
        // Update participants list
        await this.supabase
          .from('voice_rooms')
          .update({ participants: updatedParticipants })
          .eq('id', roomId);
      }

      return true;
    } catch (error) {
      console.error('Failed to leave voice room:', error);
      return false;
    }
  }

  async findVoiceRoomByGameId(gameId: string): Promise<any | null> {
    try {
      await this.initialize();
      const { data, error } = await this.supabase
        .from('voice_rooms')
        .select('*')
        .eq('game_id', gameId)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error finding voice room:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to find voice room:', error);
      return null;
    }
  }

  async cleanupVoiceRoomsByGameId(gameId: string): Promise<boolean> {
    try {
      await this.initialize();
      const { error } = await this.supabase
        .from('voice_rooms')
        .delete()
        .eq('game_id', gameId);

      if (error) {
        console.error('Error cleaning up voice rooms:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to cleanup voice rooms:', error);
      return false;
    }
  }

  // ── GAME SESSION TRACKING ─────────────────────────────────────────────────

  async startGameSession(summonerName: string, gameId: string, championName?: string, region: string = 'euw1'): Promise<boolean> {
    try {
      await this.initialize();
      const { error } = await this.supabase
        .from('game_sessions')
        .insert({
          summoner_name: summonerName,
          game_id: gameId,
          champion_name: championName,
          region: region,
          active: true
        });

      if (error) {
        console.error('Error starting game session:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to start game session:', error);
      return false;
    }
  }

  async endGameSession(gameId: string): Promise<boolean> {
    try {
      await this.initialize();
      
      // Use the database function to end game and cleanup voice rooms
      const { error } = await this.supabase.rpc('end_game_session', {
        session_game_id: gameId
      });

      if (error) {
        console.error('Error ending game session:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to end game session:', error);
      return false;
    }
  }

  async findActiveTeammates(summonerName: string, currentGameId?: string): Promise<string[]> {
    try {
      await this.initialize();
      const { data, error } = await this.supabase
        .from('game_sessions')
        .select('summoner_name')
        .eq('active', true)
        .neq('summoner_name', summonerName)
        .neq('game_id', currentGameId || ''); // Exclude current game

      if (error) {
        console.error('Error finding active teammates:', error);
        return [];
      }

      return data?.map(session => session.summoner_name) || [];
    } catch (error) {
      console.error('Failed to find active teammates:', error);
      return [];
    }
  }

  async getVoiceRoomParticipants(roomId: string): Promise<string[]> {
    try {
      await this.initialize();
      const { data, error } = await this.supabase
        .from('voice_rooms')
        .select('participants')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error('Error getting voice room participants:', error);
        return [];
      }

      return data?.participants || [];
    } catch (error) {
      console.error('Failed to get voice room participants:', error);
      return [];
    }
  }
}

// Create singleton instance
export const supabaseService = new SupabaseService();

// Legacy export for existing augment service compatibility
export const augmentService = {
  async getLiveAugments(): Promise<LiveAugment[]> {
    const augments = await supabaseService.getAllAugments();
    return supabaseService.convertAugmentsToLegacyFormat(augments);
  },
  
  async initialize(): Promise<LiveAugment[]> {
    return await this.getLiveAugments();
  },
  
  clearCache(): void {
    // No cache to clear in database service
  }
};

export const initializeAugments = () => augmentService.initialize(); 