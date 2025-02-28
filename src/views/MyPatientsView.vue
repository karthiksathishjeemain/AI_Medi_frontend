<template>
  <div class="patients-container">
    <div class="patients-header">
      <h1>My Patients</h1>
      <div class="header-actions">
        <div class="search-container">
          <input
            type="text"
            class="search-input"
            placeholder="Search patients by name..."
            v-model="searchQuery"
            @input="filterPatients"
          >
          <span class="search-icon">🔍</span>
        </div>
        <button class="add-patient-btn" @click="addNewPatient">
          <span class="plus-icon">+</span>
          New Patient
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading patients...</p>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="patients.length === 0" class="no-patients">
      <div class="empty-state">
        <div class="empty-icon">👤</div>
        <h3>No patients yet</h3>
        <p>Add your first patient to get started</p>
        <button class="add-first-patient" @click="addNewPatient">Add Patient</button>
      </div>
    </div>

    <div v-else-if="filteredPatients.length === 0 && searchQuery" class="no-search-results">
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No matches found</h3>
        <p>No patients match the search "{{ searchQuery }}"</p>
        <button class="clear-search-btn" @click="clearSearch">Clear Search</button>
      </div>
    </div>

    <div v-else class="patients-grid">
      <div
        v-for="patient in filteredPatients"
        :key="patient.id"
        class="patient-card"
      >
        <div class="patient-info">
          <h3 class="patient-name">{{ patient.name }}</h3>
          <div class="patient-meta">
            <span class="patient-age">{{ patient.age }} years</span>
            <span v-if="patient.gender" class="patient-gender">· {{ formatGender(patient.gender) }}</span>
          </div>
          <div class="patient-timestamp">
            Added: {{ formatDate(patient.created_at) }}
          </div>
        </div>
        <div class="patient-actions">
          <button class="history-btn" @click="viewPatientHistory(patient.id)">
            History
          </button>
          <button class="continue-btn" @click="continueWithPatient(patient)">
            Continue
          </button>
        </div>
      </div>
    </div>


    <PatientHistoryModal
      :show="showHistoryModal"
      :patientId="selectedPatientId"
      @close="closeHistoryModal"
    />
  </div>
</template>

<script>
import PatientHistoryModal from './PatientsHistoryModal.vue';

export default {
  name: 'MyPatientsView',
  components: {
    PatientHistoryModal
  },
  data() {
    return {
      patients: [],
      filteredPatients: [],
      searchQuery: '',
      isLoading: true,
      error: null,
      showHistoryModal: false,
      selectedPatientId: null,
      apiBaseUrl:"https://ai-medi-backend.vercel.app"
    }
  },
  created() {
    this.fetchPatients();
  },
  methods: {
    async fetchPatients() {
      this.isLoading = true;
      this.error = null;

      try {
        const token = localStorage.getItem('authToken');

        if (!token) {
          this.$router.push('/login');
          return;
        }

        const response = await fetch(`${this.apiBaseUrl}/api/patients`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }

        const data = await response.json();
        this.patients = data.patients;


        this.patients.sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });


        this.filteredPatients = [...this.patients];

      } catch (error) {
        this.error = error.message || 'Failed to load patients';
        console.error('Error fetching patients:', error);
      } finally {
        this.isLoading = false;
      }
    },

    viewPatientHistory(patientId) {
      this.selectedPatientId = patientId;
      this.showHistoryModal = true;
    },

    closeHistoryModal() {
      this.showHistoryModal = false;
    },

    addNewPatient() {
      this.$router.push('/dashboard');
    },

    continueWithPatient(patient) {

      localStorage.setItem('currentPatient', JSON.stringify(patient));
      this.$router.push('/analysis');
    },

    formatDate(dateString) {
      if (!dateString) return 'Unknown';

      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    formatGender(gender) {
      if (gender === 'prefer-not-to-say') {
        return 'Prefer not to say';
      }

      return gender.charAt(0).toUpperCase() + gender.slice(1);
    },

    filterPatients() {
      if (!this.searchQuery) {
        this.filteredPatients = [...this.patients];
        return;
      }

      const query = this.searchQuery.toLowerCase().trim();
      this.filteredPatients = this.patients.filter(patient =>
        patient.name.toLowerCase().includes(query)
      );
    },

    clearSearch() {
      this.searchQuery = '';
      this.filteredPatients = [...this.patients];
    }
  }
}
</script>

<style scoped>
.patients-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 30px 40px;
}

.patients-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.patients-header h1 {
  font-size: 28px;
  color: #2c3e50;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
  width: 300px;
}

.search-input {
  width: 100%;
  padding: 10px 15px 10px 40px;
  border: 1px solid #dfe4ea;
  border-radius: 6px;
  font-size: 15px;
  color: #2c3e50;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4a82ed;
  box-shadow: 0 0 0 2px rgba(74, 130, 237, 0.2);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8795a1;
  font-size: 16px;
}

.clear-search-btn {
  padding: 10px 20px;
  background-color: #f0f2f5;
  color: #2c3e50;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background-color: #e1e5eb;
}

.add-patient-btn {
  padding: 10px 18px;
  background-color: #4a82ed;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-patient-btn:hover {
  background-color: #3461c0;
}

.plus-icon {
  font-weight: bold;
  font-size: 18px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4a82ed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
}

.no-patients, .no-search-results {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.empty-state {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  margin-bottom: 8px;
  color: #333;
}

.empty-state p {
  color: #666;
  margin-bottom: 24px;
}

.add-first-patient {
  padding: 12px 24px;
  background-color: #4a82ed;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-first-patient:hover {
  background-color: #3461c0;
}

.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  width: 100%;
}

.patient-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  min-height: 180px;
}

.patient-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}

.patient-info {
  padding: 20px;
  flex-grow: 1;
}

.patient-name {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #2c3e50;
  font-weight: 600;
}

.patient-meta {
  font-size: 15px;
  color: #5a6c7d;
  margin-bottom: 10px;
}

.patient-timestamp {
  font-size: 14px;
  color: #8795a1;
}

.patient-actions {
  display: flex;
  padding: 15px;
  border-top: 1px solid #f0f0f0;
  gap: 10px;
}

.history-btn {
  padding: 8px 16px;
  background-color: #4a82ed;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-btn:hover {
  background-color: #3461c0;
}

.continue-btn {
  padding: 8px 16px;
  background-color: #f8fafc;
  border: 1px solid #dfe4ea;
  color: #2c3e50;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.2s ease;
}

.continue-btn:hover {
  background-color: #f1f5f9;
}


@media (min-width: 1600px) {
  .patients-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .patients-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 900px) and (max-width: 1199px) {
  .patients-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 600px) and (max-width: 899px) {
  .patients-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .patients-container {
    padding: 20px 15px;
  }

  .patients-grid {
    grid-template-columns: 1fr;
  }

  .patients-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
    gap: 15px;
  }

  .search-container {
    width: 100%;
  }

  .add-patient-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
