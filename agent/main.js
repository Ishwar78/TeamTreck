const { app, BrowserWindow, desktopCapturer, ipcMain, powerMonitor } = require("electron");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");

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

const API_BASE = "http://multiclout.in";

/* ================= WINDOW ================= */

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

app.whenReady().then(() => {

  createWindow();

  setInterval(() => {

    const idleSeconds = powerMonitor.getSystemIdleTime();

    if (idleSeconds >= 180) {
      currentIdle = true;
      currentActivityScore = 0;
    } else {
      currentIdle = false;
    }

  }, 5000);

});

/* ================= CLEAN APP NAME ================= */

function cleanAppName(name) {
  if (!name) return "Application";

  let original = name;
  // Handle paths on Windows (some apps return full path)
  if (name.includes("\\") || name.includes("/")) {
    original = path.basename(name);
  }

  name = original.replace(/\.exe/gi, "").toLowerCase().trim();

  const appMappings = {
    "chrome": "Google Chrome",
    "msedge": "Microsoft Edge",
    "edge": "Microsoft Edge",
    "brave": "Brave Browser",
    "firefox": "Firefox",
    "safari": "Safari",
    "code": "VS Code",
    "explorer": "Explorer",
    "cmd": "Terminal",
    "powershell": "Terminal",
    "pwsh": "Terminal",
    "conhost": "Terminal",
    "terminal": "Terminal",
    "iterm": "Terminal",
    "slack": "Slack",
    "discord": "Discord",
    "zoom": "Zoom",
    "teams": "Microsoft Teams",
    "notion": "Notion",
    "skype": "Skype",
    "vlc": "VLC Media Player",
    "spotify": "Spotify",
    "whatsapp": "WhatsApp"
  };

  for (const key in appMappings) {
    if (name.includes(key)) return appMappings[key];
  }

  // If no common match, return capitalized trimmed original
  let finalName = original.replace(/\.exe/gi, "").trim();
  return finalName.charAt(0).toUpperCase() + finalName.slice(1);
}

/* ================= DOMAIN EXTRACT ================= */

// function detectDomain(title){

//   const t = title.toLowerCase();

//   if(t.includes("youtube")) return "youtube.com";
//   if(t.includes("chatgpt")) return "chat.openai.com";
//   if(t.includes("github")) return "github.com";
//   if(t.includes("google")) return "google.com";
//   if(t.includes("stackoverflow")) return "stackoverflow.com";
//   if(t.includes("facebook")) return "facebook.com";
//   if(t.includes("instagram")) return "instagram.com";
//   if(t.includes("linkedin")) return "linkedin.com";

//   const parts = title.split(" - ");

//   if(parts.length > 1){

//     const guess = parts[0]
//       .replace(/\s+/g,"")
//       .toLowerCase();

//     return guess + ".com";

//   }

//   return "";
// }




function detectDomain(title, appName) {
  if (!title) return "";

  const isBrowser = ["Google Chrome", "Microsoft Edge", "Brave Browser", "Firefox", "Safari"].includes(appName);
  const t = title.toLowerCase().trim();

  // 1. Common blocked/generic strings that should never be domains
  const genericStrings = ["new tab", "settings", "history", "downloads", "extensions", "google chrome", "microsoft edge", "safari", "brave", "firefox"];
  if (genericStrings.some(s => t === s)) return "";

  // 2. Exact matches (more comprehensive)
  const domains = {
    "youtube": "youtube.com",
    "chatgpt": "chatgpt.com",
    "openai": "chatgpt.com",
    "github": "github.com",
    "google": "google.com",
    "stack overflow": "stackoverflow.com",
    "stackoverflow": "stackoverflow.com",
    "facebook": "facebook.com",
    "instagram": "instagram.com",
    "linkedin": "linkedin.com",
    "whatsapp": "whatsapp.com",
    "gmail": "gmail.com",
    "outlook": "outlook.com",
    "canva": "canva.com",
    "figma": "figma.com",
    "notion": "notion.so",
    "discord": "discord.com",
    "amazon": "amazon.com",
    "netflix": "netflix.com",
    "spotify": "spotify.com",
    "gitlab": "gitlab.com",
    "reddit": "reddit.com",
    "medium": "medium.com",
    "trello": "trello.com",
    "slack": "slack.com",
    "twitter": "x.com",
    "x": "x.com"
  };

  // Special case: don't let "Google" match if it's just "Google Chrome" browser name in title
  let searchTitle = t;
  const browserStrings = [" - google chrome", " - microsoft edge", " - brave", " - safari", " - firefox"];
  browserStrings.forEach(s => { searchTitle = searchTitle.replace(s, ""); });

  for (const key in domains) {
    if (searchTitle.includes(key)) {
      // For very short keys like 'x', ensure it's a word or part of a dash/slash
      if (key.length <= 2) {
         const regex = new RegExp(`\\b${key}\\b|[\\/\\-]${key}\\b|\\b${key}[\\/\\-]`, "i");
         if (regex.test(searchTitle)) return domains[key];
      } else {
         return domains[key];
      }
    }
  }

  // 3. Fallback for browsers: Try to extract domain from title parts
  if (isBrowser) {
    // Look for URL/Email patterns in the searchTitle (after removing browser name)
    const domainMatch = searchTitle.match(/([a-z0-9-]+\.(?:com|org|net|io|in|co|us|gov|edu|me|app|dev|ai|fm|so|sh|tv|info|biz))/i);
    if (domainMatch) return domainMatch[1].toLowerCase();

    const parts = title.split(" - ").map(p => p.trim());
    
    if (parts.length > 1) {
      const isKnownBrowserName = (s) => {
        const clean = s.toLowerCase().replace(/\s/g, "");
        return ["googlechrome", "chrome", "edge", "microsoftedge", "safari", "firefox", "brave", "bravebrowser"].includes(clean);
      };
      
      // Usually the website name is the second to last or last non-browser part
      let potentialSite = "";
      for (let i = parts.length - 1; i >= 0; i--) {
        if (!isKnownBrowserName(parts[i])) {
          potentialSite = parts[i];
          break;
        }
      }

      if (potentialSite && potentialSite.length > 2) {
        // Double check if it's an email/domain
        const dm = potentialSite.match(/([a-z0-9-]+\.[a-z]{2,})/i);
        if (dm) return dm[1].toLowerCase();

        return potentialSite.toLowerCase().replace(/[^a-z0-9]/gi, "") + ".com";
      }
    }
    
    // Absolute fallback: first part of title
    return parts[0].toLowerCase().replace(/[^a-z0-9]/gi, "").slice(0, 20) + ".com";
  }

  return "";
}

/**
 * Robust URL extraction for Windows using PowerShell & UI Automation
 */
function getWindowsURL(appName) {
  if (process.platform !== "win32") return "";
  
  const browserMap = {
    "Google Chrome": "chrome",
    "Microsoft Edge": "msedge",
    "Brave Browser": "brave"
  };

  const processName = browserMap[appName];
  if (!processName) return "";

  try {
    // PowerShell script to get URL from Chrome/Edge address bar via UI Automation
    const psScript = `
      Add-Type -AssemblyName UIAutomationClient
      Add-Type -AssemblyName UIAutomationTypes
      $condition = New-Object -TypeName System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "Address and search bar")
      $element = [System.Windows.Automation.AutomationElement]::RootElement.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
      if ($element) {
        $element.GetCurrentPropertyValue([System.Windows.Automation.AutomationElement]::ValueProperty)
      }
    `;

    const result = execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, { timeout: 2000 }).toString().trim();
    return result;
  } catch (err) {
    // console.log("PS URL extraction failed:", err.message);
    return "";
  }
}

/* ================= RECEIVE ACTIVITY ================= */

ipcMain.on("activity-state", (event, data) => {

  keyboardEvents = data.keyboard_events || 0;
  mouseEvents = data.mouse_events || 0;
  mouseDistance = data.mouse_distance || 0;

  if (!currentIdle) {
    currentActivityScore = data.activity_score;
  }

});

/* ================= ACTIVE WINDOW ================= */

async function getActiveWindow() {

  let title = "";
  let appName = "";
  let url = "";

  try {

    const { activeWindow } = await import("active-win");
    const win = await activeWindow();

    title = win?.title || "";
    appName = win?.owner?.name || "";
    url = win?.url || "";

  } catch (err) {
    console.log("active-win error:", err.message);
  }

  /* ===== MAC URL ===== */

  if (!url && process.platform === "darwin") {
    try {
      const macBrowsers = [
        { name: "Google Chrome", script: 'tell application "Google Chrome" to get URL of active tab of front window' },
        { name: "Safari", script: 'tell application "Safari" to return URL of front document' },
        { name: "Brave Browser", script: 'tell application "Brave Browser" to get URL of active tab of front window' },
        { name: "Microsoft Edge", script: 'tell application "Microsoft Edge" to get URL of active tab of front window' }
      ];

      for (const browser of macBrowsers) {
        if (appName.toLowerCase().includes(browser.name.toLowerCase().split(" ")[0])) {
          try {
            url = execSync(`osascript -e '${browser.script}'`, { timeout: 2000 }).toString().trim();
            if (url) break;
          } catch(e) {}
        }
      }
    } catch (e) {
      console.log("Mac URL capture error:", e.message);
    }
  }

  /* ===== WINDOWS URL ===== */
  if (!url && process.platform === "win32") {
    url = getWindowsURL(cleanAppName(appName));
  }


/* ===== LINUX URL FALLBACK ===== */
if (!url && process.platform === "linux") {

  const cleanedApp = cleanAppName(appName);

  const isBrowser = [
    "Google Chrome",
    "Brave Browser",
    "Microsoft Edge",
    "Firefox"
  ].includes(cleanedApp);

  if (isBrowser && title) {
    url = detectDomain(title, cleanedApp);
  }
}








  /* ===== URL CLEANING ===== */
  if (url && (url.startsWith("http") || url.startsWith("www") || url.includes("."))) {
    try {
      if (!url.startsWith("http") && !url.startsWith("www")) {
         // UI Automation might return just "google.com"
         url = `https://${url}`;
      }
      const parsed = new URL(url.startsWith("http") ? url : `http://${url}`);
      url = parsed.href;
    } catch {}
  }

  /* ===== WINDOWS TITLE DOMAIN FIX ===== */

  const cleanedApp = cleanAppName(appName);

  // if (!url && title) {
  //   url = detectDomain(title, cleanedApp);
  // }

if (!url && title) {
  const detected = detectDomain(title, cleanedApp);

  if (detected && detected !== "unknown.com") {
    url = detected;
  }
}




  return {
    title: (title || "Unknown Window").trim(),
    app: cleanedApp.trim(),
    url: (url || "").trim()
  };
}

/* ================= ACTIVITY ================= */

async function sendActivityLog() {

  if (!token || !sessionId || isPaused) return;

  try {

    const windowInfo = await getActiveWindow();

    const now = new Date();
    const start = new Date(now.getTime() - 10000);

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
          url: windowInfo.url
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

    let image;

    if (process.platform === "darwin") {

      const tempFile = path.join(os.tmpdir(), `agent_${Date.now()}.png`);
      execSync(`screencapture -x "${tempFile}"`);

      image = fs.readFileSync(tempFile);
      fs.unlinkSync(tempFile);

    } else {

      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      const screen = sources[0];
      image = screen.thumbnail.toPNG();

    }

    const form = new FormData();

    form.append("file", image, {
      filename: "screenshot.png",
      contentType: "image/png"
    });

    form.append("session_id", sessionId);
    form.append("timestamp", new Date().toISOString());

    await axios.post(`${API_BASE}/api/agent/screenshots`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    });

  } catch (err) {

    console.log("Screenshot error:", err.message);

  }

}

/* ================= RANDOM SCREENSHOT ================= */

function scheduleNextScreenshot() {

  if (!sessionId || isPaused) return;

  const min = 2;
  const max = 8;


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

    activityInterval = setInterval(sendActivityLog, 10000);

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

  activityInterval = setInterval(sendActivityLog, 10000);

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