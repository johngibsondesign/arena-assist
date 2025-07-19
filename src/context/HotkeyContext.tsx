import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useApp } from './AppContext';

interface HotkeyContextType {
  triggerAugmentDetection: () => void;
  triggerScreenCapture: () => Promise<string | null>;
}

const HotkeyContext = createContext<HotkeyContextType | null>(null);

export function HotkeyProvider({ children }: { children: ReactNode }) {
  const { dispatch } = useApp();

  const triggerAugmentDetection = async () => {
    try {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'info',
          message: 'Augment detection triggered! Analyzing screen...',
        },
      });

      // Trigger screen capture
      const screenshot = await triggerScreenCapture();
      
      if (screenshot) {
        // Process the screenshot with OCR (will implement this later)
        console.log('Screenshot captured for augment detection:', screenshot.substring(0, 100) + '...');
        
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            type: 'success',
            message: 'Screen captured successfully! Processing augments...',
          },
        });
      } else {
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            type: 'error',
            message: 'Failed to capture screen. Please try again.',
          },
        });
      }
    } catch (error) {
      console.error('Augment detection failed:', error);
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'error',
          message: 'Augment detection failed. Check console for details.',
        },
      });
    }
  };

  const triggerScreenCapture = async (): Promise<string | null> => {
    if (!window.electronAPI) {
      console.error('Electron API not available');
      return null;
    }

    try {
      return await window.electronAPI.captureScreen();
    } catch (error) {
      console.error('Screen capture failed:', error);
      return null;
    }
  };

  useEffect(() => {
    // Listen for hotkey events from main process
    if (window.electronAPI) {
      const handleHotkeyEvent = () => {
        triggerAugmentDetection();
      };

      window.electronAPI.on('trigger-augment-detection', handleHotkeyEvent);

      return () => {
        window.electronAPI.removeAllListeners('trigger-augment-detection');
      };
    }
  }, []);

  return (
    <HotkeyContext.Provider
      value={{
        triggerAugmentDetection,
        triggerScreenCapture,
      }}
    >
      {children}
    </HotkeyContext.Provider>
  );
}

export function useHotkeys() {
  const context = useContext(HotkeyContext);
  if (!context) {
    throw new Error('useHotkeys must be used within a HotkeyProvider');
  }
  return context;
} 