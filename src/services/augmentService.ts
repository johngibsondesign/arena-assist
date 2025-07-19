export interface LiveAugment {
  id: string;
  apiName: string;
  displayName: string;
  description: string;
  tier: string;
  iconPath: string;
  // Computed fields for compatibility with existing code
  name: string;
  pickRate: number;
  winRate: number;
  category: 'damage' | 'tank' | 'utility' | 'healing';
  keywords: string[];
}

class AugmentService {
  private cachedAugments: LiveAugment[] = [];
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  async getLatestVersion(): Promise<string> {
    try {
      const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch versions: ${response.status}`);
      }
      const versions = await response.json();
      return versions[0]; // Latest version
    } catch (error) {
      console.error('Failed to fetch latest version:', error);
      throw error;
    }
  }

  async fetchAugmentsData(version: string): Promise<any[]> {
    try {
      const url = `https://raw.communitydragon.org/${version}/cdragon/arena/en_us.json`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch augments data: ${response.status}`);
      }
      
      const augmentsData = await response.json();
      return Array.isArray(augmentsData) ? augmentsData : [];
    } catch (error) {
      console.error('Failed to fetch augments data:', error);
      throw error;
    }
  }

  private categorizeAugment(description: string, name: string): 'damage' | 'tank' | 'utility' | 'healing' {
    const text = `${name} ${description}`.toLowerCase();
    
    // Healing keywords
    if (text.match(/heal|regenerat|lifesteal|vampir|restore|recovery/)) {
      return 'healing';
    }
    
    // Tank keywords
    if (text.match(/resist|armor|shield|defensive|tenacity|reduction|damage.*reduc/)) {
      return 'tank';
    }
    
    // Damage keywords  
    if (text.match(/damage|attack|crit|penetrat|magic.*power|ability.*power|burn|execute/)) {
      return 'damage';
    }
    
    // Default to utility
    return 'utility';
  }

  private extractKeywords(description: string, name: string): string[] {
    const text = `${name} ${description}`.toLowerCase();
    const keywords = new Set<string>();
    
    // Extract common League keywords
    const keywordPatterns = [
      /damage/g, /heal/g, /shield/g, /armor/g, /magic resist/g, /attack speed/g,
      /critical/g, /penetration/g, /lifesteal/g, /movement speed/g, /ability power/g,
      /mana/g, /cooldown/g, /tenacity/g, /burn/g, /execute/g, /stun/g, /slow/g
    ];
    
    keywordPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.add(match));
      }
    });
    
    return Array.from(keywords);
  }

  private generateMockStats(): { pickRate: number; winRate: number } {
    // Generate realistic pick and win rates
    const pickRate = Math.random() * 60 + 20; // 20-80%
    const winRate = Math.random() * 20 + 50; // 50-70%
    return { pickRate, winRate };
  }

  private mapToLiveAugment(augmentData: any): LiveAugment {
    const { pickRate, winRate } = this.generateMockStats();
    const category = this.categorizeAugment(augmentData.description || '', augmentData.displayName || augmentData.apiName);
    const keywords = this.extractKeywords(augmentData.description || '', augmentData.displayName || augmentData.apiName);
    
    return {
      id: augmentData.id?.toString() || Math.random().toString(),
      apiName: augmentData.apiName || '',
      displayName: augmentData.displayName || augmentData.apiName || 'Unknown Augment',
      description: augmentData.description || 'No description available',
      tier: augmentData.tier || 'B',
      iconPath: augmentData.iconPath || '',
      // Compatibility fields
      name: augmentData.displayName || augmentData.apiName || 'Unknown Augment',
      pickRate,
      winRate,
      category,
      keywords,
    };
  }

  async getLiveAugments(): Promise<LiveAugment[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cachedAugments.length > 0 && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      console.log('Returning cached augments data');
      return this.cachedAugments;
    }

    try {
      console.log('Fetching latest augments data from Community Dragon...');
      
      // Step 1: Get latest version
      const latestVersion = await this.getLatestVersion();
      console.log(`Latest Data Dragon version: ${latestVersion}`);
      
      // Step 2: Fetch augments data
      const rawAugmentsData = await this.fetchAugmentsData(latestVersion);
      console.log(`Fetched ${rawAugmentsData.length} raw augments`);
      
      // Step 3: Map to our format
      const liveAugments = rawAugmentsData
        .filter(a => a && (a.displayName || a.apiName)) // Filter out invalid entries
        .map(a => this.mapToLiveAugment(a));
      
      console.log(`Processed ${liveAugments.length} live augments`);
      
      // Cache the results
      this.cachedAugments = liveAugments;
      this.lastFetchTime = now;
      
      return liveAugments;
      
    } catch (error) {
      console.error('Failed to fetch live augments data:', error);
      
      // Return cached data if available, otherwise empty array
      if (this.cachedAugments.length > 0) {
        console.log('Falling back to cached augments data');
        return this.cachedAugments;
      }
      
      console.log('No cached data available, returning empty array');
      return [];
    }
  }

  // Initialize and return augments (replaces mockAugments)
  async initialize(): Promise<LiveAugment[]> {
    return await this.getLiveAugments();
  }

  // Clear cache (useful for testing)
  clearCache(): void {
    this.cachedAugments = [];
    this.lastFetchTime = 0;
  }
}

// Create singleton instance
export const augmentService = new AugmentService();

// Export for backwards compatibility and easy initialization
export const initializeAugments = () => augmentService.initialize(); 