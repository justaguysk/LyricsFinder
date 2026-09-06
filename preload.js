const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateTitle: (callback) => ipcRenderer.on('update-title', (_event, value) => callback(value)),
  onUpdateArtist: (callback) => ipcRenderer.on('update-artist', (_event, value) => callback(value)),
  onUpdateCover: (callback) => ipcRenderer.on('update-cover', (_event, value) => callback(value)),
  onUpdateLyrics: (callback) => ipcRenderer.on('update-lyrics', (_event, value) => callback(value)),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, value) => callback(value)),
  onUpdatePlayer: (callback) => ipcRenderer.on('update-player', (_event, value) => callback(value)),
  onConsoleLog: (callback) => ipcRenderer.on('console-log', (_event, value) => callback(value)),
  onSwitchMode: (value) => ipcRenderer.on('switch-mode', value),
  onOnMac: (value) => ipcRenderer.on('on-mac', value),
  onNoCli: (value) => ipcRenderer.on('no-cli', value),
  onQuitClicked: (value) => ipcRenderer.send('quit-click', value),
  onSwitchClicked: (value) => ipcRenderer.send('switch-config', value),
  onInstallPlayerClicked: (value) => ipcRenderer.send('install-player', value),
});