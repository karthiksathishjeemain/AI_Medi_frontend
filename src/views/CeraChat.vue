<template>
  <div class="ceramd-chat-container">
    <!-- Sidebar for chat sessions -->
    <div class="ceramd-sidebar" :class="{ 'ceramd-sidebar-open': sidebarOpen }">
      <div class="ceramd-sidebar-header">
        <h3>Chat History</h3>
        <button class="ceramd-new-chat-btn" @click="createNewSession">
          <span>+</span> New Chat
        </button>
      </div>
      <div class="ceramd-session-list">
        <div
          v-for="session in chatSessions"
          :key="session.id"
          @click="loadSession(session.id)"
          class="ceramd-session-item"
          :class="{
            'ceramd-active': currentSessionId === session.id,
            'ceramd-local-session': session.isLocal
          }">
          <div class="ceramd-session-title">{{ session.title }}</div>
          <div class="ceramd-session-date">
            <span v-if="session.isLocal">New</span>
            <span v-else>{{ formatDate(session.updated_at) }}</span>
          </div>
        </div>
        <div v-if="chatSessions.length === 0" class="ceramd-no-sessions">
          No previous chats
        </div>
      </div>
    </div>

    <!-- Main chat container -->
    <div class="ceramd-main-chat">
      <div class="ceramd-mobile-header">
        <button class="ceramd-sidebar-toggle" @click="toggleSidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="ceramd-chat-messages" ref="chatMessages">
        <div class="ceramd-chat-pill-header">CeraMD Chat</div>

        <!-- Session loading indicator -->
        <div v-if="isSessionLoading" class="ceramd-session-loading">
          <div class="ceramd-loading-spinner"></div>
          <div class="ceramd-loading-text">Loading conversation...</div>
        </div>

        <!-- Regular messages -->
        <div v-else v-for="(message, index) in messages" :key="index"
             :class="['ceramd-message', message.role === 'user' ? 'ceramd-user-message' : 'ceramd-bot-message']">
             <div class="ceramd-message-content" v-if="message.role === 'user'">{{ message.content }}</div>
             <div class="ceramd-message-content ceramd-markdown-content" v-else v-html="renderMarkdown(message.content)"></div>
        </div>

        <!-- Message sending loading indicator -->
        <div v-if="isLoading" class="ceramd-message ceramd-bot-message">
          <div class="ceramd-message-content ceramd-loading">
            <span class="ceramd-dot"></span>
            <span class="ceramd-dot"></span>
            <span class="ceramd-dot"></span>
          </div>
        </div>
      </div>

      <div class="ceramd-chat-input">
        <textarea
          v-model="userInput"
          @keydown.enter.prevent="sendMessage"
          placeholder="Ask CeraMd a question..."
          rows="2"
        ></textarea>
        <button @click="sendMessage" :disabled="!userInput.trim() || isLoading">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked';
export default {
  name: 'CeraChat',
  data() {
    return {
      userInput: '',
      messages: [
        { role: 'assistant', content: 'Hello! I\'m CeraMd Assistant. How can I help you today?' },
      ],
      isLoading: false,
      isSessionLoading: false,
      chatSessions: [],
      currentSessionId: null,
      sidebarOpen: false,
      // apiBaseUrl: "http://localhost:5000",
      apiBaseUrl: "https://ai-medi-backend.vercel.app"
    }
  },
  methods: {
    renderMarkdown(content) {
      return marked(content);
    },
    async sendMessage() {
      if (!this.userInput.trim() || this.isLoading) return;

      // Add user message
      this.messages.push({ role: 'user', content: this.userInput });
      const userMessage = this.userInput;
      this.userInput = '';
      this.isLoading = true;

      // Scroll to bottom
      this.$nextTick(() => {
        this.scrollToBottom();
      });

      // Create a local session if one doesn't exist
      if (!this.currentSessionId) {
        this.createNewSession();
      }

      // Check if this is a local session that needs to be created on the server
      const isLocalSession = this.currentSessionId && this.currentSessionId.startsWith('local-');
      if (isLocalSession) {
        // Create a real session on the server for the first message
        const newSessionId = await this.createSessionOnServer();

        if (newSessionId) {
          // Now save all accumulated messages
          for (const msg of this.messages) {
            try {
              await this.saveMessageToServer(
                msg.role === 'user' ? 'user' : 'assistant',
                msg.content
              );
            } catch (error) {
              console.error('Error saving message:', error);
            }
          }
        }
      } else if (this.currentSessionId) {
        // Regular case - just save the latest user message
        try {
          await this.saveMessageToServer('user', userMessage);
        } catch (error) {
          console.error('Error saving user message:', error);
        }
      }

      const systemMessage = {
        role: 'system',
        content: `You are CeraMd.ai, a medical AI assistant designed to help doctors with medical information and questions.`
      };

      const Inputmessages = [
        systemMessage,
        ...this.messages.map(msg => ({ role: msg.role, content: msg.content }))
      ];

      try {
        // Make API call to Mistral Large
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer SnKZ9Dryc0oeA9twr35jgtrhxgM1zoRm`
          },
          body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: Inputmessages
          })
        });

        const data = await response.json();

        // Make sure loading state is cleared first
        this.isLoading = false;

        // Add assistant response
        let assistantMessage = '';
        if (data.choices && data.choices[0]?.message) {
          assistantMessage = data.choices[0].message.content;
          this.messages.push({
            role: 'assistant',
            content: assistantMessage
          });
        } else {
          // Fallback error message
          assistantMessage = 'Sorry, I encountered an issue processing your request. Please try again.';
          this.messages.push({
            role: 'assistant',
            content: assistantMessage
          });
        }

        // Save assistant message to server
        if (this.currentSessionId && !this.currentSessionId.startsWith('local-')) {
          try {
            await this.saveMessageToServer('assistant', assistantMessage);
            await this.updateSessionTitle();
          } catch (error) {
            console.error('Error saving assistant message:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching response:', error);

        // Clear loading state before adding the error message
        this.isLoading = false;

        const errorMessage = 'Sorry, there was an error connecting to the service. Please check your connection and try again.';
        this.messages.push({
          role: 'assistant',
          content: errorMessage
        });

        // Save error message to server
        if (this.currentSessionId && !this.currentSessionId.startsWith('local-')) {
          try {
            await this.saveMessageToServer('assistant', errorMessage);
          } catch (saveError) {
            console.error('Error saving error message:', saveError);
          }
        }
      } finally {
        // Ensure loading is always turned off, even if there were other errors
        this.isLoading = false;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    scrollToBottom() {
      if (this.$refs.chatMessages) {
        this.$refs.chatMessages.scrollTop = this.$refs.chatMessages.scrollHeight;
      }
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    },
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    async fetchSessions() {
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/chat/sessions`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });

        if (response.ok) {
          const data = await response.json();

          // If we have an active local session, preserve it
          if (this.currentSessionId && this.currentSessionId.startsWith('local-')) {
            const localSession = this.chatSessions.find(s => s.id === this.currentSessionId);
            if (localSession) {
              // Keep the local session at the beginning of the list
              this.chatSessions = [localSession, ...data];
              return;
            }
          }

          this.chatSessions = data;
        } else {
          console.error('Failed to fetch sessions:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    },
    createNewSession() {
      // Just create a local conversation without API call
      this.currentSessionId = 'local-' + Date.now();
      this.messages = [
        { role: 'assistant', content: 'Hello! I\'m CeraMd Assistant. How can I help you today?' }
      ];

      // Add temporary session to the UI
      const tempSession = {
        id: this.currentSessionId,
        title: 'New Conversation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isLocal: true
      };

      // Add to the beginning of the sessions array
      // Check if there's already a "New Conversation" that is local
      const existingNewConversation = this.chatSessions.find(
        session => session.isLocal && session.title === 'New Conversation'
      );

      // If there's already a new conversation, replace it instead of adding another
      if (existingNewConversation) {
        this.chatSessions = this.chatSessions.map(session => {
          if (session.id === existingNewConversation.id) {
            return tempSession;
          }
          return session;
        });
      } else {
        // Otherwise add to the beginning of sessions array
        this.chatSessions = [tempSession, ...this.chatSessions];
      }

      this.scrollToBottom();
      return this.currentSessionId;
    },

    async createSessionOnServer() {
      // Only called after the first user message is sent
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/chat/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify({
            title: 'New Conversation'
          })
        });

        if (response.ok) {
          const data = await response.json();

          // Replace the local session ID with the server one
          const oldSessionId = this.currentSessionId;
          this.currentSessionId = data.session_id;

          // Update the sessions list
          this.chatSessions = this.chatSessions.map(session => {
            if (session.id === oldSessionId) {
              return {
                ...session,
                id: data.session_id,
                isLocal: false
              };
            }
            return session;
          });

          return data.session_id;
        } else {
          console.error('Failed to create session:', response.statusText);
          return null;
        }
      } catch (error) {
        console.error('Error creating session:', error);
        return null;
      }
    },
    async loadSession(sessionId) {
      // If this is the currently selected session, don't reload it
      if (sessionId === this.currentSessionId) {
        // Just close the sidebar on mobile
        this.sidebarOpen = false;
        return;
      }

      // Check if this is a local session (not yet saved to server)
      if (sessionId.startsWith('local-')) {
        // Find the session in our local array
        const session = this.chatSessions.find(s => s.id === sessionId);
        if (session) {
          this.currentSessionId = sessionId;
          // Reset to just the initial greeting message
          this.messages = [
            { role: 'assistant', content: 'Hello! I\'m CeraMd Assistant. How can I help you today?' }
          ];

          this.sidebarOpen = false; // Close sidebar on mobile after selection
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        }
        return;
      }

      // Otherwise, load from server - but first show loading indicator
      this.sidebarOpen = false; // Close sidebar on mobile immediately
      this.currentSessionId = sessionId; // Set current session ID immediately

      // Show loading state immediately
      this.isSessionLoading = true;
      this.messages = [
        { role: 'assistant', content: 'Loading conversation...' }
      ];

      // Scroll to the loading message
      this.$nextTick(() => {
        this.scrollToBottom();
      });

      try {
        const response = await fetch(`${this.apiBaseUrl}/api/chat/sessions/${sessionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });

        if (response.ok) {
          const data = await response.json();

          // Convert messages from server format to component format
          if (data.messages && Array.isArray(data.messages)) {
            this.messages = data.messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content
            }));

            // If no messages, add initial greeting
            if (this.messages.length === 0) {
              this.messages = [
                { role: 'assistant', content: 'Hello! I\'m CeraMd Assistant. How can I help you today?' }
              ];
            }
          } else {
            // If no messages array or invalid format, reset to default
            this.messages = [
              { role: 'assistant', content: 'Hello! I\'m CeraMd Assistant. How can I help you today?' }
            ];
            console.warn("Session had invalid message format:", data);
          }
        } else {
          console.error('Failed to load session:', response.statusText);
          // Show error message
          this.messages = [
            { role: 'assistant', content: 'Sorry, there was a problem loading this conversation. Please try again or start a new chat.' }
          ];
        }
      } catch (error) {
        console.error('Error loading session:', error);
        // Show error message
        this.messages = [
          { role: 'assistant', content: 'Sorry, there was a problem loading this conversation. Please try again or start a new chat.' }
        ];
      } finally {
        // Clear loading state
        this.isSessionLoading = false;

        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    async saveMessageToServer(sender, content) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/chat/sessions/${this.currentSessionId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify({
            sender: sender,
            content: content
          })
        });

        if (!response.ok) {
          console.error('Failed to save message:', response.statusText);
        }
      } catch (error) {
        console.error('Error saving message:', error);
        throw error;
      }
    },
    async updateSessionTitle() {
      // Only update title if this is the first exchange in a new session
      if (this.messages.length <= 3) {
        const firstUserMessage = this.messages.find(msg => msg.role === 'user')?.content || '';
        // Generate title from first user message (truncated)
        let title = firstUserMessage.split(' ').slice(0, 5).join(' ');
        if (firstUserMessage.length > title.length) title += '...';

        try {
          const response = await fetch(`${this.apiBaseUrl}/api/chat/sessions/${this.currentSessionId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({
              title: title || 'New Conversation'
            })
          });

          if (response.ok) {
            await this.fetchSessions();
          } else {
            console.error('Failed to update session title:', response.statusText);
          }
        } catch (error) {
          console.error('Error updating session title:', error);
        }
      }
    },
    getAuthToken() {
      // Get auth token from wherever it's stored
      return localStorage.getItem('authToken') || '';
    }
  },
  async mounted() {
    this.scrollToBottom();

    // Only fetch sessions if we have an auth token
    if (this.getAuthToken()) {
      try {
        await this.fetchSessions();

        // Create a new conversation automatically if there are no sessions
        // or if the user is visiting /chat for the first time
        if (this.chatSessions.length === 0 || !this.currentSessionId) {
          this.createNewSession();
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        // If there was an error fetching sessions, still create a new session
        this.createNewSession();
      }
    } else {
      // Even without auth, create a local session for the interface
      this.createNewSession();
    }
  }
}
</script>

<style scoped>
/* Namespace all CSS classes to avoid conflicts with App.vue */
.ceramd-chat-container {
  display: flex;
  height: calc(100vh - 60px); /* Adjusted for the App.vue navbar */
  width: 100%;
  overflow: hidden;
  position: relative;
}

/* Sidebar Styles */
.ceramd-sidebar {
  width: 280px;
  background-color: #f0f2f5;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
  transition: transform 0.3s ease;
  z-index: 10;
}

.ceramd-sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ceramd-sidebar-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.ceramd-new-chat-btn {
  background-color: #4a82ed;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background-color 0.2s;
}

.ceramd-new-chat-btn:hover {
  background-color: #3a72dd;
}

.ceramd-session-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.ceramd-session-item {
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.ceramd-session-item:hover {
  background-color: #e5e7eb;
}

.ceramd-session-item.ceramd-active {
  background-color: #e0e7ff;
}

.ceramd-session-item.ceramd-local-session {
  border-left: 3px solid #4a82ed;
}

.ceramd-session-title {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 4px;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ceramd-session-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.ceramd-no-sessions {
  text-align: center;
  color: #6b7280;
  padding: 20px;
  font-size: 0.9rem;
}

/* Mobile Header */
.ceramd-mobile-header {
  display: none;
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.ceramd-sidebar-toggle {
  background: none;
  border: none;
  cursor: pointer;
  color: #4a82ed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

/* Main Chat Styles */
.ceramd-main-chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  width: calc(100% - 280px);
  margin: 0 auto;
  overflow: hidden;
  background-color: #f8f9fa;
  position: relative;
}

.ceramd-chat-pill-header {
  background-color: #4a82ed;
  color: white;
  display: inline-block;
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: 500;
  margin-bottom: 15px;
  align-self: center;
  font-size: 0.9rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.ceramd-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 400px;
  max-height: calc(100vh - 200px); /* Adjusted for App.vue navbar and chat input */
}

.ceramd-message {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 18px;
  margin-bottom: 10px;
  word-wrap: break-word;
}

.ceramd-user-message {
  align-self: flex-end;
  background-color: #4a82ed;
  color: white;
  border-bottom-right-radius: 5px;
}

.ceramd-bot-message {
  align-self: flex-start;
  background-color: #e9ecef;
  color: #343a40;
  border-bottom-left-radius: 5px;
}

.ceramd-loading .ceramd-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #343a40;
  margin-right: 3px;
  animation: ceramd-wave 1.3s linear infinite;
}

.ceramd-loading .ceramd-dot:nth-child(2) {
  animation-delay: -1.1s;
}

.ceramd-loading .ceramd-dot:nth-child(3) {
  animation-delay: -0.9s;
}

@keyframes ceramd-wave {
  0%, 60%, 100% {
    transform: initial;
  }
  30% {
    transform: translateY(-10px);
  }
}

.ceramd-chat-input {
  display: flex;
  padding: 15px;
  background-color: white;
  border-top: 1px solid #dee2e6;
  flex-shrink: 0;
}

.ceramd-chat-input textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 20px;
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 1rem;
}

.ceramd-chat-input button {
  width: 45px;
  height: 45px;
  margin-left: 10px;
  border: none;
  border-radius: 50%;
  background-color: #4a82ed;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.ceramd-chat-input button:hover:not(:disabled) {
  background-color: #3a72dd;
}

.ceramd-chat-input button:disabled {
  background-color: #ced4da;
  cursor: not-allowed;
}

.ceramd-markdown-content {
  line-height: 1.5;
}

.ceramd-markdown-content :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 1.2rem;
  font-weight: bold;
}

.ceramd-markdown-content :deep(ul),
.ceramd-markdown-content :deep(ol) {
  padding-left: 20px;
  margin-bottom: 8px;
}

.ceramd-markdown-content :deep(li) {
  margin-bottom: 4px;
}

.ceramd-markdown-content :deep(strong) {
  font-weight: bold;
}

.ceramd-markdown-content :deep(em) {
  font-style: italic;
}

.ceramd-session-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #4a82ed;
}

.ceramd-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(74, 130, 237, 0.2);
  border-radius: 50%;
  border-top-color: #4a82ed;
  animation: ceramd-spin 1s linear infinite;
  margin-bottom: 15px;
}

.ceramd-loading-text {
  font-size: 0.9rem;
  color: #4a5568;
}

@keyframes ceramd-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Styles */
@media (max-width: 768px) {
  .ceramd-chat-container {
    flex-direction: column;
  }

  .ceramd-sidebar {
    position: fixed;
    top: 60px; /* Adjusted for App.vue navbar */
    left: 0;
    z-index: 100;
    transform: translateX(-100%);
    width: 80%;
    max-width: 280px;
    height: calc(100vh - 60px); /* Adjusted for App.vue navbar */
  }

  .ceramd-sidebar-open {
    transform: translateX(0);
  }

  .ceramd-mobile-header {
    display: block;
  }

  .ceramd-main-chat {
    width: 100%;
    max-width: 100%;
  }

  .ceramd-chat-messages {
    max-height: calc(100vh - 200px); /* Adjusted for navbar and input */
  }
}
</style>
