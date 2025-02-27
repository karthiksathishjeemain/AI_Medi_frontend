<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="title">Login to AI-Medi</h2>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            placeholder="Enter your email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="Enter your password"
            required
          />
        </div>

        <button
          type="submit"
          class="login-button"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <div class="register-link">
        Don't have an account?
        <router-link to="/register">Register here</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import authService from '../authService';

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      error: null,
      isLoading: false,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:5000'
    }
  },
  methods: {
    async handleLogin() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${this.apiBaseUrl}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to login');
        }

        authService.login(data.user, data.token);

        const redirectPath = this.$route.query.redirect || '/dashboard';

        this.$router.push(redirectPath);

      } catch (error) {
        this.error = error.message;
        console.error('Login error:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.title {
  text-align: center;
  color: #4a82ed;
  margin-bottom: 24px;
  font-size: 24px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #4a82ed;
}

.login-button {
  margin-top: 10px;
  padding: 12px;
  border: none;
  border-radius: 4px;
  background-color: #4a82ed;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: #3461c0;
}

.login-button:disabled {
  background-color: #a0b4e0;
  cursor: not-allowed;
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
}

.register-link {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #4a82ed;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
