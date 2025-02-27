<template>
    <div class="soap-container">
      <h3>SOAP Notes</h3>

      <div v-if="transcription.trim().length === 0" class="empty-message">
        Notes will appear when conversation begins.
      </div>

      <div v-else class="soap-content">
        <div v-if="isProcessing" class="processing">Processing conversation...</div>

        <!-- Subjective -->
        <div class="soap-section">
          <h4>Subjective</h4>
          <p v-if="soapData.subjective.chiefComplaint">
            <strong>Chief Complaint:</strong> {{ soapData.subjective.chiefComplaint }}
          </p>
          <p v-if="soapData.subjective.hpi && soapData.subjective.hpi.length > 0">
            <strong>HPI:</strong> {{ soapData.subjective.hpi.join('. ') }}
          </p>
          <p v-if="soapData.subjective.pmh">
            <strong>PMH:</strong> {{ soapData.subjective.pmh }}
          </p>
        </div>

        <!-- Objective -->
        <div class="soap-section">
          <h4>Objective</h4>
          <p v-if="hasVitalSigns">
            <strong>Vitals:</strong> {{ formatVitals() }}
          </p>
          <p v-if="soapData.objective.physicalExam && soapData.objective.physicalExam.length > 0">
            <strong>Exam:</strong> {{ soapData.objective.physicalExam.join('. ') }}
          </p>
        </div>

        <!-- Assessment -->
        <div class="soap-section">
          <h4>Assessment</h4>
          <p>{{ soapData.assessment || "Pending assessment" }}</p>
          <p v-if="soapData.differentialDiagnosis && soapData.differentialDiagnosis.length > 0">
            <strong>Differential:</strong> {{ soapData.differentialDiagnosis.join(', ') }}
          </p>
        </div>

        <!-- Plan -->
        <div class="soap-section">
          <h4>Plan</h4>
          <p v-if="soapData.plan && soapData.plan.length > 0">
            {{ soapData.plan.join('. ') }}
          </p>
          <p v-else>Pending plan</p>
        </div>
      </div>
    </div>
  </template>

  <script>
  export default {
    name: 'SOAP',
    props: {
      transcription: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        soapData: {
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
        },
        isProcessing: false,
        debounceTimer: null,
        lastProcessedText: ''
      };
    },
    computed: {
      hasVitalSigns() {
        return this.soapData.objective.vitalSigns &&
               Object.values(this.soapData.objective.vitalSigns).some(v => v);
      }
    },
    watch: {
      transcription(newVal) {
        if (newVal && newVal !== this.lastProcessedText) {
          clearTimeout(this.debounceTimer);
          this.isProcessing = true;

          this.debounceTimer = setTimeout(() => {
            this.processTranscription(newVal);
          }, 2000);
        }
      },
      soapData: {
        deep: true,
        handler(newVal) {
          // Emit the updated SOAP data to parent for Diagnosis.vue
          this.$emit('soap-update', JSON.parse(JSON.stringify(newVal)));
        }
      }
    },
    methods: {
      formatVitals() {
        const vitals = this.soapData.objective.vitalSigns;
        const parts = [];

        if (vitals.temperature) parts.push(`Temp ${vitals.temperature}`);
        if (vitals.bloodPressure) parts.push(`BP ${vitals.bloodPressure}`);
        if (vitals.heartRate) parts.push(`HR ${vitals.heartRate}`);
        if (vitals.respiratoryRate) parts.push(`RR ${vitals.respiratoryRate}`);
        if (vitals.oxygenSaturation) parts.push(`O2 ${vitals.oxygenSaturation}`);

        return parts.join(', ');
      },

      async processTranscription(text) {
        try {
          const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.VUE_APP_MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
              model: 'mistral-large-latest',
              messages: [
                {
                  role: 'system',
                  content: `Create concise SOAP notes from medical conversations. Format as JSON:
                  {
                    "subjective": {
                      "chiefComplaint": "",
                      "hpi": [],
                      "pmh": ""
                    },
                    "objective": {
                      "vitalSigns": {},
                      "physicalExam": []
                    },
                    "assessment": "",
                    "differentialDiagnosis": [],
                    "plan": []
                  }`
                },
                {
                  role: 'user',
                  content: `Generate SOAP note from this conversation:\n\n${text}`
                }
              ]
            })
          });

          const data = await response.json();

          if (data.choices && data.choices[0] && data.choices[0].message) {
            try {
              const content = data.choices[0].message.content;
              const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                               content.match(/```([\s\S]*?)```/) ||
                               [null, content];
              const jsonStr = jsonMatch[1] || content;

              const newSoapData = JSON.parse(jsonStr);
              this.soapData = {
                subjective: {
                  chiefComplaint: newSoapData.subjective?.chiefComplaint || '',
                  hpi: newSoapData.subjective?.hpi || [],
                  pmh: newSoapData.subjective?.pmh || '',
                  socialHistory: newSoapData.subjective?.socialHistory || [],
                  ros: newSoapData.subjective?.ros || {}
                },
                objective: {
                  vitalSigns: newSoapData.objective?.vitalSigns || {},
                  physicalExam: newSoapData.objective?.physicalExam || [],
                  diagnosticTests: newSoapData.objective?.diagnosticTests || []
                },
                assessment: newSoapData.assessment || '',
                differentialDiagnosis: newSoapData.differentialDiagnosis || [],
                plan: newSoapData.plan || []
              };

              this.lastProcessedText = text;
            } catch (error) {
              console.error('Error parsing SOAP data:', error);
            }
          }
        } catch (error) {
          console.error('Error with Mistral API:', error);
        } finally {
          this.isProcessing = false;
        }
      }
    }
  };
  </script>

  <style scoped>
  .soap-container {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  h3 {
    font-size: 1.3rem;
    margin-top: 0;
    margin-bottom: 12px;
    color: #2c3e50;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }

  .empty-message {
    padding: 20px;
    text-align: center;
    color: #666;
    font-style: italic;
  }

  .soap-section {
    margin-bottom: 15px;
  }

  .soap-section h4 {
    margin: 10px 0 5px 0;
    color: #2c3e50;
    font-size: 1.1rem;
  }

  .soap-section p {
    margin: 5px 0;
    padding-left: 10px;
    border-left: 2px solid #0066cc;
  }

  .processing {
    padding: 8px;
    margin-bottom: 10px;
    background: #e6f7ff;
    border-radius: 4px;
    text-align: center;
    color: #0066cc;
  }
  </style>
