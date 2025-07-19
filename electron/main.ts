import { app, BrowserWindow, globalShortcut, ipcMain, screen, shell, dialog, Tray, Menu, nativeImage } from 'electron';
import { autoUpdater } from 'electron-updater';
import { join } from 'node:path';
import Store from 'electron-store';
import AutoLaunch from 'auto-launch';

// Initialize persistent store
const store = new Store();

// Window references
let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Auto-launch setup
const autoLauncher = new AutoLaunch({
  name: 'Arena Assist',
  path: process.execPath,
  isHidden: true, // Start minimized to tray
});

const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// Configure auto-updater
autoUpdater.checkForUpdatesAndNotify();
autoUpdater.autoDownload = false; // We want to ask user first

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
  
  // Show update dialog to user
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available!`,
      detail: 'Would you like to download and install it now?',
      buttons: ['Download & Install', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  }
});

autoUpdater.on('update-not-available', () => {
  console.log('Update not available');
});

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(log_message);
  
  // Optionally show progress to user via notification or main window
});

autoUpdater.on('update-downloaded', () => {
  console.log('Update downloaded');
  
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded successfully!',
      detail: 'The application will restart to apply the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }
});

function createMainWindow(): void {
  console.log('Creating main window...');
  
  // Prevent creating multiple main windows
  if (mainWindow) {
    console.log('Main window already exists, focusing existing window');
    mainWindow.focus();
    return;
  }
  
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    title: 'Arena Assist',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    x: Math.floor((width - 1200) / 2),
    y: Math.floor((height - 800) / 2),
    frame: false, // Remove default title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev
    },
    icon: join(__dirname, '../assets/icon.png'),
    show: false, // Don't show initially
  });

  // Handle permissions for microphone and camera (needed for WebRTC voice chat)
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log('Permission requested:', permission);
    
    // Allow media access for voice chat functionality (covers microphone and camera)
    if (permission === 'media') {
      console.log('Granting media permission for voice chat');
      callback(true);
    } else if (permission === 'display-capture') {
      console.log('Granting display-capture permission for screen sharing');
      callback(true);
    } else {
      console.log(`Denying ${permission} permission`);
      callback(false);
    }
  });

  // Load the app
  if (isDev && VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/renderer/index.html'));
  }

  // Security: Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Hide to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Main window ready to show, arguments:', process.argv);
    // Only show if not launched minimized
    if (!process.argv.includes('--hidden')) {
      console.log('Showing main window');
      mainWindow?.show();
    } else {
      console.log('Window launched hidden');
    }
  });
}

function createOverlayWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay();
  
  const overlay = new BrowserWindow({
    width: 400,
    height: 300,
    x: primaryDisplay.bounds.width - 420,
    y: 20,
    alwaysOnTop: true,
    frame: false,
    titleBarStyle: 'hidden',
    resizable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    show: false, // Keep hidden by default
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load overlay route
  if (isDev && VITE_DEV_SERVER_URL) {
    overlay.loadURL(`${VITE_DEV_SERVER_URL}#/overlay`);
  } else {
    overlay.loadFile(join(__dirname, '../dist/renderer/index.html'), {
      hash: 'overlay'
    });
  }

  // Don't show automatically - controlled by hotkeys and tray menu

  return overlay;
}

function createTray(): void {
  // Create tray icon (you can replace this with a proper icon file)
  const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVFiFtZddaBxVFMd/Z2Yz2d1kk6RJ0zRt0rS2tlqrtVqLWkXBBx8EH3zwQXzwQfBBfPBBX/RBfPDBB1/0QfBBX3zwwQdffPBBfBBBfLBYW2uttbXWttY2bZomTZNkk+zO7szszJw7c8/MnZnNJukHl7n3nvP/3XPPPfdcRinFahbHcRzP8+IiEm+1Ws1Wq9VsNpuNZrNZbzab9Waz2Wg2mw3XdeuO49Rdx6m7jlN3XbfuOE7ddZx6q9VqNJvNRrPZbDSbzXqz2aw3m816s9mst1qtebfVar4ByMRx');
  
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Arena Assist',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      }
    },
    {
      label: 'Toggle Overlay',
      click: () => {
        if (!overlayWindow) {
          overlayWindow = createOverlayWindow();
        }
        
        if (overlayWindow.isVisible()) {
          overlayWindow.hide();
        } else {
          overlayWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
        mainWindow?.webContents.send('navigate-to-settings');
      }
    },
    { type: 'separator' },
    {
      label: 'Check for Updates',
      click: async () => {
        if (!isDev) {
          try {
            await autoUpdater.checkForUpdates();
          } catch (error) {
            dialog.showErrorBox('Update Check Failed', 'Could not check for updates. Please try again later.');
          }
        } else {
          dialog.showMessageBox(mainWindow!, {
            type: 'info',
            title: 'Development Mode',
            message: 'Auto-updates are disabled in development mode.'
          });
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Start with Windows',
      type: 'checkbox',
      checked: false,
      click: async (menuItem) => {
        try {
          if (menuItem.checked) {
            await autoLauncher.enable();
            console.log('Auto-launch enabled');
          } else {
            await autoLauncher.disable();
            console.log('Auto-launch disabled');
          }
          
          // Rebuild menu with updated state
          setTimeout(async () => {
            try {
              const isEnabled = await autoLauncher.isEnabled();
              // The menu will be recreated next time it's accessed
            } catch (e) {
              console.error('Failed to check auto-launch status:', e);
            }
          }, 100);
        } catch (error) {
          console.error('Auto-launch toggle failed:', error);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Arena Assist',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.setToolTip('Arena Assist - League of Legends Arena Helper');
  
  // Double-click to show main window
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function registerGlobalShortcuts(): void {
  // Register global shortcuts for hotkeys
  globalShortcut.register('F9', () => {
    console.log('F9 pressed - Toggle overlay');
    if (!overlayWindow) {
      overlayWindow = createOverlayWindow();
    }
    
    if (overlayWindow.isVisible()) {
      overlayWindow.hide();
    } else {
      overlayWindow.show();
    }
  });

  globalShortcut.register('F10', () => {
    console.log('F10 pressed - Screen capture for augment detection');
    mainWindow?.webContents.send('trigger-screen-capture');
  });

  globalShortcut.register('F11', () => {
    console.log('F11 pressed - Toggle main window');
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

// IPC handlers
ipcMain.handle('app-version', () => {
  return require('../package.json').version;
});

ipcMain.handle('get-store-value', async (_, key) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', async (_, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('delete-store-value', async (_, key) => {
  store.delete(key);
  return true;
});

ipcMain.handle('show-save-dialog', async (_, options) => {
  if (mainWindow) {
    return await dialog.showSaveDialog(mainWindow, options);
  }
});

ipcMain.handle('show-open-dialog', async (_, options) => {
  if (mainWindow) {
    return await dialog.showOpenDialog(mainWindow, options);
  }
});

ipcMain.handle('show-message-box', async (_, options) => {
  if (mainWindow) {
    return await dialog.showMessageBox(mainWindow, options);
  }
});

// Window controls
ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow?.hide(); // Hide to tray instead of closing
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() || false;
});

// Auto-updater IPC handlers
ipcMain.handle('check-for-updates', async () => {
  if (!isDev) {
    try {
      console.log('Checking for updates...');
      const updateCheckResult = await autoUpdater.checkForUpdates();
      console.log('Update check result:', updateCheckResult);
      return updateCheckResult;
    } catch (error) {
      console.error('Manual update check failed:', error);
      return { error: error.message };
    }
  } else {
    // In development, simulate an update check
    console.log('Development mode - simulating update check');
    return { 
      updateInfo: null, 
      isDev: true, 
      message: 'Update checking disabled in development mode' 
    };
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Auto-launch IPC handlers
ipcMain.handle('get-auto-launch-enabled', async () => {
  try {
    return await autoLauncher.isEnabled();
  } catch (error) {
    console.error('Failed to check auto-launch status:', error);
    return false;
  }
});

ipcMain.handle('set-auto-launch-enabled', async (_, enabled) => {
  try {
    if (enabled) {
      await autoLauncher.enable();
    } else {
      await autoLauncher.disable();
    }
    return true;
  } catch (error) {
    console.error('Failed to set auto-launch:', error);
    return false;
  }
});

// Permission check handler
ipcMain.handle('check-media-permissions', async () => {
  try {
    if (mainWindow) {
      // This will help debug permission issues
      console.log('Checking media permissions...');
      return { status: 'available' };
    }
    return { status: 'unavailable' };
  } catch (error) {
    console.error('Failed to check permissions:', error);
    return { status: 'error', error: error.message };
  }
});

// App event handlers
app.whenReady().then(async () => {
  createMainWindow();
  
  // Only create overlay window when needed (don't create automatically)
  // overlayWindow will be created on first toggle
  
  // Create system tray
  createTray();
  
  // Register global shortcuts
  registerGlobalShortcuts();
  
  // Check and set up auto-launch after tray is created
  try {
    const isEnabled = await autoLauncher.isEnabled();
    console.log(`Auto-launch is ${isEnabled ? 'enabled' : 'disabled'}`);
    // Note: Tray menu checkbox will be updated when user accesses the menu
  } catch (error) {
    console.error('Auto-launch check failed:', error);
  }

  // Check for updates on startup (only in production)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 5000); // Wait 5 seconds after startup
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', (e: any) => {
  // Prevent app from quitting, keep it in tray
  e.preventDefault();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

module.exports = { mainWindow, overlayWindow }; 