const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Authentication
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  logout: () => ipcRenderer.invoke('logout'),
  getSession: () => ipcRenderer.invoke('get-session'),
  onSessionLoaded: (callback) => ipcRenderer.on('session-loaded', (event, data) => callback(data)),
  loginSuccess: () => ipcRenderer.send('login-success'),
  openRegistration: () => ipcRenderer.send('open-registration'),

  // Notifications
  showNotification: (data) => ipcRenderer.send('show-notification', data),

  // Connection status
  onConnectionStatusChanged: (callback) => ipcRenderer.on('connection-status-changed', (event, isOnline) => callback(isOnline)),
  updateConnectionStatus: (isOnline) => ipcRenderer.send('connection-status', isOnline),

  // WebSocket
  connectWebSocket: () => ipcRenderer.invoke('connect-websocket'),
  sendWebSocketMessage: (message) => ipcRenderer.invoke('send-websocket-message', message),
  closeWebSocket: () => ipcRenderer.invoke('close-websocket'),
  onWebSocketMessage: (callback) => ipcRenderer.on('websocket-message', (event, data) => callback(data)),
  onWebSocketError: (callback) => ipcRenderer.on('websocket-error', (event, error) => callback(error)),
  onWebSocketClosed: (callback) => ipcRenderer.on('websocket-closed', () => callback()),

  // API requests with cookies
  apiRequest: (params) => ipcRenderer.invoke('api-request', params)
});
