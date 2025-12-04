const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

// Store for session data
let mainWindow = null;
let loginWindow = null;
let sessionData = null;
const SESSION_FILE = path.join(app.getPath('userData'), 'session.json');

// Load saved session on startup
function loadSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = fs.readFileSync(SESSION_FILE, 'utf8');
      const session = JSON.parse(data);

      // Check if session is not expired (24 hours)
      const sessionAge = Date.now() - session.timestamp;
      const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours

      if (sessionAge < MAX_SESSION_AGE) {
        sessionData = session;
        return true;
      }
    }
  } catch (error) {
    console.error('Error loading session:', error);
  }
  return false;
}

// Save session to disk
function saveSession(cookie, userId) {
  sessionData = {
    cookie,
    userId,
    timestamp: Date.now()
  };

  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData), 'utf8');
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

// Clear session
function clearSession() {
  sessionData = null;
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    resizable: false,
    title: 'Login - Social Network Messenger'
  });

  loginWindow.loadFile(path.join(__dirname, 'renderer', 'login.html'));

  loginWindow.on('closed', () => {
    loginWindow = null;
    if (!mainWindow) {
      app.quit();
    }
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Social Network Messenger',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'main.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Send session data to renderer
    if (sessionData) {
      mainWindow.webContents.send('session-loaded', sessionData);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Check for existing session
  const hasSession = loadSession();

  if (hasSession) {
    createMainWindow();
  } else {
    createLoginWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (sessionData) {
      createMainWindow();
    } else {
      createLoginWindow();
    }
  }
});

// IPC Handlers

// Handle login
ipcMain.handle('login', async (event, { email, password }) => {
  const fetch = require('node-fetch');
  const FormData = require('form-data');

  try {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const response = await fetch('http://localhost:8080/signin', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      // Extract session cookie
      const cookies = response.headers.raw()['set-cookie'];
      const sessionCookie = cookies.find(cookie => cookie.startsWith('session_token='));

      if (sessionCookie) {
        const cookieValue = sessionCookie.split(';')[0];

        // Get user ID
        const validateResponse = await fetch('http://localhost:8080/cook', {
          method: 'POST',
          headers: {
            'Cookie': cookieValue
          }
        });

        const data = await validateResponse.json();
        saveSession(cookieValue, data.id);

        return { success: true, userId: data.id };
      }
    }

    return { success: false, error: 'Invalid credentials' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
});

// Handle successful login - open main window
ipcMain.on('login-success', () => {
  if (loginWindow) {
    loginWindow.close();
  }
  createMainWindow();
});

// Handle logout
ipcMain.handle('logout', async () => {
  const fetch = require('node-fetch');

  try {
    if (sessionData) {
      await fetch('http://localhost:8080/logout', {
        method: 'POST',
        headers: {
          'Cookie': sessionData.cookie
        }
      });
    }

    clearSession();

    if (mainWindow) {
      mainWindow.close();
    }

    createLoginWindow();

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
});

// Get session data
ipcMain.handle('get-session', () => {
  return sessionData;
});

// Show notification
ipcMain.on('show-notification', (event, { title, body }) => {
  console.log('Notification requested:', title, body);
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body
    });
    notification.show();
    console.log('Notification shown');
  } else {
    console.log('Notifications not supported');
  }
});

// Open registration in browser
ipcMain.on('open-registration', () => {
  require('electron').shell.openExternal('http://localhost:3000/auth');
});

// Handle online/offline detection
ipcMain.on('connection-status', (event, isOnline) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('connection-status-changed', isOnline);
  }
});

// WebSocket connection management
let wsConnection = null;

ipcMain.handle('connect-websocket', (event) => {
  return new Promise((resolve, reject) => {
    if (wsConnection && wsConnection.readyState === 1) {
      resolve({ success: true });
      return;
    }

    if (!sessionData) {
      reject({ success: false, error: 'No session' });
      return;
    }

    const WebSocket = require('ws');

    try {
      wsConnection = new WebSocket('ws://localhost:8080/ws', {
        headers: {
          'Cookie': sessionData.cookie
        }
      });

      wsConnection.on('open', () => {
        console.log('WebSocket connected from main process');
        resolve({ success: true });
      });

      wsConnection.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('websocket-message', message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      wsConnection.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('websocket-error', error.message);
        }
      });

      wsConnection.on('close', () => {
        console.log('WebSocket closed');
        wsConnection = null;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('websocket-closed');
        }
      });
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      reject({ success: false, error: error.message });
    }
  });
});

ipcMain.handle('send-websocket-message', (event, message) => {
  if (wsConnection && wsConnection.readyState === 1) {
    wsConnection.send(JSON.stringify(message));
    return { success: true };
  }
  return { success: false, error: 'WebSocket not connected' };
});

ipcMain.handle('close-websocket', () => {
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
  return { success: true };
});

// API request handlers with cookies
ipcMain.handle('api-request', async (event, { endpoint, method = 'GET', formData = null }) => {
  const fetch = require('node-fetch');
  const FormData = require('form-data');

  if (!sessionData) {
    return { success: false, error: 'No session' };
  }

  try {
    const options = {
      method,
      headers: {
        'Cookie': sessionData.cookie
      }
    };

    if (formData) {
      const form = new FormData();
      for (const [key, value] of Object.entries(formData)) {
        form.append(key, value);
      }
      options.body = form;
    }

    const response = await fetch(`http://localhost:8080${endpoint}`, options);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return { success: true, data };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText, status: response.status };
    }
  } catch (error) {
    console.error('API request error:', error);
    return { success: false, error: error.message };
  }
});
