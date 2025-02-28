
class AuthService {
    constructor() {
      this.eventBus = document.createElement('div');
      this.initialize();
    }


    initialize() {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');

      this.isAuthenticated = !!token;
      this.userData = userData ? JSON.parse(userData) : null;
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

      this.emitAuthChange();
      return userData;
    }

    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('currentPatient');

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
  }

  const authService = new AuthService();

  export default authService;
