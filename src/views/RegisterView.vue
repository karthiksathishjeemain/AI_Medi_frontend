<template>
  <div class="register-container">
    <div class="register-card">
      <h2 class="title">Create an Account</h2>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Step 1: Registration Form -->
      <form v-if="!verificationMode" @submit.prevent="handleRegister" class="register-form">
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
          <div class="password-input-container">
            <input
              type="password"
              id="password"
              v-model="password"
              placeholder="Create a password"
              required
              :class="{'input-error': password && !isPasswordValid}"
            />
            <span
              v-if="password"
              class="password-indicator"
              @click="showPasswordRequirements = !showPasswordRequirements"
            >
              <span v-if="!isPasswordValid" class="exclamation-icon">!</span>
              <span v-else class="check-icon">✓</span>
            </span>
          </div>
          <div v-if="showPasswordRequirements" class="password-requirements-list">
            <p>Password must contain:</p>
            <ul>
              <li :class="{ 'requirement-met': hasMinLength }">At least 8 characters</li>
              <li :class="{ 'requirement-met': hasUpperCase }">At least one uppercase letter</li>
              <li :class="{ 'requirement-met': hasLowerCase }">At least one lowercase letter</li>
              <li :class="{ 'requirement-met': hasNumber }">At least one number</li>
              <li :class="{ 'requirement-met': hasSpecialChar }">At least one special character</li>
            </ul>
          </div>
          <div class="password-strength-meter" v-if="password">
            <div class="strength-bar" :style="{ width: passwordStrengthPercentage + '%', backgroundColor: passwordStrengthColor }"></div>
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
            :class="{'input-error': confirmPassword && password !== confirmPassword}"
          />
          <div v-if="confirmPassword && password !== confirmPassword" class="password-mismatch">
            Passwords do not match
          </div>
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
          :disabled="isLoading || !termsAccepted || password !== confirmPassword || !isPasswordValid"
        >
          {{ isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <!-- Step 2: Verification Code Form -->
      <form v-if="verificationMode" @submit.prevent="handleVerification" class="register-form">
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
          class="register-button"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Verifying...' : 'Complete Registration' }}
        </button>

        <div class="resend-code">
          Didn't receive a code?
          <a href="#" @click.prevent="resendCode">Resend code</a>
        </div>
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
      verificationCode: '',
      verificationId: '',
      verificationMode: false,
      termsAccepted: false,
      error: null,
      isLoading: false,
      apiBaseUrl: "https://ai-medi-backend.vercel.app",
      // apiBaseUrl: "http://localhost:5000",
      showPasswordRequirements: false
    }
  },
  computed: {
    hasMinLength() {
      return this.password.length >= 8;
    },
    hasUpperCase() {
      return /[A-Z]/.test(this.password);
    },
    hasLowerCase() {
      return /[a-z]/.test(this.password);
    },
    hasNumber() {
      return /[0-9]/.test(this.password);
    },
    hasSpecialChar() {
      return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(this.password);
    },
    isPasswordValid() {
      return this.hasMinLength &&
             this.hasUpperCase &&
             this.hasLowerCase &&
             this.hasNumber &&
             this.hasSpecialChar;
    },
    passwordStrengthScore() {
      let score = 0;
      if (this.hasMinLength) score++;
      if (this.hasUpperCase) score++;
      if (this.hasLowerCase) score++;
      if (this.hasNumber) score++;
      if (this.hasSpecialChar) score++;
      return score;
    },
    passwordStrengthPercentage() {
      return (this.passwordStrengthScore / 5) * 100;
    },
    passwordStrengthColor() {
      if (this.passwordStrengthScore <= 2) return '#ff4d4d'; // Red
      if (this.passwordStrengthScore <= 3) return '#ffa64d'; // Orange
      if (this.passwordStrengthScore <= 4) return '#ffff4d'; // Yellow
      return '#4CAF50'; // Green
    }
  },
  methods: {
    async handleRegister() {
      if (this.password !== this.confirmPassword) {
        this.error = 'Passwords do not match';
        return;
      }

      if (!this.isPasswordValid) {
        this.error = 'Password does not meet the security requirements';
        this.showPasswordRequirements = true;
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

        // Store verification ID for the next step
        this.verificationId = data.verification_id;

        // Switch to verification mode
        this.verificationMode = true;

      } catch (error) {
        this.error = error.message;
        console.error('Registration error:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async handleVerification() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${this.apiBaseUrl}/api/verify-registration`, {
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

        // Registration successful - redirect to login page
        this.$router.push({
          path: '/login',
          query: { registered: 'success' }
        });

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
            type: 'registration'
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

.input-error {
  border-color: #ff4d4d !important;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-container input {
  width: 100%;
}

.password-indicator {
  position: absolute;
  right: 12px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.exclamation-icon {
  color: #ff4d4d;
  font-weight: bold;
  font-size: 16px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ffe6e6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  color: #4CAF50;
  font-weight: bold;
  font-size: 16px;
}

.password-requirements {
  color: #777;
  font-size: 12px;
  margin-top: 4px;
}

.password-requirements-list {
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px 15px;
  margin-top: 8px;
  font-size: 13px;
}

.password-requirements-list p {
  margin: 0 0 5px 0;
  color: #555;
  font-weight: 500;
}

.password-requirements-list ul {
  margin: 0;
  padding-left: 20px;
}

.password-requirements-list li {
  margin-bottom: 3px;
  color: #777;
}

.requirement-met {
  color: #4CAF50 !important;
}

.password-strength-meter {
  height: 4px;
  background-color: #eee;
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  transition: width 0.3s, background-color 0.3s;
}

.password-mismatch {
  color: #ff4d4d;
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
