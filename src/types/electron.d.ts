declare global {
  interface Window {
    electronAPI?: {
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
      };
      // Auto-updater
      checkForUpdates: () => Promise<any>;
      // Auto-launch
      getAutoLaunchEnabled: () => Promise<boolean>;
      setAutoLaunchEnabled: (enabled: boolean) => Promise<boolean>;
      // Generic invoke for IPC
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

export {};
