const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require("electron");
const path = require("path");

// Add this line - checks if we're in development
// Remove your existing isDev line and replace with:
const isDev = process.env.ELECTRON_VITE_DEV_SERVER_URL !== undefined;
let win;
let tray;
let isMinimized = false;
let isHidden = false;
let lastVisibleY = 20;
let autoShowTimer = null;

app.setName("Floating Routine Manager");
app.setAppUserModelId("com.floatingroutine.manager");

// 👇 Prevent multiple app instances/////////////////////////////////////////////////////////////////////////////////////////
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit(); // ❌ Quit if another instance is already running
} else {
  app.on("second-instance", () => {
    // ✅ Focus existing window instead of opening a new one
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getWindowSize() {
  return isMinimized
    ? { width: 300, height: 100 }
    : { width: 400, height: 600 };
}

function createWindow() {
  const { width, height } = getWindowSize();
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
  const x = Math.floor((screenWidth - width) / 2);
  const y = lastVisibleY;

  win = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    skipTaskbar: true, // 👈 Hide from taskbar
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    icon: path.join(__dirname, "../resources/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: false, // Should be false for security
      contextIsolation: true, // Keep this true
      sandbox: true, // Enable sandbox
      webSecurity: true,
      // Disable unnecessary features
      enableRemoteModule: false,
      spellcheck: false,
      // Optimize memory usage
      javascript: true,
      webgl: false, // Disable if not needed
      plugins: false,
    },
  });

  // if (isDev) {
  //   win.loadURL("http://localhost:5173");
  // } else {
  //   console.log("index.html stated");
  //   win.loadFile(path.join(__dirname, "dist/index.html"));
  // }

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    // For production - load from dist folder
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  win.webContents.once("did-finish-load", () => {
    win.webContents.send("window-state", {
      isMinimized,
      isHidden,
      ...getWindowSize(),
    });

    // Enable memory optimizations
    win.webContents.setBackgroundThrottling(true);

    // Set memory limits
    app.commandLine.appendSwitch("js-flags", "--max-old-space-size=256");
  });

  // ADD WINDOW CLEANUP:
  win.on("closed", () => {
    win = null;
    if (autoShowTimer) {
      clearTimeout(autoShowTimer);
      autoShowTimer = null;
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, "../resources/icon.ico"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: () => {
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    {
      label: "Hide App",
      click: () => {
        if (win) win.hide();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Floating Routine Manager");
  tray.setContextMenu(contextMenu);

  // 👇 Double-click tray icon to toggle window
  tray.on("double-click", () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });
}

ipcMain.on("hide-window", async () => {
  if (!win) return;
  win.hide();

  if (autoShowTimer) clearTimeout(autoShowTimer);
  autoShowTimer = setTimeout(() => {
    if (win) win.show();
  }, 30000); // 30 sec auto-show
});

ipcMain.on("show-window", () => {
  if (!win) return;
  win.show();
});

ipcMain.on("toggle-window-size", () => {
  if (!win) return;
  isMinimized = !isMinimized;
  const { width, height } = getWindowSize();
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
  const x = Math.floor((screenWidth - width) / 2);
  const currentY = win.getBounds().y;
  lastVisibleY = currentY;

  win.setBounds({ x, y: currentY, width, height }, true);
  win.webContents.send("window-state", { isMinimized, ...getWindowSize() });
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Close all
app.on("window-all-closed", () => {
  if (autoShowTimer) clearTimeout(autoShowTimer);
  if (process.platform !== "darwin") app.quit();
});

// 👇 Auto-start at system boot
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: false,
  path: process.execPath,
});

// Get current window state
ipcMain.handle("get-window-state", () => {
  return {
    isMinimized,
    isHidden,
    ...getWindowSize(),
  };
});
