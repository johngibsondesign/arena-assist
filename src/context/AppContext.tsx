import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiKeys } from '../config/apiKeys';

// Types
interface GameState {
  isInGame: boolean;
  gameMode: string | null;
  champion: string | null;
  teamMate: string | null;
  matchId: string | null;
}

interface AppState {
  // Game state
  game: GameState;
  
  // Settings
  settings: {
    hotkeys: {
      augmentDetection: string;
      overlayToggle: string;
      mainWindow: string;
    };
    overlay: {
      enabled: boolean;
      clickThrough: boolean;
      position: { x: number; y: number };
    };
    voice: {
      enabled: boolean;
      autoJoin: boolean;
      micGain: number;
      speakerVolume: number;
    };
    api: {
      riotApiKey: string;
      openAiApiKey: string;
      supabaseUrl: string;
      supabaseKey: string;
    };
  };
  
  // UI state
  ui: {
    sidebarCollapsed: boolean;
    currentPage: string;
    notifications: Array<{
      id: string;
      type: 'info' | 'success' | 'warning' | 'error';
      message: string;
      timestamp: number;
    }>;
  };
  
  // Feature states
  features: {
    overlayEnabled: boolean;
    ocrEnabled: boolean;
    voiceChatEnabled: boolean;
  };
  
  // Match data
  matches: Array<{
    id: string;
    gameMode: string;
    champion: string;
    augments: string[];
    items: string[];
    placement: number;
    duration: number;
    timestamp: number;
  }>;
}

// Action types
type AppAction =
  | { type: 'SET_GAME_STATE'; payload: Partial<GameState> }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<AppState['ui']['notifications'][0], 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'ADD_MATCH'; payload: AppState['matches'][0] }
  | { type: 'CLEAR_MATCHES' }
  | { type: 'LOAD_PERSISTENT_DATA'; payload: Partial<AppState> };

// Initial state
const initialState: AppState = {
  game: {
    isInGame: false,
    gameMode: null,
    champion: null,
    teamMate: null,
    matchId: null,
  },
  settings: {
    hotkeys: {
      augmentDetection: 'CommandOrControl+Shift+A',
      overlayToggle: 'CommandOrControl+Shift+O',
      mainWindow: 'CommandOrControl+Shift+M',
    },
    overlay: {
      enabled: true,
      clickThrough: true,
      position: { x: 0, y: 50 },
    },
    voice: {
      enabled: true,
      autoJoin: true,
      micGain: 0.8,
      speakerVolume: 0.8,
    },
          api: {
        riotApiKey: apiKeys.RIOT_API_KEY,
        openAiApiKey: apiKeys.OPENAI_API_KEY,
        supabaseUrl: apiKeys.SUPABASE_URL,
        supabaseKey: apiKeys.SUPABASE_KEY,
      },
  },
  ui: {
    sidebarCollapsed: false,
    currentPage: 'home',
    notifications: [],
  },
  features: {
    overlayEnabled: true,
    ocrEnabled: true,
    voiceChatEnabled: true,
  },
  matches: [],
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return {
        ...state,
        game: { ...state.game, ...action.payload },
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed },
      };

    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        ui: { ...state.ui, currentPage: action.payload },
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [
            ...state.ui.notifications,
            {
              ...action.payload,
              id: Date.now().toString(),
              timestamp: Date.now(),
            },
          ],
        },
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.payload),
        },
      };

    case 'ADD_MATCH':
      return {
        ...state,
        matches: [action.payload, ...state.matches].slice(0, 10), // Keep only last 10 matches
      };

    case 'CLEAR_MATCHES':
      return {
        ...state,
        matches: [],
      };

    case 'LOAD_PERSISTENT_DATA':
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persistent data on mount
  useEffect(() => {
    const loadData = async () => {
      if (window.electronAPI) {
        try {
          const persistedSettings = await window.electronAPI.store.get('settings');
          const persistedMatches = await window.electronAPI.store.get('matches');
          
          if (persistedSettings || persistedMatches) {
            dispatch({
              type: 'LOAD_PERSISTENT_DATA',
              payload: {
                settings: persistedSettings || initialState.settings,
                matches: persistedMatches || initialState.matches,
              },
            });
          }
        } catch (error) {
          console.error('Failed to load persistent data:', error);
        }
      }
    };

    loadData();
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.store.set('settings', state.settings).catch(console.error);
    }
  }, [state.settings]);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.store.set('matches', state.matches).catch(console.error);
    }
  }, [state.matches]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Selector hooks for specific parts of state
export function useGameState() {
  const { state } = useApp();
  return state.game;
}

export function useSettings() {
  const { state, dispatch } = useApp();
  return {
    settings: state.settings,
    updateSettings: (newSettings: Partial<AppState['settings']>) =>
      dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings }),
  };
}

export function useNotifications() {
  const { state, dispatch } = useApp();
  return {
    notifications: state.ui.notifications,
    addNotification: (notification: Omit<AppState['ui']['notifications'][0], 'id' | 'timestamp'>) =>
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    removeNotification: (id: string) =>
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
  };
} 