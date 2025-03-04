<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="title">Login to CeraMD AI</h2>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Step 1: Credentials Form -->
      <form v-if="!verificationMode" @submit.prevent="handleLogin" class="login-form">
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
          {{ isLoading ? 'Verifying...' : 'Continue' }}
        </button>
      </form>

      <!-- Step 2: Verification Code Form -->
      <form v-if="verificationMode" @submit.prevent="handleVerification" class="login-form">
        <div class="verification-message">
          A verification code has been sent to your email.
        </div>

        <div class="form-group">
          <label for="verificationCode">Verification Code</label>
          <input
            type="text"
            id="verificationCode"
            v-model="verificationCode"
            placeholder="Enter the 6-digit code"
            required
            pattern="[0-9]{6}"
            maxlength="6"
          />
        </div>

        <button
          type="submit"
          class="login-button"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Verifying...' : 'Login' }}
        </button>

        <div class="resend-code">
          Didn't receive a code?
          <a href="#" @click.prevent="resendCode">Resend code</a>
        </div>
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
import { createAuditLog } from 'src/auditLog';
export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      verificationCode: '',
      verificationId: '',
      verificationMode: false,
      error: null,
      isLoading: false,
      apiBaseUrl: "https://ai-medi-backend.vercel.app"
      // apiBaseUrl: "http://localhost:5000"
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

        // Store the verification ID for the next step
        this.verificationId = data.verification_id;
        // Switch to verification mode
        this.verificationMode = true;

      } catch (error) {
        this.error = error.message;
        console.error('Login error:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async handleVerification() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${this.apiBaseUrl}/api/verify-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            verification_id: this.verificationId,
            totp: this.verificationCode
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Invalid verification code');
        }

        // Complete the login process
        authService.login(data.user, data.token);
        await createAuditLog('login', data.token,'User logged in');
        const redirectPath = this.$route.query.redirect || '/dashboard';
        this.$router.push(redirectPath);

      } catch (error) {
        this.error = error.message;
        console.error('Verification error:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async resendCode() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${this.apiBaseUrl}/api/resend-totp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            verification_id: this.verificationId,
            type: 'login'
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to resend code');
        }

        // Show success message
        this.error = null;
        alert('A new verification code has been sent to your email.');

      } catch (error) {
        this.error = error.message;
        console.error('Resend code error:', error);
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

.verification-message {
  background-color: #e8f4fd;
  color: #0277bd;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: center;
}

.resend-code {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.resend-code a {
  color: #4a82ed;
  text-decoration: none;
  font-weight: 500;
}

.resend-code a:hover {
  text-decoration: underline;
}
</style>
