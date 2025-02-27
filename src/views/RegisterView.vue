<template>
    <div class="register-container">
      <div class="register-card">
        <h2 class="title">Create an Account</h2>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input
              type="text"
              id="name"
              v-model="name"
              placeholder="Enter your full name"
              required
            />
          </div>

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
              placeholder="Create a password"
              required
            />
            <div class="password-requirements">
              Password must be at least 8 characters long
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              v-model="confirmPassword"
              placeholder="Confirm your password"
              required
            />
          </div>

          <div class="terms-checkbox">
            <input type="checkbox" id="terms" v-model="termsAccepted" required />
            <label for="terms">
              I agree to the
              <a href="#" @click.prevent="showTerms">Terms of Service</a> and
              <a href="#" @click.prevent="showPrivacyPolicy">Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            class="register-button"
            :disabled="isLoading || !termsAccepted || password !== confirmPassword"
          >
            {{ isLoading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <div class="login-link">
          Already have an account?
          <router-link to="/login">Login here</router-link>
        </div>
      </div>
    </div>
  </template>

  <script>
  export default {
    name: 'RegisterView',
    data() {
      return {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        termsAccepted: false,
        error: null,
        isLoading: false,
        apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:5000'
      }
    },
    methods: {
      async handleRegister() {

        if (this.password !== this.confirmPassword) {
          this.error = 'Passwords do not match';
          return;
        }


        if (this.password.length < 8) {
          this.error = 'Password must be at least 8 characters long';
          return;
        }

        this.isLoading = true;
        this.error = null;

        try {
          const response = await fetch(`${this.apiBaseUrl}/api/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: this.name,
              email: this.email,
              password: this.password
            })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to register');
          }


          this.$router.push({
            path: '/login',
            query: { registered: 'success' }
          });

        } catch (error) {
          this.error = error.message;
          console.error('Registration error:', error);
        } finally {
          this.isLoading = false;
        }
      },

      showTerms() {

        alert('Terms of Service will be implemented soon.');
      },

      showPrivacyPolicy() {

        alert('Privacy Policy will be implemented soon.');
      }
    }
  }
  </script>

  <style scoped>
  .register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f7fa;
    padding: 20px;
  }

  .register-card {
    width: 100%;
    max-width: 500px;
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

  .register-form {
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

  input[type="text"],
  input[type="email"],
  input[type="password"] {
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

  .password-requirements {
    color: #777;
    font-size: 12px;
    margin-top: 4px;
  }

  .terms-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 8px;
  }

  .terms-checkbox input[type="checkbox"] {
    margin-top: 3px;
  }

  .terms-checkbox label {
    font-size: 14px;
    color: #666;
  }

  .terms-checkbox a {
    color: #4a82ed;
    text-decoration: none;
  }

  .terms-checkbox a:hover {
    text-decoration: underline;
  }

  .register-button {
    margin-top: 16px;
    padding: 12px;
    border: none;
    border-radius: 4px;
    background-color: #4a82ed;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .register-button:hover {
    background-color: #3461c0;
  }

  .register-button:disabled {
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

  .login-link {
    margin-top: 24px;
    text-align: center;
    font-size: 14px;
    color: #666;
  }

  .login-link a {
    color: #4a82ed;
    text-decoration: none;
    font-weight: 500;
  }

  .login-link a:hover {
    text-decoration: underline;
  }
  </style>
