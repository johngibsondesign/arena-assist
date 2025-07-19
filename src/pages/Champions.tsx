import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService, ArenaChampion, ArenaDuo, ArenaAugment, ArenaItem, ArenaSkillOrder, PrismaticItem } from '../services/supabaseService';

type ViewMode = 'list' | 'detail';

export default function Champions() {
  // Main data
  const [champions, setChampions] = useState<ArenaChampion[]>([]);
  const [duos, setDuos] = useState<ArenaDuo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<'solo' | 'duo'>('solo');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('tier_score');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  
  // Champion detail data
  const [selectedChampion, setSelectedChampion] = useState<ArenaChampion | null>(null);
  const [championAugments, setChampionAugments] = useState<ArenaAugment[]>([]);
  const [championItems, setChampionItems] = useState<ArenaItem[]>([]);
  const [championSkills, setChampionSkills] = useState<ArenaSkillOrder[]>([]);
  const [championPrismaticItems, setChampionPrismaticItems] = useState<PrismaticItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Modal state for augment descriptions
  const [selectedAugment, setSelectedAugment] = useState<ArenaAugment | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [championsData, duosData] = await Promise.all([
        supabaseService.getTopChampions(200), // Increased to get all champions
        supabaseService.getTopDuos(50)
      ]);
      setChampions(championsData);
      setDuos(duosData);
    } catch (error) {
      console.error('Failed to load champion data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChampionDetails = useCallback(async (champion: ArenaChampion) => {
    setSelectedChampion(champion);
    setViewMode('detail');
    setDetailLoading(true);
    
    // Clear previous data
    setChampionAugments([]);
    setChampionItems([]);
    setChampionSkills([]);

    try {
      console.log(`Loading details for champion: ${champion.name} (ID: ${champion.id})`);
      
      const [augments, items, skills, prismaticItems] = await Promise.all([
        supabaseService.getAugmentsByChampion(champion.id),
        supabaseService.getItemsByChampion(champion.id),
        supabaseService.getSkillOrderByChampion(champion.id),
        supabaseService.getPrismaticItemsByChampion(champion.id)
      ]);
      
      console.log(`Loaded ${augments.length} augments, ${items.length} items, ${skills.length} skills, ${prismaticItems.length} prismatic items for ${champion.name}`);
      
      setChampionAugments(augments);
      setChampionItems(items);
      setChampionSkills(skills);
      setChampionPrismaticItems(prismaticItems);
    } catch (error) {
      console.error('Failed to load champion details:', error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const goBackToList = () => {
    setViewMode('list');
    setSelectedChampion(null);
    setChampionAugments([]);
    setChampionItems([]);
    setChampionSkills([]);
    setSelectedAugment(null);
  };

  const openAugmentModal = (augment: ArenaAugment) => {
    setSelectedAugment(augment);
  };

  const closeAugmentModal = () => {
    setSelectedAugment(null);
  };

  // Filter, search, and sort logic
  const filteredChampions = champions
    .filter(champ => {
      const matchesSearch = champ.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = selectedTier === 'all' || champ.tier_rank === selectedTier;
      return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'tier_score':
          return b.tier_score - a.tier_score;
        case 'pick_rate':
          return b.pick_rate - a.pick_rate;
        case 'win_rate':
          return b.win_rate - a.win_rate;
        case 'ban_rate':
          return b.ban_rate - a.ban_rate;
        case 'games_count':
          return b.games_count - a.games_count;
        case 'kda':
          return b.kda - a.kda;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return b.tier_score - a.tier_score;
      }
    });

  const filteredDuos = duos.filter(duo => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return duo.champion1.toLowerCase().includes(query) || 
           duo.champion2.toLowerCase().includes(query);
  });

  // Utility functions
  const getTierStyling = (tier: string) => {
    switch (tier) {
      case 'S+': return { text: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/50' };
      case 'S': return { text: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/50' };
      case 'A': return { text: 'text-green-400', bg: 'bg-green-400/20', border: 'border-green-400/50' };
      case 'B': return { text: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/50' };
      case 'C': return { text: 'text-purple-400', bg: 'bg-purple-400/20', border: 'border-purple-400/50' };
      case 'D': return { text: 'text-gray-400', bg: 'bg-gray-400/20', border: 'border-gray-400/50' };
      default: return { text: 'text-gray-400', bg: 'bg-gray-400/20', border: 'border-gray-400/50' };
    }
  };

  const getAugmentTierStyling = (tier: string) => {
    switch (tier) {
      case 'prismatic': return { text: 'text-yellow-400', bg: 'bg-yellow-400/20' };
      case 'gold': return { text: 'text-orange-400', bg: 'bg-orange-400/20' };
      case 'silver': return { text: 'text-gray-300', bg: 'bg-gray-300/20' };
      default: return { text: 'text-gray-400', bg: 'bg-gray-400/20' };
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();
  const formatKDA = (kda: number) => kda.toFixed(2);
  
  // Helper function to convert augment names to Community Dragon format
  const getAugmentImageUrl = (augmentName: string) => {
    const cleanName = augmentName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
      + '_large.png';
    return `https://raw.communitydragon.org/15.14/game/assets/ux/cherry/augments/icons/${cleanName}`;
  };

  // Helper function to assign tier ranks to duos based on tier_score
  const getDuoTierRank = (tierScore: number) => {
    if (tierScore >= 90) return 'S+';
    if (tierScore >= 80) return 'S';
    if (tierScore >= 70) return 'A';
    if (tierScore >= 60) return 'B';
    if (tierScore >= 50) return 'C';
    return 'D';
  };

  const tabs = [
    { id: 'solo', label: 'Solo Queue', icon: '👤' },
    { id: 'duo', label: 'Duo Queue', icon: '👥' },
  ];

  const tiers = ['all', 'S+', 'S', 'A', 'B', 'C', 'D'];

  // Champion Detail View
  if (viewMode === 'detail' && selectedChampion) {
    const tierStyle = getTierStyling(selectedChampion.tier_rank);

    return (
      <div className="p-6 min-h-full">
        <div className="max-w-7xl mx-auto">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <img
                src={selectedChampion.image_url}
                alt={selectedChampion.name}
                className="w-16 h-16 rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${selectedChampion.name}.png`;
                }}
              />
              <div>
                <h1 className="text-3xl font-bold text-primary-400">{selectedChampion.name}</h1>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded font-bold ${tierStyle.text} ${tierStyle.bg} ${tierStyle.border} border`}>
                    {selectedChampion.tier_rank} Tier
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">Tier Score: {selectedChampion.tier_score.toFixed(1)}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={goBackToList}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <span>Back to Champions</span>
              <span>→</span>
            </button>
          </div>

          {detailLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading champion details...</p>
            </div>
          ) : (
                       <div className="grid lg:grid-cols-3 gap-6">
               {/* Left Column - Stats and Items */}
               <div className="lg:col-span-1 space-y-6">
                 {/* Performance Stats */}
                 <div className="bg-gray-800 rounded-lg p-6">
                   <h3 className="text-xl font-semibold text-primary-400 mb-4">Performance Stats</h3>
                   <div className="space-y-3">
                     <div className="flex justify-between">
                       <span className="text-gray-400">Pick Rate:</span>
                       <span className="text-primary-400 font-semibold">{formatPercentage(selectedChampion.pick_rate)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Ban Rate:</span>
                       <span className="text-red-400 font-semibold">{formatPercentage(selectedChampion.ban_rate)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Games Played:</span>
                       <span className="text-white font-semibold">{formatNumber(selectedChampion.games_count)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Average KDA:</span>
                       <span className="text-green-400 font-semibold">{formatKDA(selectedChampion.kda)}</span>
                     </div>
                   </div>
                 </div>

                 {/* Recommended Items - Reorganized */}
                 <div className="bg-gray-800 rounded-lg p-6">
                   <h3 className="text-xl font-semibold text-primary-400 mb-4">Recommended Items</h3>
                   {championItems.length > 0 ? (
                     <div className="space-y-4">
                       {/* Start Here - First Core Item */}
                       {(() => {
                         const coreItems = championItems.filter(item => item.item_category.toLowerCase().includes('core'));
                         const startingItem = coreItems.length > 0 ? coreItems.sort((a, b) => a.round_priority - b.round_priority)[0] : null;
                         
                         if (!startingItem) return null;
                         
                         return (
                           <div>
                             <h4 className="text-sm font-semibold text-green-400 mb-2">Start Here</h4>
                             <div className="bg-gray-700 p-2 rounded">
                               <div className="flex items-center space-x-3">
                                 <img
                                   src={startingItem.image_url}
                                   alt={startingItem.item_name}
                                   className="w-6 h-6 rounded"
                                   onError={(e) => {
                                     const target = e.target as HTMLImageElement;
                                     const itemName = startingItem.item_name.replace(/[^a-zA-Z0-9]/g, '');
                                     target.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/${itemName}.png`;
                                     target.onerror = () => { target.style.display = 'none'; };
                                   }}
                                 />
                                 <div className="flex-1">
                                   <div className="font-semibold text-white text-xs">{startingItem.item_name}</div>
                                   <div className="text-primary-400 text-xs">Pick Rate: {formatPercentage(startingItem.pick_rate)}</div>
                                 </div>
                               </div>
                             </div>
                           </div>
                         );
                       })()}

                       {/* Get some booty - Boots */}
                       {(() => {
                         const boots = championItems
                           .filter(item => item.item_category.toLowerCase().includes('boot'))
                           .sort((a, b) => b.pick_rate - a.pick_rate);
                         
                         if (boots.length === 0) return null;
                         
                         return (
                           <div>
                             <h4 className="text-sm font-semibold text-blue-400 mb-2">Get some booty</h4>
                             <div className="space-y-2">
                               {boots.map((item) => (
                                 <div key={item.id} className="flex items-center space-x-3 bg-gray-700 p-2 rounded">
                                   <img
                                     src={item.image_url}
                                     alt={item.item_name}
                                     className="w-6 h-6 rounded"
                                     onError={(e) => {
                                       const target = e.target as HTMLImageElement;
                                       const itemName = item.item_name.replace(/[^a-zA-Z0-9]/g, '');
                                       target.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/${itemName}.png`;
                                       target.onerror = () => { target.style.display = 'none'; };
                                     }}
                                   />
                                   <div className="flex-1">
                                     <div className="font-semibold text-white text-xs">{item.item_name}</div>
                                     <div className="text-primary-400 text-xs">Pick Rate: {formatPercentage(item.pick_rate)}</div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         );
                       })()}

                       {/* Core Items (excluding the starting item) */}
                       {(() => {
                         const coreItems = championItems.filter(item => item.item_category.toLowerCase().includes('core'));
                         const startingItem = coreItems.length > 0 ? coreItems.sort((a, b) => a.round_priority - b.round_priority)[0] : null;
                         const remainingCoreItems = startingItem ? coreItems.filter(item => item.id !== startingItem.id) : coreItems;
                         
                         if (remainingCoreItems.length === 0) return null;
                         
                         return (
                           <div>
                             <h4 className="text-sm font-semibold text-orange-400 mb-2">Core Items</h4>
                             <div className="space-y-2">
                               {remainingCoreItems
                                 .sort((a, b) => b.pick_rate - a.pick_rate)
                                 .map((item) => (
                                   <div key={item.id} className="flex items-center space-x-3 bg-gray-700 p-2 rounded">
                                     <img
                                       src={item.image_url}
                                       alt={item.item_name}
                                       className="w-6 h-6 rounded"
                                       onError={(e) => {
                                         const target = e.target as HTMLImageElement;
                                         const itemName = item.item_name.replace(/[^a-zA-Z0-9]/g, '');
                                         target.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/${itemName}.png`;
                                         target.onerror = () => { target.style.display = 'none'; };
                                       }}
                                     />
                                     <div className="flex-1">
                                       <div className="font-semibold text-white text-xs">{item.item_name}</div>
                                       <div className="text-primary-400 text-xs">Pick Rate: {formatPercentage(item.pick_rate)}</div>
                                     </div>
                                   </div>
                                 ))}
                             </div>
                           </div>
                         );
                       })()}

                       {/* Situational - ALL other items */}
                       {(() => {
                         const coreItems = championItems.filter(item => item.item_category.toLowerCase().includes('core'));
                         const boots = championItems.filter(item => item.item_category.toLowerCase().includes('boot'));
                         const coreAndBootIds = [...coreItems, ...boots].map(item => item.id);
                         
                         const situationalItems = championItems
                           .filter(item => !coreAndBootIds.includes(item.id))
                           .sort((a, b) => b.pick_rate - a.pick_rate);
                         
                         if (situationalItems.length === 0) return null;
                         
                         return (
                           <div>
                             <h4 className="text-sm font-semibold text-red-400 mb-2">Situational</h4>
                             <div className="space-y-2">
                               {situationalItems.map((item) => (
                                 <div key={item.id} className="flex items-center space-x-3 bg-gray-700 p-2 rounded">
                                   <img
                                     src={item.image_url}
                                     alt={item.item_name}
                                     className="w-6 h-6 rounded"
                                     onError={(e) => {
                                       const target = e.target as HTMLImageElement;
                                       const itemName = item.item_name.replace(/[^a-zA-Z0-9]/g, '');
                                       target.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/${itemName}.png`;
                                       target.onerror = () => { target.style.display = 'none'; };
                                     }}
                                   />
                                   <div className="flex-1">
                                     <div className="font-semibold text-white text-xs">{item.item_name}</div>
                                     <div className="text-primary-400 text-xs">Pick Rate: {formatPercentage(item.pick_rate)}</div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         );
                       })()}
                     </div>
                   ) : (
                     <p className="text-gray-400">No item data available</p>
                   )}
                 </div>
               </div>

               {/* Right Column - Skills and Augments */}
               <div className="lg:col-span-2 space-y-6">
                 {/* Skill Order - Compact Layout */}
                 <div className="bg-gray-800 rounded-lg p-6">
                   <h3 className="text-xl font-semibold text-primary-400 mb-4">Skill Order</h3>
                   {championSkills.length > 0 ? (
                     <div className="space-y-4">
                       {/* Skill Priority Display */}
                                                <div className="bg-gray-700 p-2 rounded-lg">
                           <div className="text-center">
                             <div className="text-xs text-gray-400 mb-1">Max Priority</div>
                             <div className="text-sm font-bold text-white">
                             {(() => {
                               // Group skills by key to find priority order
                               const skillCounts = championSkills.reduce((acc, skill) => {
                                 acc[skill.skill_key] = (acc[skill.skill_key] || 0) + 1;
                                 return acc;
                               }, {} as Record<string, number>);
                               
                               const sortedSkills = Object.entries(skillCounts)
                                 .sort(([,a], [,b]) => b - a)
                                 .map(([key]) => key);
                                 
                               return sortedSkills.join(' > ');
                             })()}
                           </div>
                         </div>
                       </div>
                       
                       {/* Skill Sequence - Compact Grid */}
                       <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2">
                         {championSkills
                           .sort((a, b) => a.level_num - b.level_num)
                           .map((skill, index) => (
                             <div key={skill.id} className="flex flex-col items-center bg-gray-700 p-2 rounded text-center">
                               <div className="text-primary-400 font-bold text-sm">{skill.level_num}</div>
                               <div className="bg-primary-500 text-white font-bold px-2 py-1 rounded text-xs">
                                 {skill.skill_key}
                               </div>
                             </div>
                           ))}
                       </div>
                     </div>
                   ) : (
                     <p className="text-gray-400">No skill order data available</p>
                   )}
                 </div>
                                 {/* Augments - Organized by Tier */}
                 <div className="bg-gray-800 rounded-lg p-6">
                   <h3 className="text-xl font-semibold text-primary-400 mb-4">Best Augments</h3>
                   {championAugments.length > 0 ? (
                     <div className="space-y-6">
                       {/* Prismatic Augments */}
                       {(() => {
                         const prismaticAugments = championAugments.filter(a => a.augment_tier === 'prismatic').sort((a, b) => b.pick_rate - a.pick_rate);
                         const topPrismatic = prismaticAugments.slice(0, 4);
                         
                         if (topPrismatic.length === 0) return null;
                         
                         return (
                           <div>
                             <div className="flex items-center space-x-2 mb-3">
                               <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                               <h4 className="text-lg font-semibold text-yellow-400">Prismatic</h4>
                               <span className="text-gray-400 text-sm">({topPrismatic.length})</span>
                             </div>
                             <div className="grid md:grid-cols-2 gap-3">
                               {topPrismatic.map((augment) => {
                                 const augmentTierStyle = getAugmentTierStyling(augment.augment_tier);
                                 const tierStyle = getTierStyling(augment.tier_rank);
                                 
                                 return (
                                   <div 
                                     key={augment.id} 
                                     onClick={() => openAugmentModal(augment)}
                                     className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                                   >
                                     <div className="flex items-start space-x-3">
                                                                               <img
                                          src={augment.image_url}
                                          alt={augment.augment_name}
                                          className="w-10 h-10 rounded"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = getAugmentImageUrl(augment.augment_name);
                                            target.onerror = () => {
                                              target.style.display = 'none';
                                            };
                                          }}
                                        />
                                       <div className="flex-1">
                                         <h5 className="font-semibold text-white text-sm mb-1">{augment.augment_name}</h5>
                                         <div className="flex items-center space-x-2 mb-1">
                                           <span className={`px-2 py-1 rounded text-xs font-bold ${tierStyle.text} ${tierStyle.bg}`}>
                                             {augment.tier_rank}
                                           </span>
                                           <span className="text-primary-400 text-xs">Pick Rate: {formatPercentage(augment.pick_rate)}</span>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                           </div>
                         );
                       })()}

                       {/* Gold Augments */}
                       {(() => {
                         const goldAugments = championAugments.filter(a => a.augment_tier === 'gold').sort((a, b) => b.pick_rate - a.pick_rate);
                         const topGold = goldAugments.slice(0, 4);
                         
                         if (topGold.length === 0) return null;
                         
                         return (
                           <div>
                             <div className="flex items-center space-x-2 mb-3">
                               <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
                               <h4 className="text-lg font-semibold text-orange-400">Gold</h4>
                               <span className="text-gray-400 text-sm">({topGold.length})</span>
                             </div>
                             <div className="grid md:grid-cols-2 gap-3">
                               {topGold.map((augment) => {
                                 const augmentTierStyle = getAugmentTierStyling(augment.augment_tier);
                                 const tierStyle = getTierStyling(augment.tier_rank);
                                 
                                 return (
                                   <div 
                                     key={augment.id} 
                                     onClick={() => openAugmentModal(augment)}
                                     className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                                   >
                                     <div className="flex items-start space-x-3">
                                       <img
                                         src={augment.image_url}
                                         alt={augment.augment_name}
                                         className="w-10 h-10 rounded"
                                         onError={(e) => {
                                           const target = e.target as HTMLImageElement;
                                           target.src = getAugmentImageUrl(augment.augment_name);
                                           target.onerror = () => {
                                             target.style.display = 'none';
                                           };
                                         }}
                                       />
                                       <div className="flex-1">
                                         <h5 className="font-semibold text-white text-sm mb-1">{augment.augment_name}</h5>
                                         <div className="flex items-center space-x-2 mb-1">
                                           <span className={`px-2 py-1 rounded text-xs font-bold ${tierStyle.text} ${tierStyle.bg}`}>
                                             {augment.tier_rank}
                                           </span>
                                           <span className="text-primary-400 text-xs">Pick Rate: {formatPercentage(augment.pick_rate)}</span>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                           </div>
                         );
                       })()}

                       {/* Silver Augments */}
                       {(() => {
                         const silverAugments = championAugments.filter(a => a.augment_tier === 'silver').sort((a, b) => b.pick_rate - a.pick_rate);
                         const topSilver = silverAugments.slice(0, 4);
                         
                         if (topSilver.length === 0) return null;
                         
                         return (
                           <div>
                             <div className="flex items-center space-x-2 mb-3">
                               <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                               <h4 className="text-lg font-semibold text-gray-300">Silver</h4>
                               <span className="text-gray-400 text-sm">({topSilver.length})</span>
                             </div>
                             <div className="grid md:grid-cols-2 gap-3">
                               {topSilver.map((augment) => {
                                 const augmentTierStyle = getAugmentTierStyling(augment.augment_tier);
                                 const tierStyle = getTierStyling(augment.tier_rank);
                                 
                                 return (
                                   <div 
                                     key={augment.id} 
                                     onClick={() => openAugmentModal(augment)}
                                     className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                                   >
                                     <div className="flex items-start space-x-3">
                                       <img
                                         src={augment.image_url}
                                         alt={augment.augment_name}
                                         className="w-10 h-10 rounded"
                                         onError={(e) => {
                                           const target = e.target as HTMLImageElement;
                                           target.src = getAugmentImageUrl(augment.augment_name);
                                           target.onerror = () => {
                                             target.style.display = 'none';
                                           };
                                         }}
                                       />
                                       <div className="flex-1">
                                         <h5 className="font-semibold text-white text-sm mb-1">{augment.augment_name}</h5>
                                         <div className="flex items-center space-x-2 mb-1">
                                           <span className={`px-2 py-1 rounded text-xs font-bold ${tierStyle.text} ${tierStyle.bg}`}>
                                             {augment.tier_rank}
                                           </span>
                                           <span className="text-primary-400 text-xs">Pick Rate: {formatPercentage(augment.pick_rate)}</span>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                           </div>
                         );
                       })()}

                       {/* Additional Augments - 3 Column Layout */}
                       {(() => {
                         const prismaticAugments = championAugments.filter(a => a.augment_tier === 'prismatic').sort((a, b) => b.pick_rate - a.pick_rate);
                         const goldAugments = championAugments.filter(a => a.augment_tier === 'gold').sort((a, b) => b.pick_rate - a.pick_rate);
                         const silverAugments = championAugments.filter(a => a.augment_tier === 'silver').sort((a, b) => b.pick_rate - a.pick_rate);
                         
                         const remainingPrismatic = prismaticAugments.slice(4);
                         const remainingGold = goldAugments.slice(4);
                         const remainingSilver = silverAugments.slice(4);
                         
                         const hasRemainingAugments = remainingPrismatic.length > 0 || remainingGold.length > 0 || remainingSilver.length > 0;
                         
                         if (!hasRemainingAugments) return null;
                         
                         return (
                           <div>
                             <div className="flex items-center space-x-2 mb-4">
                               <h4 className="text-lg font-semibold text-gray-400">More Augments</h4>
                               <span className="text-gray-400 text-sm">({remainingPrismatic.length + remainingGold.length + remainingSilver.length})</span>
                             </div>
                             
                             <div className="grid md:grid-cols-3 gap-4">
                               {/* Prismatic Column */}
                               <div>
                                 <div className="flex items-center space-x-2 mb-3">
                                   <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                   <h5 className="font-semibold text-yellow-400 text-sm">Prismatic ({remainingPrismatic.length})</h5>
                                 </div>
                                 <div className="space-y-2">
                                   {remainingPrismatic.map((augment) => (
                                     <div 
                                       key={augment.id} 
                                       onClick={() => openAugmentModal(augment)}
                                       className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                                     >
                                       <div className="flex items-center space-x-2">
                                         <img
                                           src={augment.image_url}
                                           alt={augment.augment_name}
                                           className="w-6 h-6 rounded"
                                           onError={(e) => {
                                             const target = e.target as HTMLImageElement;
                                             target.src = getAugmentImageUrl(augment.augment_name);
                                             target.onerror = () => {
                                               target.style.display = 'none';
                                             };
                                           }}
                                         />
                                         <div className="flex-1 min-w-0">
                                           <h6 className="font-semibold text-white text-xs truncate">{augment.augment_name}</h6>
                                           <div className="text-primary-400 text-xs">Pick Rate: {formatPercentage(augment.pick_rate)}</div>
                                         </div>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               </div>

                               {/* Gold Column */}
                               <div>
                                 <div className="flex items-center space-x-2 mb-3">
                                   <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                                   <h5 className="font-semibold text-orange-400 text-sm">Gold ({remainingGold.length})</h5>
                                 </div>
                                 <div className="space-y-2">
                                   {remainingGold.map((augment) => (
                                     <div 
                                       key={augment.id} 
                                       onClick={() => openAugmentModal(augment)}
                                       className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                                     >
                                       <div className="flex items-center space-x-2">
                                         <img
                                           src={augment.image_url}
                                           alt={augment.augment_name}
                                           className="w-6 h-6 rounded"
                                           onError={(e) => {
                                             const target = e.target as HTMLImageElement;
                                             target.src = getAugmentImageUrl(augment.augment_name);
                                             target.onerror = () => {
                                               target.style.display = 'none';
                                             };
                                           }}
                                         />
                                         <div className="flex-1 min-w-0">
                                           <h6 className="font-semibold text-white text-xs truncate">{augment.augment_name}</h6>
                                           <div className="text-primary-400 text-xs">Pick Rate: {formatPercentage(augment.pick_rate)}</div>
                                         </div>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               </div>

                               {/* Silver Column */}
                               <div>
                                 <div className="flex items-center space-x-2 mb-3">
                                   <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                   <h5 className="font-semibold text-gray-300 text-sm">Silver ({remainingSilver.length})</h5>
                                 </div>
                                 <div className="space-y-2">
                                   {remainingSilver.map((augment) => (
                                     <div 
                                       key={augment.id} 
                                       onClick={() => openAugmentModal(augment)}
                                       className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                                     >
                                       <div className="flex items-center space-x-2">
                                         <img
                                           src={augment.image_url}
                                           alt={augment.augment_name}
                                           className="w-6 h-6 rounded"
                                           onError={(e) => {
                                             const target = e.target as HTMLImageElement;
                                             target.src = getAugmentImageUrl(augment.augment_name);
                                             target.onerror = () => {
                                               target.style.display = 'none';
                                             };
                                           }}
                                         />
                                         <div className="flex-1 min-w-0">
                                           <h6 className="font-semibold text-white text-xs truncate">{augment.augment_name}</h6>
                                           <div className="text-primary-400 text-xs">Pick Rate: {formatPercentage(augment.pick_rate)}</div>
                                         </div>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             </div>
                           </div>
                         );
                       })()}
                     </div>
                   ) : (
                     <p className="text-gray-400">No augment data available</p>
                   )}
                 </div>

                 {/* Prismatic Items Tier List */}
                 <div className="bg-gray-800 rounded-lg p-6">
                   <h3 className="text-xl font-semibold text-primary-400 mb-4">Prismatic Item Tier List</h3>
                   {championPrismaticItems.length > 0 ? (
                     <div className="space-y-6">
                       {['S', 'A', 'B', 'C', 'D'].map(tier => {
                         const tierItems = championPrismaticItems.filter(item => item.tier_rank === tier);
                         if (tierItems.length === 0) return null;
                         
                         const getTierColor = (tier: string) => {
                           switch (tier) {
                             case 'S': return { bg: 'bg-red-500/20', text: 'text-red-400', indicator: 'bg-red-400' };
                             case 'A': return { bg: 'bg-orange-500/20', text: 'text-orange-400', indicator: 'bg-orange-400' };
                             case 'B': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', indicator: 'bg-yellow-400' };
                             case 'C': return { bg: 'bg-green-500/20', text: 'text-green-400', indicator: 'bg-green-400' };
                             case 'D': return { bg: 'bg-blue-500/20', text: 'text-blue-400', indicator: 'bg-blue-400' };
                             default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', indicator: 'bg-gray-400' };
                           }
                         };
                         
                         const tierStyle = getTierColor(tier);
                         
                         return (
                           <div key={tier}>
                             <div className="flex items-center space-x-2 mb-3">
                               <div className={`w-4 h-4 ${tierStyle.indicator} rounded-full`}></div>
                               <h4 className={`text-lg font-semibold ${tierStyle.text}`}>Tier {tier}</h4>
                               <span className="text-gray-400 text-sm">({tierItems.length})</span>
                             </div>
                             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                               {tierItems
                                 .sort((a, b) => a.tier_position - b.tier_position)
                                 .map((item) => (
                                 <div 
                                   key={item.id} 
                                   className={`${tierStyle.bg} p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors`}
                                 >
                                   <div className="flex items-start space-x-3">
                                     <div className="text-sm font-bold text-gray-400 min-w-[2rem]">
                                       #{item.tier_position}
                                     </div>
                                     
                                     {item.image_url && (
                                       <img
                                         src={item.image_url}
                                         alt={item.item_name}
                                         className="w-12 h-12 rounded-lg"
                                         onError={(e) => {
                                           (e.target as HTMLImageElement).style.display = 'none';
                                         }}
                                       />
                                     )}
                                     
                                     <div className="flex-1">
                                       <h5 className="font-semibold text-white text-sm mb-1">{item.item_name}</h5>
                                       {item.effect_summary && (
                                         <p className="text-gray-300 text-xs mb-2">{item.effect_summary}</p>
                                       )}
                                       {item.usage_notes && (
                                         <p className="text-gray-400 text-xs">
                                           💡 {item.usage_notes}
                                         </p>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   ) : (
                     <p className="text-gray-400">No prismatic item tier data available</p>
                   )}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="p-6 min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-400 mb-2">Champions</h1>
            <p className="text-slate-400">Arena champion statistics and tier rankings</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search champions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
          />
          <div className="absolute right-3 top-3 text-gray-400">
            🔍
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'solo' | 'duo')}
                className={`flex items-center space-x-2 px-6 py-3 rounded transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          
                    {/* Filters - Show on both tabs */}
          {(activeTab === 'solo' || activeTab === 'duo') && (
                        <div className="flex items-center space-x-4">
              {/* Tier Filter - Only for Solo */}
              {activeTab === 'solo' && (
          <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-400">Tier:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none"
                  >
                    {tiers.map(tier => (
                      <option key={tier} value={tier}>
                        {tier === 'all' ? 'All Tiers' : `${tier} Tier`}
                      </option>
                    ))}
            </select>
          </div>
              )}
              
              {/* Sort By - Only for Solo */}
              {activeTab === 'solo' && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-400">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none"
                  >
                    <option value="tier_score">Tier Score</option>
                    <option value="pick_rate">Pick Rate</option>
                    <option value="win_rate">Win Rate</option>
                    <option value="ban_rate">Ban Rate</option>
                    <option value="games_count">Games Played</option>
                    <option value="kda">Average KDA</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              )}

              {/* View Toggle - For both tabs */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-400">View:</span>
                <div className="flex bg-gray-700 rounded p-0.5">
                  <button
                    onClick={() => setViewType('grid')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      viewType === 'grid' 
                        ? 'bg-primary-500 text-white' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    ⊞ Grid
                  </button>
                  <button
                    onClick={() => setViewType('list')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      viewType === 'list' 
                        ? 'bg-primary-500 text-white' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    ☰ List
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading */}
                  {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading champion data...</p>
          </div>
        )}

        {/* Solo Tab */}
        {!isLoading && activeTab === 'solo' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-400">Solo Queue Champions</h2>
              <span className="text-sm text-gray-400">
                Showing {filteredChampions.length} of {champions.length} champions
                  </span>
                </div>

                        {/* Grid View */}
            {viewType === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredChampions.map((champion) => {
                  const tierStyle = getTierStyling(champion.tier_rank);
                  
                  return (
                  <div
                    key={champion.id}
                      onClick={() => {
                        console.log('Clicked champion:', champion.name, 'ID:', champion.id);
                        loadChampionDetails(champion);
                      }}
                      className={`p-4 rounded-lg border transition-all duration-200 hover:scale-105 cursor-pointer ${tierStyle.bg} ${tierStyle.border} hover:shadow-lg hover:border-primary-500/50 relative group`}
                      title={`Tier Score: ${champion.tier_score.toFixed(1)} • Games Played: ${formatNumber(champion.games_count)}`}
                    >
                      {/* Champion Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="relative">
                      <img 
                        src={champion.image_url} 
                        alt={champion.name}
                            className="w-12 h-12 rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.name}.png`;
                            }}
                          />
                          {/* Tier Badge on Image */}
                          <span className={`absolute -top-1 -right-3 px-1.5 py-0.5 rounded text-xs font-bold ${
                            champion.tier_rank === 'S+' ? 'text-black bg-yellow-400' :
                            champion.tier_rank === 'S' ? 'text-black bg-orange-400' :
                            champion.tier_rank === 'A' ? 'text-black bg-green-400' :
                            champion.tier_rank === 'B' ? 'text-white bg-blue-400' :
                            champion.tier_rank === 'C' ? 'text-white bg-purple-400' :
                            champion.tier_rank === 'D' ? 'text-white bg-gray-400' :
                            'text-white bg-gray-400'
                          } border border-gray-800 shadow-sm`}>
                            {champion.tier_rank}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-lg text-white">{champion.name}</h3>
                            <span className="px-2 py-1 rounded text-xs font-bold text-green-400 bg-green-400/20">
                              Win rate: {formatPercentage(champion.win_rate)}
                            </span>
                          </div>
                        </div>
                      </div>

                                            {/* Essential Stats - Card Style */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/10 border-l-3 border-primary-400 p-2 rounded-r">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <span className="text-primary-400 text-xs">↗</span>
                              <span className="text-gray-300 text-xs font-medium">Pick Rate</span>
                            </div>
                            <span className="text-primary-400 text-sm font-bold">
                              {formatPercentage(champion.pick_rate)}
                            </span>
                      </div>
                    </div>

                        <div className="bg-black/10 border-l-3 border-red-400 p-2 rounded-r">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <span className="text-red-400 text-xs">✕</span>
                              <span className="text-gray-300 text-xs font-medium">Ban Rate</span>
                            </div>
                            <span className="text-red-400 text-sm font-bold">
                              {formatPercentage(champion.ban_rate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Stats Row */}
                      <div className="grid grid-cols-2 gap-3 text-center text-sm mt-3">
                        <div>
                          <div className="text-yellow-400 font-bold">{champion.tier_score.toFixed(1)}</div>
                          <div className="text-gray-400 text-xs">Tier Score</div>
                        </div>
                        <div>
                          <div className="text-orange-400 font-bold">{formatKDA(champion.kda)}</div>
                          <div className="text-gray-400 text-xs">KDA</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {viewType === 'list' && (
              <div className="space-y-3">
                {filteredChampions.map((champion) => {
                  const tierStyle = getTierStyling(champion.tier_rank);
                  
                  return (
                    <div
                      key={champion.id}
                      onClick={() => {
                        console.log('Clicked champion:', champion.name, 'ID:', champion.id);
                        loadChampionDetails(champion);
                      }}
                      className={`p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] cursor-pointer ${tierStyle.bg} ${tierStyle.border} hover:shadow-lg hover:border-primary-500/50`}
                      title={`Tier Score: ${champion.tier_score.toFixed(1)} • Games Played: ${formatNumber(champion.games_count)}`}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Champion Image with Tier */}
                        <div className="relative flex-shrink-0">
                          <img 
                            src={champion.image_url} 
                            alt={champion.name}
                            className="w-16 h-16 rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.name}.png`;
                            }}
                          />
                          <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-xs font-bold ${
                            champion.tier_rank === 'S+' ? 'text-black bg-yellow-400' :
                            champion.tier_rank === 'S' ? 'text-black bg-orange-400' :
                            champion.tier_rank === 'A' ? 'text-black bg-green-400' :
                            champion.tier_rank === 'B' ? 'text-white bg-blue-400' :
                            champion.tier_rank === 'C' ? 'text-white bg-purple-400' :
                            champion.tier_rank === 'D' ? 'text-white bg-gray-400' :
                            'text-white bg-gray-400'
                          } border border-gray-800 shadow-sm`}>
                            {champion.tier_rank}
                    </span>
                  </div>

                        {/* Champion Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-xl text-white mb-1">{champion.name}</h3>
                          <span className="px-2 py-1 rounded text-sm font-bold text-green-400 bg-green-400/20">
                            {formatKDA(champion.kda)} KDA
                            </span>
                        </div>

                                                 {/* All Stats in List Format */}
                         <div className="flex items-center space-x-4">
                           <div className="text-center">
                             <div className="text-primary-400 text-base font-bold">{formatPercentage(champion.pick_rate)}</div>
                             <div className="text-gray-300 text-xs">Pick Rate</div>
                           </div>
                           <div className="text-center">
                             <div className="text-green-400 text-base font-bold">{formatPercentage(champion.win_rate)}</div>
                             <div className="text-gray-300 text-xs">Win Rate</div>
                           </div>
                           <div className="text-center">
                             <div className="text-red-400 text-base font-bold">{formatPercentage(champion.ban_rate)}</div>
                             <div className="text-gray-300 text-xs">Ban Rate</div>
                           </div>
                           <div className="text-center">
                             <div className="text-yellow-400 text-base font-bold">{champion.tier_score.toFixed(1)}</div>
                             <div className="text-gray-300 text-xs">Tier Score</div>
                           </div>
                           <div className="text-center">
                             <div className="text-blue-400 text-base font-bold">{formatNumber(champion.games_count)}</div>
                             <div className="text-gray-300 text-xs">Games</div>
                           </div>
                           <div className="text-center">
                             <div className="text-orange-400 text-base font-bold">{formatKDA(champion.kda)}</div>
                             <div className="text-gray-300 text-xs">KDA</div>
                           </div>
                         </div>
                      </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
            )}

                {/* Duo Tab */}
        {!isLoading && activeTab === 'duo' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-400">Duo Queue Combinations</h2>
              <span className="text-sm text-gray-400">
                Showing {filteredDuos.length} duo combinations
              </span>
        </div>

            {/* Organize duos by tiers */}
            {['S+', 'S', 'A', 'B', 'C', 'D'].map(tierRank => {
              const duosInTier = filteredDuos.filter(duo => getDuoTierRank(duo.tier_score) === tierRank);
              if (duosInTier.length === 0) return null;

              const tierStyle = getTierStyling(tierRank);

              return (
                <div key={tierRank} className="space-y-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded ${tierStyle.bg} ${tierStyle.border} border flex items-center justify-center`}>
                      <span className={`text-xs font-bold ${tierStyle.text}`}>{tierRank}</span>
                    </div>
                    <h3 className={`text-lg font-semibold ${tierStyle.text}`}>{tierRank} Tier Duos</h3>
                    <span className="text-gray-400 text-sm">({duosInTier.length})</span>
                  </div>

                  {/* Grid View */}
                  {viewType === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {duosInTier.map((duo) => {
                        const duoTierStyle = getTierStyling(getDuoTierRank(duo.tier_score));
                        return (
                          <div
                            key={duo.id}
                            className={`p-4 rounded-lg border transition-all duration-200 hover:scale-105 ${duoTierStyle.bg} ${duoTierStyle.border}`}
                          >
                            {/* Win Rate Badge */}
                            <div className="flex justify-center mb-3">
                              <span className="px-3 py-1 rounded text-sm font-bold text-green-400 bg-green-400/20">
                                Win rate: {formatPercentage(duo.win_rate)}
                              </span>
                            </div>

                            {/* Duo Champions */}
                            <div className="flex items-center justify-center space-x-3 mb-4">
                              <div className="flex items-center space-x-2">
                                <img
                                  src={duo.champion1_image_url}
                                  alt={duo.champion1}
                                  className="w-10 h-10 rounded"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${duo.champion1}.png`;
                                  }}
                                />
                                <span className="font-semibold text-white text-sm">{duo.champion1}</span>
                              </div>
                              
                              <div className="text-primary-400 font-bold">+</div>
                              
                              <div className="flex items-center space-x-2">
                                <img
                                  src={duo.champion2_image_url}
                                  alt={duo.champion2}
                                  className="w-10 h-10 rounded"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${duo.champion2}.png`;
                                  }}
                                />
                                <span className="font-semibold text-white text-sm">{duo.champion2}</span>
                              </div>
                            </div>

                            {/* Duo Stats */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-black/10 border-l-3 border-primary-400 p-2 rounded-r">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-primary-400 text-xs">↗</span>
                                    <span className="text-gray-300 text-xs font-medium">Pick Rate</span>
                                  </div>
                                  <span className="text-primary-400 text-sm font-bold">
                                    {formatPercentage(duo.pick_rate)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="bg-black/10 border-l-3 border-yellow-400 p-2 rounded-r">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-yellow-400 text-xs">★</span>
                                    <span className="text-gray-300 text-xs font-medium">Tier Score</span>
                                  </div>
                                  <span className="text-yellow-400 text-sm font-bold">
                                    {duo.tier_score.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* List View */}
                  {viewType === 'list' && (
                    <div className="space-y-3">
                      {duosInTier.map((duo) => {
                        const duoTierStyle = getTierStyling(getDuoTierRank(duo.tier_score));
                        return (
                          <div
                            key={duo.id}
                            className={`p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${duoTierStyle.bg} ${duoTierStyle.border}`}
                          >
                            <div className="flex items-center space-x-6">
                              {/* Duo Champions */}
                              <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <img 
                      src={duo.champion1_image_url} 
                      alt={duo.champion1}
                                    className="w-12 h-12 rounded"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${duo.champion1}.png`;
                                    }}
                                  />
                                  <span className="font-semibold text-white text-base">{duo.champion1}</span>
                                </div>
                                
                                <div className="text-primary-400 font-bold text-lg">+</div>
                                
                                <div className="flex items-center space-x-2">
                    <img 
                      src={duo.champion2_image_url} 
                      alt={duo.champion2}
                                    className="w-12 h-12 rounded"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${duo.champion2}.png`;
                                    }}
                                  />
                                  <span className="font-semibold text-white text-base">{duo.champion2}</span>
                                </div>
                              </div>

                              {/* Stats in List Format */}
                              <div className="flex items-center space-x-6 ml-auto">
                                <div className="text-center">
                                  <div className="text-primary-400 text-base font-bold">{formatPercentage(duo.pick_rate)}</div>
                                  <div className="text-gray-300 text-xs">Pick Rate</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-green-400 text-base font-bold">{formatPercentage(duo.win_rate)}</div>
                                  <div className="text-gray-300 text-xs">Win Rate</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-yellow-400 text-base font-bold">{duo.tier_score.toFixed(1)}</div>
                                  <div className="text-gray-300 text-xs">Tier Score</div>
                                </div>
                              </div>
                            </div>
                  </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* No Data */}
        {!isLoading && ((activeTab === 'solo' && filteredChampions.length === 0) || (activeTab === 'duo' && filteredDuos.length === 0)) && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">📊</div>
            <p>No {activeTab} data found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Augment Description Modal */}
        {selectedAugment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedAugment.image_url}
                      alt={selectedAugment.augment_name}
                      className="w-12 h-12 rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getAugmentImageUrl(selectedAugment.augment_name);
                        target.onerror = () => {
                          target.style.display = 'none';
                        };
                      }}
                    />
                    <div>
                      <h3 className="text-lg font-bold text-white">{selectedAugment.augment_name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getAugmentTierStyling(selectedAugment.augment_tier).text} ${getAugmentTierStyling(selectedAugment.augment_tier).bg}`}>
                          {selectedAugment.augment_tier}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getTierStyling(selectedAugment.tier_rank).text} ${getTierStyling(selectedAugment.tier_rank).bg}`}>
                          {selectedAugment.tier_rank}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeAugmentModal}
                    className="text-gray-400 hover:text-white text-xl font-bold leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Stats */}
                <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-400">Pick Rate: <span className="text-primary-400 font-semibold">{formatPercentage(selectedAugment.pick_rate)}</span></div>
                  {selectedAugment.tier_position && (
                    <div className="text-sm text-gray-400">Tier Position: <span className="text-yellow-400 font-semibold">#{selectedAugment.tier_position}</span></div>
                  )}
                </div>

                {/* Description */}
                {selectedAugment.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-primary-400 mb-2">Description</h4>
                    <div className="text-sm text-gray-300 leading-relaxed bg-gray-700 p-3 rounded-lg">
                      {selectedAugment.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 