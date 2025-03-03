class AuthService {
  constructor() {
    this.eventBus = document.createElement('div');
    this.INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds
    this.inactivityTimer = null;
    this.apiBaseUrl = 'https://ai-medi-backend.vercel.app';
    // this.apiBaseUrl = 'http://localhost:5000';
    this.initialize();
  }

  initialize() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    this.isAuthenticated = !!token;
    this.userData = userData ? JSON.parse(userData) : null;

    if (this.isAuthenticated) {
      // Initialize session timeout for existing login
      this.updateLastActivity();
      this.resetInactivityTimer();
      this.setupActivityListeners();
    }
  }

  onAuthChange(callback) {
    this.eventBus.addEventListener('auth-change', (event) => {
      callback(event.detail.isAuthenticated, event.detail.userData);
    });
  }

  emitAuthChange() {
    const event = new CustomEvent('auth-change', {
      detail: {
        isAuthenticated: this.isAuthenticated,
        userData: this.userData
      }
    });
    this.eventBus.dispatchEvent(event);
  }

  login(userData, token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));

    this.isAuthenticated = true;
    this.userData = userData;

    // Initialize session timeout tracking
    this.updateLastActivity();
    this.resetInactivityTimer();
    this.setupActivityListeners();

    this.emitAuthChange();
    return userData;
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('currentPatient');
    localStorage.removeItem('lastActivity');

    // Clear session timeout
    this.clearInactivityTimer();
    this.removeActivityListeners();

    this.isAuthenticated = false;
    this.userData = null;

    this.emitAuthChange();
  }

  isLoggedIn() {
    return this.isAuthenticated;
  }

  getUserData() {
    return this.userData;
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  // Session timeout methods
  updateLastActivity() {
    localStorage.setItem('lastActivity', Date.now().toString());
  }

  checkInactivity() {
    const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
    const currentTime = Date.now();

    if (currentTime - lastActivity > this.INACTIVITY_TIMEOUT) {
      // Session has expired due to inactivity
      this.logout();

      // Emit a custom event for session timeout
      const timeoutEvent = new CustomEvent('session-timeout');
      this.eventBus.dispatchEvent(timeoutEvent);

      // Navigate to login page if router is available
      if (window.router) {
        window.router.push('/login?timeout=true');
      }
    }
  }

  resetInactivityTimer() {
    // Clear any existing timer
    this.clearInactivityTimer();

    // Set a new timer
    this.inactivityTimer = setInterval(() => {
      this.checkInactivity();
    }, 60000); // Check every minute
  }

  clearInactivityTimer() {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  setupActivityListeners() {
    // Track user activity
    this.activityHandler = () => {
      this.updateLastActivity();
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, this.activityHandler, true);
    });
  }

  removeActivityListeners() {
    if (!this.activityHandler) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    // Remove event listeners
    activityEvents.forEach(event => {
      document.removeEventListener(event, this.activityHandler, true);
    });

    this.activityHandler = null;
  }

  onSessionTimeout(callback) {
    this.eventBus.addEventListener('session-timeout', callback);
  }

  // Get remaining time until timeout
  getRemainingTime() {
    const lastActivity = parseInt(localStorage.getItem('lastActivity') || Date.now().toString());
    const currentTime = Date.now();
    const elapsedTime = currentTime - lastActivity;
    const remainingTime = Math.max(0, this.INACTIVITY_TIMEOUT - elapsedTime);

    return remainingTime;
  }

  // Method to refresh token
  async refreshToken() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json',
          'Last-Activity': Date.now().toString()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      // Update token and reset activity
      localStorage.setItem('authToken', data.token);
      this.updateLastActivity();

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }
}

const authService = new AuthService();

export default authService;
