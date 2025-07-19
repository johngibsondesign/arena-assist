import { createWorker, Worker } from 'tesseract.js';
import augmentData from '../data/augments.json';

export interface DetectedText {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface AugmentMatch {
  augmentId: string;
  augmentName: string;
  confidence: number;
  pickRate: number;
  winRate: number;
  tier: string;
  category: string;
  isRecommended: boolean;
}

export class OcrService {
  private worker: Worker | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.worker = await createWorker('eng');
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 \'-',
        tessedit_pageseg_mode: '6', // Uniform block of text
      });
      this.isInitialized = true;
      console.log('OCR service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR service:', error);
      throw error;
    }
  }

  async recognizeText(imageData: string): Promise<DetectedText[]> {
    if (!this.worker) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      const { data } = await this.worker.recognize(imageData);
      
      return data.words?.map(word => ({
        text: word.text,
        confidence: word.confidence / 100, // Convert to 0-1 scale
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1,
        },
      })) || [];
    } catch (error) {
      console.error('Text recognition failed:', error);
      throw error;
    }
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const s1 = text1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = text2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;
    
    // Simple Levenshtein distance implementation
    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    
    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    const distance = matrix[s2.length][s1.length];
    const maxLen = Math.max(s1.length, s2.length);
    
    return 1 - (distance / maxLen);
  }

  private findAugmentMatches(detectedTexts: DetectedText[], threshold: number = 0.7): AugmentMatch[] {
    const matches: AugmentMatch[] = [];
    const { augments } = augmentData;
    
    // Combine nearby text elements to form potential augment names
    const combinedTexts: string[] = [];
    let currentLine = '';
    let lastY = -1;
    
    // Sort by Y position, then X position
    const sortedTexts = [...detectedTexts].sort((a, b) => {
      const yDiff = a.bbox.y0 - b.bbox.y0;
      if (Math.abs(yDiff) < 10) { // Same line threshold
        return a.bbox.x0 - b.bbox.x0;
      }
      return yDiff;
    });
    
    for (const detection of sortedTexts) {
      const yPos = detection.bbox.y0;
      
      if (lastY === -1 || Math.abs(yPos - lastY) < 10) {
        // Same line
        currentLine += (currentLine ? ' ' : '') + detection.text;
      } else {
        // New line
        if (currentLine.trim()) {
          combinedTexts.push(currentLine.trim());
        }
        currentLine = detection.text;
      }
      
      lastY = yPos;
    }
    
    if (currentLine.trim()) {
      combinedTexts.push(currentLine.trim());
    }
    
    // Match combined texts against augment database
    for (const text of combinedTexts) {
      for (const augment of augments) {
        const similarity = this.calculateTextSimilarity(text, augment.name);
        
        if (similarity >= threshold) {
          matches.push({
            augmentId: augment.id,
            augmentName: augment.name,
            confidence: similarity,
            pickRate: augment.pickRate,
            winRate: augment.winRate,
            tier: augment.tier,
            category: augment.category,
            isRecommended: false, // Will be set later
          });
        }
        
        // Also check against keywords
        for (const keyword of augment.keywords) {
          const keywordSimilarity = this.calculateTextSimilarity(text, keyword);
          if (keywordSimilarity >= 0.8) {
            const existingMatch = matches.find(m => m.augmentId === augment.id);
            if (!existingMatch) {
              matches.push({
                augmentId: augment.id,
                augmentName: augment.name,
                confidence: keywordSimilarity * 0.8, // Lower confidence for keyword matches
                pickRate: augment.pickRate,
                winRate: augment.winRate,
                tier: augment.tier,
                category: augment.category,
                isRecommended: false,
              });
            }
          }
        }
      }
    }
    
    // Remove duplicates and sort by confidence
    const uniqueMatches = matches.reduce((acc, current) => {
      const existing = acc.find(m => m.augmentId === current.augmentId);
      if (!existing || current.confidence > existing.confidence) {
        return acc.filter(m => m.augmentId !== current.augmentId).concat(current);
      }
      return acc;
    }, [] as AugmentMatch[]);
    
    // Sort by confidence and pick rate
    uniqueMatches.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) < 0.1) {
        return b.pickRate - a.pickRate; // Higher pick rate if confidence is similar
      }
      return confidenceDiff;
    });
    
    // Mark the best option as recommended
    if (uniqueMatches.length > 0) {
      uniqueMatches[0].isRecommended = true;
    }
    
    return uniqueMatches.slice(0, 3); // Return top 3 matches
  }

  async detectAugments(imageData: string, confidenceThreshold: number = 0.7): Promise<AugmentMatch[]> {
    try {
      console.log('Starting augment detection...');
      
      const detectedTexts = await this.recognizeText(imageData);
      console.log('Detected texts:', detectedTexts.map(t => t.text));
      
      const matches = this.findAugmentMatches(detectedTexts, confidenceThreshold);
      console.log('Found augment matches:', matches);
      
      return matches;
    } catch (error) {
      console.error('Augment detection failed:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  // Test method with mock data
  async testDetection(): Promise<AugmentMatch[]> {
    // Simulate OCR results for testing
    const mockDetectedTexts: DetectedText[] = [
      {
        text: "Starcaster's",
        confidence: 0.95,
        bbox: { x0: 100, y0: 50, x1: 200, y1: 70 }
      },
      {
        text: "Lament",
        confidence: 0.93,
        bbox: { x0: 205, y0: 50, x1: 260, y1: 70 }
      },
      {
        text: "Ancestral",
        confidence: 0.89,
        bbox: { x0: 300, y0: 50, x1: 380, y1: 70 }
      },
      {
        text: "Guidance",
        confidence: 0.91,
        bbox: { x0: 385, y0: 50, x1: 450, y1: 70 }
      },
      {
        text: "Tome",
        confidence: 0.87,
        bbox: { x0: 500, y0: 50, x1: 540, y1: 70 }
      },
      {
        text: "of",
        confidence: 0.95,
        bbox: { x0: 545, y0: 50, x1: 565, y1: 70 }
      },
      {
        text: "Warding",
        confidence: 0.88,
        bbox: { x0: 570, y0: 50, x1: 630, y1: 70 }
      }
    ];
    
    return this.findAugmentMatches(mockDetectedTexts);
  }
} 