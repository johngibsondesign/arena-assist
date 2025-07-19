import React, { useState, useEffect } from 'react';
import { supabaseService, PrismaticItem } from '../services/supabaseService';

interface PrismaticItemForm {
  champion_id: string;
  item_name: string;
  image_url: string;
  tier_rank: 'S' | 'A' | 'B' | 'C' | 'D';
  tier_position: number;
  description?: string;
  effect_summary?: string;
  usage_notes?: string;
}

export const PrismaticItemsManager: React.FC = () => {
  const [items, setItems] = useState<PrismaticItem[]>([]);
  const [selectedChampion, setSelectedChampion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<PrismaticItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<PrismaticItemForm>({
    champion_id: '',
    item_name: '',
    image_url: '',
    tier_rank: 'S',
    tier_position: 1,
    description: '',
    effect_summary: '',
    usage_notes: ''
  });

  const champions = [
    'Aatrox', 'Ahri', 'Akali', 'Akshan', 'Alistar', 'Ammu', 'Anivia', 'Annie', 'Aphelios', 'Ashe',
    'AurelionSol', 'Azir', 'Bard', 'Blitzcrank', 'Brand', 'Braum', 'Caitlyn', 'Camille', 'Cassiopeia',
    'Chogath', 'Corki', 'Darius', 'Diana', 'Draven', 'DrMundo', 'Ekko', 'Elise', 'Evelynn', 'Ezreal',
    'Fiddlesticks', 'Fiora', 'Fizz', 'Galio', 'Gangplank', 'Garen', 'Gnar', 'Gragas', 'Graves',
    'Gwen', 'Hecarim', 'Heimerdinger', 'Illaoi', 'Irelia', 'Ivern', 'Janna', 'JarvanIV', 'Jax',
    'Jayce', 'Jhin', 'Jinx', 'Kaisa', 'Kalista', 'Karma', 'Karthus', 'Kassadin', 'Katarina',
    'Kayle', 'Kayn', 'Kennen', 'Khazix', 'Kindred', 'Kled', 'KogMaw', 'Leblanc', 'LeeSin',
    'Leona', 'Lillia', 'Lissandra', 'Lucian', 'Lulu', 'Lux', 'Malphite', 'Malzahar', 'Maokai',
    'MasterYi', 'MissFortune', 'Mordekaiser', 'Morgana', 'Nami', 'Nasus', 'Nautilus', 'Neeko',
    'Nidalee', 'Nocturne', 'Nunu', 'Olaf', 'Orianna', 'Ornn', 'Pantheon', 'Poppy', 'Pyke',
    'Qiyana', 'Quinn', 'Rakan', 'Rammus', 'RekSai', 'Rell', 'Renekton', 'Rengar', 'Riven',
    'Rumble', 'Ryze', 'Samira', 'Sejuani', 'Senna', 'Seraphine', 'Sett', 'Shaco', 'Shen',
    'Shyvana', 'Singed', 'Sion', 'Sivir', 'Skarner', 'Sona', 'Soraka', 'Swain', 'Sylas',
    'Syndra', 'TahmKench', 'Taliyah', 'Talon', 'Taric', 'Teemo', 'Thresh', 'Tristana', 'Trundle',
    'Tryndamere', 'TwistedFate', 'Twitch', 'Udyr', 'Urgot', 'Varus', 'Vayne', 'Veigar', 'Velkoz',
    'Vex', 'Vi', 'Viego', 'Viktor', 'Vladimir', 'Volibear', 'Warwick', 'Wukong', 'Xayah',
    'Xerath', 'XinZhao', 'Yasuo', 'Yone', 'Yorick', 'Yuumi', 'Zac', 'Zed', 'Ziggs', 'Zilean',
    'Zoe', 'Zyra'
  ];

  const loadItems = async (championId: string) => {
    if (!championId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseService.getPrismaticItemsByChampion(championId);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingItem) {
        const success = await supabaseService.updatePrismaticItem(editingItem.id, formData);
        if (success) {
          await loadItems(selectedChampion);
          setEditingItem(null);
          setShowForm(false);
          resetForm();
        } else {
          setError('Failed to update item');
        }
      } else {
        const success = await supabaseService.addPrismaticItem(formData);
        if (success) {
          await loadItems(selectedChampion);
          setShowForm(false);
          resetForm();
        } else {
          setError('Failed to add item');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setLoading(true);
    try {
      const success = await supabaseService.deletePrismaticItem(id);
      if (success) {
        await loadItems(selectedChampion);
      } else {
        setError('Failed to delete item');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      champion_id: selectedChampion,
      item_name: '',
      image_url: '',
      tier_rank: 'S',
      tier_position: 1,
      description: '',
      effect_summary: '',
      usage_notes: ''
    });
  };

  const startEdit = (item: PrismaticItem) => {
    setEditingItem(item);
    setFormData({
      champion_id: item.champion_id,
      item_name: item.item_name,
      image_url: item.image_url,
      tier_rank: item.tier_rank,
      tier_position: item.tier_position,
      description: item.description || '',
      effect_summary: item.effect_summary || '',
      usage_notes: item.usage_notes || ''
    });
    setShowForm(true);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S': return 'text-red-400 bg-red-500/20';
      case 'A': return 'text-orange-400 bg-orange-500/20';
      case 'B': return 'text-yellow-400 bg-yellow-500/20';
      case 'C': return 'text-green-400 bg-green-500/20';
      case 'D': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  useEffect(() => {
    if (selectedChampion) {
      loadItems(selectedChampion);
      setFormData(prev => ({ ...prev, champion_id: selectedChampion }));
    }
  }, [selectedChampion]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-400 mb-2">Prismatic Items Manager</h1>
        <p className="text-slate-400">Manage tier list data for prismatic items per champion</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Champion Selection */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Select Champion</h2>
        <select
          value={selectedChampion}
          onChange={(e) => setSelectedChampion(e.target.value)}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
        >
          <option value="">Choose a champion...</option>
          {champions.map(champion => (
            <option key={champion} value={champion}>{champion}</option>
          ))}
        </select>
      </div>

      {selectedChampion && (
        <>
          {/* Controls */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
                resetForm();
              }}
              className="btn-primary"
            >
              ➕ Add New Item
            </button>
            <button
              onClick={() => loadItems(selectedChampion)}
              disabled={loading}
              className="btn-secondary"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="card mb-8">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Item Name</label>
                    <input
                      type="text"
                      value={formData.item_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                      className="input-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Image URL</label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      className="input-primary"
                      placeholder="https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tier Rank</label>
                    <select
                      value={formData.tier_rank}
                      onChange={(e) => setFormData(prev => ({ ...prev, tier_rank: e.target.value as any }))}
                      className="input-primary"
                    >
                      <option value="S">S - Best</option>
                      <option value="A">A - Great</option>
                      <option value="B">B - Good</option>
                      <option value="C">C - Average</option>
                      <option value="D">D - Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Position in Tier</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.tier_position}
                      onChange={(e) => setFormData(prev => ({ ...prev, tier_position: parseInt(e.target.value) }))}
                      className="input-primary"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Effect Summary</label>
                  <input
                    type="text"
                    value={formData.effect_summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, effect_summary: e.target.value }))}
                    className="input-primary"
                    placeholder="Brief summary of the item effect"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-primary h-24"
                    placeholder="Detailed description of the item"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Usage Notes</label>
                  <textarea
                    value={formData.usage_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, usage_notes: e.target.value }))}
                    className="input-primary h-24"
                    placeholder="Notes on when/how to use this item"
                  />
                </div>

                <div className="flex gap-4">
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingItem(null);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Items List */}
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">
              Prismatic Items for {selectedChampion} ({items.length})
            </h3>
            
            {loading && !showForm ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Loading items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No prismatic items found for this champion.</p>
                <p className="text-sm text-slate-500 mt-2">Add some items to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {['S', 'A', 'B', 'C', 'D'].map(tier => {
                  const tierItems = items.filter(item => item.tier_rank === tier);
                  if (tierItems.length === 0) return null;
                  
                  return (
                    <div key={tier} className="border border-dark-600 rounded-lg p-4">
                      <h4 className={`text-lg font-bold mb-3 px-3 py-1 rounded-lg inline-block ${getTierColor(tier)}`}>
                        Tier {tier}
                      </h4>
                      <div className="grid gap-3">
                        {tierItems
                          .sort((a, b) => a.tier_position - b.tier_position)
                          .map(item => (
                          <div key={item.id} className="bg-dark-700/50 rounded-lg p-4 flex items-center gap-4">
                            <div className="text-sm font-bold text-slate-400 w-8">
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
                              <h5 className="font-semibold text-slate-200">{item.item_name}</h5>
                              {item.effect_summary && (
                                <p className="text-sm text-slate-400 mt-1">{item.effect_summary}</p>
                              )}
                              {item.usage_notes && (
                                <p className="text-xs text-slate-500 mt-1">💡 {item.usage_notes}</p>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEdit(item)}
                                className="text-blue-400 hover:text-blue-300 p-2"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-400 hover:text-red-300 p-2"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PrismaticItemsManager;
