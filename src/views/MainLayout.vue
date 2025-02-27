<template>
  <div class="app-container">
    <header>
      <div class="header-content">
        <div class="patient-info-container" v-if="currentPatient">
          <div class="patient-info">
            <h3>Patient: {{ currentPatient.name }}</h3>
            <div class="patient-details">
              <span class="detail-item">Age: {{ currentPatient.age }}</span>
              <span v-if="currentPatient.gender" class="detail-item">Gender: {{ formatGender(currentPatient.gender) }}</span>
            </div>
          </div>
          
          <button class="add-patient-button" @click="addNewPatient" title="Add new patient">
            <span class="plus-icon">+</span>
          </button>
        </div>
        <h2>Medical Transcription & Analysis</h2>
      </div>
    </header>
    <div class="content-container">
     
      <div class="column recorder-container">
        <AudioRecorder @transcription-update="updateTranscription" />
        <SaveSession :transcription="currentTranscription" @session-saved="handleSessionSaved" />
      </div>
      <div class="column soap-container">
        <SOAP 
          :transcription="currentTranscription" 
          @soap-update="updateSoapData"
        />
      </div>
      <div class="column diagnosis-container">
        <Diagnosis :soapData="currentSoapData" />
      </div>
    </div>
  </div>
</template>

<script>
import AudioRecorder from '../components/AudioRecorder.vue';
import SOAP from '../components/SOAP.vue';
import Diagnosis from '../components/Diagnosis.vue';
import SaveSession from './SaveSession.vue';


export default {
  components: {
    AudioRecorder,
    SOAP,
    Diagnosis,
    SaveSession
  },
  data() {
    return {
      currentTranscription: '',
      currentPatient: null,
      currentSoapData: {
        subjective: {
          chiefComplaint: '',
          hpi: [],
          pmh: '',
          socialHistory: [],
          ros: {}
        },
        objective: {
          vitalSigns: {},
          physicalExam: [],
          diagnosticTests: []
        },
        assessment: '',
        differentialDiagnosis: [],
        plan: []
      }
    };
  },
  created() {
   
    this.loadPatientData();
  },
  methods: {
    loadPatientData() {
      const patientData = localStorage.getItem('currentPatient');
      if (patientData) {
        try {
          this.currentPatient = JSON.parse(patientData);
        } catch (e) {
          console.error('Error parsing patient data:', e);
          this.$router.push('/dashboard');
        }
      } else {
        
        this.$router.push('/dashboard');
      }
    },
    addNewPatient() {
      
      localStorage.removeItem('currentPatient');
      
      
      this.$router.push('/dashboard');
    },
    updateTranscription(text) {
      this.currentTranscription = text;
    },
    updateSoapData(soapData) {
      this.currentSoapData = soapData;
    },
    formatGender(gender) {
      
      if (gender === 'prefer-not-to-say') {
        return 'Prefer not to say';
      }
    
      
    
      return gender.charAt(0).toUpperCase() + gender.slice(1);
    },
    handleSessionSaved(data) {
      console.log('Session saved with ID:', data.sessionId);
      
    }

  }
};
</script>

<style scoped>
.app-container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 15px;
}

header {
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.patient-info-container {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 10px;
}

.patient-info {
  background-color: #f5f9ff;
  border-left: 4px solid #4a82ed;
  padding: 10px 15px;
  border-radius: 0 4px 4px 0;
  flex-grow: 1;
}

.add-patient-button {
  margin-left: 10px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: #4a82ed;
  color: white;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.add-patient-button:hover {
  background-color: #3461c0;
  transform: scale(1.05);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.plus-icon {
  font-size: 22px;
  font-weight: bold;
  line-height: 1;
}

.patient-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.patient-details {
  display: flex;
  gap: 15px;
  margin-top: 4px;
  font-size: 0.9rem;
  color: #5a6c7d;
}

.detail-item {
  display: inline-block;
}

header h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.6rem;
  text-align: center;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.column {
  flex: 1;
  min-width: 0; 
}


@media (min-width: 992px) {
  .content-container {
    flex-direction: row;
  }
  
  .column {
    width: calc(33.33% - 14px);
  }
  
  .header-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .patient-info-container {
    margin-bottom: 0;
  }
  
  header h2 {
    text-align: right;
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .content-container {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .column {
    width: calc(50% - 10px);
  }
  
  .diagnosis-container {
    width: 100%;
    margin-top: 20px;
  }
}

@media (max-width: 767px) {
  .app-container {
    padding: 10px;
  }
  
  .patient-info {
    width: 100%;
  }
}
</style>