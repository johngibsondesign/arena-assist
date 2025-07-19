const { contextBridge, ipcRenderer } = require('electron');

interface ElectronAPI {
  // Store operations
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
  
  // Overlay operations
  overlay: {
    show: () => Promise<void>;
    hide: () => Promise<void>;
    toggleClickThrough: (enabled: boolean) => Promise<void>;
  };
  
  // Screen capture
  captureScreen: () => Promise<string | null>;
  
  // Dialog operations
  showMessageBox: (options: any) => Promise<any>;
  
  // Event listeners
  on: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
  
  // Window controls
  windowControls: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App version
  getVersion: () => ipcRenderer.invoke('app-version'),

  // File operations
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  showMessageBox: (options: any) => ipcRenderer.invoke('show-message-box', options),

  // Store operations (electron-store)
  store: {
    get: (key: string) => ipcRenderer.invoke('get-store-value', key),
    set: (key: string, value: any) => ipcRenderer.invoke('set-store-value', key, value),
    delete: (key: string) => ipcRenderer.invoke('delete-store-value', key),
  },

  // Event listeners
  on: (channel: string, callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
  
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // Window controls
  windowControls: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  },

  // Send messages to main process
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  }
});

// Also expose some Node.js globals that might be useful
contextBridge.exposeInMainWorld('nodeAPI', {
  process: {
    platform: process.platform,
    versions: process.versions
  }
});

// Export types for the renderer 