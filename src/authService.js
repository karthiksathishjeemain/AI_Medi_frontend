// authService.js - Centralized authentication state management

class AuthService {
    constructor() {
      this.eventBus = document.createElement('div');
      this.initialize();
    }
    
    // Initialize auth state from localStorage
    initialize() {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      this.isAuthenticated = !!token;
      this.userData = userData ? JSON.parse(userData) : null;
    }
    
    // Add event listener for auth state changes
    onAuthChange(callback) {
      this.eventBus.addEventListener('auth-change', (event) => {
        callback(event.detail.isAuthenticated, event.detail.userData);
      });
    }
    
    // Trigger auth state change event
    emitAuthChange() {
      const event = new CustomEvent('auth-change', {
        detail: {
          isAuthenticated: this.isAuthenticated,
          userData: this.userData
        }
      });
      this.eventBus.dispatchEvent(event);
    }
    
    // Login user
    login(userData, token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      this.isAuthenticated = true;
      this.userData = userData;
      
      this.emitAuthChange();
      return userData;
    }
    
    // Logout user
    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('currentPatient');
      
      this.isAuthenticated = false;
      this.userData = null;
      
      this.emitAuthChange();
    }
    
    // Check authentication status
    isLoggedIn() {
      return this.isAuthenticated;
    }
    
    // Get user data
    getUserData() {
      return this.userData;
    }
    
    // Get auth token
    getToken() {
      return localStorage.getItem('authToken');
    }
  }
  
  // Create singleton instance
  const authService = new AuthService();
  
  export default authService;