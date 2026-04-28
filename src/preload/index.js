const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimizeWindow: () => ipcRenderer.send("toggle-window-size"),
  hideWindow: () => ipcRenderer.send("hide-window"),
  showWindow: () => ipcRenderer.send("show-window"),
  onWindowState: (callback) => ipcRenderer.on("window-state", callback),
  getWindowState: () => ipcRenderer.invoke("get-window-state"),
  requestWindowState: () => ipcRenderer.send("request-window-state"),


  
});