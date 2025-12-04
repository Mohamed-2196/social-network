// State
let sessionData = null;
let currentUserId = null;
let currentChatUserId = null;
let users = [];
let messages = [];
let ws = null;
let isOnline = navigator.onLine;
let allUsers = [];
let isInitialized = false;

// DOM Elements
const offlineBanner = document.getElementById('offline-banner');
const userList = document.getElementById('user-list');
const userSearch = document.getElementById('user-search');
const emptyState = document.getElementById('empty-state');
const chatContainer = document.getElementById('chat-container');
const chatAvatar = document.getElementById('chat-avatar');
const chatUsername = document.getElementById('chat-username');
const chatStatus = document.getElementById('chat-status');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.getElementById('emoji-picker');
const emojiGrid = document.getElementById('emoji-grid');
const emojiCloseBtn = document.getElementById('emoji-close-btn');
const logoutBtn = document.getElementById('logout-btn');
const searchToggleBtn = document.getElementById('search-toggle-btn');
const messageSearchBar = document.getElementById('message-search-bar');
const messageSearch = document.getElementById('message-search');
const searchCloseBtn = document.getElementById('search-close-btn');

// Initialize
async function init() {
  if (isInitialized) return;
  isInitialized = true;

  // Get session data
  sessionData = await window.electron.getSession();

  if (!sessionData) {
    console.error('No session data');
    return;
  }

  currentUserId = parseInt(sessionData.userId);

  // Set up online/offline detection
  setupConnectionMonitoring();

  // Initialize emoji picker
  initEmojiPicker();

  // Load users
  await loadUsers();

  // Connect to WebSocket if online
  if (isOnline) {
    connectWebSocket();
  }

  // Set up event listeners
  setupEventListeners();

  // Refresh user list every 10 seconds to update online status
  setInterval(() => {
    if (isOnline && !document.hidden) {
      loadUsers();
    }
  }, 10000); // 10 seconds
}

// Connection Monitoring
function setupConnectionMonitoring() {
  updateConnectionStatus(isOnline);

  window.addEventListener('online', () => {
    isOnline = true;
    updateConnectionStatus(true);
    connectWebSocket();
    loadUsers();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    updateConnectionStatus(false);
    if (ws) {
      ws.close();
      ws = null;
    }
  });

  // Also send to main process
  window.electron.updateConnectionStatus(isOnline);
}

function updateConnectionStatus(online) {
  if (online) {
    offlineBanner.style.display = 'none';
    document.querySelector('.app-container').classList.remove('offline');
    messageInput.disabled = false;
    sendBtn.disabled = false;
  } else {
    offlineBanner.style.display = 'block';
    document.querySelector('.app-container').classList.add('offline');
    messageInput.disabled = true;
    sendBtn.disabled = true;
  }
}

// WebSocket Connection (through main process)
async function connectWebSocket() {
  try {
    const result = await window.electron.connectWebSocket();
    if (result.success) {
      console.log('WebSocket connected');
      ws = { connected: true }; // Dummy object to track state
    }
  } catch (error) {
    console.error('Error connecting to WebSocket:', error);
  }
}

// Set up WebSocket event listeners
window.electron.onWebSocketMessage((data) => {
  handleWebSocketMessage(data);
});

window.electron.onWebSocketError((error) => {
  console.error('WebSocket error:', error);
});

window.electron.onWebSocketClosed(() => {
  console.log('WebSocket closed');
  ws = null;

  // Try to reconnect after 3 seconds if online
  if (isOnline) {
    setTimeout(() => {
      if (isOnline) {
        connectWebSocket();
      }
    }, 3000);
  }
});

function handleWebSocketMessage(data) {
  console.log('Received WebSocket message:', data);

  // Handle incoming message
  if (data.message_id) {
    // New message received
    const message = {
      MessageID: data.message_id,
      SenderID: data.sender_id,
      ReceiverID: data.receiver_id,
      Content: data.content,
      CreatedAt: data.created_at
    };

    // Add to messages if it's for current chat
    if (currentChatUserId &&
        (message.SenderID === currentChatUserId || message.ReceiverID === currentChatUserId)) {

      // Check if message already exists (avoid duplicates)
      const exists = messages.some(m =>
        (m.MessageID === message.MessageID || m.message_id === message.MessageID)
      );

      if (!exists) {
        messages.push(message);

        // Update cache
        localStorage.setItem(`messages_${currentChatUserId}`, JSON.stringify(messages));

        renderMessages();

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }

    // Update user list
    updateUserLastMessage(message.SenderID === currentUserId ? message.ReceiverID : message.SenderID, message.Content);

    // Show notification for new messages
    if (message.SenderID !== currentUserId) {
      const user = allUsers.find(u => u.user_id === message.SenderID);
      if (user) {
        console.log('Showing notification for message from:', user.nickname);

        // Show in-app toast notification
        showToast(user.nickname, message.Content, user.image);

        // Also show desktop notification if not in current chat
        if (!currentChatUserId || message.SenderID !== currentChatUserId) {
          window.electron.showNotification({
            title: `New message from ${user.nickname}`,
            body: message.Content
          });
        }
      }
    }
  }

  // Handle notification count update
  if (data.type === 'notification_count') {
    // Handle notification count
    console.log('Notification count:', data.count);
  }
}

// Load Users
async function loadUsers() {
  if (!isOnline) {
    // Load from cache if offline
    const cached = localStorage.getItem('cached_users');
    if (cached) {
      allUsers = JSON.parse(cached);
      renderUserList(allUsers);
    }
    return;
  }

  try {
    const result = await window.electron.apiRequest({
      endpoint: '/chatusers',
      method: 'GET'
    });

    if (result.success) {
      allUsers = result.data || [];

      // Log online status for debugging
      console.log('Loaded users with status:', allUsers.map(u => ({
        name: u.nickname,
        online: u.is_online
      })));

      // Cache users
      localStorage.setItem('cached_users', JSON.stringify(allUsers));

      renderUserList(allUsers);

      // Re-select current chat user if exists
      if (currentChatUserId) {
        const currentItem = document.querySelector(`[data-user-id="${currentChatUserId}"]`);
        if (currentItem) {
          currentItem.classList.add('active');
        }
      }
    } else {
      console.error('Error loading users:', result.error);

      // Try to load from cache
      const cached = localStorage.getItem('cached_users');
      if (cached) {
        allUsers = JSON.parse(cached);
        renderUserList(allUsers);
      }
    }
  } catch (error) {
    console.error('Error loading users:', error);

    // Try to load from cache
    const cached = localStorage.getItem('cached_users');
    if (cached) {
      allUsers = JSON.parse(cached);
      renderUserList(allUsers);
    }
  }
}

function renderUserList(usersList) {
  if (usersList.length === 0) {
    userList.innerHTML = '<div class="loading">No users available</div>';
    return;
  }

  userList.innerHTML = usersList.map(user => {
    const isOnlineUser = user.is_online || false;
    const initials = getInitials(user.nickname);

    // Handle profile image
    const avatarContent = user.image && user.image !== 'pfp.webp'
      ? `<img src="http://localhost:8080/uploads/${user.image}" alt="${user.nickname}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
      : initials;

    return `
      <div class="user-item" data-user-id="${user.user_id}">
        <div class="user-avatar">
          ${avatarContent}
          <span class="status-indicator ${isOnlineUser ? 'online' : 'offline'}"></span>
        </div>
        <div class="user-info">
          <div class="user-name">${user.nickname}</div>
          <div class="user-last-message">${user.last_message || 'No messages yet'}</div>
        </div>
        ${user.unread_count ? `<span class="unread-badge">${user.unread_count}</span>` : ''}
      </div>
    `;
  }).join('');

  // Add click listeners
  document.querySelectorAll('.user-item').forEach(item => {
    item.addEventListener('click', () => {
      const userId = parseInt(item.dataset.userId);
      openChat(userId);
    });
  });
}

function updateUserLastMessage(userId, message) {
  const user = allUsers.find(u => u.user_id === userId);
  if (user) {
    user.last_message = message.substring(0, 50);
    renderUserList(allUsers);
  }
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Open Chat
async function openChat(userId) {
  currentChatUserId = userId;
  messages = [];

  // Update UI
  document.querySelectorAll('.user-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-user-id="${userId}"]`)?.classList.add('active');

  // Find user
  const user = allUsers.find(u => u.user_id === userId);
  if (!user) return;

  // Update chat header
  if (user.image && user.image !== 'pfp.webp') {
    chatAvatar.innerHTML = `<img src="http://localhost:8080/uploads/${user.image}" alt="${user.nickname}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
  } else {
    chatAvatar.textContent = getInitials(user.nickname);
  }
  chatUsername.textContent = user.nickname;
  chatStatus.textContent = user.is_online ? 'Online' : 'Offline';
  chatStatus.className = `user-status ${user.is_online ? '' : 'offline'}`;

  // Show chat container
  emptyState.style.display = 'none';
  chatContainer.style.display = 'flex';

  // Load messages
  await loadMessages(userId);

  // Enable input if online
  if (isOnline) {
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

async function loadMessages(userId) {
  messagesContainer.innerHTML = '<div class="messages-loading">Loading messages...</div>';

  if (!isOnline) {
    // Load from cache
    const cached = localStorage.getItem(`messages_${userId}`);
    if (cached) {
      messages = JSON.parse(cached);
      renderMessages();
    } else {
      messagesContainer.innerHTML = '<div class="messages-loading">You are offline. No cached messages available.</div>';
    }
    return;
  }

  try {
    const result = await window.electron.apiRequest({
      endpoint: `/messages?userid=${userId}`,
      method: 'POST'
    });

    if (result.success) {
      messages = result.data || [];

      // Cache messages
      localStorage.setItem(`messages_${userId}`, JSON.stringify(messages));

      renderMessages();

      // Scroll to bottom
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    } else {
      console.error('Error loading messages:', result.error);

      // Try to load from cache
      const cached = localStorage.getItem(`messages_${userId}`);
      if (cached) {
        messages = JSON.parse(cached);
        renderMessages();
      }
    }
  } catch (error) {
    console.error('Error loading messages:', error);

    // Try to load from cache
    const cached = localStorage.getItem(`messages_${userId}`);
    if (cached) {
      messages = JSON.parse(cached);
      renderMessages();
    }
  }
}

function renderMessages() {
  if (messages.length === 0) {
    messagesContainer.innerHTML = '<div class="messages-loading">No messages yet. Start the conversation!</div>';
    return;
  }

  let lastDate = null;
  const html = messages.map(msg => {
    const isSent = msg.SenderID === currentUserId || msg.sender_id === currentUserId;
    const date = new Date(msg.CreatedAt || msg.created_at);
    const dateStr = formatDate(date);
    const timeStr = formatTime(date);
    const content = msg.Content || msg.content;
    const messageId = msg.MessageID || msg.message_id;

    let dateSeparator = '';
    if (dateStr !== lastDate) {
      dateSeparator = `<div class="date-separator"><span>${dateStr}</span></div>`;
      lastDate = dateStr;
    }

    return `
      ${dateSeparator}
      <div class="message ${isSent ? 'sent' : 'received'}" data-message-id="${messageId}">
        <div class="message-content">
          <div class="message-text">${escapeHtml(content)}</div>
          <div class="message-time">${timeStr}</div>
        </div>
      </div>
    `;
  }).join('');

  messagesContainer.innerHTML = html;
}

// Send Message
async function sendMessage() {
  const content = messageInput.value.trim();

  if (!content || !isOnline || !currentChatUserId) {
    return;
  }

  const message = {
    receiver_id: currentChatUserId,
    content: content
  };

  if (ws && ws.connected) {
    const result = await window.electron.sendWebSocketMessage(message);
    if (result.success) {
      messageInput.value = '';
      messageInput.focus();
    } else {
      alert('Failed to send message. Please check your connection.');
    }
  } else {
    alert('Not connected to server. Please check your connection.');
  }
}

// Emoji Picker
function initEmojiPicker() {
  // Ensure picker starts hidden - use class instead of inline style
  emojiPicker.classList.remove('show');

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
    '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
    '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
    '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '🥴', '😵',
    '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟',
    '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
    '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
    '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡',
    '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡',
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️',
    '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
    '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
    '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
    '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
    '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
    '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
    '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️',
    '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪',
    '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳'
  ];

  emojiGrid.innerHTML = emojis.map(emoji =>
    `<div class="emoji-item" data-emoji="${emoji}">${emoji}</div>`
  ).join('');

  // Add click listeners
  document.querySelectorAll('.emoji-item').forEach(item => {
    item.addEventListener('click', () => {
      const emoji = item.dataset.emoji;
      messageInput.value += emoji;
      messageInput.focus();
      emojiPicker.style.display = 'none';
    });
  });
}

// Event Listeners
function setupEventListeners() {
  // Send message
  sendBtn.addEventListener('click', sendMessage);

  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Emoji picker - SIMPLE VERSION WITH INLINE STYLES
  emojiBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const currentlyVisible = emojiPicker.style.display === 'block';

    if (!currentlyVisible) {
      // SHOW with inline styles - GUARANTEED to work
      emojiPicker.style.cssText = `
        position: fixed !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        left: 50% !important;
        bottom: 100px !important;
        transform: translateX(-50%) !important;
        width: 320px !important;
        height: 400px !important;
        background: white !important;
        border: 5px solid red !important;
        border-radius: 12px !important;
        z-index: 99999 !important;
        box-shadow: 0 10px 50px rgba(0,0,0,0.5) !important;
        overflow: hidden !important;
      `;
    } else {
      // HIDE
      emojiPicker.style.display = 'none';
    }
  });

  emojiCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emojiPicker.style.display = 'none';
    console.log('Emoji picker closed');
  });

  // Click outside to close emoji picker
  document.addEventListener('click', (e) => {
    if (emojiPicker.style.display === 'block' &&
        !emojiPicker.contains(e.target) &&
        !emojiBtn.contains(e.target)) {
      emojiPicker.style.display = 'none';
      console.log('Emoji picker closed by outside click');
    }
  });

  // User search
  userSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allUsers.filter(user =>
      user.nickname.toLowerCase().includes(query) ||
      (user.first_name && user.first_name.toLowerCase().includes(query)) ||
      (user.last_name && user.last_name.toLowerCase().includes(query))
    );
    renderUserList(filtered);
  });

  // Message search - SIMPLE VERSION WITH INLINE STYLES
  searchToggleBtn.addEventListener('click', () => {
    const currentlyVisible = messageSearchBar.style.display === 'flex';

    if (!currentlyVisible) {
      // SHOW with inline styles - GUARANTEED to work
      messageSearchBar.style.cssText = `
        display: flex !important;
        visibility: visible !important;
        padding: 15px 20px !important;
        background: yellow !important;
        border: 5px solid blue !important;
        gap: 10px !important;
        align-items: center !important;
        width: 100% !important;
      `;
      messageSearch.focus();
    } else {
      messageSearchBar.style.display = 'none';
      messageSearch.value = '';
      document.querySelectorAll('.message.highlight').forEach(msg => {
        msg.classList.remove('highlight');
      });
    }
  });

  searchCloseBtn.addEventListener('click', () => {
    messageSearchBar.style.display = 'none';
    messageSearch.value = '';
    // Remove highlights
    document.querySelectorAll('.message.highlight').forEach(msg => {
      msg.classList.remove('highlight');
    });
  });

  messageSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();

    // Remove previous highlights
    document.querySelectorAll('.message.highlight').forEach(msg => {
      msg.classList.remove('highlight');
    });

    if (!query) return;

    // Highlight matching messages
    document.querySelectorAll('.message').forEach(msg => {
      const text = msg.querySelector('.message-text').textContent.toLowerCase();
      if (text.includes(query)) {
        msg.classList.add('highlight');

        // Scroll to first match
        if (!document.querySelector('.message.highlight.scrolled')) {
          msg.classList.add('scrolled');
          msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  });

  // Test notification button
  const testNotificationBtn = document.getElementById('test-notification-btn');
  if (testNotificationBtn) {
    testNotificationBtn.addEventListener('click', () => {
      console.log('Test notification button clicked');
      window.electron.showNotification({
        title: 'Test Notification',
        body: 'If you see this, notifications are working!'
      });
    });
  }

  // Logout
  logoutBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to logout?')) {
      await window.electron.logout();
    }
  });
}

// Toast Notifications
function showToast(username, message, userImage) {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';

  const initials = getInitials(username);
  const avatarContent = userImage && userImage !== 'pfp.webp'
    ? `<img src="http://localhost:8080/uploads/${userImage}" alt="${username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
    : initials;

  toast.innerHTML = `
    <div class="toast-icon">${avatarContent}</div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(username)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
  `;

  // Click to go to chat
  toast.addEventListener('click', () => {
    const user = allUsers.find(u => u.nickname === username);
    if (user) {
      openChat(user.user_id);
    }
    hideToast(toast);
  });

  toastContainer.appendChild(toast);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideToast(toast);
  }, 5000);
}

function hideToast(toast) {
  toast.classList.add('hiding');
  setTimeout(() => {
    toast.remove();
  }, 300);
}

// Utility Functions
function formatDate(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Listen for session loaded
window.electron.onSessionLoaded((data) => {
  sessionData = data;
  currentUserId = parseInt(data.userId);
  init();
});

// Initialize on load
if (sessionData) {
  init();
} else {
  // Wait for session to be loaded
  setTimeout(init, 1000);
}
