// TypeScript interfaces and ChatManager class for chat functionality

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
  lastActivity: number;
}

export class ChatManager {
  private currentChatId: string | null = null;
  private chats: Map<string, Chat> = new Map();
  private storageKey = 'genai-chats';

  constructor() {
    this.loadChats();
    this.initializeUI();
  }

  private loadChats(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const chatsArray: Chat[] = JSON.parse(stored);
        this.chats = new Map(chatsArray.map((chat) => [chat.id, chat]));
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }

  private saveChats(): void {
    try {
      const chatsArray = Array.from(this.chats.values());
      localStorage.setItem(this.storageKey, JSON.stringify(chatsArray));
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private initializeUI(): void {
    this.renderChatList();
    if (this.chats.size === 0) {
      this.createNewChat();
    } else {
      // Load the most recent chat
      const sortedChats = Array.from(this.chats.values()).sort(
        (a, b) => b.lastActivity - a.lastActivity
      );
      this.switchToChat(sortedChats[0].id);
    }
  }

  createNewChat(): void {
    const chatId = this.generateId();
    const newChat: Chat = {
      id: chatId,
      name: `Chat ${this.chats.size + 1}`,
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.chats.set(chatId, newChat);
    this.saveChats();
    this.renderChatList();
    this.switchToChat(chatId);
  }

  switchToChat(chatId: string): void {
    const chat = this.chats.get(chatId);
    if (!chat) return;

    this.currentChatId = chatId;
    this.updateChatTitle(chat.name);
    this.renderMessages(chat.messages);
    this.updateCurrentChatName(chat.name);
    this.highlightActiveChat(chatId);
  }

  renameChat(chatId: string, newName: string): void {
    const chat = this.chats.get(chatId);
    if (!chat) return;

    chat.name =
      newName.trim() ||
      `Chat ${Array.from(this.chats.keys()).indexOf(chatId) + 1}`;
    this.saveChats();
    this.renderChatList();

    if (this.currentChatId === chatId) {
      this.updateChatTitle(chat.name);
      this.updateCurrentChatName(chat.name);
    }
  }

  deleteChat(chatId: string): void {
    this.chats.delete(chatId);
    this.saveChats();
    this.renderChatList();

    if (this.currentChatId === chatId) {
      if (this.chats.size === 0) {
        this.createNewChat();
      } else {
        const remainingChats = Array.from(this.chats.values()).sort(
          (a, b) => b.lastActivity - a.lastActivity
        );
        this.switchToChat(remainingChats[0].id);
      }
    }
  }

  clearAllChats(): void {
    this.chats.clear();
    this.saveChats();
    this.renderChatList();
    this.createNewChat();
  }

  addMessage(
    role: 'user' | 'assistant',
    content: string,
    shouldScroll: boolean = true
  ): void {
    if (!this.currentChatId) return;

    const chat = this.chats.get(this.currentChatId);
    if (!chat) return;

    const message: ChatMessage = {
      role,
      content,
      timestamp: Date.now(),
    };

    chat.messages.push(message);
    chat.lastActivity = Date.now();

    // Auto-generate chat name from first user message
    if (
      role === 'user' &&
      chat.messages.filter((m) => m.role === 'user').length === 1
    ) {
      const autoName = this.generateChatName(content);
      chat.name = autoName;
      this.updateChatTitle(autoName);
      this.updateCurrentChatName(autoName);
    }

    this.saveChats();
    this.addMessageToDOM(role, content, shouldScroll);
    this.renderChatList(); // Update last activity time
  }

  private updateChatTitle(name: string): void {
    const titleElement = document.getElementById('chat-title');
    if (titleElement) {
      titleElement.textContent = name;
    }
  }

  private updateCurrentChatName(name: string): void {
    const nameElement = document.getElementById('current-chat-name');
    if (nameElement) {
      nameElement.textContent = name;
    }
  }

  private highlightActiveChat(chatId: string): void {
    // This is now handled in renderChatList with the isActive check
    // No need for separate highlighting since we re-render the entire list
  }

  private renderChatList(): void {
    const chatList = document.getElementById('chat-list');
    if (!chatList) return;

    const sortedChats = Array.from(this.chats.values()).sort(
      (a, b) => b.lastActivity - a.lastActivity
    );

    chatList.innerHTML = sortedChats
      .map((chat) => {
        const lastMessage = chat.messages[chat.messages.length - 1];
        const preview = lastMessage
          ? lastMessage.content.length > 50
            ? lastMessage.content.substring(0, 50) + '...'
            : lastMessage.content
          : 'Sin mensajes';

        const timeAgo = this.getTimeAgo(chat.lastActivity);
        const isActive = this.currentChatId === chat.id;

        return `
          <div class="chat-item p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-slate-800 transition-all duration-200 ${
            isActive ? 'bg-slate-800' : 'bg-transparent'
          } group" 
               data-chat-id="${chat.id}">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-slate-200 text-xs sm:text-sm truncate">${
                  chat.name
                }</h3>
                <p class="text-xs text-slate-400 truncate mt-1">${preview}</p>
              </div>
              <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="event.stopPropagation(); chatManager.showRenameModal('${
                  chat.id
                }')" 
                        class="p-1 text-slate-400 hover:text-slate-200 transition-colors">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                  </svg>
                </button>
                <button onclick="event.stopPropagation(); chatManager.confirmDeleteChat('${
                  chat.id
                }')" 
                        class="p-1 text-slate-400 hover:text-red-400 transition-colors">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd"></path>
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Add click event listeners to chat items
    setTimeout(() => {
      document.querySelectorAll('.chat-item').forEach((item) => {
        item.addEventListener('click', (e) => {
          const chatId = (e.currentTarget as HTMLElement).getAttribute(
            'data-chat-id'
          );
          if (chatId) {
            this.switchToChat(chatId);
          }
        });
      });
    }, 0);
  }

  private renderMessages(messages: ChatMessage[]): void {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;

    // Clear existing messages except welcome message
    chatBox.innerHTML = `
        <div class='flex items-start space-x-2 sm:space-x-3'>
          <div class='flex-shrink-0'>
            <div class='w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-full flex items-center justify-center'>
              <svg class='w-3 h-3 sm:w-4 sm:h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                <path fill-rule='evenodd' d='M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z' clip-rule='evenodd'></path>
              </svg>
            </div>
          </div>
          <div class='flex-1'>
            <div class='max-w-none'>
              <p class='text-slate-800 text-xs sm:text-sm leading-relaxed'>
                ¡Hola! 👋 Soy tu asistente de IA. ¿En qué puedo ayudarte hoy?
              </p>
            </div>
          </div>
        </div>
      `;

    // Add all messages (don't auto-scroll when rendering existing messages)
    messages.forEach((message, index) => {
      const isLastMessage = index === messages.length - 1;
      this.addMessageToDOM(message.role, message.content, isLastMessage);
    });
  }

  private addMessageToDOM(
    role: 'user' | 'assistant',
    content: string,
    shouldScroll: boolean = true
  ): void {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;

    // Check if user is near the bottom before adding message
    const wasNearBottom = this.isNearBottom(chatBox);

    const messageDiv = document.createElement('div');

    if (role === 'user') {
      messageDiv.className =
        'flex items-start space-x-2 sm:space-x-3 justify-end';
      messageDiv.innerHTML = `
          <div class="flex-1 max-w-2xl sm:max-w-3xl">
            <div class="bg-slate-100 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ml-auto max-w-fit">
              <p class="text-xs sm:text-sm text-slate-900" style="white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word;">${this.escapeHtml(
                content
              )}</p>
            </div>
          </div>
          <div class="flex-shrink-0">
            <div class="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
              </svg>
            </div>
          </div>
        `;
    } else {
      messageDiv.className = 'flex items-start space-x-2 sm:space-x-3';
      messageDiv.innerHTML = `
          <div class="flex-shrink-0">
            <div class="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
              </svg>
            </div>
          </div>
          <div class="flex-1 max-w-2xl sm:max-w-3xl">
            <div class="bg-white rounded-2xl px-3 sm:px-4 py-2 sm:py-3 border border-slate-200">
              <p class="text-slate-800 text-xs sm:text-sm leading-relaxed" style="white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word;">${this.escapeHtml(
                content
              )}</p>
            </div>
          </div>
        `;
    }

    chatBox.appendChild(messageDiv);

    // Only scroll if user was near bottom or if it's a user message or shouldScroll is true
    if (shouldScroll && (wasNearBottom || role === 'user')) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  private isNearBottom(element: HTMLElement): boolean {
    const threshold = 100; // pixels from bottom
    return (
      element.scrollTop + element.clientHeight >=
      element.scrollHeight - threshold
    );
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'ahora';
  }

  private generateChatName(firstMessage: string): string {
    // Clean and truncate the message for the chat name
    let name = firstMessage.trim();

    // Remove common question words and clean up
    name = name.replace(
      /^(qué|cómo|cuál|cuándo|dónde|por qué|quién|what|how|which|when|where|why|who)\s+/i,
      ''
    );

    // Truncate to reasonable length
    if (name.length > 40) {
      name = name.substring(0, 40).trim();
      // Try to cut at word boundary
      const lastSpace = name.lastIndexOf(' ');
      if (lastSpace > 20) {
        name = name.substring(0, lastSpace);
      }
      name += '...';
    }

    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);

    return name || 'Nuevo Chat';
  }

  showRenameModal(chatId: string): void {
    const chat = this.chats.get(chatId);
    if (!chat) return;

    const modal = document.getElementById('rename-modal');
    const input = document.getElementById('rename-input') as HTMLInputElement;

    if (modal && input) {
      input.value = chat.name;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      input.focus();
      input.select();

      // Store the chat ID for the rename operation
      modal.setAttribute('data-chat-id', chatId);
    }
  }

  confirmDeleteChat(chatId: string): void {
    const deleteChatModal = document.getElementById('delete-chat-modal');
    if (deleteChatModal) {
      deleteChatModal.setAttribute('data-chat-id', chatId);
      deleteChatModal.classList.remove('hidden');
      deleteChatModal.classList.add('flex');
    }
  }

  getCurrentChatId(): string | null {
    return this.currentChatId;
  }
}

// Global chat manager instance
let chatManager: ChatManager;

// Make chatManager globally accessible
declare global {
  interface Window {
    chatManager: ChatManager;
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  const messageInput = document.getElementById(
    'message-input'
  ) as HTMLTextAreaElement;
  const sendButton = document.getElementById(
    'send-button'
  ) as HTMLButtonElement;
  const modelNameSpan = document.getElementById('model-name') as HTMLElement;
  const dynamicModelTitle = document.getElementById(
    'dynamic-model-title'
  ) as HTMLElement;

  const clearAllBtn = document.getElementById(
    'clear-all-btn'
  ) as HTMLButtonElement;
  const renameChatBtn = document.getElementById(
    'rename-chat-btn'
  ) as HTMLButtonElement;
  const deleteChatBtn = document.getElementById(
    'delete-chat-btn'
  ) as HTMLButtonElement;
  const renameModal = document.getElementById('rename-modal') as HTMLElement;
  const renameInput = document.getElementById(
    'rename-input'
  ) as HTMLInputElement;
  const confirmRename = document.getElementById(
    'confirm-rename'
  ) as HTMLButtonElement;
  const cancelRename = document.getElementById(
    'cancel-rename'
  ) as HTMLButtonElement;

  // Initialize chat manager
  chatManager = new ChatManager();
  window.chatManager = chatManager;

  // Auto-resize textarea
  function autoResize() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 128) + 'px';
  }

  messageInput.addEventListener('input', autoResize);

  // Get model info
  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '!modelinfo' }),
  })
    .then((response) => response.json())
    .then((data) => {
      const modelName = data.model || 'AI Language Model';
      if (modelNameSpan) {
        modelNameSpan.textContent = modelName;
      }
      if (dynamicModelTitle) {
        dynamicModelTitle.textContent = modelName;
      }
      if (messageInput) {
        messageInput.placeholder = `Envía un mensaje a ${modelName}...`;
      }
    })
    .catch((error) => {
      if (modelNameSpan) {
        modelNameSpan.textContent = 'AI Language Model';
      }
    });

  function sendMessage() {
    let message = messageInput.value.trim();
    if (!message) return;

    // Disable send button and input during request
    sendButton.disabled = true;
    messageInput.disabled = true;
    sendButton.classList.add('opacity-50', 'cursor-not-allowed');
    messageInput.classList.add('opacity-50');

    const messageForApi = message + ' en español';
    // Add user message to current chat
    chatManager.addMessage('user', message);
    messageInput.value = '';
    autoResize();

    // Show loading indicator
    const chatBox = document.getElementById('chat-box');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'flex items-start space-x-3';
    loadingDiv.innerHTML = `
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <div class="flex-1">
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-md shadow-sm border border-gray-200">
            <p class="text-gray-600 italic text-sm">Pensando...</p>
          </div>
        </div>
      `;
    if (chatBox) {
      chatBox.appendChild(loadingDiv);
      // Always scroll to bottom when showing loading indicator
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Send message to API
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageForApi }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Remove loading indicator
        if (loadingDiv.parentNode) {
          loadingDiv.parentNode.removeChild(loadingDiv);
        }

        // Add bot's response to current chat
        if (data.error) {
          chatManager.addMessage(
            'assistant',
            'Lo siento, encontré un error. Por favor, inténtalo de nuevo.'
          );
        } else {
          chatManager.addMessage('assistant', data.response);
        }
      })
      .catch((error) => {
        // Remove loading indicator
        if (loadingDiv.parentNode) {
          loadingDiv.parentNode.removeChild(loadingDiv);
        }
        // Show error message
        chatManager.addMessage(
          'assistant',
          'Lo siento, encontré un error. Por favor, inténtalo de nuevo.'
        );
        console.error('Error:', error);
      })
      .finally(() => {
        // Re-enable send button and input
        sendButton.disabled = false;
        messageInput.disabled = false;
        sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
        messageInput.classList.remove('opacity-50');
        messageInput.focus();
      });
  }

  // Event listeners
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // New chat button event listener
  const sidebarNewChatBtn = document.getElementById('sidebar-new-chat-btn');
  if (sidebarNewChatBtn) {
    sidebarNewChatBtn.addEventListener('click', () => {
      chatManager.createNewChat();
    });
  }

  clearAllBtn.addEventListener('click', () => {
    const clearAllModal = document.getElementById('clear-all-modal');
    if (clearAllModal) {
      clearAllModal.classList.remove('hidden');
      clearAllModal.classList.add('flex');
    }
  });

  renameChatBtn.addEventListener('click', () => {
    const currentChatId = chatManager.getCurrentChatId();
    if (currentChatId) {
      chatManager.showRenameModal(currentChatId);
    }
  });

  deleteChatBtn.addEventListener('click', () => {
    const currentChatId = chatManager.getCurrentChatId();
    if (currentChatId) {
      chatManager.confirmDeleteChat(currentChatId);
    }
  });

  // Modal event listeners
  confirmRename.addEventListener('click', () => {
    const chatId = renameModal.getAttribute('data-chat-id');
    const newName = renameInput.value.trim();

    if (chatId && newName) {
      chatManager.renameChat(chatId, newName);
    }

    renameModal.classList.add('hidden');
    renameModal.classList.remove('flex');
  });

  cancelRename.addEventListener('click', () => {
    renameModal.classList.add('hidden');
    renameModal.classList.remove('flex');
  });

  // Close modal on backdrop click
  renameModal.addEventListener('click', (e) => {
    if (e.target === renameModal) {
      renameModal.classList.add('hidden');
      renameModal.classList.remove('flex');
    }
  });

  // Handle Enter key in rename input
  renameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      confirmRename.click();
    } else if (e.key === 'Escape') {
      cancelRename.click();
    }
  });

  // Clear all modal event listeners
  const clearAllModal = document.getElementById('clear-all-modal');
  const confirmClearAll = document.getElementById('confirm-clear-all');
  const cancelClearAll = document.getElementById('cancel-clear-all');

  if (confirmClearAll && clearAllModal) {
    confirmClearAll.addEventListener('click', () => {
      chatManager.clearAllChats();
      clearAllModal.classList.add('hidden');
      clearAllModal.classList.remove('flex');
    });
  }

  if (cancelClearAll && clearAllModal) {
    cancelClearAll.addEventListener('click', () => {
      clearAllModal.classList.add('hidden');
      clearAllModal.classList.remove('flex');
    });
  }

  // Close clear all modal on backdrop click
  if (clearAllModal) {
    clearAllModal.addEventListener('click', (e) => {
      if (e.target === clearAllModal) {
        clearAllModal.classList.add('hidden');
        clearAllModal.classList.remove('flex');
      }
    });
  }

  // Delete chat modal event listeners
  const deleteChatModal = document.getElementById('delete-chat-modal');
  const confirmDeleteChatBtn = document.getElementById('confirm-delete-chat');
  const cancelDeleteChatBtn = document.getElementById('cancel-delete-chat');

  if (confirmDeleteChatBtn && deleteChatModal) {
    confirmDeleteChatBtn.addEventListener('click', () => {
      const chatId = deleteChatModal.getAttribute('data-chat-id');
      if (chatId) {
        chatManager.deleteChat(chatId);
      }
      deleteChatModal.classList.add('hidden');
      deleteChatModal.classList.remove('flex');
    });
  }

  if (cancelDeleteChatBtn && deleteChatModal) {
    cancelDeleteChatBtn.addEventListener('click', () => {
      deleteChatModal.classList.add('hidden');
      deleteChatModal.classList.remove('flex');
    });
  }

  // Close delete chat modal on backdrop click
  if (deleteChatModal) {
    deleteChatModal.addEventListener('click', (e) => {
      if (e.target === deleteChatModal) {
        deleteChatModal.classList.add('hidden');
        deleteChatModal.classList.remove('flex');
      }
    });
  }
});
