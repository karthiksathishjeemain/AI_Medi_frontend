<template>
    <div class="modal-backdrop" v-if="show" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>Patient History</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading history...</p>
        </div>

        <div v-else-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-else-if="sessionNotes.length === 0" class="no-history">
          <p>No treatment history found for this patient</p>
        </div>

        <div v-else class="modal-content">
          <table class="history-table">
            <thead>
              <tr>
                <th class="column-serial">#</th>
                <th class="column-date">Date</th>
                <th class="column-action">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(session, index) in sessionNotes" :key="session.session_id">
                <td class="column-serial">{{ index + 1 }}</td>
                <td class="column-date">{{ formatDateTime(session.created_at) }}</td>
                <td class="column-action">
                  <div v-if="session.noteLoading" class="note-loading">Loading...</div>
                  <div v-else-if="session.noteError" class="note-error">{{ session.noteError }}</div>
                  <div v-else-if="session.isEditing" class="note-edit">
                    <textarea v-model="session.editText" class="note-textarea"></textarea>
                    <div class="edit-actions">
                      <button class="save-btn" @click="saveNote(session.session_id, index)">Save</button>
                      <button class="cancel-btn" @click="cancelEdit(index)">Cancel</button>
                    </div>
                  </div>
                  <div v-else-if="session.note" class="note-container">
                    <div class="note-content">{{ session.note }}</div>
                    <div class="note-actions">
                      <button class="edit-btn" @click="editNote(index)">Edit</button>
                      <button class="delete-btn" @click="confirmDelete(session.session_id, index)">Delete</button>
                    </div>
                  </div>
                  <button v-else class="view-note-btn" @click="fetchSessionNote(session.session_id, index)">View Note</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </template>

    <script>
    export default {
      name: 'PatientHistoryModal',
      props: {
        show: {
          type: Boolean,
          default: false
        },
        patientId: {
          type: String,
          default: ''
        }
      },
      data() {
        return {
          sessionNotes: [],
          isLoading: false,
          error: null,
          apiBaseUrl: "https://ai-medi-backend.vercel.app"
        };
      },
      watch: {
        show(newVal) {
          if (newVal && this.patientId) {
            this.fetchPatientHistory();
          }
        }
      },
      methods: {
        async fetchPatientHistory() {
          this.isLoading = true;
          this.error = null;

          try {
            const token = localStorage.getItem('authToken');

            if (!token) {
              this.$router.push('/login');
              return;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/patients/${this.patientId}/session-notes`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to fetch patient history');
            }

            const data = await response.json();

            this.sessionNotes = data.session_notes.map(session => ({
              ...session,
              note: null,
              noteLoading: false,
              noteError: null,
              isEditing: false,
              editText: ''
            }));

          } catch (error) {
            this.error = error.message || 'Failed to load patient history';
            console.error('Error fetching patient history:', error);
          } finally {
            this.isLoading = false;
          }
        },

        async fetchSessionNote(sessionId, index) {

          const updatedNotes = [...this.sessionNotes];


          updatedNotes[index] = {
            ...updatedNotes[index],
            noteLoading: true,
            noteError: null
          };


          this.sessionNotes = updatedNotes;

          try {
            const token = localStorage.getItem('authToken');

            if (!token) {
              this.$router.push('/login');
              return;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/session-notes/${sessionId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to fetch session note');
            }

            const sessionData = await response.json();


            const notesWithData = [...this.sessionNotes];
            notesWithData[index] = {
              ...notesWithData[index],
              note: sessionData.note,
              noteLoading: false
            };


            this.sessionNotes = notesWithData;
          } catch (error) {

            const notesWithError = [...this.sessionNotes];
            notesWithError[index] = {
              ...notesWithError[index],
              noteError: error.message || 'Error loading note',
              noteLoading: false
            };

            this.sessionNotes = notesWithError;
            console.error('Error fetching session note:', error);
          }
        },

        editNote(index) {

          const updatedNotes = [...this.sessionNotes];


          updatedNotes[index] = {
            ...updatedNotes[index],
            isEditing: true,
            editText: updatedNotes[index].note
          };


          this.sessionNotes = updatedNotes;
        },

        cancelEdit(index) {

          const updatedNotes = [...this.sessionNotes];


          updatedNotes[index] = {
            ...updatedNotes[index],
            isEditing: false,
            editText: ''
          };


          this.sessionNotes = updatedNotes;
        },

        async saveNote(sessionId, index) {

          const updatedNotes = [...this.sessionNotes];


          updatedNotes[index] = {
            ...updatedNotes[index],
            noteLoading: true,
            isEditing: false
          };


          this.sessionNotes = updatedNotes;

          try {
            const token = localStorage.getItem('authToken');

            if (!token) {
              this.$router.push('/login');
              return;
            }

            const updatedNote = {
              note: this.sessionNotes[index].editText
            };

            const response = await fetch(`${this.apiBaseUrl}/api/session-notes/${sessionId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(updatedNote)
            });

            if (!response.ok) {
              throw new Error('Failed to update session note');
            }


            const notesWithUpdate = [...this.sessionNotes];
            notesWithUpdate[index] = {
              ...notesWithUpdate[index],
              note: notesWithUpdate[index].editText,
              noteLoading: false,
              editText: ''
            };


            this.sessionNotes = notesWithUpdate;
          } catch (error) {

            const notesWithError = [...this.sessionNotes];
            notesWithError[index] = {
              ...notesWithError[index],
              noteError: error.message || 'Error updating note',
              noteLoading: false
            };


            this.sessionNotes = notesWithError;
            console.error('Error updating session note:', error);
          }
        },

        confirmDelete(sessionId, index) {
          if (confirm('Are you sure you want to delete this session note? This action cannot be undone.')) {
            this.deleteNote(sessionId, index);
          }
        },

        async deleteNote(sessionId, index) {

          const updatedNotes = [...this.sessionNotes];


          updatedNotes[index] = {
            ...updatedNotes[index],
            noteLoading: true
          };


          this.sessionNotes = updatedNotes;

          try {
            const token = localStorage.getItem('authToken');

            if (!token) {
              this.$router.push('/login');
              return;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/session-notes/${sessionId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to delete session note');
            }


            const notesAfterDelete = this.sessionNotes.filter((_, i) => i !== index);


            this.sessionNotes = notesAfterDelete;
          } catch (error) {

            const notesWithError = [...this.sessionNotes];
            notesWithError[index] = {
              ...notesWithError[index],
              noteError: error.message || 'Error deleting note',
              noteLoading: false
            };


            this.sessionNotes = notesWithError;
            console.error('Error deleting session note:', error);
          }
        },

        closeModal() {
          this.$emit('close');
        },

        formatDateTime(dateString) {
          if (!dateString) return 'Unknown';

          const date = new Date(dateString);
          return `${date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })} ${date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}`;
        }
      }
    };
    </script>

    <style scoped>
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 22px;
      color: #2c3e50;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-content {
      padding: 20px;
      overflow-y: auto;
      max-height: calc(90vh - 70px);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
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
      margin: 20px;
      border-radius: 8px;
    }

    .no-history {
      padding: 40px;
      text-align: center;
      color: #666;
      font-style: italic;
    }

    .history-table {
      width: 100%;
      border-collapse: collapse;
    }

    .history-table th,
    .history-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .history-table th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #2c3e50;
    }

    .history-table tr:hover {
      background-color: #f5f9ff;
    }

    .column-serial {
      width: 60px;
      text-align: center;
    }

    .column-date {
      width: 40%;
    }

    .column-action {
      width: 40%;
    }

    .note-loading {
      font-style: italic;
      color: #666;
    }

    .note-error {
      color: #d32f2f;
      font-size: 0.9em;
    }

    .note-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .note-content {
      white-space: pre-line;
      line-height: 1.4;
      color: #2c3e50;
    }

    .note-actions {
      display: flex;
      gap: 8px;
    }

    .note-edit {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .note-textarea {
      min-height: 100px;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: inherit;
      font-size: 0.95em;
      line-height: 1.4;
      width: 100%;
      resize: vertical;
    }

    .edit-actions {
      display: flex;
      gap: 8px;
    }

    .view-note-btn, .edit-btn, .save-btn {
      padding: 6px 12px;
      background-color: #4a82ed;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      font-size: 0.9em;
      transition: all 0.2s ease;
    }

    .view-note-btn:hover, .edit-btn:hover, .save-btn:hover {
      background-color: #3461c0;
    }

    .delete-btn {
      padding: 6px 12px;
      background-color: #ef5350;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      font-size: 0.9em;
      transition: all 0.2s ease;
    }

    .delete-btn:hover {
      background-color: #d32f2f;
    }

    .cancel-btn {
      padding: 6px 12px;
      background-color: #f8fafc;
      border: 1px solid #dfe4ea;
      color: #2c3e50;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      font-size: 0.9em;
      transition: all 0.2s ease;
    }

    .cancel-btn:hover {
      background-color: #f1f5f9;
    }

    @media (max-width: 600px) {
      .modal-container {
        width: 95%;
        max-height: 95vh;
      }

      .history-table th,
      .history-table td {
        padding: 10px;
      }

      .modal-header h2 {
        font-size: 20px;
      }
    }
    </style>
