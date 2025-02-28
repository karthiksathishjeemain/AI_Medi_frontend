<template>
  <div class="save-session-container">
    <button
      @click="saveSession"
      class="save-button"
      :disabled="isSaving || !hasContent"
    >
      <span v-if="!isSaving">Save Session</span>
      <span v-else>Saving...</span>
    </button>


    <div v-if="showSuccessToast" class="toast success-toast">
      Session saved successfully!
    </div>


    <div v-if="showErrorToast" class="toast error-toast">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'SaveSession',
  props: {
    transcription: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isSaving: false,
      showSuccessToast: false,
      showErrorToast: false,
      errorMessage: '',
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:5000'
    };
  },
  computed: {
    patientId() {
      const patientData = localStorage.getItem('currentPatient');
      if (patientData) {
        try {
          const patient = JSON.parse(patientData);
          return patient.id;
        } catch (e) {
          console.error('Error parsing patient data:', e);
          return null;
        }
      }
      return null;
    },
    hasContent() {
      return this.transcription && this.transcription.trim().length > 0;
    }
  },
  methods: {
    async saveSession() {
      if (!this.hasContent) {
        this.showError('No transcription content to save');
        return;
      }

      if (!this.patientId) {
        this.showError('No patient selected');
        return;
      }

      this.isSaving = true;

      try {
        const summary = await this.generateSummary(this.transcription);

        // Remove any markdown formatting (asterisks) from the summary
        const cleanSummary = this.removeMarkdownFormatting(summary);

        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }

        const response = await fetch(`${this.apiBaseUrl}/api/patients/${this.patientId}/session-note`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            note: cleanSummary
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to save session');
        }

        this.showSuccess();

        this.$emit('session-saved', {
          sessionId: data.session_id
        });
      } catch (error) {
        this.showError(error.message || 'Error saving session');
      } finally {
        this.isSaving = false;
      }
    },

    removeMarkdownFormatting(text) {
      if (!text) return '';

      // Remove bold/italic markdown (single and double asterisks)
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold (**text**)
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic (*text*)
        .replace(/__(.*?)__/g, '$1')     // Remove bold with underscores
        .replace(/_(.*?)_/g, '$1');      // Remove italic with underscores
    },

    async generateSummary(text) {
      try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer SnKZ9Dryc0oeA9twr35jgtrhxgM1zoRm`
          },
          body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: [
              {
                role: 'system',
                content: 'Generate a concise 3-line summary of the medical conversation provided. Focus on key medical findings, complaints, and plan. Keep the summary professional and medical in tone. DO NOT use any markdown formatting like asterisks or underscores.'
              },
              {
                role: 'user',
                content: `Create a 3-line summary of this medical conversation without any markdown:\n\n${text}`
              }
            ],
            temperature: 0.3,
            max_tokens: 200
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate summary');
        }

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
          return data.choices[0].message.content;
        } else {
          return "Failed to generate summary. Saving full transcription.";
        }
      } catch (error) {
        console.error('Error generating summary:', error);
        return "Error generating summary. Saving session with raw transcription.";
      }
    },

    showSuccess() {
      this.showSuccessToast = true;
      setTimeout(() => {
        this.showSuccessToast = false;
      }, 3000);
    },

    showError(message) {
      this.errorMessage = message;
      this.showErrorToast = true;
      setTimeout(() => {
        this.showErrorToast = false;
      }, 5000);
    }
  }
};
</script>

<style scoped>
.save-session-container {
  margin-top: 15px;
}

.save-button {
  background-color: #4a82ed;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.save-button:hover:not(:disabled) {
  background-color: #3461c0;
}

.save-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 4px;
  font-weight: bold;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  animation: fadeInOut 4s forwards;
}

.success-toast {
  background-color: #4caf50;
  color: white;
}

.error-toast {
  background-color: #f44336;
  color: white;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
