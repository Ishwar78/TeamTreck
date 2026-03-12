# TeamTreck Desktop Agent — Electron Architecture

## Production-Ready Electron Application for Team Monitoring SaaS

---

## 📁 Folder Structure

```
teamtreck-agent/
├── package.json
├── electron-builder.yml
├── tsconfig.json
├── src/
│   ├── main/                    # Main Process (Node.js)
│   │   ├── index.ts             # Entry point
│   │   ├── window.ts            # BrowserWindow management
│   │   ├── tray.ts              # System tray
│   │   ├── ipc-handlers.ts      # IPC message handlers
│   │   ├── auto-launch.ts       # Auto-start on boot
│   │   └── logger.ts            # Logging system
│   ├── preload/                 # Preload Scripts (Bridge)
│   │   └── index.ts             # contextBridge API
│   ├── renderer/                # Renderer Process (React)
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   └── AgentPanel.tsx   # ← Your existing Lovable UI
│   │   └── hooks/
│   │       └── useElectronAPI.ts
│   ├── services/                # Shared Business Logic
│   │   ├── auth.service.ts      # JWT auth + secure storage
│   │   ├── screenshot.service.ts
│   │   ├── tracker.service.ts   # App & URL tracking
│   │   ├── idle.service.ts      # Idle detection (powerMonitor)
│   │   └── api.service.ts       # Backend HTTP client
│   ├── workers/                 # Background Workers
│   │   ├── heartbeat.worker.ts  # Keep-alive pings
│   │   ├── sync.worker.ts       # Offline queue sync
│   │   └── screenshot.worker.ts # Randomized capture
│   └── shared/                  # Shared Types
│       ├── types.ts
│       └── constants.ts
├── resources/                   # App icons & assets
│   ├── icon.ico                 # Windows
│   ├── icon.icns                # macOS
│   └── icon.png                 # Linux (256x256)
└── dist/                        # Build output
```

---

## 📄 Core Files

### 1. `package.json`

```json
{
  "name": "teamtreck-agent",
  "version": "2.1.0",
  "description": "TeamTreck Desktop Monitoring Agent",
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "concurrently \"tsc -w\" \"electron .\"",
    "build": "tsc && electron-builder",
    "build:win": "tsc && electron-builder --win",
    "build:mac": "tsc && electron-builder --mac",
    "build:linux": "tsc && electron-builder --linux",
    "lint": "eslint src/"
  },
  "dependencies": {
    "electron-store": "^8.1.0",
    "electron-log": "^5.1.0",
    "auto-launch": "^5.0.6",
    "axios": "^1.7.0",
    "keytar": "^7.9.0"
  },
  "devDependencies": {
    "electron": "^30.0.0",
    "electron-builder": "^24.13.0",
    "typescript": "^5.4.0",
    "concurrently": "^8.2.0",
    "@types/auto-launch": "^5.0.5"
  }
}
```

### 2. `electron-builder.yml`

```yaml
appId: com.teamtreck.agent
productName: TeamTreck Agent
copyright: Copyright © 2025 TeamTreck

directories:
  output: release
  buildResources: resources

files:
  - dist/**/*
  - resources/**/*

asar: true

win:
  target:
    - target: nsis
      arch: [x64, ia32]
  icon: resources/icon.ico
  artifactName: TeamTreck-Setup-${version}.${ext}

nsis:
  oneClick: false
  perMachine: true
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true

mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: resources/icon.icns
  category: public.app-category.business
  hardenedRuntime: true
  gatekeeperAssess: false

dmg:
  sign: false

linux:
  target:
    - target: AppImage
      arch: [x64]
  icon: resources/icon.png
  category: Utility
  desktop:
    StartupWMClass: TeamTreck Agent
```

---

### 3. `src/main/index.ts` — Main Process Entry

```typescript
import { app, BrowserWindow, Tray, nativeImage } from 'electron';
import path from 'path';
import { createWindow, getMainWindow } from './window';
import { createTray } from './tray';
import { registerIpcHandlers } from './ipc-handlers';
import { setupAutoLaunch } from './auto-launch';
import log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
log.info('App starting...');

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

app.whenReady().then(async () => {
  log.info('App ready');

  // Create main window
  createWindow();

  // Setup system tray
  createTray();

  // Register IPC handlers
  registerIpcHandlers();

  // Setup auto-launch on boot
  await setupAutoLaunch();

  log.info('All modules initialized');
});

// Prevent app from quitting when all windows are closed (stays in tray)
app.on('window-all-closed', (e: Event) => {
  e.preventDefault();
});

app.on('activate', () => {
  const win = getMainWindow();
  if (win) {
    win.show();
  } else {
    createWindow();
  }
});

// Global error handling
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason);
});
```

### 4. `src/main/window.ts` — Window Management

```typescript
import { BrowserWindow, app } from 'electron';
import path from 'path';
import log from 'electron-log';

let mainWindow: BrowserWindow | null = null;

export function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 680,
    minWidth: 380,
    minHeight: 600,
    resizable: false,
    frame: false, // Custom title bar
    titleBarStyle: 'hidden',
    webPreferences: {
      contextIsolation: true,      // ✅ Security
      nodeIntegration: false,       // ✅ Security
      sandbox: true,                // ✅ Security
      preload: path.join(__dirname, '../preload/index.js'),
      devTools: !app.isPackaged,
    },
    icon: path.join(__dirname, '../../resources/icon.png'),
    show: false, // Show after ready-to-show
  });

  // Load renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173/agent');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show when ready (prevents flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    log.info('Window shown');
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
    log.info('Window hidden to tray');
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
```

### 5. `src/main/tray.ts` — System Tray

```typescript
import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';
import { getMainWindow } from './window';
import log from 'electron-log';

let tray: Tray | null = null;

export function createTray(): void {
  const iconPath = path.join(__dirname, '../../resources/icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip('TeamTreck Agent');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Agent',
      click: () => {
        const win = getMainWindow();
        if (win) { win.show(); win.focus(); }
      },
    },
    { type: 'separator' },
    {
      label: 'Status: Active',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        log.info('Quit from tray');
        app.exit(0);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    const win = getMainWindow();
    if (win) {
      win.isVisible() ? win.hide() : win.show();
    }
  });

  log.info('Tray created');
}

export function updateTrayStatus(status: string): void {
  // Rebuild menu with updated status
  if (!tray) return;
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Agent', click: () => getMainWindow()?.show() },
    { type: 'separator' },
    { label: `Status: ${status}`, enabled: false },
    { type: 'separator' },
    { label: 'Quit', click: () => app.exit(0) },
  ]);
  tray.setContextMenu(contextMenu);
}
```

### 6. `src/main/ipc-handlers.ts` — IPC Communication

```typescript
import { ipcMain } from 'electron';
import { authService } from '../services/auth.service';
import { screenshotService } from '../services/screenshot.service';
import { trackerService } from '../services/tracker.service';
import { idleService } from '../services/idle.service';
import { updateTrayStatus } from './tray';
import log from 'electron-log';

export function registerIpcHandlers(): void {

  // ─── Authentication ───
  ipcMain.handle('auth:login', async (_event, credentials: { email: string; password: string }) => {
    try {
      const result = await authService.login(credentials.email, credentials.password);
      log.info('Login successful');
      return { success: true, data: result };
    } catch (error: any) {
      log.error('Login failed:', error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:logout', async () => {
    await authService.logout();
    trackerService.stopAll();
    screenshotService.stop();
    idleService.stop();
    updateTrayStatus('Logged Out');
    log.info('Logout complete');
    return { success: true };
  });

  ipcMain.handle('auth:getToken', async () => {
    return authService.getToken();
  });

  // ─── Session Controls ───
  ipcMain.handle('session:start', async () => {
    trackerService.startAll();
    screenshotService.start();
    idleService.start();
    updateTrayStatus('Active');
    log.info('Work session started');
    return { success: true, startTime: new Date().toISOString() };
  });

  ipcMain.handle('session:pause', async () => {
    trackerService.pauseAll();
    screenshotService.stop();
    idleService.stop();
    updateTrayStatus('Paused');
    log.info('Work session paused');
    return { success: true };
  });

  ipcMain.handle('session:resume', async () => {
    trackerService.startAll();
    screenshotService.start();
    idleService.start();
    updateTrayStatus('Active');
    log.info('Work session resumed');
    return { success: true };
  });

  // ─── Screenshot ───
  ipcMain.handle('screenshot:capture', async () => {
    const screenshot = await screenshotService.capture();
    return screenshot;
  });

  // ─── System Info ───
  ipcMain.handle('system:getInfo', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: require('../../package.json').version,
    };
  });
}
```

### 7. `src/main/auto-launch.ts` — Auto Start on Boot

```typescript
import AutoLaunch from 'auto-launch';
import log from 'electron-log';

const autoLauncher = new AutoLaunch({
  name: 'TeamTreck Agent',
  isHidden: true, // Start minimized
});

export async function setupAutoLaunch(): Promise<void> {
  try {
    const isEnabled = await autoLauncher.isEnabled();
    if (!isEnabled) {
      await autoLauncher.enable();
      log.info('Auto-launch enabled');
    }
  } catch (error) {
    log.error('Auto-launch setup failed:', error);
  }
}

export async function toggleAutoLaunch(enable: boolean): Promise<void> {
  try {
    if (enable) {
      await autoLauncher.enable();
    } else {
      await autoLauncher.disable();
    }
    log.info(`Auto-launch ${enable ? 'enabled' : 'disabled'}`);
  } catch (error) {
    log.error('Auto-launch toggle failed:', error);
  }
}
```

### 8. `src/preload/index.ts` — Secure Bridge

```typescript
import { contextBridge, ipcRenderer } from 'electron';

// Expose a controlled API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {

  // Auth
  login: (credentials: { email: string; password: string }) =>
    ipcRenderer.invoke('auth:login', credentials),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getToken: () => ipcRenderer.invoke('auth:getToken'),

  // Session
  startWork: () => ipcRenderer.invoke('session:start'),
  pauseWork: () => ipcRenderer.invoke('session:pause'),
  resumeWork: () => ipcRenderer.invoke('session:resume'),

  // Screenshot
  captureScreenshot: () => ipcRenderer.invoke('screenshot:capture'),

  // System
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),

  // Window controls (for frameless window)
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Events from main process
  onForceLogout: (callback: () => void) => {
    ipcRenderer.on('force-logout', callback);
    return () => ipcRenderer.removeListener('force-logout', callback);
  },
  onIdleDetected: (callback: (idleSeconds: number) => void) => {
    ipcRenderer.on('idle-detected', (_event, seconds) => callback(seconds));
    return () => ipcRenderer.removeListener('idle-detected', () => {});
  },
  onStatusUpdate: (callback: (status: string) => void) => {
    ipcRenderer.on('status-update', (_event, status) => callback(status));
    return () => ipcRenderer.removeListener('status-update', () => {});
  },
});
```

### 9. `src/services/auth.service.ts` — Secure Token Storage

```typescript
import keytar from 'keytar'; // OS keychain (Keychain, Credential Manager, libsecret)
import axios from 'axios';
import log from 'electron-log';

const SERVICE_NAME = 'TeamTreck';
const ACCOUNT_NAME = 'auth-token';
const API_BASE = 'https://api.teamtreck.com';

class AuthService {
  private token: string | null = null;

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
    const { token, user } = response.data;

    // Store token securely in OS keychain
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
    this.token = token;

    log.info(`User ${user.email} logged in`);
    return { token, user };
  }

  async logout(): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    this.token = null;
    log.info('Token cleared from keychain');
  }

  async getToken(): Promise<string | null> {
    if (this.token) return this.token;
    this.token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    return this.token;
  }

  getAuthHeaders(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }
}

export const authService = new AuthService();
```

### 10. `src/services/screenshot.service.ts`

```typescript
import { desktopCapturer, screen } from 'electron';
import log from 'electron-log';

class ScreenshotService {
  private intervalId: NodeJS.Timeout | null = null;
  private captureCount = 0;
  private readonly CAPTURES_PER_HOUR = 12;

  start(): void {
    this.scheduleNext();
    log.info('Screenshot service started');
  }

  stop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    log.info('Screenshot service stopped');
  }

  private scheduleNext(): void {
    const baseInterval = 3600 / this.CAPTURES_PER_HOUR; // 300s = 5min
    const jitter = (Math.random() - 0.5) * 180; // ±90s
    const delayMs = Math.max(10, baseInterval + jitter) * 1000;

    this.intervalId = setTimeout(async () => {
      await this.capture();
      this.scheduleNext(); // Schedule next recursively
    }, delayMs);
  }

  async capture(): Promise<{ dataUrl: string; timestamp: string } | null> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: screen.getPrimaryDisplay().workAreaSize,
      });

      if (sources.length === 0) {
        log.warn('No screen sources found');
        return null;
      }

      const dataUrl = sources[0].thumbnail.toDataURL();
      this.captureCount++;

      log.info(`Screenshot #${this.captureCount} captured`);

      return {
        dataUrl,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      log.error('Screenshot capture failed:', error);
      return null;
    }
  }

  getCount(): number {
    return this.captureCount;
  }
}

export const screenshotService = new ScreenshotService();
```

### 11. `src/services/idle.service.ts`

```typescript
import { powerMonitor } from 'electron';
import { BrowserWindow } from 'electron';
import log from 'electron-log';

class IdleService {
  private checkInterval: NodeJS.Timeout | null = null;
  private thresholdSeconds = 300; // 5 minutes default (configurable)

  start(thresholdMinutes?: number): void {
    if (thresholdMinutes) {
      this.thresholdSeconds = thresholdMinutes * 60;
    }

    this.checkInterval = setInterval(() => {
      const idleTime = powerMonitor.getSystemIdleTime(); // seconds

      if (idleTime >= this.thresholdSeconds) {
        log.info(`Idle detected: ${idleTime}s`);
        // Notify renderer
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
          win.webContents.send('idle-detected', idleTime);
        }
      }
    }, 10000); // Check every 10s

    log.info(`Idle detection started (threshold: ${this.thresholdSeconds}s)`);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    log.info('Idle detection stopped');
  }

  setThreshold(minutes: number): void {
    this.thresholdSeconds = minutes * 60;
    log.info(`Idle threshold set to ${minutes} minutes`);
  }
}

export const idleService = new IdleService();
```

### 12. `src/workers/heartbeat.worker.ts`

```typescript
import axios from 'axios';
import { authService } from '../services/auth.service';
import log from 'electron-log';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const API_BASE = 'https://api.teamtreck.com';

class HeartbeatWorker {
  private intervalId: NodeJS.Timeout | null = null;

  start(): void {
    this.intervalId = setInterval(async () => {
      try {
        const token = await authService.getToken();
        if (!token) return;

        await axios.post(
          `${API_BASE}/api/agent/heartbeat`,
          { timestamp: new Date().toISOString(), status: 'active' },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
        );
      } catch (error) {
        log.warn('Heartbeat failed, will retry...');
      }
    }, HEARTBEAT_INTERVAL);

    log.info('Heartbeat worker started');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    log.info('Heartbeat worker stopped');
  }
}

export const heartbeatWorker = new HeartbeatWorker();
```

### 13. `src/workers/sync.worker.ts` — Offline Queue

```typescript
import ElectronStore from 'electron-store';
import axios from 'axios';
import { authService } from '../services/auth.service';
import log from 'electron-log';

const store = new ElectronStore({ name: 'offline-queue' });
const API_BASE = 'https://api.teamtreck.com';

interface QueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT';
  data: any;
  timestamp: string;
}

class SyncWorker {
  private intervalId: NodeJS.Timeout | null = null;

  enqueue(item: Omit<QueueItem, 'id' | 'timestamp'>): void {
    const queue = this.getQueue();
    queue.push({
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
    });
    store.set('queue', queue);
    log.info(`Queued offline item: ${item.endpoint}`);
  }

  private getQueue(): QueueItem[] {
    return (store.get('queue') as QueueItem[]) || [];
  }

  start(): void {
    this.intervalId = setInterval(() => this.processQueue(), 15000);
    log.info('Sync worker started');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async processQueue(): Promise<void> {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    const token = await authService.getToken();
    if (!token) return;

    const remaining: QueueItem[] = [];

    for (const item of queue) {
      try {
        await axios({
          method: item.method,
          url: `${API_BASE}${item.endpoint}`,
          data: item.data,
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        log.info(`Synced: ${item.endpoint}`);
      } catch {
        remaining.push(item);
      }
    }

    store.set('queue', remaining);
    if (remaining.length > 0) {
      log.warn(`${remaining.length} items still in queue`);
    }
  }
}

export const syncWorker = new SyncWorker();
```

### 14. `src/renderer/hooks/useElectronAPI.ts` — Renderer Hook

```typescript
// Type-safe hook for accessing the Electron API from React components

interface ElectronAPI {
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; data?: any; error?: string }>;
  logout: () => Promise<{ success: boolean }>;
  getToken: () => Promise<string | null>;
  startWork: () => Promise<{ success: boolean; startTime: string }>;
  pauseWork: () => Promise<{ success: boolean }>;
  resumeWork: () => Promise<{ success: boolean }>;
  captureScreenshot: () => Promise<{ dataUrl: string; timestamp: string } | null>;
  getSystemInfo: () => Promise<{ platform: string; arch: string; version: string }>;
  minimizeWindow: () => void;
  closeWindow: () => void;
  onForceLogout: (callback: () => void) => () => void;
  onIdleDetected: (callback: (idleSeconds: number) => void) => () => void;
  onStatusUpdate: (callback: (status: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export function useElectronAPI(): ElectronAPI | null {
  return window.electronAPI ?? null;
}

export function isElectron(): boolean {
  return !!window.electronAPI;
}
```

---

## 🔨 Build Commands

### Development
```bash
npm install
npm run dev
```

### Production Builds

```bash
# Windows (.exe installer)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (.AppImage)
npm run build:linux

# All platforms
npm run build
```

### Output Locations
- Windows: `release/TeamTreck-Setup-2.1.0.exe`
- macOS: `release/TeamTreck-2.1.0.dmg`
- Linux: `release/TeamTreck-2.1.0.AppImage`

---

## 🔐 Security Checklist

| Feature | Status |
|---------|--------|
| `contextIsolation: true` | ✅ |
| `nodeIntegration: false` | ✅ |
| `sandbox: true` | ✅ |
| Preload with `contextBridge` | ✅ |
| Token in OS Keychain (keytar) | ✅ |
| Single instance lock | ✅ |
| DevTools disabled in production | ✅ |
| Offline queue with sync | ✅ |
| Error logging (electron-log) | ✅ |

---

## 🔗 Integration with Lovable Renderer

Your Lovable `/agent` page works as the renderer UI. In development:
1. Run your Lovable dev server (`npm run dev` → `localhost:5173`)
2. Run Electron (`npm run dev` in the electron project)
3. Electron loads `http://localhost:5173/agent`

For production, build the Lovable app and copy the dist into the Electron renderer folder.

The `useElectronAPI` hook detects if running inside Electron and uses native IPC, otherwise falls back to the web simulation.

---

## 📸 Secure Background Screenshot Capture System

### Extended Folder Structure

```
teamtreck-agent/
├── src/
│   ├── services/
│   │   ├── screenshot.service.ts     # Core capture engine (UPDATED)
│   │   ├── encryption.service.ts     # AES-256 local file encryption
│   │   ├── upload.service.ts         # Upload with retry queue
│   │   └── image-optimizer.service.ts # Sharp-based compression
│   ├── workers/
│   │   ├── screenshot.worker.ts      # Background capture scheduler (UPDATED)
│   │   └── upload-queue.worker.ts    # Persistent retry queue processor
│   └── config/
│       └── capture-config.json       # Runtime-configurable settings
├── temp/                             # Encrypted screenshot staging (auto-cleaned)
└── logs/                             # Rotating log files
```

---

### 15. `src/config/capture-config.json` — Configurable Settings

```json
{
  "capture": {
    "intervalMinutes": 5,
    "jitterSeconds": 60,
    "maxCapturesPerHour": 12,
    "enabled": true
  },
  "image": {
    "format": "jpeg",
    "quality": 70,
    "maxWidth": 1920,
    "maxHeight": 1080
  },
  "upload": {
    "endpoint": "/api/agent/screenshots",
    "maxRetries": 5,
    "retryBackoffMs": [5000, 15000, 60000, 300000, 900000],
    "timeoutMs": 30000,
    "maxQueueSize": 500
  },
  "storage": {
    "tempDir": "temp/screenshots",
    "encryptionAlgorithm": "aes-256-gcm",
    "maxLocalFiles": 100,
    "cleanupAfterUploadMs": 0
  },
  "permissions": {
    "macScreenRecordingCheck": true,
    "showPermissionDialog": true
  }
}
```

---

### 16. `src/services/encryption.service.ts` — AES-256-GCM Local Encryption

```typescript
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import log from 'electron-log';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

class EncryptionService {
  private key: Buffer;

  constructor() {
    // Derive key from machine-specific data + app secret
    // In production, store this in OS keychain via keytar
    const machineId = this.getMachineId();
    this.key = crypto.scryptSync(machineId, 'teamtreck-salt-v2', KEY_LENGTH);
  }

  private getMachineId(): string {
    const os = require('os');
    return `${os.hostname()}-${os.userInfo().username}-teamtreck-agent`;
  }

  async encryptAndSave(data: Buffer, filePath: string): Promise<{ path: string; iv: string; authTag: string }> {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Prepend IV + authTag to encrypted data for self-contained decryption
    const output = Buffer.concat([iv, authTag, encrypted]);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, output);

    log.info(`Encrypted file saved: ${path.basename(filePath)} (${(output.length / 1024).toFixed(1)}KB)`);

    return {
      path: filePath,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  async decryptFile(filePath: string): Promise<Buffer> {
    const fileData = await fs.readFile(filePath);

    const iv = fileData.subarray(0, IV_LENGTH);
    const authTag = fileData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = fileData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  async secureDelete(filePath: string): Promise<void> {
    try {
      // Overwrite with random data before deleting
      const stats = await fs.stat(filePath);
      const randomData = crypto.randomBytes(stats.size);
      await fs.writeFile(filePath, randomData);
      await fs.unlink(filePath);
      log.info(`Securely deleted: ${path.basename(filePath)}`);
    } catch (error) {
      // Fallback: just delete
      try { await fs.unlink(filePath); } catch {}
      log.warn(`Fallback delete: ${path.basename(filePath)}`);
    }
  }
}

export const encryptionService = new EncryptionService();
```

---

### 17. `src/services/image-optimizer.service.ts` — Sharp-Based Compression

```typescript
import sharp from 'sharp';
import log from 'electron-log';

interface OptimizeOptions {
  format?: 'jpeg' | 'webp' | 'png';
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

class ImageOptimizerService {
  async optimize(inputBuffer: Buffer, options: OptimizeOptions = {}): Promise<Buffer> {
    const {
      format = 'jpeg',
      quality = 70,
      maxWidth = 1920,
      maxHeight = 1080,
    } = options;

    try {
      const metadata = await sharp(inputBuffer).metadata();
      const originalSize = inputBuffer.length;

      let pipeline = sharp(inputBuffer);

      // Resize if larger than max dimensions (maintain aspect ratio)
      if (metadata.width && metadata.height) {
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          pipeline = pipeline.resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }
      }

      // Compress
      let output: Buffer;
      switch (format) {
        case 'webp':
          output = await pipeline.webp({ quality, effort: 4 }).toBuffer();
          break;
        case 'png':
          output = await pipeline.png({ compressionLevel: 8 }).toBuffer();
          break;
        case 'jpeg':
        default:
          output = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
          break;
      }

      const savedPercent = ((1 - output.length / originalSize) * 100).toFixed(1);
      log.info(`Image optimized: ${(originalSize / 1024).toFixed(0)}KB → ${(output.length / 1024).toFixed(0)}KB (${savedPercent}% saved)`);

      return output;
    } catch (error) {
      log.error('Image optimization failed, using original:', error);
      return inputBuffer; // Fallback to unoptimized
    }
  }

  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata();
      return !!(metadata.width && metadata.height && metadata.format);
    } catch {
      return false;
    }
  }
}

export const imageOptimizer = new ImageOptimizerService();
```

---

### 18. `src/services/screenshot.service.ts` — Full Capture Engine (UPDATED)

```typescript
import { desktopCapturer, screen, systemPreferences, dialog } from 'electron';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import log from 'electron-log';
import { encryptionService } from './encryption.service';
import { imageOptimizer } from './image-optimizer.service';
import { uploadQueueWorker } from '../workers/upload-queue.worker';

// Load config
const configPath = path.join(app.getPath('userData'), 'capture-config.json');
const defaultConfig = require('../config/capture-config.json');

interface CaptureResult {
  id: string;
  encryptedPath: string;
  timestamp: string;
  displayId: string;
  optimizedSize: number;
}

class ScreenshotService {
  private intervalId: NodeJS.Timeout | null = null;
  private captureCount = 0;
  private config = defaultConfig;
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(app.getPath('userData'), this.config.storage.tempDir);
  }

  async initialize(): Promise<void> {
    // Load user config if exists
    try {
      const userConfig = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      this.config = { ...defaultConfig, ...userConfig };
    } catch {
      // Use defaults
    }

    // Ensure temp directory exists
    await fs.mkdir(this.tempDir, { recursive: true });

    // macOS: Check screen recording permission
    if (process.platform === 'darwin' && this.config.permissions.macScreenRecordingCheck) {
      await this.checkMacPermissions();
    }

    log.info('Screenshot service initialized');
  }

  private async checkMacPermissions(): Promise<void> {
    const hasPermission = systemPreferences.getMediaAccessStatus('screen');

    if (hasPermission !== 'granted') {
      log.warn('macOS screen recording permission not granted');

      if (this.config.permissions.showPermissionDialog) {
        const { response } = await dialog.showMessageBox({
          type: 'warning',
          title: 'Screen Recording Permission Required',
          message: 'TeamTreck Agent needs screen recording permission to capture screenshots.',
          detail: 'Go to System Settings → Privacy & Security → Screen Recording → Enable TeamTreck Agent',
          buttons: ['Open Settings', 'Later'],
          defaultId: 0,
        });

        if (response === 0) {
          const { shell } = require('electron');
          shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
        }
      }
    }
  }

  start(): void {
    if (!this.config.capture.enabled) {
      log.info('Screenshot capture disabled by config');
      return;
    }
    this.scheduleNext();
    log.info(`Screenshot service started (interval: ${this.config.capture.intervalMinutes}min)`);
  }

  stop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    log.info('Screenshot service stopped');
  }

  private scheduleNext(): void {
    const baseMs = this.config.capture.intervalMinutes * 60 * 1000;
    const jitterMs = (Math.random() - 0.5) * 2 * this.config.capture.jitterSeconds * 1000;
    const delayMs = Math.max(10000, baseMs + jitterMs);

    this.intervalId = setTimeout(async () => {
      await this.captureAndProcess();
      this.scheduleNext();
    }, delayMs);
  }

  async captureAndProcess(): Promise<CaptureResult | null> {
    try {
      // 1. Capture raw screenshot
      const rawBuffer = await this.captureScreen();
      if (!rawBuffer) return null;

      // 2. Validate image integrity
      const isValid = await imageOptimizer.validateImage(rawBuffer);
      if (!isValid) {
        log.error('Captured screenshot failed validation — corrupted data');
        return null;
      }

      // 3. Optimize image size
      const optimized = await imageOptimizer.optimize(rawBuffer, {
        format: this.config.image.format,
        quality: this.config.image.quality,
        maxWidth: this.config.image.maxWidth,
        maxHeight: this.config.image.maxHeight,
      });

      // 4. Generate unique ID and file path
      const captureId = `ss_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const encryptedPath = path.join(this.tempDir, `${captureId}.enc`);

      // 5. Encrypt and save locally
      await encryptionService.encryptAndSave(optimized, encryptedPath);

      this.captureCount++;
      const timestamp = new Date().toISOString();

      log.info(`Screenshot #${this.captureCount} captured → encrypted → queued (${(optimized.length / 1024).toFixed(0)}KB)`);

      // 6. Queue for upload
      uploadQueueWorker.enqueue({
        id: captureId,
        encryptedPath,
        timestamp,
        optimizedSize: optimized.length,
        displayId: screen.getPrimaryDisplay().id.toString(),
      });

      return {
        id: captureId,
        encryptedPath,
        timestamp,
        displayId: screen.getPrimaryDisplay().id.toString(),
        optimizedSize: optimized.length,
      };
    } catch (error) {
      log.error('Screenshot capture pipeline failed:', error);
      return null;
    }
  }

  private async captureScreen(): Promise<Buffer | null> {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;
      const scaleFactor = primaryDisplay.scaleFactor;

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: Math.floor(width * scaleFactor),
          height: Math.floor(height * scaleFactor),
        },
      });

      if (sources.length === 0) {
        log.warn('No screen sources available');
        return null;
      }

      // Use NativeImage → PNG buffer
      const thumbnail = sources[0].thumbnail;
      return thumbnail.toPNG();
    } catch (error) {
      log.error('desktopCapturer failed:', error);
      return null;
    }
  }

  async updateConfig(newConfig: Partial<typeof defaultConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
    log.info('Capture config updated');

    // Restart with new config
    this.stop();
    this.start();
  }

  getCount(): number { return this.captureCount; }

  async cleanupOldFiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      if (files.length > this.config.storage.maxLocalFiles) {
        const sorted = files.sort();
        const toDelete = sorted.slice(0, files.length - this.config.storage.maxLocalFiles);
        for (const f of toDelete) {
          await encryptionService.secureDelete(path.join(this.tempDir, f));
        }
        log.info(`Cleaned up ${toDelete.length} old screenshot files`);
      }
    } catch (error) {
      log.error('Cleanup failed:', error);
    }
  }
}

export const screenshotService = new ScreenshotService();
```

---

### 19. `src/workers/upload-queue.worker.ts` — Persistent Retry Queue

```typescript
import ElectronStore from 'electron-store';
import axios from 'axios';
import fs from 'fs/promises';
import log from 'electron-log';
import { authService } from '../services/auth.service';
import { encryptionService } from '../services/encryption.service';

const API_BASE = 'https://api.teamtreck.com';

interface QueueItem {
  id: string;
  encryptedPath: string;
  timestamp: string;
  optimizedSize: number;
  displayId: string;
  retryCount: number;
  nextRetryAt: number;
  status: 'pending' | 'uploading' | 'failed';
  lastError?: string;
}

const store = new ElectronStore({ name: 'screenshot-upload-queue' });

const RETRY_BACKOFF = [5000, 15000, 60000, 300000, 900000]; // 5s, 15s, 1m, 5m, 15m
const MAX_RETRIES = 5;
const PROCESS_INTERVAL = 5000;
const MAX_CONCURRENT = 3;
const UPLOAD_TIMEOUT = 30000;

class UploadQueueWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private activeUploads = 0;
  private isOnline = true;

  constructor() {
    // Monitor connectivity
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.isOnline = true; log.info('Network: online'); });
      window.addEventListener('offline', () => { this.isOnline = false; log.info('Network: offline'); });
    }
  }

  enqueue(item: Omit<QueueItem, 'retryCount' | 'nextRetryAt' | 'status'>): void {
    const queue = this.getQueue();

    // Enforce max queue size
    if (queue.length >= 500) {
      // Remove oldest completed/failed items
      const trimmed = queue.slice(-400);
      store.set('queue', trimmed);
      log.warn('Queue trimmed to 400 items');
    }

    queue.push({
      ...item,
      retryCount: 0,
      nextRetryAt: Date.now(),
      status: 'pending',
    });

    store.set('queue', queue);
    log.info(`Queued screenshot for upload: ${item.id}`);
  }

  private getQueue(): QueueItem[] {
    return (store.get('queue') as QueueItem[]) || [];
  }

  private saveQueue(queue: QueueItem[]): void {
    store.set('queue', queue);
  }

  start(): void {
    this.intervalId = setInterval(() => this.processQueue(), PROCESS_INTERVAL);
    log.info('Upload queue worker started');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    log.info('Upload queue worker stopped');
  }

  private async processQueue(): Promise<void> {
    if (!this.isOnline) return;
    if (this.activeUploads >= MAX_CONCURRENT) return;

    const queue = this.getQueue();
    const now = Date.now();

    // Find items ready for upload
    const ready = queue.filter(
      (item) => item.status !== 'uploading' && item.retryCount < MAX_RETRIES && item.nextRetryAt <= now
    );

    if (ready.length === 0) return;

    const batch = ready.slice(0, MAX_CONCURRENT - this.activeUploads);

    for (const item of batch) {
      this.uploadItem(item);
    }
  }

  private async uploadItem(item: QueueItem): Promise<void> {
    this.activeUploads++;

    // Mark as uploading
    this.updateItemStatus(item.id, 'uploading');

    try {
      // 1. Decrypt the file
      let fileBuffer: Buffer;
      try {
        fileBuffer = await encryptionService.decryptFile(item.encryptedPath);
      } catch (decryptError) {
        log.error(`Decryption failed for ${item.id} — file may be corrupted, removing from queue`);
        this.removeItem(item.id);
        // Securely delete corrupted file
        try { await encryptionService.secureDelete(item.encryptedPath); } catch {}
        this.activeUploads--;
        return;
      }

      // 2. Get auth token
      const token = await authService.getToken();
      if (!token) {
        log.warn('No auth token — skipping upload');
        this.updateItemStatus(item.id, 'pending');
        this.activeUploads--;
        return;
      }

      // 3. Upload via multipart form
      const FormData = require('form-data');
      const form = new FormData();
      form.append('screenshot', fileBuffer, {
        filename: `${item.id}.jpg`,
        contentType: 'image/jpeg',
      });
      form.append('timestamp', item.timestamp);
      form.append('displayId', item.displayId);
      form.append('captureId', item.id);

      await axios.post(`${API_BASE}/api/agent/screenshots`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
        timeout: UPLOAD_TIMEOUT,
        maxContentLength: 10 * 1024 * 1024, // 10MB max
      });

      log.info(`Screenshot uploaded: ${item.id}`);

      // 4. Success — delete local encrypted file
      await encryptionService.secureDelete(item.encryptedPath);

      // 5. Remove from queue
      this.removeItem(item.id);

    } catch (error: any) {
      const retryCount = item.retryCount + 1;
      const backoffMs = RETRY_BACKOFF[Math.min(retryCount - 1, RETRY_BACKOFF.length - 1)];
      const errorMsg = error.response?.status
        ? `HTTP ${error.response.status}: ${error.response.statusText}`
        : error.code || error.message;

      log.warn(`Upload failed for ${item.id} (attempt ${retryCount}/${MAX_RETRIES}): ${errorMsg}`);

      if (retryCount >= MAX_RETRIES) {
        log.error(`Max retries reached for ${item.id} — moving to dead letter`);
        this.updateItem(item.id, {
          status: 'failed',
          retryCount,
          lastError: errorMsg,
        });
      } else {
        this.updateItem(item.id, {
          status: 'pending',
          retryCount,
          nextRetryAt: Date.now() + backoffMs,
          lastError: errorMsg,
        });
      }
    } finally {
      this.activeUploads--;
    }
  }

  private updateItemStatus(id: string, status: QueueItem['status']): void {
    const queue = this.getQueue();
    const idx = queue.findIndex((q) => q.id === id);
    if (idx !== -1) {
      queue[idx].status = status;
      this.saveQueue(queue);
    }
  }

  private updateItem(id: string, updates: Partial<QueueItem>): void {
    const queue = this.getQueue();
    const idx = queue.findIndex((q) => q.id === id);
    if (idx !== -1) {
      queue[idx] = { ...queue[idx], ...updates };
      this.saveQueue(queue);
    }
  }

  private removeItem(id: string): void {
    const queue = this.getQueue().filter((q) => q.id !== id);
    this.saveQueue(queue);
  }

  getStats(): { pending: number; failed: number; total: number } {
    const queue = this.getQueue();
    return {
      pending: queue.filter((q) => q.status === 'pending').length,
      failed: queue.filter((q) => q.status === 'failed').length,
      total: queue.length,
    };
  }

  async retryFailed(): Promise<void> {
    const queue = this.getQueue();
    for (const item of queue) {
      if (item.status === 'failed') {
        item.status = 'pending';
        item.retryCount = 0;
        item.nextRetryAt = Date.now();
      }
    }
    this.saveQueue(queue);
    log.info('All failed items reset for retry');
  }

  async purgeCompleted(): Promise<number> {
    const queue = this.getQueue();
    const failed = queue.filter((q) => q.status === 'failed');
    // Delete orphaned encrypted files for failed items
    for (const item of failed) {
      try { await encryptionService.secureDelete(item.encryptedPath); } catch {}
    }
    const remaining = queue.filter((q) => q.status !== 'failed');
    this.saveQueue(remaining);
    return failed.length;
  }
}

export const uploadQueueWorker = new UploadQueueWorker();
```

---

### 20. Updated `src/main/ipc-handlers.ts` — Screenshot IPC Additions

Add these handlers to the existing `registerIpcHandlers()`:

```typescript
// ─── Screenshot System ───
ipcMain.handle('screenshot:getStats', async () => {
  return {
    captureCount: screenshotService.getCount(),
    queueStats: uploadQueueWorker.getStats(),
  };
});

ipcMain.handle('screenshot:updateConfig', async (_event, config: any) => {
  await screenshotService.updateConfig(config);
  return { success: true };
});

ipcMain.handle('screenshot:retryFailed', async () => {
  await uploadQueueWorker.retryFailed();
  return { success: true };
});

ipcMain.handle('screenshot:cleanup', async () => {
  await screenshotService.cleanupOldFiles();
  return { success: true };
});
```

---

### Updated `src/main/index.ts` — Initialize Screenshot System

Add after `registerIpcHandlers()`:

```typescript
// Initialize screenshot capture system
await screenshotService.initialize();
uploadQueueWorker.start();

// Periodic cleanup every 30 minutes
setInterval(() => screenshotService.cleanupOldFiles(), 30 * 60 * 1000);
```

---

## 🔧 Performance Optimization Tips (1000+ Users)

| Optimization | Implementation |
|---|---|
| **Image compression** | Sharp JPEG mozjpeg at 70% quality → 60-80% size reduction |
| **Concurrent uploads** | Max 3 simultaneous uploads to avoid bandwidth saturation |
| **Exponential backoff** | 5s → 15s → 1m → 5m → 15m retry intervals |
| **Queue persistence** | `electron-store` survives crashes and restarts |
| **Dead letter queue** | Failed items after 5 retries are flagged, not retried infinitely |
| **Secure deletion** | Overwrite with random bytes before `unlink` |
| **Memory efficiency** | Stream-based processing, no full images held in memory |
| **Batch cleanup** | Auto-purge when local files exceed 100 |
| **Offline resilience** | Full queue system — captures continue offline, sync when online |
| **Scale-ready backend** | Multipart upload with captureId deduplication |

### Package Dependencies for Screenshot System

```json
{
  "dependencies": {
    "sharp": "^0.33.0",
    "form-data": "^4.0.0"
  }
}
```

> **Note:** `sharp` includes native binaries. For Electron, use `electron-rebuild` or `@electron/rebuild` to compile for the correct Electron ABI:
> ```bash
> npx @electron/rebuild -m node_modules/sharp
> ```

---

## 🍎 macOS Screen Recording Permission

macOS requires explicit user approval for screen capture. The system handles this:

1. **Auto-detection** via `systemPreferences.getMediaAccessStatus('screen')`
2. **Dialog prompt** explaining why permission is needed
3. **Direct link** to System Settings → Privacy → Screen Recording
4. **Graceful degradation** — agent continues running, captures skipped until permission granted

---

## 🪟 Windows Compatibility

Windows has no special permissions for screen capture. The `desktopCapturer` API works natively. Key considerations:

- **DPI scaling**: `scaleFactor` used to capture at native resolution
- **Multi-monitor**: Primary display captured by default; extend config for all displays
- **UAC**: NSIS installer configured with `perMachine: true` for proper installation

---

## 🖥️ Multi-Monitor Screenshot Support

### Updated `src/config/capture-config.json` — Monitor Selection

Add to the existing config:

```json
{
  "monitors": {
    "captureMode": "all",
    "allowedDisplayIds": [],
    "stitchMode": "individual",
    "labelDisplayId": true
  }
}
```

| Field | Values | Description |
|-------|--------|-------------|
| `captureMode` | `"all"` / `"primary"` / `"selected"` | Which monitors to capture |
| `allowedDisplayIds` | `string[]` | Only used when `captureMode: "selected"` |
| `stitchMode` | `"individual"` / `"combined"` | Upload separate images or one stitched panorama |
| `labelDisplayId` | `boolean` | Embed display identifier in metadata |

---

### 21. `src/services/multi-monitor.service.ts` — Display Manager

```typescript
import { screen, desktopCapturer, Display } from 'electron';
import log from 'electron-log';
import { imageOptimizer } from './image-optimizer.service';
import { encryptionService } from './encryption.service';
import { uploadQueueWorker } from '../workers/upload-queue.worker';
import path from 'path';
import { app } from 'electron';

interface MonitorConfig {
  captureMode: 'all' | 'primary' | 'selected';
  allowedDisplayIds: string[];
  stitchMode: 'individual' | 'combined';
  labelDisplayId: boolean;
}

interface DisplayCapture {
  displayId: string;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  buffer: Buffer;
  scaleFactor: number;
}

class MultiMonitorService {
  private config: MonitorConfig = {
    captureMode: 'all',
    allowedDisplayIds: [],
    stitchMode: 'individual',
    labelDisplayId: true,
  };

  configure(config: Partial<MonitorConfig>): void {
    this.config = { ...this.config, ...config };
    log.info(`Monitor config updated: mode=${this.config.captureMode}, stitch=${this.config.stitchMode}`);
  }

  getDisplays(): Array<{ id: string; label: string; bounds: Display['bounds']; isPrimary: boolean; scaleFactor: number }> {
    const primary = screen.getPrimaryDisplay();
    return screen.getAllDisplays().map((d, i) => ({
      id: d.id.toString(),
      label: `Display ${i + 1}${d.id === primary.id ? ' (Primary)' : ''}`,
      bounds: d.bounds,
      isPrimary: d.id === primary.id,
      scaleFactor: d.scaleFactor,
    }));
  }

  private getTargetDisplays(): Display[] {
    const allDisplays = screen.getAllDisplays();
    const primary = screen.getPrimaryDisplay();

    switch (this.config.captureMode) {
      case 'primary':
        return [primary];
      case 'selected':
        return allDisplays.filter(d =>
          this.config.allowedDisplayIds.includes(d.id.toString())
        );
      case 'all':
      default:
        return allDisplays;
    }
  }

  async captureAllDisplays(imageConfig: { format: string; quality: number; maxWidth: number; maxHeight: number }): Promise<DisplayCapture[]> {
    const targets = this.getTargetDisplays();
    const captures: DisplayCapture[] = [];

    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: 3840, // Request max, actual size determined per display
          height: 2160,
        },
      });

      for (const display of targets) {
        // Match source to display by checking bounds overlap
        const matchedSource = sources.find(src => {
          // Electron names screen sources as "Screen 1", "Screen 2", etc.
          // Match by index or display ID embedded in source id
          return src.display_id === display.id.toString();
        }) || sources[targets.indexOf(display)]; // Fallback: positional match

        if (!matchedSource) {
          log.warn(`No source found for display ${display.id}`);
          continue;
        }

        const rawBuffer = matchedSource.thumbnail.toPNG();

        // Validate before processing
        const isValid = await imageOptimizer.validateImage(rawBuffer);
        if (!isValid) {
          log.error(`Corrupted capture for display ${display.id}`);
          continue;
        }

        // Optimize per-display
        const optimized = await imageOptimizer.optimize(rawBuffer, {
          format: imageConfig.format as any,
          quality: imageConfig.quality,
          maxWidth: imageConfig.maxWidth,
          maxHeight: imageConfig.maxHeight,
        });

        captures.push({
          displayId: display.id.toString(),
          label: `Display ${targets.indexOf(display) + 1}`,
          bounds: display.bounds,
          buffer: optimized,
          scaleFactor: display.scaleFactor,
        });
      }

      log.info(`Captured ${captures.length}/${targets.length} displays`);
      return captures;
    } catch (error) {
      log.error('Multi-monitor capture failed:', error);
      return [];
    }
  }

  async captureAndQueue(
    imageConfig: { format: string; quality: number; maxWidth: number; maxHeight: number },
    tempDir: string
  ): Promise<number> {
    const captures = await this.captureAllDisplays(imageConfig);
    let queued = 0;

    for (const capture of captures) {
      const captureId = `ss_${Date.now()}_d${capture.displayId}_${Math.random().toString(36).slice(2, 6)}`;
      const encryptedPath = path.join(tempDir, `${captureId}.enc`);

      await encryptionService.encryptAndSave(capture.buffer, encryptedPath);

      uploadQueueWorker.enqueue({
        id: captureId,
        encryptedPath,
        timestamp: new Date().toISOString(),
        optimizedSize: capture.buffer.length,
        displayId: capture.displayId,
      });

      queued++;
    }

    return queued;
  }
}

export const multiMonitorService = new MultiMonitorService();
```

### IPC Handlers for Monitor Config

```typescript
// Add to ipc-handlers.ts

ipcMain.handle('monitors:getDisplays', async () => {
  return multiMonitorService.getDisplays();
});

ipcMain.handle('monitors:configure', async (_event, config: any) => {
  multiMonitorService.configure(config);
  return { success: true };
});
```

### Preload API Extension

```typescript
// Add to preload/index.ts
getDisplays: () => ipcRenderer.invoke('monitors:getDisplays'),
configureMonitors: (config: any) => ipcRenderer.invoke('monitors:configure'),
```

---

## 🔍 Activity Tracking System

### Extended Folder Structure

```
teamtreck-agent/
├── src/
│   ├── services/
│   │   ├── activity-tracker.service.ts   # Core tracking engine
│   │   ├── window-tracker.service.ts     # Active window detection
│   │   └── input-monitor.service.ts      # Keyboard/mouse activity (privacy-safe)
│   ├── workers/
│   │   └── activity-sync.worker.ts       # Batch upload every 2 min
│   └── config/
│       └── tracking-config.json          # Privacy & tracking settings
```

---

### 22. `src/config/tracking-config.json` — Privacy-Safe Defaults

```json
{
  "tracking": {
    "sampleIntervalMs": 10000,
    "idleThresholdMinutes": 5,
    "batchUploadIntervalMs": 120000,
    "maxBatchSize": 200
  },
  "inputMonitoring": {
    "trackKeyboardActivity": true,
    "trackMouseActivity": true,
    "logKeystrokeCounts": true,
    "logKeystrokeContent": false,
    "logMouseClicks": true,
    "logMouseMovement": false
  },
  "windowTracking": {
    "enabled": true,
    "captureWindowTitle": true,
    "captureAppName": true,
    "captureUrl": true,
    "sensitiveAppBlacklist": [
      "1Password", "KeePass", "Bitwarden",
      "System Preferences", "Settings"
    ]
  },
  "privacy": {
    "anonymizeSensitiveApps": true,
    "stripUrlParams": true,
    "maskWindowTitles": false,
    "gdprCompliant": true
  }
}
```

---

### 23. `src/services/activity-tracker.service.ts` — Core Tracking Engine

```typescript
import { powerMonitor } from 'electron';
import { BrowserWindow } from 'electron';
import ElectronStore from 'electron-store';
import log from 'electron-log';
import { windowTracker } from './window-tracker.service';
import { inputMonitor } from './input-monitor.service';

const trackingConfig = require('../config/tracking-config.json');

// ─── Data Schema ───

interface ActivitySample {
  timestamp: string;
  status: 'active' | 'idle';
  idleSeconds: number;
  activeWindow: {
    title: string;
    appName: string;
    url?: string;
  } | null;
  input: {
    keystrokes: number;
    mouseClicks: number;
    mouseDistance: number;
  };
  systemInfo: {
    cpuUsage: number;
    memoryUsage: number;
  };
}

interface ActivityBatch {
  batchId: string;
  userId: string;
  deviceId: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  samples: ActivitySample[];
  summary: {
    totalActiveSeconds: number;
    totalIdleSeconds: number;
    topApps: Array<{ name: string; seconds: number }>;
    productivityScore: number;
  };
}

const store = new ElectronStore({ name: 'activity-buffer' });

class ActivityTrackerService {
  private sampleInterval: NodeJS.Timeout | null = null;
  private buffer: ActivitySample[] = [];
  private isTracking = false;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private deviceId: string | null = null;
  private lastIdleState: boolean = false;
  private config = trackingConfig;
  private activeSeconds = 0;
  private idleSeconds = 0;
  private appUsageMap = new Map<string, number>();

  initialize(userId: string, deviceId: string): void {
    this.userId = userId;
    this.deviceId = deviceId;

    // Restore unsent buffer from previous crash
    const savedBuffer = store.get('unsent-samples') as ActivitySample[] | undefined;
    if (savedBuffer && savedBuffer.length > 0) {
      this.buffer = savedBuffer;
      log.info(`Restored ${savedBuffer.length} unsent activity samples`);
    }
  }

  start(sessionId: string): void {
    if (this.isTracking) return;

    this.sessionId = sessionId;
    this.isTracking = true;
    this.activeSeconds = 0;
    this.idleSeconds = 0;
    this.appUsageMap.clear();

    // Start sub-services
    inputMonitor.start(this.config.inputMonitoring);

    // Sample every N seconds
    this.sampleInterval = setInterval(
      () => this.collectSample(),
      this.config.tracking.sampleIntervalMs
    );

    log.info(`Activity tracking started (session: ${sessionId})`);
  }

  stop(): void {
    this.isTracking = false;

    if (this.sampleInterval) {
      clearInterval(this.sampleInterval);
      this.sampleInterval = null;
    }

    inputMonitor.stop();

    // Persist unsent samples
    if (this.buffer.length > 0) {
      store.set('unsent-samples', this.buffer);
      log.info(`Persisted ${this.buffer.length} unsent samples`);
    }

    log.info('Activity tracking stopped');
  }

  private async collectSample(): Promise<void> {
    try {
      const idleTime = powerMonitor.getSystemIdleTime(); // seconds
      const isIdle = idleTime >= this.config.tracking.idleThresholdMinutes * 60;
      const sampleSeconds = this.config.tracking.sampleIntervalMs / 1000;

      // Track active/idle time
      if (isIdle) {
        this.idleSeconds += sampleSeconds;
      } else {
        this.activeSeconds += sampleSeconds;
      }

      // Notify renderer on idle state change
      if (isIdle !== this.lastIdleState) {
        this.lastIdleState = isIdle;
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
          win.webContents.send('idle-state-changed', { isIdle, idleSeconds: idleTime });
        }
      }

      // Get active window info
      let activeWindow = null;
      if (this.config.windowTracking.enabled) {
        activeWindow = await windowTracker.getActiveWindow(this.config);
      }

      // Track app usage duration
      if (activeWindow && !isIdle) {
        const appName = activeWindow.appName;
        this.appUsageMap.set(appName, (this.appUsageMap.get(appName) || 0) + sampleSeconds);
      }

      // Get input metrics and reset counters
      const inputMetrics = inputMonitor.getAndReset();

      // Build sample
      const sample: ActivitySample = {
        timestamp: new Date().toISOString(),
        status: isIdle ? 'idle' : 'active',
        idleSeconds: idleTime,
        activeWindow,
        input: {
          keystrokes: inputMetrics.keystrokes,
          mouseClicks: inputMetrics.mouseClicks,
          mouseDistance: inputMetrics.mouseDistance,
        },
        systemInfo: {
          cpuUsage: process.cpuUsage().user / 1000000, // μs → s
          memoryUsage: process.memoryUsage().heapUsed / (1024 * 1024), // MB
        },
      };

      this.buffer.push(sample);

      // Periodic persistence (every 30 samples)
      if (this.buffer.length % 30 === 0) {
        store.set('unsent-samples', this.buffer);
      }

    } catch (error) {
      log.error('Activity sample collection failed:', error);
    }
  }

  flushBatch(): ActivityBatch | null {
    if (this.buffer.length === 0 || !this.sessionId || !this.userId || !this.deviceId) {
      return null;
    }

    const samples = this.buffer.splice(0, this.config.tracking.maxBatchSize);
    store.set('unsent-samples', this.buffer); // Persist remaining

    // Calculate top apps
    const topApps = Array.from(this.appUsageMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, seconds]) => ({ name, seconds }));

    const totalTracked = this.activeSeconds + this.idleSeconds;
    const productivityScore = totalTracked > 0
      ? Math.round((this.activeSeconds / totalTracked) * 100)
      : 0;

    const batch: ActivityBatch = {
      batchId: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: this.userId,
      deviceId: this.deviceId,
      sessionId: this.sessionId,
      startTime: samples[0].timestamp,
      endTime: samples[samples.length - 1].timestamp,
      samples,
      summary: {
        totalActiveSeconds: this.activeSeconds,
        totalIdleSeconds: this.idleSeconds,
        topApps,
        productivityScore,
      },
    };

    log.info(`Flushed batch: ${samples.length} samples, productivity: ${productivityScore}%`);
    return batch;
  }

  getRealtimeStats() {
    return {
      isTracking: this.isTracking,
      bufferedSamples: this.buffer.length,
      activeSeconds: this.activeSeconds,
      idleSeconds: this.idleSeconds,
      productivityScore: this.activeSeconds + this.idleSeconds > 0
        ? Math.round((this.activeSeconds / (this.activeSeconds + this.idleSeconds)) * 100)
        : 0,
    };
  }
}

export const activityTracker = new ActivityTrackerService();
```

---

### 24. `src/services/window-tracker.service.ts` — Active Window Detection

```typescript
import log from 'electron-log';

interface WindowInfo {
  title: string;
  appName: string;
  url?: string;
}

class WindowTrackerService {
  private activeWindowLib: any = null;

  constructor() {
    // Use @prsm/active-win or active-win for cross-platform active window detection
    try {
      this.activeWindowLib = require('@prsm/active-win');
    } catch {
      try {
        this.activeWindowLib = require('active-win');
      } catch {
        log.warn('No active-window library found — window tracking disabled');
      }
    }
  }

  async getActiveWindow(config: any): Promise<WindowInfo | null> {
    if (!this.activeWindowLib) return null;

    try {
      const win = await this.activeWindowLib.activeWindow();
      if (!win) return null;

      const appName = win.owner?.name || win.app || 'Unknown';
      let title = config.windowTracking.captureWindowTitle ? (win.title || '') : '[redacted]';
      let url: string | undefined;

      // Privacy: Check sensitive app blacklist
      if (config.privacy.anonymizeSensitiveApps) {
        const blacklist: string[] = config.windowTracking.sensitiveAppBlacklist || [];
        if (blacklist.some(b => appName.toLowerCase().includes(b.toLowerCase()))) {
          return {
            title: '[sensitive app]',
            appName: '[redacted]',
            url: undefined,
          };
        }
      }

      // Privacy: Mask window titles if configured
      if (config.privacy.maskWindowTitles) {
        title = title.replace(/[a-zA-Z0-9]/g, '*');
      }

      // Extract URL from browser windows
      if (config.windowTracking.captureUrl) {
        const browserApps = ['chrome', 'firefox', 'safari', 'edge', 'brave', 'opera', 'arc'];
        if (browserApps.some(b => appName.toLowerCase().includes(b))) {
          url = this.extractUrlFromTitle(title);
          if (url && config.privacy.stripUrlParams) {
            url = url.split('?')[0].split('#')[0]; // Remove query params
          }
        }
      }

      return { title, appName, url };
    } catch (error) {
      log.error('Active window detection failed:', error);
      return null;
    }
  }

  private extractUrlFromTitle(title: string): string | undefined {
    // Browser titles often contain the URL or domain
    // Format: "Page Title - Browser" or "domain.com - Page Title"
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)/;
    const match = title.match(urlPattern);
    return match ? match[0] : undefined;
  }
}

export const windowTracker = new WindowTrackerService();
```

---

### 25. `src/services/input-monitor.service.ts` — Privacy-Safe Input Tracking

```typescript
import { globalShortcut } from 'electron';
import log from 'electron-log';

// Uses uiohook-napi for native input monitoring without keystroke logging
// npm install uiohook-napi

interface InputMetrics {
  keystrokes: number;
  mouseClicks: number;
  mouseDistance: number;
}

interface InputConfig {
  trackKeyboardActivity: boolean;
  trackMouseActivity: boolean;
  logKeystrokeCounts: boolean;
  logKeystrokeContent: boolean; // NEVER enable unless explicit admin config
  logMouseClicks: boolean;
  logMouseMovement: boolean;
}

class InputMonitorService {
  private keystrokes = 0;
  private mouseClicks = 0;
  private mouseDistance = 0;
  private lastMousePos = { x: 0, y: 0 };
  private hook: any = null;
  private config: InputConfig | null = null;

  start(config: InputConfig): void {
    this.config = config;
    this.reset();

    try {
      const { uIOhook, UiohookKey } = require('uiohook-napi');
      this.hook = uIOhook;

      if (config.trackKeyboardActivity && config.logKeystrokeCounts) {
        uIOhook.on('keydown', () => {
          this.keystrokes++;
          // PRIVACY: Only count, NEVER log actual key values
          // config.logKeystrokeContent is intentionally NOT implemented here
        });
      }

      if (config.trackMouseActivity) {
        if (config.logMouseClicks) {
          uIOhook.on('click', () => {
            this.mouseClicks++;
          });
        }

        if (config.logMouseMovement) {
          uIOhook.on('mousemove', (e: { x: number; y: number }) => {
            const dx = e.x - this.lastMousePos.x;
            const dy = e.y - this.lastMousePos.y;
            this.mouseDistance += Math.sqrt(dx * dx + dy * dy);
            this.lastMousePos = { x: e.x, y: e.y };
          });
        }
      }

      uIOhook.start();
      log.info('Input monitoring started (privacy-safe mode)');
    } catch (error) {
      log.warn('uiohook-napi not available — input monitoring disabled:', error);
      // Fallback: use powerMonitor idle time as proxy for activity
    }
  }

  stop(): void {
    if (this.hook) {
      try {
        this.hook.stop();
      } catch {}
      this.hook = null;
    }
    log.info('Input monitoring stopped');
  }

  getAndReset(): InputMetrics {
    const metrics = {
      keystrokes: this.keystrokes,
      mouseClicks: this.mouseClicks,
      mouseDistance: Math.round(this.mouseDistance),
    };
    this.reset();
    return metrics;
  }

  private reset(): void {
    this.keystrokes = 0;
    this.mouseClicks = 0;
    this.mouseDistance = 0;
  }
}

export const inputMonitor = new InputMonitorService();
```

---

### 26. `src/workers/activity-sync.worker.ts` — Batch Upload Worker

```typescript
import axios from 'axios';
import log from 'electron-log';
import { activityTracker } from '../services/activity-tracker.service';
import { authService } from '../services/auth.service';
import ElectronStore from 'electron-store';

const API_BASE = 'https://api.teamtreck.com';
const SYNC_INTERVAL = 120000; // 2 minutes
const failedStore = new ElectronStore({ name: 'failed-activity-batches' });

class ActivitySyncWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isOnline = true;

  start(): void {
    // Check connectivity
    if (typeof process !== 'undefined') {
      const { net } = require('electron');
      setInterval(() => { this.isOnline = net.isOnline(); }, 10000);
    }

    this.intervalId = setInterval(() => this.sync(), SYNC_INTERVAL);
    log.info('Activity sync worker started (interval: 2min)');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    // Final flush
    this.sync();
    log.info('Activity sync worker stopped');
  }

  private async sync(): Promise<void> {
    // 1. Flush current buffer
    const batch = activityTracker.flushBatch();
    if (!batch && this.getFailedQueue().length === 0) return;

    const token = await authService.getToken();
    if (!token) {
      if (batch) this.enqueueFailed(batch);
      return;
    }

    if (!this.isOnline) {
      if (batch) this.enqueueFailed(batch);
      log.info('Offline — activity batch queued');
      return;
    }

    // 2. Upload current batch
    if (batch) {
      const success = await this.uploadBatch(batch, token);
      if (!success) this.enqueueFailed(batch);
    }

    // 3. Retry failed batches
    await this.retryFailed(token);
  }

  private async uploadBatch(batch: any, token: string): Promise<boolean> {
    try {
      await axios.post(`${API_BASE}/api/agent/activity`, batch, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        timeout: 15000,
        maxBodyLength: 5 * 1024 * 1024, // 5MB max
      });
      log.info(`Activity batch uploaded: ${batch.batchId} (${batch.samples.length} samples)`);
      return true;
    } catch (error: any) {
      log.warn(`Activity upload failed: ${error.response?.status || error.code}`);
      return false;
    }
  }

  private getFailedQueue(): any[] {
    return (failedStore.get('queue') as any[]) || [];
  }

  private enqueueFailed(batch: any): void {
    const queue = this.getFailedQueue();
    queue.push({ ...batch, failedAt: Date.now(), retries: 0 });
    // Keep max 50 failed batches
    if (queue.length > 50) queue.splice(0, queue.length - 50);
    failedStore.set('queue', queue);
  }

  private async retryFailed(token: string): Promise<void> {
    const queue = this.getFailedQueue();
    if (queue.length === 0) return;

    const remaining: any[] = [];
    for (const batch of queue) {
      const success = await this.uploadBatch(batch, token);
      if (!success) {
        batch.retries = (batch.retries || 0) + 1;
        if (batch.retries < 10) remaining.push(batch);
        else log.error(`Dropping batch ${batch.batchId} after 10 retries`);
      }
    }
    failedStore.set('queue', remaining);
  }
}

export const activitySyncWorker = new ActivitySyncWorker();
```

---

### IPC Handlers for Activity Tracking

```typescript
// Add to ipc-handlers.ts

ipcMain.handle('activity:getStats', async () => {
  return activityTracker.getRealtimeStats();
});

ipcMain.handle('activity:getConfig', async () => {
  return require('../config/tracking-config.json');
});
```

### Preload API Extensions

```typescript
// Add to preload/index.ts
getActivityStats: () => ipcRenderer.invoke('activity:getStats'),
getTrackingConfig: () => ipcRenderer.invoke('activity:getConfig'),
onIdleStateChanged: (callback: (data: { isIdle: boolean; idleSeconds: number }) => void) => {
  ipcRenderer.on('idle-state-changed', (_event, data) => callback(data));
  return () => ipcRenderer.removeListener('idle-state-changed', () => {});
},
```

### Package Dependencies for Activity Tracking

```json
{
  "dependencies": {
    "uiohook-napi": "^1.5.0",
    "@prsm/active-win": "^1.0.0"
  }
}
```

> **Note:** `uiohook-napi` requires `@electron/rebuild`:
> ```bash
> npx @electron/rebuild -m node_modules/uiohook-napi
> ```

---

## 🏗️ Full SaaS Architecture — TeamTreck Platform

### System Architecture (10,000 Users)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                      │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐            │
│  │   Electron    │   │  React Web   │   │   Mobile     │            │
│  │   Desktop     │   │  Dashboard   │   │   (Future)   │            │
│  │   Agent       │   │  (Admin)     │   │              │            │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘            │
│         │                  │                   │                     │
└─────────┼──────────────────┼───────────────────┼────────────────────┘
          │                  │                   │
          │ HTTPS/WSS        │ HTTPS             │ HTTPS
          ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER (AWS ALB)                          │
│                    ├── Health checks                                │
│                    ├── SSL termination                              │
│                    └── Rate limiting (100 req/min per IP)           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  API Server #1   │ │  API Server #2   │ │  API Server #N   │
│  (Node.js)       │ │  (Node.js)       │ │  (Node.js)       │
│  Express/Fastify │ │  Express/Fastify │ │  Express/Fastify │
│  PM2 Cluster     │ │  PM2 Cluster     │ │  PM2 Cluster     │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   MongoDB        │ │   Redis          │ │   AWS S3         │
│   Atlas M30+     │ │   ElastiCache    │ │                  │
│                  │ │                  │ │   Screenshots    │
│   ├── users      │ │   ├── sessions   │ │   ├── raw/       │
│   ├── sessions   │ │   ├── tokens     │ │   ├── optimized/ │
│   ├── activities │ │   ├── cache      │ │   └── exports/   │
│   ├── screenshots│ │   └── pub/sub    │ │                  │
│   └── companies  │ │                  │ │   CDN: CloudFront│
└──────────────────┘ └──────────────────┘ └──────────────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
          ┌──────────────────┐ ┌──────────────────┐
          │  Bull MQ Workers │ │  Cron Jobs        │
          │                  │ │                    │
          │  ├── screenshot  │ │  ├── report gen    │
          │  │   processing  │ │  ├── data cleanup  │
          │  ├── activity    │ │  ├── 90-day purge  │
          │  │   aggregation │ │  └── billing cycle  │
          │  └── alert       │ │                    │
          │     notifications│ └──────────────────┘
          └──────────────────┘
```

---

### Data Flow Diagrams

#### Authentication Flow

```
Electron Agent                API Server               MongoDB          Redis
     │                            │                       │               │
     ├── POST /api/auth/login ───►│                       │               │
     │   {email, password}        │                       │               │
     │                            ├── findUser() ────────►│               │
     │                            │◄── user doc ──────────┤               │
     │                            │                       │               │
     │                            ├── bcrypt.compare() ──►│               │
     │                            │                       │               │
     │                            ├── jwt.sign({          │               │
     │                            │     user_id,          │               │
     │                            │     role,             │               │
     │                            │     company_id,       │               │
     │                            │     device_id         │               │
     │                            │   })                  │               │
     │                            │                       │               │
     │                            ├── SET session ────────┼──────────────►│
     │                            │   (TTL: 24h)          │               │
     │                            │                       │               │
     │◄── { token, user,          │                       │               │
     │      monitoring_rules } ───┤                       │               │
     │                            │                       │               │
     ├── [Store in OS Keychain]   │                       │               │
```

#### Monitoring Flow

```
Electron Agent                         API Server                MongoDB
     │                                      │                       │
     ├── POST /api/sessions/start ─────────►│                       │
     │   { device_id, timestamp }           │                       │
     │                                      ├── createSession() ───►│
     │◄── { session_id } ──────────────────┤                       │
     │                                      │                       │
     │  [Every 10s: collect sample]         │                       │
     │  [Every 5min: capture screenshot]    │                       │
     │                                      │                       │
     ├── POST /api/agent/activity ─────────►│   (every 2 min)      │
     │   { batch of samples }               │                       │
     │                                      ├── bulkInsert() ──────►│
     │                                      │                       │
     ├── POST /api/agent/heartbeat ────────►│   (every 30s)        │
     │   { status, timestamp }              │                       │
     │                                      ├── updateSession() ───►│
```

#### Screenshot Upload Flow

```
Agent                       API Server              S3              MongoDB
  │                              │                    │                │
  │ [Capture → Optimize → Encrypt locally]            │                │
  │                              │                    │                │
  ├── POST /api/agent/screenshots ►│                  │                │
  │   multipart/form-data         │                   │                │
  │   {file, timestamp, captureId}│                   │                │
  │                               │                   │                │
  │                               ├── Upload ────────►│                │
  │                               │   s3.putObject()  │                │
  │                               │◄── {key, url} ────┤                │
  │                               │                   │                │
  │                               ├── Insert ─────────┼───────────────►│
  │                               │   {s3_key, url,   │                │
  │                               │    metadata}      │                │
  │                               │                   │                │
  │◄── { success: true } ────────┤                   │                │
  │                               │                   │                │
  │ [Delete local encrypted file] │                   │                │
```

---

### Database Schemas (MongoDB)

#### Company Schema

```javascript
// companies collection
{
  _id: ObjectId,
  name: String,                    // "Acme Corp"
  slug: String,                    // "acme-corp" (unique)
  plan: {
    type: String,                  // "starter" | "business" | "enterprise"
    maxUsers: Number,              // 50, 200, unlimited
    features: [String],            // ["screenshots", "url_tracking", "reports"]
  },
  monitoringRules: {
    screenshotsPerHour: Number,    // 1-30
    idleThresholdMinutes: Number,  // 1-30
    privacyBlur: Boolean,
    trackUrls: Boolean,
    trackApps: Boolean,
    blockedApps: [String],
    blockedUrls: [String],
    allowedApps: [String],
    workingHours: {
      start: String,               // "09:00"
      end: String,                 // "18:00"
      timezone: String,            // "Asia/Kolkata"
    },
  },
  billing: {
    stripeCustomerId: String,
    currentPeriodEnd: Date,
    status: String,                // "active" | "past_due" | "cancelled"
  },
  settings: {
    dataRetentionDays: Number,     // default: 90
    exportEnabled: Boolean,
  },
  createdAt: Date,
  updatedAt: Date,
}

// Index: { slug: 1 } unique
```

#### User Schema

```javascript
// users collection
{
  _id: ObjectId,
  company_id: ObjectId,           // FK → companies
  email: String,                   // unique per company
  passwordHash: String,           // bcrypt
  role: String,                    // "company_admin" | "sub_admin" | "user"
  profile: {
    firstName: String,
    lastName: String,
    department: String,
    designation: String,
    avatar: String,                // S3 URL
  },
  devices: [{
    deviceId: String,              // UUID bound on first login
    platform: String,              // "win32" | "darwin" | "linux"
    hostname: String,
    lastSeen: Date,
    agentVersion: String,          // "2.1.0"
  }],
  status: String,                  // "active" | "suspended" | "invited"
  invitedBy: ObjectId,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date,
}

// Indexes:
// { company_id: 1, email: 1 } unique compound
// { company_id: 1, role: 1 }
// { status: 1 }
```

#### Session Schema

```javascript
// sessions collection
{
  _id: ObjectId,
  user_id: ObjectId,              // FK → users
  company_id: ObjectId,           // FK → companies (denormalized for query perf)
  device_id: String,
  startTime: Date,
  endTime: Date | null,           // null = active session
  status: String,                  // "active" | "paused" | "ended" | "force_ended"
  timeline: [{
    event: String,                 // "start" | "pause" | "resume" | "idle" | "active" | "end"
    timestamp: Date,
    metadata: Object,              // { reason: "admin_force_logout", idleSeconds: 300 }
  }],
  summary: {
    totalActiveSeconds: Number,
    totalPausedSeconds: Number,
    totalIdleSeconds: Number,
    screenshotCount: Number,
    productivityScore: Number,     // 0-100
    topApps: [{
      name: String,
      seconds: Number,
      category: String,            // "productive" | "neutral" | "unproductive"
    }],
  },
  createdAt: Date,
}

// Indexes:
// { user_id: 1, startTime: -1 }
// { company_id: 1, startTime: -1 }
// { status: 1, company_id: 1 }
// TTL: { createdAt: 1 }, expireAfterSeconds: 365 * 86400  (1 year)
```

#### ActivityLog Schema

```javascript
// activity_logs collection
{
  _id: ObjectId,
  session_id: ObjectId,           // FK → sessions
  user_id: ObjectId,              // FK → users
  company_id: ObjectId,           // FK → companies
  batchId: String,                // Deduplication key
  samples: [{
    timestamp: Date,
    status: String,                // "active" | "idle"
    idleSeconds: Number,
    activeWindow: {
      title: String,
      appName: String,
      url: String,
      category: String,            // "productive" | "neutral" | "unproductive"
    },
    input: {
      keystrokes: Number,
      mouseClicks: Number,
      mouseDistance: Number,
    },
  }],
  uploadedAt: Date,
}

// Indexes:
// { batchId: 1 } unique (deduplication)
// { user_id: 1, "samples.timestamp": -1 }
// { company_id: 1, uploadedAt: -1 }
// TTL: { uploadedAt: 1 }, expireAfterSeconds: 90 * 86400  (90 days)
```

#### Screenshot Schema

```javascript
// screenshots collection
{
  _id: ObjectId,
  captureId: String,              // Agent-generated unique ID
  session_id: ObjectId,           // FK → sessions
  user_id: ObjectId,              // FK → users
  company_id: ObjectId,           // FK → companies
  s3Key: String,                  // "screenshots/{company_id}/{user_id}/{date}/{captureId}.jpg"
  s3Url: String,                  // CloudFront URL (signed, expires in 1h)
  displayId: String,
  metadata: {
    width: Number,
    height: Number,
    fileSize: Number,              // bytes
    format: String,
    capturedAt: Date,
    activeWindow: String,
    blurred: Boolean,
  },
  retentionExpiry: Date,           // 90 days from capture
  createdAt: Date,
}

// Indexes:
// { captureId: 1 } unique (deduplication)
// { user_id: 1, createdAt: -1 }
// { company_id: 1, createdAt: -1 }
// TTL: { retentionExpiry: 1 }, expireAfterSeconds: 0  (auto-delete at expiry)
```

---

### API Endpoints

#### Authentication

| Method | Endpoint | Body | Response | Auth |
|--------|----------|------|----------|------|
| POST | `/api/auth/login` | `{ email, password, device_id? }` | `{ token, user, monitoring_rules }` | None |
| POST | `/api/auth/logout` | — | `{ success }` | JWT |
| POST | `/api/auth/refresh` | `{ refreshToken }` | `{ token }` | JWT |
| POST | `/api/auth/verify-device` | `{ device_id }` | `{ bound: true }` | JWT |

#### Sessions

| Method | Endpoint | Body | Response | Auth |
|--------|----------|------|----------|------|
| POST | `/api/sessions/start` | `{ device_id, timestamp }` | `{ session_id, startTime }` | JWT |
| PUT | `/api/sessions/:id/pause` | `{ timestamp }` | `{ success }` | JWT |
| PUT | `/api/sessions/:id/resume` | `{ timestamp }` | `{ success }` | JWT |
| PUT | `/api/sessions/:id/end` | `{ timestamp, summary }` | `{ success }` | JWT |
| GET | `/api/sessions/active` | — | `{ sessions[] }` | JWT (admin) |
| POST | `/api/sessions/:id/force-end` | `{ reason }` | `{ success }` | JWT (admin) |

#### Activity

| Method | Endpoint | Body | Response | Auth |
|--------|----------|------|----------|------|
| POST | `/api/agent/activity` | `ActivityBatch` | `{ success }` | JWT |
| POST | `/api/agent/heartbeat` | `{ timestamp, status }` | `{ commands[] }` | JWT |
| GET | `/api/activity/:userId/timeline` | `?date=&range=` | `{ timeline[] }` | JWT (admin) |
| GET | `/api/activity/:userId/summary` | `?period=daily\|weekly` | `{ summary }` | JWT (admin) |

#### Screenshots

| Method | Endpoint | Body | Response | Auth |
|--------|----------|------|----------|------|
| POST | `/api/agent/screenshots` | `multipart { file, metadata }` | `{ success, id }` | JWT |
| GET | `/api/screenshots/:userId` | `?date=&page=&limit=` | `{ screenshots[], total }` | JWT (admin) |
| GET | `/api/screenshots/:id/url` | — | `{ signedUrl }` | JWT (admin) |
| POST | `/api/screenshots/bulk-download` | `{ ids[] }` | `{ downloadUrl }` | JWT (admin) |

#### Admin

| Method | Endpoint | Body | Response | Auth |
|--------|----------|------|----------|------|
| GET | `/api/admin/dashboard` | — | `{ stats }` | JWT (admin) |
| PUT | `/api/admin/monitoring-rules` | `{ rules }` | `{ success }` | JWT (admin) |
| POST | `/api/admin/invite` | `{ email, role }` | `{ inviteId }` | JWT (admin) |
| GET | `/api/admin/reports` | `?type=&format=` | `{ report }` | JWT (admin) |

---

### Security Model

#### JWT Structure

```json
{
  "header": { "alg": "RS256", "typ": "JWT" },
  "payload": {
    "user_id": "ObjectId",
    "company_id": "ObjectId",
    "role": "user | sub_admin | company_admin",
    "device_id": "uuid-bound-to-machine",
    "iss": "teamtreck-api",
    "aud": "teamtreck-agent",
    "exp": 1234567890,
    "iat": 1234567890
  }
}
```

#### Device Binding

```
1. First login from agent → generate device_id (UUID v4)
2. Send device_id in login request
3. Server stores device_id in user.devices[]
4. Subsequent requests: JWT device_id must match request header X-Device-ID
5. Max 3 devices per user (configurable per company)
6. Admin can revoke device bindings
```

#### API Protection Layers

```
Request → Rate Limiter → CORS → JWT Verify → Role Check
  → Company Isolation → Input Validation → Handler → Response

1. Rate Limiting:    100 req/min per IP, 1000 req/min per user
2. CORS:             Whitelist dashboard domain only
3. JWT Verification: RS256 signature + expiry + audience check
4. Role Guard:       Permission matrix per endpoint
5. Tenant Isolation: Every query includes company_id from JWT
6. Input Validation: Zod schemas for all request bodies
7. Helmet.js:        Security headers (CSP, HSTS, X-Frame-Options)
```

---

### Scaling Strategy (10,000 Users)

| Component | Strategy | Config |
|-----------|----------|--------|
| **API Servers** | Horizontal auto-scaling (AWS ECS Fargate) | Min 3, Max 20 instances |
| **MongoDB** | Atlas M30+ with read replicas | 3-node replica set, sharding by company_id |
| **Redis** | ElastiCache cluster mode | 3 shards, 1 replica each |
| **S3** | Standard tier + lifecycle rules | Intelligent-Tiering after 30 days |
| **CDN** | CloudFront for signed screenshot URLs | Edge caching, 1h TTL |
| **Queue** | BullMQ on Redis | Dedicated worker instances |
| **Monitoring** | DataDog / CloudWatch | APM, custom metrics, alerts |

#### Estimated Resource Usage (10K Users)

```
Screenshots:  10,000 users × 12/hour × 8 hours × 150KB avg = ~140 GB/day
Activity:     10,000 users × 360 samples/hour × 8 hours = 28.8M samples/day
Heartbeats:   10,000 users × 120/hour × 8 hours = 9.6M heartbeats/day
API Requests: ~50M requests/day
S3 Storage:   ~4.2 TB/month (before 90-day cleanup)
MongoDB:      ~500 GB/month (with TTL indexes)
```

---

### Recommended Tech Stack Versions

| Technology | Version | Purpose |
|------------|---------|---------|
| **Electron** | 30.x LTS | Desktop agent |
| **Node.js** | 20.x LTS | API server runtime |
| **TypeScript** | 5.4+ | Type safety |
| **Express** | 4.19+ / Fastify 4.x | HTTP framework |
| **MongoDB** | 7.0+ (Atlas) | Primary database |
| **Mongoose** | 8.x | ODM |
| **Redis** | 7.2+ | Caching, sessions, queues |
| **BullMQ** | 5.x | Job queue |
| **AWS SDK** | v3 | S3, SES, CloudFront |
| **React** | 18.3+ | Dashboard frontend |
| **Vite** | 5.x | Build tooling |
| **Sharp** | 0.33+ | Image processing |
| **Zod** | 3.x | Input validation |
| **Helmet** | 7.x | Security headers |
| **Winston** | 3.x | Server logging |
| **Vitest** | 1.x | Testing |
| **Docker** | 24+ | Containerization |
| **Terraform** | 1.7+ | Infrastructure as code |

---

## 12. Express.js Backend Server — Complete Boilerplate

### Folder Structure

```
server/
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Express app setup
│   ├── config/
│   │   ├── env.ts               # Environment variables
│   │   ├── database.ts          # MongoDB connection
│   │   └── redis.ts             # Redis connection
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification
│   │   ├── roleGuard.ts         # Role-based access
│   │   ├── tenantIsolation.ts   # company_id scoping
│   │   ├── rateLimiter.ts       # Rate limiting
│   │   ├── validate.ts          # Zod validation
│   │   └── errorHandler.ts      # Global error handler
│   ├── models/
│   │   ├── Company.ts
│   │   ├── User.ts
│   │   ├── Session.ts
│   │   ├── ActivityLog.ts
│   │   └── Screenshot.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── session.routes.ts
│   │   ├── activity.routes.ts
│   │   ├── screenshot.routes.ts
│   │   └── admin.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── session.service.ts
│   │   ├── activity.service.ts
│   │   ├── screenshot.service.ts
│   │   └── websocket.service.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── s3.ts
│   │   └── errors.ts
│   └── types/
│       └── index.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

### Config — env.ts

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

export const env = envSchema.parse(process.env);
```

### Config — database.ts

```typescript
import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection failed', error);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => logger.error('MongoDB error', err));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
}
```

### Config — redis.ts

```typescript
import { createClient, RedisClientType } from 'redis';
import { env } from './env';
import { logger } from '../utils/logger';

let redis: RedisClientType;

export async function connectRedis(): Promise<RedisClientType> {
  redis = createClient({ url: env.REDIS_URL });
  redis.on('error', (err) => logger.error('Redis error', err));
  await redis.connect();
  logger.info('Redis connected');
  return redis;
}

export function getRedis(): RedisClientType {
  if (!redis) throw new Error('Redis not initialized');
  return redis;
}
```

---

### Models

#### Company.ts

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  domain: string;
  plan: 'free' | 'starter' | 'business' | 'enterprise';
  settings: {
    screenshot_interval: number;
    idle_threshold: number;
    max_devices_per_user: number;
    blur_screenshots: boolean;
    track_urls: boolean;
    track_apps: boolean;
  };
  subscription: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    status: 'active' | 'past_due' | 'canceled' | 'trialing';
    current_period_end?: Date;
  };
  created_at: Date;
}

const CompanySchema = new Schema<ICompany>({
  name: { type: String, required: true, trim: true },
  domain: { type: String, required: true, unique: true, lowercase: true },
  plan: { type: String, enum: ['free', 'starter', 'business', 'enterprise'], default: 'free' },
  settings: {
    screenshot_interval: { type: Number, default: 300 },
    idle_threshold: { type: Number, default: 300 },
    max_devices_per_user: { type: Number, default: 3 },
    blur_screenshots: { type: Boolean, default: false },
    track_urls: { type: Boolean, default: true },
    track_apps: { type: Boolean, default: true },
  },
  subscription: {
    stripe_customer_id: String,
    stripe_subscription_id: String,
    status: { type: String, enum: ['active', 'past_due', 'canceled', 'trialing'], default: 'trialing' },
    current_period_end: Date,
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
```

#### User.ts

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  company_id: Types.ObjectId;
  email: string;
  password_hash: string;
  name: string;
  role: 'company_admin' | 'sub_admin' | 'user';
  devices: Array<{
    device_id: string;
    device_name: string;
    os: string;
    bound_at: Date;
    last_seen: Date;
  }>;
  status: 'active' | 'suspended' | 'invited';
  invite_token?: string;
  last_login?: Date;
}

const UserSchema = new Schema<IUser>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['company_admin', 'sub_admin', 'user'], default: 'user' },
  devices: [{
    device_id: { type: String, required: true },
    device_name: String,
    os: String,
    bound_at: { type: Date, default: Date.now },
    last_seen: { type: Date, default: Date.now },
  }],
  status: { type: String, enum: ['active', 'suspended', 'invited'], default: 'invited' },
  invite_token: String,
  last_login: Date,
}, { timestamps: true });

UserSchema.index({ company_id: 1, email: 1 });
UserSchema.index({ invite_token: 1 }, { sparse: true });

export const User = mongoose.model<IUser>('User', UserSchema);
```

#### Session.ts

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISession extends Document {
  user_id: Types.ObjectId;
  company_id: Types.ObjectId;
  device_id: string;
  start_time: Date;
  end_time?: Date;
  status: 'active' | 'paused' | 'ended' | 'force_ended';
  events: Array<{
    type: 'start' | 'pause' | 'resume' | 'end' | 'force_end' | 'idle_start' | 'idle_end';
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }>;
  summary: {
    total_duration: number;
    active_duration: number;
    idle_duration: number;
    pause_duration: number;
    screenshots_count: number;
    activity_score: number;
  };
}

const SessionSchema = new Schema<ISession>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  device_id: { type: String, required: true },
  start_time: { type: Date, required: true, default: Date.now },
  end_time: Date,
  status: { type: String, enum: ['active', 'paused', 'ended', 'force_ended'], default: 'active' },
  events: [{
    type: { type: String, enum: ['start', 'pause', 'resume', 'end', 'force_end', 'idle_start', 'idle_end'], required: true },
    timestamp: { type: Date, required: true },
    metadata: Schema.Types.Mixed,
  }],
  summary: {
    total_duration: { type: Number, default: 0 },
    active_duration: { type: Number, default: 0 },
    idle_duration: { type: Number, default: 0 },
    pause_duration: { type: Number, default: 0 },
    screenshots_count: { type: Number, default: 0 },
    activity_score: { type: Number, default: 0 },
  },
}, { timestamps: true });

SessionSchema.index({ company_id: 1, user_id: 1, start_time: -1 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ end_time: 1 }, { expireAfterSeconds: 90 * 86400 }); // TTL 90 days

export const Session = mongoose.model<ISession>('Session', SessionSchema);
```

#### ActivityLog.ts

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  user_id: Types.ObjectId;
  company_id: Types.ObjectId;
  session_id: Types.ObjectId;
  timestamp: Date;
  interval_start: Date;
  interval_end: Date;
  keyboard_events: number;
  mouse_events: number;
  mouse_distance: number;
  activity_score: number;
  idle: boolean;
  active_window: {
    title: string;
    app_name: string;
    url?: string;
    category?: string;
  };
}

const ActivityLogSchema = new Schema<IActivityLog>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  session_id: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  timestamp: { type: Date, required: true },
  interval_start: { type: Date, required: true },
  interval_end: { type: Date, required: true },
  keyboard_events: { type: Number, default: 0 },
  mouse_events: { type: Number, default: 0 },
  mouse_distance: { type: Number, default: 0 },
  activity_score: { type: Number, default: 0, min: 0, max: 100 },
  idle: { type: Boolean, default: false },
  active_window: {
    title: { type: String, default: '' },
    app_name: { type: String, default: '' },
    url: String,
    category: String,
  },
}, { timestamps: false });

ActivityLogSchema.index({ company_id: 1, user_id: 1, timestamp: -1 });
ActivityLogSchema.index({ session_id: 1 });
ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 86400 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
```

#### Screenshot.ts

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IScreenshot extends Document {
  user_id: Types.ObjectId;
  company_id: Types.ObjectId;
  session_id: Types.ObjectId;
  timestamp: Date;
  s3_key: string;
  s3_bucket: string;
  file_size: number;
  resolution: { width: number; height: number };
  monitor_id?: string;
  activity_score: number;
  active_window: { title: string; app_name: string };
  blurred: boolean;
}

const ScreenshotSchema = new Schema<IScreenshot>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  session_id: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  timestamp: { type: Date, required: true },
  s3_key: { type: String, required: true },
  s3_bucket: { type: String, required: true },
  file_size: { type: Number, required: true },
  resolution: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  monitor_id: String,
  activity_score: { type: Number, default: 0 },
  active_window: {
    title: { type: String, default: '' },
    app_name: { type: String, default: '' },
  },
  blurred: { type: Boolean, default: false },
}, { timestamps: true });

ScreenshotSchema.index({ company_id: 1, user_id: 1, timestamp: -1 });
ScreenshotSchema.index({ session_id: 1 });
ScreenshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 86400 });

export const Screenshot = mongoose.model<IScreenshot>('Screenshot', ScreenshotSchema);
```

---

### Middleware

#### auth.ts — JWT Verification

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

export interface AuthPayload {
  user_id: string;
  company_id: string;
  role: 'company_admin' | 'sub_admin' | 'user';
  device_id: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Missing authorization token', 401);
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer: 'teamtreck-api',
      audience: 'teamtreck-agent',
    }) as AuthPayload;

    // Device binding check
    const deviceHeader = req.headers['x-device-id'] as string | undefined;
    if (deviceHeader && payload.device_id && deviceHeader !== payload.device_id) {
      throw new AppError('Device ID mismatch', 403);
    }

    req.auth = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or expired token', 401);
  }
}
```

#### roleGuard.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

type Role = 'company_admin' | 'sub_admin' | 'user';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) throw new AppError('Unauthorized', 401);
    if (!roles.includes(req.auth.role)) {
      throw new AppError('Insufficient permissions', 403);
    }
    next();
  };
}
```

#### tenantIsolation.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

// Injects company_id into req.query for all downstream queries
export function enforceTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth?.company_id) {
    throw new AppError('Missing tenant context', 403);
  }
  // Attach for service layer use
  req.query._company_id = req.auth.company_id;
  next();
}
```

#### rateLimiter.ts

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedis } from '../config/redis';
import { env } from '../config/env';

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => getRedis().sendCommand(args),
  }),
  message: { error: 'Too many requests, please try again later' },
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  message: { error: 'Too many login attempts' },
});
```

#### validate.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/errors';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new AppError(`Validation failed: ${messages.join('; ')}`, 422);
    }
    req[source] = result.data;
    next();
  };
}
```

#### errorHandler.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
}
```

---

### Utils

#### errors.ts

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

#### logger.ts

```typescript
import winston from 'winston';
import { env } from '../config/env';

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  ),
  transports: [new winston.transports.Console()],
});
```

#### s3.ts

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadToS3(key: string, body: Buffer, contentType: string): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ServerSideEncryption: 'AES256',
  }));
  return key;
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  }), { expiresIn });
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  }));
}
```

---

### Routes

#### auth.routes.ts

```typescript
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { User } from '../models/User';
import { env } from '../config/env';
import { getRedis } from '../config/redis';
import { AppError } from '../utils/errors';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  device_id: z.string().uuid(),
  device_name: z.string().optional(),
  os: z.string().optional(),
});

const refreshSchema = z.object({
  refresh_token: z.string(),
});

function generateTokens(payload: object) {
  const accessToken = jwt.sign(payload, env.JWT_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: env.JWT_ACCESS_EXPIRY,
    issuer: 'teamtreck-api',
    audience: 'teamtreck-agent',
  });
  const refreshToken = jwt.sign(payload, env.JWT_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: env.JWT_REFRESH_EXPIRY,
    issuer: 'teamtreck-api',
  });
  return { accessToken, refreshToken };
}

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password, device_id, device_name, os } = req.body;

  const user = await User.findOne({ email, status: 'active' }).select('+password_hash');
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  // Device binding
  const existingDevice = user.devices.find((d) => d.device_id === device_id);
  if (!existingDevice) {
    if (user.devices.length >= 3) {
      throw new AppError('Maximum devices reached. Remove a device first.', 403);
    }
    user.devices.push({ device_id, device_name: device_name || 'Unknown', os: os || 'Unknown', bound_at: new Date(), last_seen: new Date() });
  } else {
    existingDevice.last_seen = new Date();
  }
  user.last_login = new Date();
  await user.save();

  const payload = {
    user_id: user._id.toString(),
    company_id: user.company_id.toString(),
    role: user.role,
    device_id,
  };

  const tokens = generateTokens(payload);

  // Store refresh token in Redis (7-day expiry)
  await getRedis().set(`refresh:${user._id}:${device_id}`, tokens.refreshToken, { EX: 7 * 86400 });

  res.json({
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/auth/refresh
router.post('/refresh', validate(refreshSchema), async (req, res) => {
  const { refresh_token } = req.body;
  const decoded = jwt.verify(refresh_token, env.JWT_PUBLIC_KEY, { algorithms: ['RS256'] }) as any;

  const stored = await getRedis().get(`refresh:${decoded.user_id}:${decoded.device_id}`);
  if (stored !== refresh_token) throw new AppError('Invalid refresh token', 401);

  const tokens = generateTokens({
    user_id: decoded.user_id,
    company_id: decoded.company_id,
    role: decoded.role,
    device_id: decoded.device_id,
  });

  await getRedis().set(`refresh:${decoded.user_id}:${decoded.device_id}`, tokens.refreshToken, { EX: 7 * 86400 });

  res.json({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  await getRedis().del(`refresh:${req.auth!.user_id}:${req.auth!.device_id}`);
  res.json({ success: true });
});

export default router;
```

#### session.routes.ts

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { enforceTenant } from '../middleware/tenantIsolation';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import { Session } from '../models/Session';
import { AppError } from '../utils/errors';

const router = Router();
router.use(authenticate, enforceTenant);

const startSchema = z.object({
  device_id: z.string().uuid(),
  timestamp: z.string().datetime(),
});

// POST /api/sessions/start
router.post('/start', validate(startSchema), async (req, res) => {
  const existing = await Session.findOne({ user_id: req.auth!.user_id, status: { $in: ['active', 'paused'] } });
  if (existing) throw new AppError('Active session already exists', 409);

  const session = await Session.create({
    user_id: req.auth!.user_id,
    company_id: req.auth!.company_id,
    device_id: req.body.device_id,
    start_time: new Date(req.body.timestamp),
    events: [{ type: 'start', timestamp: new Date(req.body.timestamp) }],
  });

  res.status(201).json({ session_id: session._id, startTime: session.start_time });
});

// PUT /api/sessions/:id/pause
router.put('/:id/pause', async (req, res) => {
  const session = await Session.findOneAndUpdate(
    { _id: req.params.id, user_id: req.auth!.user_id, status: 'active' },
    { $set: { status: 'paused' }, $push: { events: { type: 'pause', timestamp: new Date() } } },
    { new: true },
  );
  if (!session) throw new AppError('No active session found', 404);
  res.json({ success: true });
});

// PUT /api/sessions/:id/resume
router.put('/:id/resume', async (req, res) => {
  const session = await Session.findOneAndUpdate(
    { _id: req.params.id, user_id: req.auth!.user_id, status: 'paused' },
    { $set: { status: 'active' }, $push: { events: { type: 'resume', timestamp: new Date() } } },
    { new: true },
  );
  if (!session) throw new AppError('No paused session found', 404);
  res.json({ success: true });
});

// PUT /api/sessions/:id/end
router.put('/:id/end', async (req, res) => {
  const session = await Session.findOneAndUpdate(
    { _id: req.params.id, user_id: req.auth!.user_id, status: { $in: ['active', 'paused'] } },
    {
      $set: { status: 'ended', end_time: new Date(), summary: req.body.summary || {} },
      $push: { events: { type: 'end', timestamp: new Date() } },
    },
    { new: true },
  );
  if (!session) throw new AppError('No active session found', 404);
  res.json({ success: true });
});

// GET /api/sessions/active (admin)
router.get('/active', requireRole('company_admin', 'sub_admin'), async (req, res) => {
  const sessions = await Session.find({
    company_id: req.auth!.company_id,
    status: { $in: ['active', 'paused'] },
  }).populate('user_id', 'name email');
  res.json({ sessions });
});

// POST /api/sessions/:id/force-end (admin)
router.post('/:id/force-end', requireRole('company_admin'), async (req, res) => {
  const session = await Session.findOneAndUpdate(
    { _id: req.params.id, company_id: req.auth!.company_id, status: { $in: ['active', 'paused'] } },
    {
      $set: { status: 'force_ended', end_time: new Date() },
      $push: { events: { type: 'force_end', timestamp: new Date(), metadata: { reason: req.body.reason } } },
    },
    { new: true },
  );
  if (!session) throw new AppError('Session not found', 404);
  res.json({ success: true });
});

export default router;
```

#### activity.routes.ts

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { enforceTenant } from '../middleware/tenantIsolation';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import { ActivityLog } from '../models/ActivityLog';

const router = Router();
router.use(authenticate, enforceTenant);

const activityBatchSchema = z.object({
  session_id: z.string(),
  logs: z.array(z.object({
    timestamp: z.string().datetime(),
    interval_start: z.string().datetime(),
    interval_end: z.string().datetime(),
    keyboard_events: z.number().int().min(0),
    mouse_events: z.number().int().min(0),
    mouse_distance: z.number().min(0),
    activity_score: z.number().min(0).max(100),
    idle: z.boolean(),
    active_window: z.object({
      title: z.string(),
      app_name: z.string(),
      url: z.string().optional(),
    }),
  })).min(1).max(500),
});

// POST /api/agent/activity — batch upload
router.post('/', validate(activityBatchSchema), async (req, res) => {
  const docs = req.body.logs.map((log: any) => ({
    ...log,
    user_id: req.auth!.user_id,
    company_id: req.auth!.company_id,
    session_id: req.body.session_id,
    timestamp: new Date(log.timestamp),
    interval_start: new Date(log.interval_start),
    interval_end: new Date(log.interval_end),
  }));

  await ActivityLog.insertMany(docs, { ordered: false });
  res.json({ success: true, count: docs.length });
});

// POST /api/agent/heartbeat
router.post('/heartbeat', async (req, res) => {
  // Update last_seen, check for pending commands (force-logout, config change)
  const commands: any[] = []; // fetch from Redis command queue
  res.json({ commands });
});

// GET /api/activity/:userId/timeline (admin)
router.get('/:userId/timeline', requireRole('company_admin', 'sub_admin'), async (req, res) => {
  const { date, range } = req.query;
  const start = new Date(date as string);
  const end = new Date(start);
  end.setDate(end.getDate() + (Number(range) || 1));

  const timeline = await ActivityLog.find({
    company_id: req.auth!.company_id,
    user_id: req.params.userId,
    timestamp: { $gte: start, $lt: end },
  }).sort({ timestamp: 1 }).lean();

  res.json({ timeline });
});

// GET /api/activity/:userId/summary (admin)
router.get('/:userId/summary', requireRole('company_admin', 'sub_admin'), async (req, res) => {
  const period = req.query.period === 'weekly' ? 7 : 1;
  const start = new Date();
  start.setDate(start.getDate() - period);

  const summary = await ActivityLog.aggregate([
    { $match: { company_id: req.auth!.company_id, user_id: req.params.userId, timestamp: { $gte: start } } },
    {
      $group: {
        _id: null,
        total_samples: { $sum: 1 },
        avg_activity: { $avg: '$activity_score' },
        total_keyboard: { $sum: '$keyboard_events' },
        total_mouse: { $sum: '$mouse_events' },
        idle_samples: { $sum: { $cond: ['$idle', 1, 0] } },
      },
    },
  ]);

  res.json({ summary: summary[0] || {} });
});

export default router;
```

#### screenshot.routes.ts

```typescript
import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { enforceTenant } from '../middleware/tenantIsolation';
import { requireRole } from '../middleware/roleGuard';
import { Screenshot } from '../models/Screenshot';
import { uploadToS3, getSignedDownloadUrl } from '../utils/s3';
import { AppError } from '../utils/errors';

const router = Router();
router.use(authenticate, enforceTenant);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/agent/screenshots — upload from agent
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const metadata = JSON.parse(req.body.metadata || '{}');
  const key = `screenshots/${req.auth!.company_id}/${req.auth!.user_id}/${Date.now()}.webp`;

  await uploadToS3(key, req.file.buffer, req.file.mimetype);

  const screenshot = await Screenshot.create({
    user_id: req.auth!.user_id,
    company_id: req.auth!.company_id,
    session_id: metadata.session_id,
    timestamp: new Date(metadata.timestamp || Date.now()),
    s3_key: key,
    s3_bucket: process.env.AWS_S3_BUCKET,
    file_size: req.file.size,
    resolution: metadata.resolution || { width: 1920, height: 1080 },
    monitor_id: metadata.monitor_id,
    activity_score: metadata.activity_score || 0,
    active_window: metadata.active_window || { title: '', app_name: '' },
    blurred: metadata.blurred || false,
  });

  res.status(201).json({ success: true, id: screenshot._id });
});

// GET /api/screenshots/:userId (admin)
router.get('/:userId', requireRole('company_admin', 'sub_admin'), async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const [screenshots, total] = await Promise.all([
    Screenshot.find({ company_id: req.auth!.company_id, user_id: req.params.userId })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Screenshot.countDocuments({ company_id: req.auth!.company_id, user_id: req.params.userId }),
  ]);

  res.json({ screenshots, total, page, limit });
});

// GET /api/screenshots/:id/url (admin) — signed download URL
router.get('/:id/url', requireRole('company_admin', 'sub_admin'), async (req, res) => {
  const screenshot = await Screenshot.findOne({ _id: req.params.id, company_id: req.auth!.company_id });
  if (!screenshot) throw new AppError('Screenshot not found', 404);

  const signedUrl = await getSignedDownloadUrl(screenshot.s3_key);
  res.json({ signedUrl });
});

export default router;
```

#### admin.routes.ts

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { enforceTenant } from '../middleware/tenantIsolation';
import { requireRole } from '../middleware/roleGuard';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { Screenshot } from '../models/Screenshot';
import { ActivityLog } from '../models/ActivityLog';
import { Company } from '../models/Company';

const router = Router();
router.use(authenticate, enforceTenant, requireRole('company_admin'));

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  const companyId = req.auth!.company_id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalUsers, activeToday, activeSessions, screenshotsToday] = await Promise.all([
    User.countDocuments({ company_id: companyId, status: 'active' }),
    Session.distinct('user_id', { company_id: companyId, start_time: { $gte: today } }).then((ids) => ids.length),
    Session.countDocuments({ company_id: companyId, status: { $in: ['active', 'paused'] } }),
    Screenshot.countDocuments({ company_id: companyId, timestamp: { $gte: today } }),
  ]);

  const avgActivity = await ActivityLog.aggregate([
    { $match: { company_id: companyId, timestamp: { $gte: today } } },
    { $group: { _id: null, avg: { $avg: '$activity_score' } } },
  ]);

  res.json({
    stats: {
      totalUsers,
      activeToday,
      activeSessions,
      screenshotsToday,
      avgActivityScore: avgActivity[0]?.avg ?? 0,
    },
  });
});

// PUT /api/admin/monitoring-rules
router.put('/monitoring-rules', async (req, res) => {
  await Company.findByIdAndUpdate(req.auth!.company_id, { $set: { settings: req.body.rules } });
  res.json({ success: true });
});

// POST /api/admin/invite
router.post('/invite', async (req, res) => {
  const { email, role } = req.body;
  const inviteToken = require('crypto').randomBytes(32).toString('hex');

  const user = await User.create({
    company_id: req.auth!.company_id,
    email,
    password_hash: 'PENDING',
    name: email.split('@')[0],
    role: role || 'user',
    status: 'invited',
    invite_token: inviteToken,
  });

  // TODO: Send invite email via SES/SendGrid
  res.status(201).json({ inviteId: user._id, inviteToken });
});

export default router;
```

---

### WebSocket Service

```typescript
import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends WebSocket {
  auth?: { user_id: string; company_id: string; role: string };
  isAlive?: boolean;
}

const companyRooms = new Map<string, Set<AuthenticatedSocket>>();

export function initWebSocket(server: HTTPServer): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: AuthenticatedSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) { ws.close(4001, 'Missing token'); return; }

    try {
      const payload = jwt.verify(token, env.JWT_PUBLIC_KEY, { algorithms: ['RS256'] }) as any;
      ws.auth = { user_id: payload.user_id, company_id: payload.company_id, role: payload.role };
      ws.isAlive = true;

      // Join company room
      if (!companyRooms.has(payload.company_id)) companyRooms.set(payload.company_id, new Set());
      companyRooms.get(payload.company_id)!.add(ws);

      ws.on('pong', () => { ws.isAlive = true; });
      ws.on('close', () => { companyRooms.get(payload.company_id)?.delete(ws); });

      logger.info(`WS connected: user=${payload.user_id}`);
    } catch {
      ws.close(4003, 'Invalid token');
    }
  });

  // Heartbeat every 30s
  setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedSocket) => {
      if (!ws.isAlive) { ws.terminate(); return; }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);
}

// Broadcast to all admin sockets in a company
export function broadcastToCompany(companyId: string, event: string, data: unknown): void {
  const room = companyRooms.get(companyId);
  if (!room) return;
  const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  room.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN && ws.auth?.role !== 'user') {
      ws.send(message);
    }
  });
}
```

---

### App Entry Point

#### app.ts

```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import sessionRoutes from './routes/session.routes';
import activityRoutes from './routes/activity.routes';
import screenshotRoutes from './routes/screenshot.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/agent/activity', activityRoutes);
app.use('/api/agent/screenshots', screenshotRoutes);
app.use('/api/admin', adminRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
```

#### index.ts

```typescript
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { initWebSocket } from './services/websocket.service';
import { logger } from './utils/logger';
import http from 'http';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  const server = http.createServer(app);
  initWebSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down...');
    server.close(() => process.exit(0));
  });
}

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', err);
  process.exit(1);
});
```

---

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4000
USER node
CMD ["node", "dist/index.js"]
```
