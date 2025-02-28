# AI Medi Frontend

<div align="center">

![AI Medi Logo](https://img.shields.io/badge/AI%20Medi-Medical%20Assistant-blue?style=for-the-badge)

</div>

A modern medical application frontend built with Quasar Framework that provides transcription services, medical diagnostics, SOAP notes generation, and patient management capabilities.

## ✨ Features

- 🎙️ **Real-time audio transcription** for medical conversations
- 🩺 **AI-powered medical diagnosis** suggestions
- 📝 **SOAP notes** generation and management
- 👥 **Patient information** management
- 🔐 **Secure authentication** system

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/karthiksathishjeemain/AI_Medi_frontend.git
   cd AI_Medi_frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # OR
   yarn install
   ```

3. Set up environment variables:
   - Create a `.env` file based on `.env.example` (if provided)
   - Add your API keys and configuration

### Running the Application

```bash
# Start the development server
quasar dev

# Build for production
quasar build
```

## 🏗️ Project Structure

```
quasar-project/
│
├── .env                       # Environment variables with API keys
├── .gitignore                 # Git ignore configuration
├── README.md                  # Project documentation
├── vercel.json                # Vercel deployment configuration
│
├── src/                       # Source code
│   │
│   ├── components/            # Vue components
│   │   ├── AudioRecorder.vue  # Recording functionality
│   │   ├── Diagnosis.vue      # Medical diagnosis functionality
│   │   ├── SOAP.vue           # SOAP notes component
│   │   └── ...
│   │
│   ├── views/                 # Page components
│   │   ├── LoginView.vue      # Login page
│   │   ├── PatientForm.vue    # Patient information form
│   │   ├── SaveSession.vue    # Save session functionality
│   │   └── ...
│   │
│   ├── router/                # Vue router configuration
│   ├── layouts/               # Layout components
│   ├── boot/                  # App initialization files
│   ├── css/                   # CSS/Sass files
│   ├── transcription.js       # Transcription service
│   └── ...
│
├── public/                    # Public static assets
└── dist/                      # Build output (generated after build)
```

## 🔧 Local Development Configuration

For local development, you need to replace the API base URL in the following files:

| File | Line | Replace with |
|------|------|-------------|
| LoginView.vue | 61 | http://localhost:5000 |
| MyPatientsView.vue | 103 | http://localhost:5000 |
| PatientForm.vue | 71 | http://localhost:5000 |
| PatientsHistoryModal.vue | 80 | http://localhost:5000 |
| RegisterView.vue | 96 | http://localhost:5000 |
| SaveSession.vue | 39 | http://localhost:5000 |

The production API base URL is `https://ai-medi-backend.vercel.app`.

## 🚢 Deployment

This project is configured for deployment on Vercel. The configuration is specified in `vercel.json`.

## 📄 License

[MIT License](LICENSE)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request