import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/AppContext';

interface CommunityDragonAugment {
  apiName: string;
  calculations: Record<string, any>;
  dataValues: Record<string, any>;
  desc: string;
  iconLarge: string;
  iconSmall: string;
  id: number;
  name: string;
  rarity: number; // 0 = Silver, 1 = Gold, 2 = Prismatic
  tooltip: string;
}

interface CommunityDragonData {
  augments: CommunityDragonAugment[];
}

interface ProcessedAugment {
  id: string;
  name: string;
  description: string;
  tier: 'prismatic' | 'gold' | 'silver';
  imageUrl: string;
  category: string;
  apiName: string;
}

export default function Augments() {
  const { addNotification } = useNotifications();
  const [augments, setAugments] = useState<ProcessedAugment[]>([]);
  const [filteredAugments, setFilteredAugments] = useState<ProcessedAugment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Map rarity number to tier string
  const mapRarityToTier = React.useCallback((rarity: number): 'prismatic' | 'gold' | 'silver' => {
    switch (rarity) {
      case 2: return 'prismatic';
      case 1: return 'gold';
      case 0: 
      default: return 'silver';
    }
  }, []);

  // Categorize augments based on name and description
  const categorizeAugment = React.useCallback((name: string, description: string): string => {
    const text = `${name} ${description}`.toLowerCase();
    
    if (text.match(/damage|attack|crit|physical|magic|ability power|ad|ap|slash|bolt|lightning|execute/)) {
      return 'damage';
    }
    if (text.match(/heal|shield|health|regen|lifesteal|vampir|restore|recovery/)) {
      return 'sustain';
    }
    if (text.match(/armor|resist|defensive|tank|reduction|damage.*reduc/)) {
      return 'defense';
    }
    if (text.match(/speed|movement|dash|blink|mobility|teleport|invisible|stealth/)) {
      return 'mobility';
    }
    if (text.match(/cooldown|haste|ability|spell|cast|summoner|ultimate/)) {
      return 'utility';
    }
    
    return 'other';
  }, []);

  // Process Community Dragon augments
  const processAugments = React.useCallback((cdAugments: CommunityDragonAugment[]): ProcessedAugment[] => {
    return cdAugments.map(augment => ({
      id: `${augment.apiName}_${augment.id}`,
      name: augment.name,
      description: augment.desc || augment.tooltip || 'No description available',
      tier: mapRarityToTier(augment.rarity),
      imageUrl: `https://raw.communitydragon.org/latest/game/${augment.iconLarge}`,
      category: categorizeAugment(augment.name, augment.desc || augment.tooltip || ''),
      apiName: augment.apiName
    })).sort((a, b) => {
      // Sort by tier (prismatic, gold, silver) then by name
      const tierOrder = { 'prismatic': 0, 'gold': 1, 'silver': 2 };
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
      return tierDiff !== 0 ? tierDiff : a.name.localeCompare(b.name);
    });
  }, [categorizeAugment, mapRarityToTier]);

  // Load augment data from Community Dragon
  useEffect(() => {
    const loadAugments = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('https://raw.communitydragon.org/latest/cdragon/arena/en_us.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: CommunityDragonData = await response.json();
        
        if (data.augments && Array.isArray(data.augments)) {
          const processedAugments = processAugments(data.augments);
          
          setAugments(processedAugments);
          setFilteredAugments(processedAugments);
          
          addNotification({
            type: 'success',
            message: `Loaded ${processedAugments.length} augments from Community Dragon`,
          });
        } else {
          throw new Error('Invalid data structure received');
        }
      } catch (error) {
        console.error('Error loading augments:', error);
        addNotification({
          type: 'error',
          message: 'Failed to load augments from Community Dragon API',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAugments();
  }, []); // No dependencies to prevent infinite loop

  // Filter augments based on search and filters
  useEffect(() => {
    let filtered = augments;
        
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(augment =>
        augment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        augment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        augment.apiName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tier filter
    if (selectedTier !== 'all') {
      filtered = filtered.filter(augment => augment.tier === selectedTier);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(augment => augment.category === selectedCategory);
    }

    setFilteredAugments(filtered);
  }, [augments, searchTerm, selectedTier, selectedCategory]);

  // Get tier styling
  const getTierStyling = (tier: string) => {
    switch (tier) {
      case 'prismatic':
        return {
          border: 'border-purple-500/50',
          bg: 'bg-purple-500/10',
          glow: 'shadow-purple-500/20',
          text: 'text-purple-400',
          badge: 'bg-purple-500/20 text-purple-300'
        };
      case 'gold':
        return {
          border: 'border-yellow-500/50',
          bg: 'bg-yellow-500/10',
          glow: 'shadow-yellow-500/20',
          text: 'text-yellow-400',
          badge: 'bg-yellow-500/20 text-yellow-300'
        };
      case 'silver':
        return {
          border: 'border-gray-400/50',
          bg: 'bg-gray-500/10',
          glow: 'shadow-gray-400/20',
          text: 'text-gray-300',
          badge: 'bg-gray-500/20 text-gray-300'
        };
      default:
        return {
          border: 'border-gray-600',
          bg: 'bg-gray-800/30',
          glow: '',
          text: 'text-gray-300',
          badge: 'bg-gray-600/20 text-gray-400'
        };
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'damage': return '⚔️';
      case 'sustain': return '💚';
      case 'defense': return '🛡️';
      case 'mobility': return '💨';
      case 'utility': return '⚡';
      default: return '🔮';
    }
  };

  // Clean description text (remove template variables and extra formatting)
  const cleanDescription = (desc: string): string => {
    return desc
      .replace(/@[a-zA-Z0-9_{}]*\*?[0-9]*@/g, '') // Remove template variables like @f1@, @DamageStorePercentage*100@
      .replace(/\{\{[^}]*\}\}/g, '') // Remove {{keywords}}
      .replace(/<[^>]*?>/g, '') // Remove all HTML-like tags (both opening and closing)
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  };

  const categories = ['all', 'damage', 'sustain', 'defense', 'mobility', 'utility', 'other'];
  const tiers = ['all', 'prismatic', 'gold', 'silver'];

  // Get tier counts for display
  const tierCounts = React.useMemo(() => {
    const counts = { prismatic: 0, gold: 0, silver: 0 };
    augments.forEach(aug => counts[aug.tier]++);
    return counts;
  }, [augments]);

  return (
    <div className="p-6 min-h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-glow">Arena Augments</h1>
          <p className="text-gray-400">Browse all available augments for Arena mode</p>
          <p className="text-xs text-gray-500 mt-1">
            Data from <a href="https://raw.communitydragon.org/latest/cdragon/arena/en_us.json" 
                        className="text-blue-400 hover:text-blue-300 transition-colors" 
                        target="_blank" rel="noopener noreferrer">
              Community Dragon API
            </a>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-600">
        {/* Search */}
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search augments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
          />
        </div>

        {/* Tier Filter */}
          <div>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
          >
            {tiers.map(tier => (
              <option key={tier} value={tier}>
                {tier === 'all' ? 'All Tiers' : tier.charAt(0).toUpperCase() + tier.slice(1)}
              </option>
            ))}
          </select>
          </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : 
                 `${getCategoryIcon(category)} ${category.charAt(0).toUpperCase() + category.slice(1)}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          Showing {filteredAugments.length} of {augments.length} augments
        </span>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border border-purple-500 bg-purple-500/20"></div>
            <span>Prismatic ({tierCounts.prismatic})</span>
          </div>
                  <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border border-yellow-500 bg-yellow-500/20"></div>
            <span>Gold ({tierCounts.gold})</span>
          </div>
              <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border border-gray-400 bg-gray-500/20"></div>
            <span>Silver ({tierCounts.silver})</span>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading augments from Community Dragon...</p>
              </div>
            )}

      {/* No Results */}
      {!isLoading && filteredAugments.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-4">🔍</div>
          <p>No augments found matching your criteria</p>
          <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
        </div>
      )}

      {/* Augments Grid */}
      {!isLoading && filteredAugments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAugments.map((augment) => {
            const styling = getTierStyling(augment.tier);
            
            return (
              <div
                key={augment.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:scale-105 ${styling.border} ${styling.bg} ${styling.glow ? `hover:shadow-lg ${styling.glow}` : ''}`}
              >
                {/* Augment Image */}
                <div className="flex justify-center mb-3">
                  <img
                    src={augment.imageUrl}
                    alt={augment.name}
                    className="w-16 h-16 rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Fallback to small icon if large fails
                      const smallIconUrl = augment.imageUrl.replace('_large.png', '_small.png');
                      if (target.src !== smallIconUrl) {
                        target.src = smallIconUrl;
                      }
                    }}
                  />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${styling.badge}`}>
                      {augment.tier}
                    </span>
                  </div>
                  <span className="text-lg" title={augment.category}>
                    {getCategoryIcon(augment.category)}
                  </span>
                </div>

                {/* Name */}
                <h3 className={`font-semibold text-lg mb-2 ${styling.text}`}>
                  {augment.name}
                </h3>

                {/* API Name */}
                <p className="text-xs text-gray-500 mb-2 font-mono">
                  {augment.apiName}
                </p>

                {/* Description */}
                <p className="text-sm text-gray-300 leading-relaxed">
                  {cleanDescription(augment.description)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 