<template>
    <div class="home-container">
      <main class="main-content">
        <h1 class="welcome-heading">Welcome to CeraMD AI</h1>
        <p class="welcome-description">
          Your intelligent medical assistant powered by AI
        </p>
        <div class="action-buttons">
          <router-link to="/dashboard" class="action-button primary">
            Start Analysis
          </router-link>
        </div>
      </main>
    </div>
  </template>

  <script>
  export default {
    name: 'HomePage'
  }
  </script>

  <style scoped>
  .home-container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .main-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 40px 20px;
    min-height: calc(100vh - 64px);
  }

  .welcome-heading {
    font-size: 3.5rem;
    color: #2c3e50;
    text-align: center;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }

  .welcome-description {
    font-size: 1.5rem;
    color: #5a6c7d;
    text-align: center;
    max-width: 600px;
    margin-bottom: 40px;
  }

  .action-buttons {
    display: flex;
    gap: 20px;
  }

  .action-button {
    padding: 12px 30px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1.1rem;
    text-decoration: none;
    transition: all 0.3s ease;
    text-align: center;
  }

  .action-button.primary {
    background-color: #4a82ed;
    color: white;
  }

  .action-button.primary:hover {
    background-color: #3461c0;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  </style>
