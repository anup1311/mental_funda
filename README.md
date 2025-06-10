StockDocs Scanner & Analyzer - v2.0
This Chrome extension, coupled with a Vercel serverless backend, is a comprehensive financial analysis toolkit for Screener.in. It intelligently downloads financial documents, renders interactive performance charts, and provides AI-powered analysis of a company's financials.

Core Features
📄 Smart Document Downloader:

Automatically detects Annual Reports (10y), Concall Transcripts (5y), and Investor Presentations (5y).

Uses a hybrid download engine: packages documents into a ZIP file via a serverless backend, with a graceful client-side fallback for restricted sources like BSE India.

Generates clean, descriptive filenames (e.g., RELIANCE_AnnualReport_FY2024.pdf).

📊 Interactive Financial Charts:

Extracts yearly and quarterly financial data from on-page tables.

Uses Chart.js to inject beautiful, interactive charts visualizing trends in Sales, Net Profit, and OPM%.

🤖 AI-Powered Analysis (Gemini):

Sends extracted financial data to a secure backend running Google's Gemini model.

Generates a qualitative analysis of the company's performance, strengths, and weaknesses.

Ensures your API key is kept secure on the backend and is never exposed to the browser.

## 🆕 What's New in v2.0

### Major Feature Additions:
- **🤖 AI-Powered Financial Analysis**: Integration with Google's Gemini 1.5 Flash model for intelligent company analysis
- **📊 Interactive Charts**: Real-time chart injection showing Sales, Net Profit, and OPM trends using Chart.js
- **🔧 Comprehensive Testing Suite**: 50+ automated tests covering all functionality
- **📋 Enhanced Documentation**: Complete deployment guides and testing summaries
- **🔒 Security Improvements**: API keys securely stored on backend, never exposed to browser

### Technical Enhancements:
- **Hybrid Download Strategy**: Improved success rate for BSE documents
- **Modular Architecture**: Separate content script, background service, and popup interface
- **Performance Optimization**: Memory-efficient processing and timeout handling
- **Error Handling**: Comprehensive error reporting and graceful degradation

Project Structure
.
├── api/
│   ├── analyze-company.js     # Backend for Document Downloading
│   └── generate-analysis.js   # Backend for AI Analysis
├── extension/
│   ├── features/              # Logic for on-page charts
│   ├── lib/                   # Chart.js library
│   ├── popup/                 # Extension popup UI/logic
│   ├── background.js          # Service worker for API calls
│   ├── content_script.js      # All-in-one script for on-page injection
│   └── manifest.json          # Extension configuration
├── test-apis.js               # API testing script
├── validate-extension.js      # Extension validation script
├── deploy.md                  # Comprehensive deployment guide
├── TESTING_SUMMARY.md         # Complete testing documentation
├── package.json
└── README.md

## 🧪 Testing & Validation

This project includes comprehensive testing tools:

**Backend API Testing:**
```bash
node test-apis.js
```

**Extension Structure Validation:**
```bash
node validate-extension.js
```

**Test Results:** 50/50 tests passed ✅
- Backend APIs: 3/3 ✅
- Extension Structure: 27/27 ✅
- File Validation: 15/15 ✅
- Configuration: 5/5 ✅

Setup and Deployment
Follow these steps to deploy the entire solution.

Step 1: Get Your Gemini API Key
Go to Google AI Studio.

Click "Create API key in new project".

Copy the generated API key. You will need it for the Vercel setup.

Step 2: GitHub & Vercel Deployment
Create a GitHub Repository: Push the entire project structure to a new repository on your GitHub account.

Import to Vercel:

Go to your Vercel Dashboard, click "Add New..." -> "Project".

Import the GitHub repository you just created.

Configure Vercel Project:

Vercel should auto-detect the settings. No changes are needed for the framework or build commands.

Navigate to the "Settings" tab of your new Vercel project.

Click on "Environment Variables" in the left-hand menu.

Create a new variable:

Name: GEMINI_API_KEY

Value: Paste the API key you copied from Google AI Studio.

Ensure the variable is available to all environments (Production, Preview, Development).

Click "Save".

Deploy: Go to the "Deployments" tab and trigger a new deployment (or redeploy the latest one) to apply the environment variable.

Copy Vercel URL: Once deployed, copy your production URL (e.g., https://your-project.vercel.app).

Step 3: Configure and Load the Chrome Extension
Set Backend URL: Open extension/background.js and update the placeholder URL with your Vercel domain:

// Replace with your Vercel project's domain
const VERCEL_DOMAIN = "https://your-project-name.vercel.app";

Set Host Permissions: Open extension/manifest.json. In the host_permissions array, replace the placeholder with your Vercel domain:

"host_permissions": [
  "https://www.screener.in/company/*",
  "https://your-project-name.vercel.app/*"
],

Load the Extension:

Open Chrome and go to chrome://extensions.

Enable "Developer mode".

Click "Load unpacked" and select the local extension folder from the project.

The extension is now installed and fully configured.

How to Use
Navigate to a company page on Screener.in.

Click the extension icon to open the popup.

To Download Documents: Use the "Downloader" tab. Select documents and click the download button.

To View Charts & Analysis:

Go to the "Analysis & Charts" tab in the popup.

Click the "Inject Charts & Analysis UI" button. This will add the new modules to the page below the main price chart.

To run the AI analysis, click the "Analyze Financials with AI" button within the newly injected on-page UI.

## 🚀 Deployment Status

**✅ PRODUCTION READY**

This repository includes:
- ✅ Complete source code for all features
- ✅ Comprehensive testing suite (50+ tests)
- ✅ Detailed deployment documentation
- ✅ API validation and error handling
- ✅ Security best practices implemented

Ready for immediate deployment to Vercel and Chrome browser.

## 📊 Live Demo

**Deployed Backend:** [mental-funda.vercel.app](https://mental-funda.vercel.app)

**Features:**
- 📄 Smart Document Downloads (Annual Reports, Transcripts, Presentations)
- 📊 Interactive Financial Charts (Sales, Profit, OPM trends)
- 🤖 AI Analysis (Company performance insights via Gemini)
- 🔒 Secure API key management
- ⚡ Hybrid download strategy for maximum success rate