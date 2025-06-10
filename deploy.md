# StockDocs Scanner & Analyzer - Deployment Guide

## 🚀 Complete Deployment & Testing Guide

### Prerequisites
- Node.js installed (v18+)
- Google AI Studio API key
- Chrome browser
- Vercel account (free)

## Step 1: Get Your Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API key in new project"
3. Copy the generated API key (keep it safe!)

## Step 2: Deploy Backend to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)
1. **Create GitHub Repository:**
   ```bash
   # If not already done
   git init
   git add .
   git commit -m "StockDocs Scanner v2.0"
   ```

2. **Push to GitHub:**
   - Create a new repository on GitHub
   - Add remote origin and push:
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

3. **Deploy on Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - **Important:** Add Environment Variable:
     - Name: `GEMINI_API_KEY`
     - Value: Your API key from Step 1
   - Click "Deploy"

4. **Get Your Vercel URL:**
   - After deployment, copy your production URL (e.g., `https://your-project-abc123.vercel.app`)

### Option B: Deploy via CLI (Alternative)
```bash
# Install Vercel CLI
npx vercel login

# Deploy (will prompt for settings)
npx vercel

# Set environment variable
npx vercel env add GEMINI_API_KEY
# Enter your API key when prompted

# Deploy to production
npx vercel --prod
```

## Step 3: Configure Chrome Extension

1. **Update Backend URL in Extension:**
   Edit `extension/background.js`:
   ```javascript
   // Replace line 6:
   const VERCEL_DOMAIN = "https://your-actual-vercel-url.vercel.app";
   ```

2. **Update Manifest Permissions:**
   Edit `extension/manifest.json`:
   ```json
   "host_permissions": [
     "https://www.screener.in/company/*",
     "https://your-actual-vercel-url.vercel.app/*"
   ]
   ```

## Step 4: Load Chrome Extension

1. **Open Chrome Extensions:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)

2. **Load Extension:**
   - Click "Load unpacked"
   - Select the `extension` folder from this project
   - Extension will appear in your Chrome toolbar

## Step 5: Test the Complete System

### A. Test Backend APIs
```bash
# Run local API tests
node test-apis.js
```

### B. Test Extension on Screener.in
1. **Navigate to any company page:**
   - Example: https://www.screener.in/company/RELIANCE/

2. **Test Document Downloader:**
   - Click extension icon
   - Go to "Downloader" tab
   - Should detect documents automatically
   - Select documents and test download

3. **Test Charts & AI Analysis:**
   - Go to "Analysis & Charts" tab
   - Click "Inject Charts & Analysis UI"
   - Charts should appear on the page
   - Enter your Gemini API key in settings
   - Click "Analyze Financials with AI"

## Step 6: Verify Deployment

### Backend Health Check
Test your deployed API endpoints:

```bash
# Test ping endpoint
curl https://your-vercel-url.vercel.app/api/ping

# Expected response:
# {"message":"pong","timestamp":"2024-XX-XXTXX:XX:XX.XXXZ"}
```

### Extension Integration Test
1. Open browser DevTools → Console
2. Navigate to a Screener.in company page
3. Check for extension logs (should see "StockDocs Scanner & Analyzer: Content script loaded")
4. Test all features end-to-end

## 🎯 Production Configuration

### Security Best Practices
- ✅ API key stored securely on Vercel (not in extension)
- ✅ CORS properly configured
- ✅ Input validation on all endpoints
- ✅ Error handling with user-friendly messages

### Performance Optimizations
- ✅ Hybrid download strategy (server + client fallback)
- ✅ Memory-efficient ZIP creation
- ✅ 45-second timeout for large files
- ✅ 50MB file size limit

## 📊 Expected Behavior

### Document Downloader
- **Annual Reports**: Last 10 years, attempts ZIP first, falls back to individual downloads for BSE
- **Transcripts**: Last 5 years, server-side ZIP packaging
- **Presentations**: Last 5 years, server-side ZIP packaging

### Interactive Charts
- **Sales & Net Profit**: Yearly trend visualization
- **Responsive Design**: Works on all screen sizes
- **Real-time Data**: Extracted from current page data

### AI Analysis
- **Powered by Gemini 1.5 Flash**: Fast, accurate analysis
- **Comprehensive Insights**: Performance trends, strengths, risks
- **Contextual**: Based on actual financial data from the page

## 🔧 Troubleshooting

### Common Issues

**1. Extension not loading:**
- Check Chrome Developer Mode is enabled
- Verify all files are in the extension folder
- Check browser console for errors

**2. Backend API errors:**
- Verify Vercel deployment is successful
- Check environment variables are set
- Test API endpoints directly

**3. Charts not appearing:**
- Ensure you're on a Screener.in company page
- Check if page structure has changed
- Look for console errors

**4. AI analysis failing:**
- Verify API key is correct and valid
- Check network connectivity
- Ensure financial data is being extracted properly

## 🌟 Success Indicators

✅ **Ping API**: Returns pong with timestamp  
✅ **Document Detection**: Lists available documents  
✅ **Hybrid Downloads**: Successfully downloads/packages files  
✅ **Chart Injection**: Interactive charts appear on page  
✅ **AI Analysis**: Generates meaningful financial insights  

## 📋 Final Checklist

- [ ] Gemini API key obtained and configured
- [ ] Backend deployed to Vercel with environment variables
- [ ] Extension background.js updated with correct Vercel URL
- [ ] Extension manifest.json permissions updated
- [ ] Chrome extension loaded and active
- [ ] All features tested on Screener.in
- [ ] API endpoints responding correctly
- [ ] Error handling working as expected

**🎉 Your StockDocs Scanner & Analyzer v2.0 is now fully deployed and ready for production use!** 