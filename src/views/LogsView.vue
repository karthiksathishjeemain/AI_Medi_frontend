<template>
  <div class="logs-container">
    <div class="logs-main">
      <!-- Header -->
      <h1 class="title">Audit Logs</h1>
      <p class="subtitle">Monitor and track all system activities</p>

      <!-- Filters Card -->
      <div class="filters-card">
        <h2 class="filters-title">Filters</h2>

        <div class="filters-grid">
          <div class="filter-group">
            <label for="action-type">Action Type</label>
            <div class="select-wrapper">
              <select
                id="action-type"
                v-model="filters.actionType"
                @change="fetchLogs"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="patient_create">Patient Create</option>
                <option value="patient_session_view">Patient Session View</option>
                <option value="patient_session_edit">Patient Session Edit</option>
                <option value="patient_session_create">Patient Session Create</option>
                <option value="patient_session_delete">Patient Session Delete</option>
              </select>
            </div>
          </div>

          <div class="filter-group">
            <label for="start-date">Start Date</label>
            <div class="input-wrapper">
              <input
                id="start-date"
                type="date"
                v-model="filters.startDate"
                @change="fetchLogs"
              />
            </div>
          </div>

          <div class="filter-group">
            <label for="end-date">End Date</label>
            <div class="input-wrapper">
              <input
                id="end-date"
                type="date"
                v-model="filters.endDate"
                @change="fetchLogs"
              />
            </div>
          </div>
        </div>

        <!-- Reset Filters Button -->
        <div class="reset-button-container">
          <button
            class="reset-button"
            @click="resetFilters"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
      </div>

      <!-- Error Message -->
      <div v-else-if="error" class="error-message">
        <strong>Error:</strong> {{ error }}
      </div>

      <!-- No Results -->
      <div v-else-if="logs.length === 0" class="no-results">
        <div class="no-results-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 15C8.5 16.5 9.79 17.5 12 17.5C14.21 17.5 15.5 16.5 16 15" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 10H9.01" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 10H15.01" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>No logs found</h3>
        <p>No audit logs match your current filter criteria.</p>
      </div>

      <!-- Results Table -->
      <div v-else class="table-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Location</th>
              <th>Device</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(log, index) in logs" :key="log.id">
              <td>{{ formatDate(log.timestamp) }}</td>
              <td>
                <div class="tooltip-container">
                  <span
                    class="action-badge"
                    :class="getActionTypeClass(log.action_type)"
                  >
                    {{ formatActionType(log.action_type) }}
                  </span>
                  <div v-if="log.details"
                       class="tooltip"
                       :class="index < 2 ? 'tooltip-bottom' : 'tooltip-top'"
                       @mouseover="checkTooltipPosition($event)">
                    <div class="tooltip-title">Action Details</div>
                    <div class="tooltip-content">
                      <pre>{{ formatDetails(log.details) }}</pre>
                    </div>
                  </div>
                </div>
              </td>
              <td>{{ log.location || 'Not available' }}</td>
              <td>{{ log.device || 'Not available' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <div class="pagination-info">
          <span>
            Showing {{ logs.length }} logs
          </span>
        </div>
        <div>
          <button
            class="load-more-button"
            @click="loadMore"
            v-if="logs.length >= limit"
            :disabled="loading"
          >
            <span v-if="loading">Loading...</span>
            <span v-else>Load More</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LogsView',
  data() {
    return {
      logs: [],
      loading: false,
      error: null,
      filters: {
        actionType: '',
        startDate: '',
        endDate: ''
      },
      limit: 20, // Number of logs to load at once
      apiBaseUrl : 'https://ai-medi-backend.vercel.app'
      // apiBaseUrl: 'http://localhost:5000'
    };
  },
  created() {
    this.fetchLogs();
  },
  mounted() {
    // Adding event listener for scroll to dynamically update tooltip positions
    window.addEventListener('scroll', this.updateTooltipPositions);
    window.addEventListener('resize', this.updateTooltipPositions);
  },
  beforeUnmount() {
    // Clean up event listeners
    window.removeEventListener('scroll', this.updateTooltipPositions);
    window.removeEventListener('resize', this.updateTooltipPositions);
  },
  methods: {
    async fetchLogs() {
      this.loading = true;
      this.error = null;

      try {
        // Build query parameters
        let params = { limit: this.limit };

        if (this.filters.actionType) {
          params.action_type = this.filters.actionType;
        }

        if (this.filters.startDate) {
          params.start_date = new Date(this.filters.startDate).toISOString();
        }

        if (this.filters.endDate) {
          // Add one day to include the end date
          const endDate = new Date(this.filters.endDate);
          endDate.setDate(endDate.getDate() + 1);
          params.end_date = endDate.toISOString();
        }

        // Get authorization token from localStorage
        const token = localStorage.getItem('authToken');

        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }

        // Make API request
        const response = await axios.get(`${this.apiBaseUrl}/api/logs`, {
          params,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        this.logs = response.data.logs;

        // Update tooltip positions after DOM update
        this.$nextTick(() => {
          this.updateTooltipPositions();
        });
      } catch (err) {
        console.error('Error fetching logs:', err);
        this.error = err.response?.data?.message || err.message || 'An error occurred while fetching logs';
      } finally {
        this.loading = false;
      }
    },

    async loadMore() {
      this.loading = true;

      try {
        // Build query parameters for pagination
        let params = { limit: this.limit };

        if (this.filters.actionType) {
          params.action_type = this.filters.actionType;
        }

        if (this.filters.startDate) {
          params.start_date = new Date(this.filters.startDate).toISOString();
        }

        if (this.filters.endDate) {
          const endDate = new Date(this.filters.endDate);
          endDate.setDate(endDate.getDate() + 1);
          params.end_date = endDate.toISOString();
        }

        // Get the timestamp of the last log for pagination
        if (this.logs.length > 0) {
          const lastLog = this.logs[this.logs.length - 1];

          // Since logs are ordered by timestamp descending, we use the last timestamp as end_date
          // for the next page
          params.end_date = lastLog.timestamp;
        }

        // Get authorization token
        const token = localStorage.getItem('authToken');

        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }

        // Make API request
        const response = await axios.get(`${this.apiBaseUrl}/api/logs`, {
          params,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Append new logs to the existing ones
        this.logs = [...this.logs, ...response.data.logs];

        // Update tooltip positions after DOM update
        this.$nextTick(() => {
          this.updateTooltipPositions();
        });
      } catch (err) {
        console.error('Error loading more logs:', err);
        this.error = err.response?.data?.message || err.message || 'An error occurred while loading more logs';
      } finally {
        this.loading = false;
      }
    },

    formatDate(isoString) {
      if (!isoString) return 'N/A';

      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    },

    formatActionType(actionType) {
      if (!actionType) return 'Unknown';

      // Convert snake_case to Title Case with spaces
      return actionType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },

    getActionTypeClass(actionType) {
      // Return appropriate class based on action type
      switch (actionType) {
        case 'login':
          return 'badge-login';
        case 'logout':
          return 'badge-logout';
        case 'patient_view':
          return 'badge-view';
        case 'patient_create':
          return 'badge-create';
        case 'patient_edit':
          return 'badge-edit';
        case 'patient_delete':
          return 'badge-delete';
        case 'patient_session_create':
          return 'badge-session-create';
        case 'patient_session_view':
          return 'badge-session-view';
        case 'patient_session_edit':
          return 'badge-session-edit';
        case 'patient_session_delete':
          return 'badge-session-delete';
        default:
          return 'badge-default';
      }
    },

    formatDetails(details) {
      if (typeof details === 'string') {
        try {
          // Try to parse it as JSON for pretty formatting
          const parsed = JSON.parse(details);
          return JSON.stringify(parsed, null, 2);
        } catch (e) {
          // If not valid JSON, return as is
          console.log('Error parsing details:', e);
          return details;
        }
      } else if (typeof details === 'object') {
        // If already an object, stringify it for display
        return JSON.stringify(details, null, 2);
      }
      return details || 'No details available';
    },

    resetFilters() {
      this.filters = {
        actionType: '',
        startDate: '',
        endDate: ''
      };
      this.fetchLogs();
    },

    // Dynamic tooltip positioning
    updateTooltipPositions() {
      // Wait for DOM to be ready
      this.$nextTick(() => {
        const tooltipContainers = document.querySelectorAll('.tooltip-container');

        tooltipContainers.forEach((container, index) => {
          const tooltip = container.querySelector('.tooltip');
          if (!tooltip) return;

          // Remove existing positioning classes
          tooltip.classList.remove('tooltip-top', 'tooltip-bottom');

          // Get container position relative to viewport
          const containerRect = container.getBoundingClientRect();
          // const viewportHeight = window.innerHeight;

          // For the first few rows, always show tooltip below
          if (index < 2 || containerRect.top < 150) {
            tooltip.classList.add('tooltip-bottom');
          } else {
            // For other rows, default to showing above
            tooltip.classList.add('tooltip-top');
          }
        });
      });
    },

    // Check and adjust tooltip position when it's shown
    checkTooltipPosition(event) {
      const tooltip = event.target;
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // If tooltip extends beyond viewport bottom, flip it to top
      if (tooltipRect.bottom > viewportHeight && tooltip.classList.contains('tooltip-bottom')) {
        tooltip.classList.remove('tooltip-bottom');
        tooltip.classList.add('tooltip-top');
      }

      // If tooltip extends beyond viewport top, flip it to bottom
      if (tooltipRect.top < 0 && tooltip.classList.contains('tooltip-top')) {
        tooltip.classList.remove('tooltip-top');
        tooltip.classList.add('tooltip-bottom');
      }
    }
  }
};
</script>

<style scoped>
.logs-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.logs-main {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
}

.filters-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
}

.filters-title {
  font-size: 18px;
  font-weight: 500;
  color: #444;
  margin-bottom: 16px;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

@media (min-width: 768px) {
  .filters-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.select-wrapper, .input-wrapper {
  position: relative;
}

select, input[type="date"] {
  width: 100%;
  padding: 12px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  transition: border-color 0.3s;
}

select:focus, input:focus {
  outline: none;
  border-color: #4a82ed;
}

.reset-button-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.reset-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #f0f2f5;
  color: #444;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.reset-button:hover {
  background-color: #e4e6e8;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #4a82ed;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 48px 24px;
  text-align: center;
}

.no-results-icon {
  margin-bottom: 16px;
}

.no-results h3 {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.no-results p {
  color: #666;
  font-size: 14px;
}

.table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th {
  background-color: #f7f9fc;
  color: #555;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.logs-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #eee;
}

.logs-table tr:hover {
  background-color: #f7f9fc;
}

.action-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 50px;
  font-size: 12px;
  font-weight: 500;
}

.badge-login {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.badge-logout {
  background-color: #e3f2fd;
  color: #1565c0;
}

.badge-view {
  background-color: #f5f5f5;
  color: #616161;
}

.badge-create {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.badge-edit {
  background-color: #fff8e1;
  color: #ef6c00;
}

.badge-delete {
  background-color: #ffebee;
  color: #c62828;
}

.badge-default {
  background-color: #f5f5f5;
  color: #616161;
}

.badge-session-create {
  background-color: #e0f2f1;
  color: #00796b;
}

.badge-session-view {
  background-color: #f3e5f5;
  color: #8e24aa;
}

.badge-session-edit {
  background-color: #e8eaf6;
  color: #3949ab;
}

.badge-session-delete {
  background-color: #fbe9e7;
  color: #d84315;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.pagination-info {
  font-size: 14px;
  color: #666;
}

.load-more-button {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  background-color: #4a82ed;
  color: white;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.load-more-button:hover {
  background-color: #3461c0;
}

.load-more-button:disabled {
  background-color: #a0b4e0;
  cursor: not-allowed;
}

/* Tooltip styling with adaptive positioning */
.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip {
  visibility: hidden;
  position: absolute;
  left: 50%;
  min-width: 250px;
  max-width: 350px;
  background-color: #fff;
  color: #333;
  border-radius: 6px;
  padding: 0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transition: opacity 0.3s, visibility 0.3s;
  z-index: 10;
  overflow: hidden;
  border: 1px solid #eaeaea;
  transform: translateX(-50%);
}

/* Position for tooltip appearing above the badge */
.tooltip.tooltip-top {
  bottom: calc(100% + 10px);
}

/* Position for tooltip appearing below the badge */
.tooltip.tooltip-bottom {
  top: calc(100% + 10px);
}

.tooltip-container:hover .tooltip {
  visibility: visible;
  opacity: 1;
}

.tooltip-title {
  background-color: #4a82ed;
  color: white;
  padding: 10px 16px;
  font-weight: 500;
  font-size: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.tooltip-content {
  padding: 12px 16px;
  max-height: 200px;
  overflow-y: auto;
}

.tooltip-content pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #555;
}

/* Add pointer triangles */
.tooltip.tooltip-top:after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -8px;
  border-width: 8px;
  border-style: solid;
  border-color: #fff transparent transparent transparent;
}

.tooltip.tooltip-bottom:after {
  content: "";
  position: absolute;
  bottom: 100%;
  left: 50%;
  margin-left: -8px;
  border-width: 8px;
  border-style: solid;
  border-color: transparent transparent #fff transparent;
}
</style>
