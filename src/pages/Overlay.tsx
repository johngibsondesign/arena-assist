import React, { useState, useEffect } from 'react';
import { supabaseService, ArenaAugment } from '../services/supabaseService';

interface OverlayAugment {
  name: string;
  pickRate: number;
  winRate: number;
  tier: 'S' | 'A' | 'B' | 'C';
  category: 'damage' | 'tank' | 'utility' | 'healing';
  recommendation: 'Highly Recommended' | 'Situational' | 'Avoid';
}

export default function Overlay() {
  const [overlayData, setOverlayData] = useState<OverlayAugment[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load real augment data from database
    const loadAugments = async () => {
      try {
        setIsLoading(true);
        const bestAugments = await supabaseService.getBestAugments(10); // Get top 10 augments
        
        // Convert to overlay format and take top 3 recommendations
        const overlayAugments: OverlayAugment[] = bestAugments
          .slice(0, 3) // Take top 3
          .map(augment => ({
            name: augment.augment_name,
            pickRate: augment.pick_rate * 100, // Convert to percentage
            winRate: augment.win_rate * 100,   // Convert to percentage
            tier: (augment.tier_rank || 'B') as 'S' | 'A' | 'B' | 'C',
            category: categorizeAugment(augment.augment_name, augment.description),
            recommendation: augment.win_rate > 0.65 ? 'Highly Recommended' : 
                          augment.win_rate > 0.55 ? 'Situational' : 'Avoid'
          }));

        setOverlayData(overlayAugments);
      } catch (error) {
        console.error('Failed to load overlay augments:', error);
        // Fallback to basic data
        setOverlayData([
          {
            name: 'Loading...',
            pickRate: 0,
            winRate: 0,
            tier: 'B',
            category: 'utility',
            recommendation: 'Situational'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAugments();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadAugments, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const categorizeAugment = (name: string, description: string): 'damage' | 'tank' | 'utility' | 'healing' => {
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
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S': return 'text-yellow-400 bg-yellow-400/20';
      case 'A': return 'text-green-400 bg-green-400/20';
      case 'B': return 'text-blue-400 bg-blue-400/20';
      case 'C': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Highly Recommended': return 'text-green-400';
      case 'Situational': return 'text-yellow-400';
      case 'Avoid': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'damage': return '⚔️';
      case 'tank': return '🛡️';
      case 'utility': return '🔧';
      case 'healing': return '💚';
      default: return '❓';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full h-full bg-gradient-to-br from-dark-900/95 to-dark-800/95 backdrop-blur-lg border border-primary-500/30 rounded-lg p-4 text-white shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-primary-400 flex items-center space-x-2">
          <span>🎯</span>
          <span>Augment Picks</span>
        </h3>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="text-slate-400 hover:text-white transition-colors text-sm"
            title="Hide overlay (F9 to toggle)"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {overlayData.map((augment, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-dark-800/50 rounded border border-dark-600 hover:border-primary-500/50 transition-all duration-200"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <span className="text-lg">{getCategoryIcon(augment.category)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm text-white truncate">
                    {augment.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getTierColor(augment.tier)}`}>
                    {augment.tier}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-300">
                    {augment.pickRate.toFixed(0)}% pick
                  </span>
                  <span className="text-green-400">
                    {augment.winRate.toFixed(0)}% win
                  </span>
                </div>
              </div>
            </div>
            <div className={`text-xs font-semibold ${getRecommendationColor(augment.recommendation)}`}>
              {augment.recommendation}
            </div>
          </div>
        ))}
      </div>

      {overlayData.length === 0 && !isLoading && (
        <div className="text-center py-6 text-slate-400">
          <div className="text-2xl mb-2">📡</div>
          <p className="text-sm">No augment data available</p>
          <p className="text-xs mt-1">Press F10 to detect augments</p>
        </div>
      )}

      <div className="text-center mt-3 pt-2 border-t border-dark-600">
        <p className="text-xs text-slate-500">
          Press F9 to toggle • F10 to scan • F11 for main window
        </p>
      </div>
    </div>
  );
} 