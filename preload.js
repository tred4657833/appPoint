'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const call = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld('sys', {
  device: () => call('device:info'),
  stats: () => call('device:stats'),
  backends: () => call('backends'),

  catalog: (query) => call('catalog:list', query),
  feed: (cursor) => call('catalog:feed', cursor),
  office: () => call('office:list'),
  installWebApp: (webapp) => call('webapp:install', webapp),
  dev: () => call('dev:list'),
  webPopular: () => call('webapp:popular'),
  searchWeb: (query) => call('webapp:search', query),
  preview: (item) => call('app:preview', item),
  systemApps: () => call('apps:system'),
  installedPackages: () => call('apps:installed'),

  install: (pkg) => call('pkg:install', pkg),
  remove: (pkg) => call('pkg:remove', pkg),
  cancel: (jobId) => call('pkg:cancel', jobId),

  checkUpdates: () => call('updates:check'),
  applyUpdates: (source) => call('updates:apply', source),

  searchExtensions: (q) => call('ext:search', q),
  installExtension: (ext) => call('ext:install', ext),
  listExtensions: () => call('ext:list'),

  launch: (app) => call('app:launch', app),
  openExternal: (url) => call('open:external', url),

  // Controles nativos de la ventana: usan send/on, no invoke/handle.
  // Esto hace que los onclick del HTML disparen directamente los IPC del proceso principal.
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Estado de la instalación para la mini ventana que aparece con la app minimizada o en segundo plano.
  miniUpdate: (data) => ipcRenderer.send('mini:update', data),

  onProgress: (cb) => {
    const listener = (_e, data) => cb(data);
    ipcRenderer.on('install:progress', listener);
    return () => ipcRenderer.removeListener('install:progress', listener);
  }
});
