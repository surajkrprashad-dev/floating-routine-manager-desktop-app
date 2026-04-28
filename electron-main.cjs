const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;
let win;
let tray;
let isMinimized = false;
let isHidden = false;
let lastVisibleY = 20;
let autoShowTimer = null;

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
    skipTaskbar: false, // 👈 Hide from taskbar
    transparent: false,
    alwaysOnTop: true,
    resizable: false,
    icon: path.join(__dirname, "public/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "electron-preload.cjs"),
    },
  });
  console.log(path.join(__dirname, "electron-preload.cjs"));
  console.log(path.join(__dirname, "dist/index.html"));

  // if (isDev) {
  //   win.loadURL("http://localhost:5173");
  // } else {
  //   console.log("index.html stated");
  //   win.loadFile(path.join(__dirname, "dist/index.html"));
  // }

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    const indexPath = path.join(__dirname, "dist/index.html");
    console.log("Loading index.html from:", indexPath);
    win.loadFile(indexPath);
    // Add this line to open DevTools on startup in production
    win.webContents.openDevTools();
  }

  win.webContents.once("did-finish-load", () => {
    win.webContents.send("window-state", {
      isMinimized,
      isHidden,
      ...getWindowSize(),
    });
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, "public/icon.png"));

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

  tray.setToolTip("My Hidden App");
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
  // createTray();

  app.on("activate", () => {
    if (!BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Close all
app.on("window-all-closed", () => {
  if (autoShowTimer) clearTimeout(autoShowTimer);
  if (process.platform !== "darwin") app.quit();
});

// 👇 Auto-start at system boot
// app.setLoginItemSettings({
//   openAtLogin: true,
//   path: process.execPath,
// });

// Get current window state
ipcMain.handle("get-window-state", () => {
  return {
    isMinimized,
    isHidden,
    ...getWindowSize(),
  };
});
