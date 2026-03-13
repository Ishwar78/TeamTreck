const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
// const activeWin = require('active-win');  // ❌ COMMENT SAME AS YOUR ORIGINAL

let mainWindow;
let screenshotTimeout = null;
let activityInterval = null;
let token = null;
let sessionId = null;

let currentIdle = false;
let currentActivityScore = 100;

let keyboardEvents = 0;
let mouseEvents = 0;
let mouseDistance = 0;

let isPaused = false; // ✅ ADDED (Nothing Removed)

const API_BASE = "https://mbbsgyan.com";

//  const API_BASE = "http://127.0.0.1:5000";
// const API_BASE = "https://api.mbbsgyan.com";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  mainWindow.loadFile('renderer/index.html');
}

app.whenReady().then(createWindow);

/* ================= RECEIVE IDLE STATE FROM RENDERER ================= */

ipcMain.on('activity-state', (event, data) => {
  currentIdle = data.idle;
  currentActivityScore = data.activity_score;

  keyboardEvents = data.keyboard_events || 0;
  mouseEvents = data.mouse_events || 0;
  mouseDistance = data.mouse_distance || 0;
});

/* ================= ACTIVE WINDOW ================= */

/* 
// 🔥 YOUR ORIGINAL COMMENTED BLOCK (UNCHANGED)
async function getActiveWindow() {
  try {
    let win = null;
    try {
      const getWindows = await import('get-windows');
      win = await getWindows.activeWindow();
    } catch (e) {
      console.warn("get-windows failed, falling back to active-win");
    }

    if (!win) {
      win = await activeWin();
    }

    let url = win?.url || '';
    const appName = win?.owner?.name || '';
    let title = win?.title || '';

    if (!url && ['Google Chrome', 'Microsoft Edge', 'Brave', 'Firefox', 'Opera'].includes(appName)) {
      if (title) {
        let cleanTitle = title;
        cleanTitle = cleanTitle.replace(/\s*-\s*Google Chrome$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Microsoft\u200b Edge$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Microsoft Edge$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Brave$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Mozilla Firefox$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Opera$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Profile \d+$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Personal$/, '');
        url = cleanTitle;
      }
    }

    return {
      title: title,
      app: appName,
      url: url
    };
  } catch {
    return { title: '', app: '', url: '' };
  }
}
*/

async function getActiveWindow() {
  try {
    let win = null;

    try {
      const getWindows = await import('get-windows');
      win = await getWindows.activeWindow();
    } catch (e) {
      console.warn("get-windows failed, falling back to active-win");
    }

    if (!win) {
      const activeWinModule = await import('active-win');
      win = await activeWinModule.default();
    }

    let url = win?.url || '';
    const appName = win?.owner?.name || '';
    let title = win?.title || '';

    if (!url && ['Google Chrome', 'Microsoft Edge', 'Brave', 'Firefox', 'Opera'].includes(appName)) {
      if (title) {
        let cleanTitle = title;
        cleanTitle = cleanTitle.replace(/\s*-\s*Google Chrome$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Microsoft\u200b Edge$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Microsoft Edge$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Brave$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Mozilla Firefox$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Opera$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Profile \d+$/, '');
        cleanTitle = cleanTitle.replace(/\s*-\s*Personal$/, '');
        url = cleanTitle;
      }
    }

    return {
      title: title,
      app: appName,
      url: url
    };

  } catch {
    return { title: '', app: '', url: '' };
  }
}

/* ================= ACTIVITY ================= */

async function sendActivityLog() {
  if (!token || !sessionId || isPaused) return; // ✅ Pause Added
if (keyboardEvents > 0 || mouseEvents > 0) {
  currentIdle = false;
  currentActivityScore = 100;
}
  try {
    const windowInfo = await getActiveWindow();
    const now = new Date();
    const start = new Date(now.getTime() - 5000);

    await axios.post(`${API_BASE}/api/activity`, {
      session_id: sessionId,
      logs: [{
        timestamp: now.toISOString(),
        interval_start: start.toISOString(),
        interval_end: now.toISOString(),
        keyboard_events: keyboardEvents,
        mouse_events: mouseEvents,
        mouse_distance: mouseDistance,
        activity_score: currentActivityScore,
        idle: currentIdle,
        active_window: {
          title: windowInfo.title,
          app_name: windowInfo.app,
          url: windowInfo.url || "",
          category: "Uncategorized"
        }
      }]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

     keyboardEvents = 0;
    mouseEvents = 0;
    mouseDistance = 0;

  } catch (err) {
    console.error("Activity error:", err.response?.data || err.message);
  }
}


/* ================= SCREENSHOT ================= */

async function captureScreenshot() {
  if (!token || !sessionId || isPaused) return; // ✅ Pause Added

  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1280, height: 720 }
    });

    if (!sources.length) return;

    const image = sources[0].thumbnail.toPNG();
    const windowInfo = await getActiveWindow();

    const form = new FormData();
    form.append('file', image, {
      filename: 'screenshot.png',
      contentType: 'image/png'
    });

    form.append('session_id', sessionId);
    form.append('timestamp', new Date().toISOString());
    form.append('resolution_width', 1280);
    form.append('resolution_height', 720);
    form.append('window_title', windowInfo.title);
    form.append('app_name', windowInfo.app);
    form.append('activity_score', currentActivityScore);

    await axios.post(`${API_BASE}/api/agent/screenshots`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    });

    console.log("Screenshot uploaded");

  } catch (err) {
    console.error("Screenshot error:", err.response?.data || err.message);
  }
}

/* ================= SCREENSHOT SCHEDULER ================= */

function scheduleNextScreenshot() {
  if (!sessionId || isPaused) return;

  const minMinutes = 2;
  const maxMinutes = 6;
  const randomDelay =
    Math.floor(Math.random() * (maxMinutes - minMinutes + 1) + minMinutes) *
    60 * 1000;

  screenshotTimeout = setTimeout(async () => {
    if (!isPaused) {
      await captureScreenshot();
      scheduleNextScreenshot();
    }
  }, randomDelay);
}

/* ================= START SESSION ================= */

ipcMain.on('start-session', async (event, data) => {
  try {
    token = data.token;
    isPaused = false;

    const res = await axios.post(`${API_BASE}/api/sessions/start`, {
      device_id: data.deviceId,
      timestamp: new Date().toISOString()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    sessionId = res.data.session_id;

    await captureScreenshot();
    scheduleNextScreenshot();

    activityInterval = setInterval(sendActivityLog, 5000);

  } catch (err) {
    console.error("Session start error:", err.response?.data || err.message);
  }
});

/* ================= PAUSE SESSION ================= */

ipcMain.on('pause-session', () => {
  isPaused = true;

  if (activityInterval) clearInterval(activityInterval);
  if (screenshotTimeout) clearTimeout(screenshotTimeout);

  console.log("Tracking paused");
});

/* ================= RESUME SESSION ================= */

ipcMain.on('resume-session', () => {
  if (!sessionId) return;

  isPaused = false;

  activityInterval = setInterval(sendActivityLog, 5000);
  scheduleNextScreenshot();

  console.log("Tracking resumed");
});

/* ================= END SESSION ================= */

ipcMain.on('end-session', async () => {
  try {
    if (!sessionId) return;

    clearTimeout(screenshotTimeout);
    clearInterval(activityInterval);

    await axios.put(`${API_BASE}/api/sessions/${sessionId}/end`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    sessionId = null;
    token = null; 
    isPaused = false;
    currentIdle = false;
    currentActivityScore = 100;

  } catch (err) {
    console.error("Session end error:", err.response?.data || err.message);
  }
});

/* ================= LOGOUT ================= */

ipcMain.on('agent-logout', async () => {
  try {

    if (sessionId) {
      clearTimeout(screenshotTimeout);
      clearInterval(activityInterval);

      await axios.put(`${API_BASE}/api/sessions/${sessionId}/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    sessionId = null;
    token = null;
    isPaused = false;
    currentIdle = false;
    currentActivityScore = 100;

    screenshotTimeout = null;
    activityInterval = null;

    console.log("Agent fully logged out");

  } catch (err) {
    console.error("Logout error:", err.response?.data || err.message);
  }
});