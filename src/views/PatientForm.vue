<template>
  <div class="patient-form-container">
    <div class="patient-form-card">
      <h2 class="title">Enter Patient Details</h2>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" class="patient-form">
        <div class="form-group">
          <label for="name">Patient Name*</label>
          <input
            type="text"
            id="name"
            v-model="patient.name"
            placeholder="Enter patient's full name"
            required
          />
        </div>

        <div class="form-group">
          <label for="age">Age*</label>
          <input
            type="number"
            id="age"
            v-model="patient.age"
            placeholder="Enter patient's age"
            min="0"
            max="120"
            required
          />
        </div>

        <div class="form-group">
          <label for="gender">Gender</label>
          <select id="gender" v-model="patient.gender">
            <option value="">-- Select Gender --</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="submit-button"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Saving...' : 'Begin Analysis' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { createAuditLog } from 'src/auditLog';
export default {
  name: 'PatientForm',
  data() {
    return {
      patient: {
        name: '',
        age: '',
        gender: '',

      },
       apiBaseUrl: "https://ai-medi-backend.vercel.app",
      error: null,
      isLoading: false
    }
  },
  methods: {
    async handleSubmit() {
      this.isLoading = true;
      this.error = null;

      if (!this.patient.name.trim()) {
        this.error = 'Patient name is required';
        this.isLoading = false;
        return;
      }

      if (!this.patient.age || this.patient.age < 0) {
        this.error = 'Please enter a valid age';
        this.isLoading = false;
        return;
      }

      try {
        const token = localStorage.getItem('authToken');

        if (!token) {
          this.error = 'You must be logged in to add patients';
          this.isLoading = false;
          return;
        }


        const patientData = {
          ...this.patient,
          age: parseInt(this.patient.age, 10)
        };

        const response = await fetch(`${this.apiBaseUrl}/api/patients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(patientData)
        });

        if (token && response.ok) {
          await createAuditLog('patient_create',token,`Patient ${patientData.name} created`);
        }
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to add patient');
        }


        localStorage.setItem('currentPatient', JSON.stringify({
          id: data.patient_id,
          ...patientData
        }));


        this.$router.push('/analysis');

      } catch (error) {
        this.error = error.message;
        console.error('Error adding patient:', error);
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
.patient-form-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  min-height: calc(100vh - 100px);
}

.patient-form-card {
  width: 100%;
  max-width: 450px;
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

.patient-form {
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

input, select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

input:focus, select:focus {
  outline: none;
  border-color: #4a82ed;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.submit-button {
  padding: 12px 20px;
  width: 100%;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #4a82ed;
  color: white;
}

.submit-button:hover {
  background-color: #3461c0;
}

.submit-button:disabled {
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
</style>
