const { app, BrowserWindow, desktopCapturer, ipcMain } = require("electron");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { execSync } = require("child_process");

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

let isPaused = false;

const API_BASE = "https://mbbsgyan.com";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  mainWindow.loadFile("renderer/index.html");
}

app.whenReady().then(createWindow);

/* ================= RECEIVE ACTIVITY ================= */

ipcMain.on("activity-state", (event, data) => {
  currentIdle = data.idle;
  currentActivityScore = data.activity_score;

  keyboardEvents = data.keyboard_events || 0;
  mouseEvents = data.mouse_events || 0;
  mouseDistance = data.mouse_distance || 0;
});

/* ================= ACTIVE WINDOW ================= */

async function getActiveWindow() {

  let title = "";
  let appName = "";
  let url = "";

  try {

    const activeWin = (await import("active-win")).default;
    const win = await activeWin();

    title = win?.title || "";
    appName = win?.owner?.name || "";
    url = win?.url || "";

  } catch {}

  /* ================= MAC URL FIX ================= */

  if (!url && process.platform === "darwin") {

    try {

      if (appName === "Google Chrome") {
        url = execSync(
          `osascript -e 'tell application "Google Chrome" to get URL of active tab of front window'`
        ).toString().trim();
      }

      if (appName === "Safari") {
        url = execSync(
          `osascript -e 'tell application "Safari" to return URL of front document'`
        ).toString().trim();
      }

      if (appName === "Microsoft Edge") {
        url = execSync(
          `osascript -e 'tell application "Microsoft Edge" to get URL of active tab of front window'`
        ).toString().trim();
      }

    } catch {}
  }

  return {
    title,
    app: appName,
    url
  };
}

/* ================= ACTIVITY ================= */

async function sendActivityLog() {

  if (!token || !sessionId || isPaused) return;

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
    console.log("Activity error:", err.message);
  }
}

/* ================= SCREENSHOT ================= */

async function captureScreenshot() {

  if (!token || !sessionId || isPaused) return;

  try {

    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (!sources.length) return;

    const screen = sources.find(s => s.name === "Entire Screen") || sources[0];

    const image = screen.thumbnail.toPNG();

    if (!image || image.length < 1000) {
      console.log("Invalid screenshot skipped");
      return;
    }

    const windowInfo = await getActiveWindow();

    const form = new FormData();

    form.append("file", image, {
      filename: "screenshot.png",
      contentType: "image/png"
    });

    form.append("session_id", sessionId);
    form.append("timestamp", new Date().toISOString());

    form.append("resolution_width", 1920);
    form.append("resolution_height", 1080);

    form.append("window_title", windowInfo.title);
    form.append("app_name", windowInfo.app);
    form.append("activity_score", currentActivityScore);

    await axios.post(`${API_BASE}/api/agent/screenshots`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    });

    console.log("Screenshot uploaded");

  } catch (err) {

    console.log("Screenshot error:", err.message);

  }
}

/* ================= RANDOM SCREENSHOT ================= */

function scheduleNextScreenshot() {

  if (!sessionId || isPaused) return;

  const min = 1;
  const max = 4;

  const delay =
    Math.floor(Math.random() * (max - min + 1) + min) * 60 * 1000;

  screenshotTimeout = setTimeout(async () => {

    await captureScreenshot();
    scheduleNextScreenshot();

  }, delay);
}

/* ================= START SESSION ================= */

ipcMain.on("start-session", async (event, data) => {

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

    console.log("Session start error:", err.message);

  }
});

/* ================= PAUSE ================= */

ipcMain.on("pause-session", () => {

  isPaused = true;

  clearInterval(activityInterval);
  clearTimeout(screenshotTimeout);

});

/* ================= RESUME ================= */

ipcMain.on("resume-session", () => {

  if (!sessionId) return;

  isPaused = false;

  activityInterval = setInterval(sendActivityLog, 5000);

  scheduleNextScreenshot();

});

/* ================= END ================= */

ipcMain.on("end-session", async () => {

  if (!sessionId) return;

  clearInterval(activityInterval);
  clearTimeout(screenshotTimeout);

  try {

    await axios.put(`${API_BASE}/api/sessions/${sessionId}/end`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

  } catch {}

  sessionId = null;
  token = null;

});

/* ================= LOGOUT ================= */

ipcMain.on("agent-logout", async () => {

  if (sessionId) {

    try {

      await axios.put(`${API_BASE}/api/sessions/${sessionId}/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

    } catch {}

  }

  sessionId = null;
  token = null;

});