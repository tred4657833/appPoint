'use strict';
// Preload de la mini ventana de instalación: solo expone lo mínimo que necesita.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mini', {
  onData: (cb) => ipcRenderer.on('mini:data', (_e, data) => cb(data)),
  ready: () => ipcRenderer.send('mini:ready'),
  minimize: () => ipcRenderer.send('mini:minimize'),
  showMain: () => ipcRenderer.send('mini:show-main'),
  cancel: () => ipcRenderer.send('mini:cancel'),
  open: () => ipcRenderer.send('mini:open')
});
