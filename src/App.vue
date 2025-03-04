<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="logo">
        <router-link to="/">CeraMD AI</router-link>
      </div>
      <div class="nav-buttons">
        <template v-if="isLoggedIn">
          <div class="user-dropdown">
            <button class="user-avatar" @click="toggleDropdown" ref="userAvatarBtn">
              <span>{{ userInitials }}</span>
            </button>
            <div class="dropdown-menu" v-if="dropdownOpen" ref="dropdownMenu">
              <div class="menu-header" v-if="userData">
                <div class="user-name">{{ userData.name }}</div>
                <div class="user-email">{{ userData.email }}</div>
              </div>
              <div class="menu-items">
                <router-link to="/my-patients" class="menu-item" @click="dropdownOpen = false">
                  <span class="menu-icon">👥</span>
                  My Patients
                </router-link>
                <router-link to="/logs" class="menu-item" @click="dropdownOpen = false">
                    <span class="menu-icon">📋</span>
                    Audit Logs
                </router-link>
                <button @click="logout" class="menu-item logout">
                  <span class="menu-icon">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <router-link to="/register" class="nav-button register">Register</router-link>
          <router-link to="/login" class="nav-button login">Login</router-link>
        </template>
      </div>
    </nav>

    <!-- Session timeout warning dialog -->
    <div v-if="showTimeoutWarning" class="timeout-dialog-overlay">
      <div class="timeout-dialog">
        <div class="timeout-dialog-header">
          <h3>Session Timeout Warning</h3>
        </div>
        <div class="timeout-dialog-body">
          <p>Your session will expire due to inactivity in:</p>
          <div class="timeout-countdown">{{ formatTime(remainingTime) }}</div>
          <p>Do you want to continue your session?</p>
        </div>
        <div class="timeout-dialog-footer">
          <button
            class="continue-button"
            @click="continueSession"
          >
            Continue Session
          </button>
          <button
            class="logout-button"
            @click="logout"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>

    <router-view @login-success="checkAuthStatus" />
  </div>
</template>

<script>
import authService from './authService';
import { createAuditLog } from './auditLog';
export default {
  name: 'App',
  data() {
    return {
      isLoggedIn: false,
      userData: null,
      dropdownOpen: false,
      // Session timeout related data
      showTimeoutWarning: false,
      remainingTime: 0,
      warningTimer: null,
      countdownTimer: null,
      WARNING_BEFORE_TIMEOUT: 2 * 60 * 1000 // Show warning 2 minutes before timeout
    }
  },
  computed: {
    userInitials() {
      if (!this.userData || !this.userData.name) return '?';

      const nameParts = this.userData.name.split(' ');
      if (nameParts.length === 1) {
        return nameParts[0].charAt(0).toUpperCase();
      }

      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    }
  },
  created() {
    this.checkAuthStatus();

    authService.onAuthChange((isAuthenticated, userData) => {
      this.isLoggedIn = isAuthenticated;
      this.userData = userData;

      // Setup session timeout warning timer if user is logged in
      if (isAuthenticated) {
        this.setupWarningTimer();
      } else {
        this.clearTimers();
      }
    });

    // Listen for session timeout events
    authService.onSessionTimeout(() => {
      this.showTimeoutAlert();
    });

    document.addEventListener('click', this.handleOutsideClick);

    // Make router accessible for authService
    window.router = this.$router;
  },
  mounted() {
    // Set up session timeout warning if user is already logged in
    if (this.isLoggedIn) {
      this.setupWarningTimer();
    }
  },
  unmounted() {
    document.removeEventListener('click', this.handleOutsideClick);
    this.clearTimers();
  },
  methods: {
    checkAuthStatus() {
      this.isLoggedIn = authService.isLoggedIn();
      this.userData = authService.getUserData();
    },

    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    },

    handleOutsideClick(event) {
      if (this.dropdownOpen &&
          this.$refs.dropdownMenu &&
          this.$refs.userAvatarBtn &&
          !this.$refs.dropdownMenu.contains(event.target) &&
          !this.$refs.userAvatarBtn.contains(event.target)) {
        this.dropdownOpen = false;
      }
    },

    async logout() {

      await createAuditLog('logout',localStorage.getItem('authToken'),'User logged out');
      authService.logout();
      this.dropdownOpen = false;
      this.$router.push('/');
    },

    // Session timeout methods
    setupWarningTimer() {
      // Clear any existing timers
      this.clearTimers();

      // Set timer to show warning before timeout
      this.warningTimer = setInterval(() => {
        if (!authService.isLoggedIn()) {
          this.clearTimers();
          return;
        }

        const remainingTime = authService.getRemainingTime();

        // If we're within the warning period, show the warning dialog
        if (remainingTime <= this.WARNING_BEFORE_TIMEOUT && remainingTime > 0) {
          this.showTimeoutWarning = true;
          this.remainingTime = Math.floor(remainingTime / 1000);

          // Start countdown
          this.startCountdown();

          // Clear the warning timer as we're now showing the warning
          clearInterval(this.warningTimer);
        }
      }, 30000); // Check every 30 seconds
    },

    startCountdown() {
      // Clear any existing countdown
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
      }

      // Update countdown every second
      this.countdownTimer = setInterval(() => {
        this.remainingTime -= 1;

        // If countdown reaches zero, logout
        if (this.remainingTime <= 0) {
          this.logout();
          this.showTimeoutWarning = false;
        }
      }, 1000);
    },

    clearTimers() {
      if (this.warningTimer) {
        clearInterval(this.warningTimer);
        this.warningTimer = null;
      }

      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }

      this.showTimeoutWarning = false;
    },

    async continueSession() {
      // User wants to continue the session
      this.showTimeoutWarning = false;
      this.clearTimers();

      // Attempt to refresh the token
      await authService.refreshToken();

      // Reset activity and warning timer
      authService.updateLastActivity();
      this.setupWarningTimer();
    },

    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;

      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    },

    showTimeoutAlert() {
      alert('Your session has expired due to inactivity. Please log in again.');
    }
  },
  watch: {
    // Watch for route changes to reset activity
    '$route'() {
      if (authService.isLoggedIn()) {
        authService.updateLastActivity();
      }
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}

body {
  background-color: #f5f7fa;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background-color: #4a82ed;
  color: white;
  padding: 0.8rem 2rem;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-weight: bold;
  font-size: 1.5rem;
  letter-spacing: 1px;
}

.logo a {
  color: white;
  text-decoration: none;
}

.nav-buttons {
  display: flex;
  gap: 15px;
  align-items: center;
}

.nav-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
}

.register {
  background-color: #ffffff;
  color: #4a82ed;
}

.register:hover {
  background-color: #f0f0f0;
}

.login {
  border: 2px solid white;
  color: white;
}

.login:hover {
  background-color: rgba(255, 255, 255, 0.2);
}


.user-dropdown {
  position: relative;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3461c0;
  border: 2px solid white;
  color: white;
  font-weight: bold;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
}

.menu-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.user-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.user-email {
  font-size: 0.85rem;
  color: #666;
}

.menu-items {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #444;
  text-decoration: none;
  transition: background-color 0.2s;
  cursor: pointer;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  font-size: 1rem;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-icon {
  margin-right: 10px;
  font-size: 18px;
}

.menu-item.logout {
  color: #e53935;
}

.menu-item.logout:hover {
  background-color: #ffebee;
}

/* Session timeout dialog styles */
.timeout-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.timeout-dialog {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.timeout-dialog-header {
  background-color: #f0f4f8;
  padding: 16px;
  border-bottom: 1px solid #e1e8ed;
}

.timeout-dialog-header h3 {
  margin: 0;
  color: #4a82ed;
  font-size: 18px;
}

.timeout-dialog-body {
  padding: 20px;
  text-align: center;
}

.timeout-countdown {
  font-size: 32px;
  font-weight: bold;
  color: #e74c3c;
  margin: 16px 0;
}

.timeout-dialog-footer {
  display: flex;
  padding: 16px;
  border-top: 1px solid #e1e8ed;
  justify-content: center;
  gap: 12px;
}

.continue-button {
  padding: 10px 16px;
  background-color: #4a82ed;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.continue-button:hover {
  background-color: #3461c0;
}

.logout-button {
  padding: 10px 16px;
  background-color: #f5f7fa;
  color: #4a5568;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.logout-button:hover {
  background-color: #e2e8f0;
}
</style>
