<template>
    <div class="diagnosis-container">
      <h3>Diagnosis & Treatment</h3>

      <!-- <div class="diagnosis-content"> -->
        <div v-if="isProcessing" class="processing">Updating diagnosis...</div>

        <div v-if="diagnosisResult" class="results">
          <div class="section">
            <h4>Diagnosis</h4>
            <div class="result-text" v-html="formattedDiagnosis"></div>
          </div>

          <div class="section">
            <h4>Clinical Measures</h4>
            <div class="result-text" v-html="formattedMeasures"></div>
          </div>
        </div>

        <div v-else-if="!diagnosisResult && !isProcessing" class="placeholder">
          Waiting for SOAP notes to generate diagnosis...
        </div>

    </div>
  </template>

  <script>
  export default {
    name: 'DifferentialDiagnosis',
    props: {
      soapData: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        diagnosisResult: null,
        isProcessing: false,
        debounceTimer: null,
        lastProcessedSoap: null
      };
    },
    computed: {
      formattedDiagnosis() {
        if (!this.diagnosisResult || !this.diagnosisResult.diagnosis) return '';
        return this.diagnosisResult.diagnosis.replace(/\n/g, '<br>');
      },
      formattedMeasures() {
        if (!this.diagnosisResult || !this.diagnosisResult.measures) return '';
        return this.diagnosisResult.measures.replace(/\n/g, '<br>');
      },
      hasMeaningfulData() {
        return this.soapData.subjective?.chiefComplaint ||
               this.soapData.assessment ||
               (this.soapData.subjective?.hpi && this.soapData.subjective.hpi.length > 0);
      }
    },
    watch: {
      soapData: {
        deep: true,
        handler() {
          if (this.hasMeaningfulData && this.hasDataChanged(this.soapData)) {
            clearTimeout(this.debounceTimer);
            this.isProcessing = true;

            this.debounceTimer = setTimeout(() => {
              this.generateDiagnosis();
            }, 5000);
          }
        }
      }
    },
    methods: {
      hasDataChanged(newData) {
        // Check if relevant data has changed from last processed data
        if (!this.lastProcessedSoap) return true;

        // Simple deep comparison of relevant fields
        return JSON.stringify(this.extractRelevantData(newData)) !==
               JSON.stringify(this.extractRelevantData(this.lastProcessedSoap));
      },

      extractRelevantData(data) {
        // Extract only the fields we care about for diagnosis
        return {
          chiefComplaint: data.subjective?.chiefComplaint,
          hpi: data.subjective?.hpi,
          physicalExam: data.objective?.physicalExam,
          assessment: data.assessment,
          differentialDiagnosis: data.differentialDiagnosis
        };
      },

      async generateDiagnosis() {
        if (!this.hasMeaningfulData) {
          this.isProcessing = false;
          return;
        }

        try {
          const soapText = this.formatSoapData();

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
                  content: 'You are a clinical diagnosis assistant. Based on the provided SOAP notes, provide exactly two possible diagnoses and exactly two recommended clinical measures. Do not use markdown formatting, asterisks, or hashtags. Keep your response concise and to the point.'
                },
                {
                  role: 'user',
                  content: `Based on these SOAP notes, provide exactly two potential diagnoses with brief reasoning and exactly two specific clinical measures to be taken:\n\n${soapText}`
                }
              ],
              temperature: 0.3,
              max_tokens: 800
            })
          });

          // Check if we hit rate limits
          if (response.status === 429) {
            console.warn('Rate limit exceeded for Mistral API. Try again later.');
            this.isProcessing = false;
            return;
          }

          const result = await response.json();

          if (result.choices && result.choices[0] && result.choices[0].message) {
            this.processApiResponse(result.choices[0].message.content);
            this.lastProcessedSoap = JSON.parse(JSON.stringify(this.soapData));
          } else {
            console.error('Unexpected API response format:', result);
          }
        } catch (error) {
          console.error('Error generating diagnosis:', error);
        } finally {
          this.isProcessing = false;
        }
      },

      formatSoapData() {
        const s = this.soapData;
        let text = '';

        // Subjective
        if (s.subjective.chiefComplaint) {
          text += `Chief Complaint: ${s.subjective.chiefComplaint}\n`;
        }

        if (s.subjective.hpi && s.subjective.hpi.length) {
          text += 'History of Present Illness:\n';
          s.subjective.hpi.forEach(item => text += `- ${item}\n`);
        }

        if (s.subjective.pmh) {
          text += `Past Medical History: ${s.subjective.pmh}\n`;
        }

        // Objective
        if (Object.keys(s.objective.vitalSigns || {}).length > 0) {
          text += 'Vital Signs:\n';
          Object.entries(s.objective.vitalSigns).forEach(([name, value]) => {
            if (value) text += `- ${name}: ${value}\n`;
          });
        }

        if (s.objective.physicalExam && s.objective.physicalExam.length) {
          text += 'Physical Examination:\n';
          s.objective.physicalExam.forEach(item => text += `- ${item}\n`);
        }

        // Assessment
        if (s.assessment) {
          text += `\nAssessment: ${s.assessment}\n`;
        }

        if (s.differentialDiagnosis && s.differentialDiagnosis.length) {
          text += 'Differential Diagnosis:\n';
          s.differentialDiagnosis.forEach(dx => text += `- ${dx}\n`);
        }

        return text;
      },

      processApiResponse(content) {
        // Remove any markdown formatting
        let cleanContent = content
          .replace(/[#*]/g, '') // Remove hashtags and asterisks
          .replace(/\n+/g, '\n') // Replace multiple newlines with single newlines
          .trim();

        // Extract diagnosis and measures from API response
        let diagnosisPart = '';
        let measuresPart = '';

        // Look for standard section headers
        const diagnosisMatch = cleanContent.match(/(?:Diagnosis:|Differential Diagnosis:|Potential Diagnoses:)([\s\S]*?)(?=Clinical Measures:|Next Steps:|Plan:|$)/i);
        const measuresMatch = cleanContent.match(/(?:Clinical Measures:|Next Steps:|Plan:)([\s\S]*?)$/i);

        if (diagnosisMatch && measuresMatch) {
          diagnosisPart = diagnosisMatch[1].trim();
          measuresPart = measuresMatch[1].trim();
        } else {
          // If we can't find clear sections, split the content in half
          const contentLines = cleanContent.split('\n');
          const midPoint = Math.floor(contentLines.length / 2);

          // First half is diagnosis, second half is measures
          diagnosisPart = contentLines.slice(0, midPoint).join('\n').trim();
          measuresPart = contentLines.slice(midPoint).join('\n').trim();
        }

        // Clean up any remaining numbered lists to make them cleaner
        diagnosisPart = diagnosisPart.replace(/^\d+\.\s*/gm, '• ');
        measuresPart = measuresPart.replace(/^\d+\.\s*/gm, '• ');

        this.diagnosisResult = {
          diagnosis: diagnosisPart,
          measures: measuresPart
        };
      }
    }
  };
  </script>

  <style scoped>
  .diagnosis-container {
    background-color: #f9f9f9;
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

  .diagnosis-content {
    padding: 20px;
    text-align: center;
    color: #666;
    font-style: italic;
  }

  .section {
    margin-bottom: 15px;
  }

  h4 {
    margin: 10px 0 5px 0;
    color: #2c3e50;
    font-size: 1.1rem;
  }

  .result-text {
    margin: 5px 0;
    padding-left: 10px;
    border-left: 2px solid #0066cc;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .placeholder {
    padding: 20px;
    text-align: center;
    color: #666;
    font-style: italic;
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
