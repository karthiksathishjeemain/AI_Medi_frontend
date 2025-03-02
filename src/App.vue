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

    <router-view @login-success="checkAuthStatus" />
  </div>
</template>

<script>
import authService from './authService';

export default {
  name: 'App',
  data() {
    return {
      isLoggedIn: false,
      userData: null,
      dropdownOpen: false
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
    });


    document.addEventListener('click', this.handleOutsideClick);
  },
  unmounted() {

    document.removeEventListener('click', this.handleOutsideClick);
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

    logout() {
      authService.logout();
      this.dropdownOpen = false;
      this.$router.push('/');
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
  background-color: #ffebee;}
</style>
