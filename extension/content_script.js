// content_script.js - Unified script for all on-page interactions
console.log("StockDocs Scanner & Analyzer: Content script loaded.");

// --- STATE MANAGEMENT ---
const state = {
    documentData: null,
    financialData: null,
    isUIInjected: false,
    apiKey: null
};

// --- INITIALIZATION ---
function init() {
    // Perform a single, comprehensive scan on load
    scanPageForAllData();

    // Listen for messages from the popup or background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        handleMessages(message, sender, sendResponse);
        return true; // Indicates an asynchronous response may be sent.
    });
}

function handleMessages(message, sender, sendResponse) {
    switch (message.type) {
        case "GET_DOCUMENT_DATA":
            sendResponse({ documents: state.documentData });
            break;
        case "RESCAN_PAGE":
            scanPageForAllData();
            sendResponse({ status: "Rescan complete." });
            break;
        case "INJECT_UI":
            injectToolkitUI();
            sendResponse({ status: "UI injection process started." });
            break;
        case "GET_INJECT_STATUS":
            sendResponse({ isInjected: state.isUIInjected });
            break;
        case "API_KEY_UPDATED":
            state.apiKey = message.apiKey;
            console.log("Content Script: API key updated.");
            break;
        case "PERFORM_ANALYSIS":
            if (state.financialData) {
                // Pass data to background script to make the API call
                chrome.runtime.sendMessage({
                    type: "PERFORM_ANALYSIS_BACKEND",
                    financialData: state.financialData,
                    apiKey: state.apiKey
                });
            } else {
                updateAnalysisUI("error", "Financial data not available. Please re-scan the page.");
            }
            break;
    }
}

// --- CORE DATA EXTRACTION ---
function scanPageForAllData() {
    console.log("Scanning page for all data...");
    state.documentData = extractDocumentUrls();
    state.financialData = extractFinancialData();
    
    // Notify background script that new data is available (for the popup)
    chrome.runtime.sendMessage({
        type: "PAGE_DATA_UPDATED",
        documents: state.documentData
    });
}

// --- DOCUMENT DATA EXTRACTION (FROM ORIGINAL SCRIPT) ---
function extractDocumentUrls() {
    const docSections = [
        { selector: 'section#documents .documents.annual-reports', type: 'annual_report', years: 10 },
        { selector: 'section#documents .documents.concalls', type: 'concall_transcript', years: 5 },
        { selector: 'section#documents .documents.presentations', type: 'investor_presentation', years: 5 }
    ];
    const currentYear = new Date().getFullYear();
    let allDocuments = [];

    docSections.forEach(section => {
        const container = document.querySelector(section.selector);
        if (!container) return;
        
        const yearLimit = currentYear - section.years;
        container.querySelectorAll('ul.list-links li').forEach(item => {
            const link = item.querySelector('a');
            const linkText = link ? link.innerText.trim() : item.innerText.trim();
            const yearMatch = linkText.match(/\b(20\d{2})\b/);
            const year = yearMatch ? parseInt(yearMatch[0], 10) : null;

            if (link && link.href && year && year >= yearLimit) {
                let finalLink = link;
                if (section.type === 'concall_transcript') {
                     finalLink = Array.from(item.querySelectorAll('a.concall-link')).find(a => a.innerText.trim().toLowerCase() === 'transcript') || null;
                }
                if(finalLink) {
                    allDocuments.push({
                        url: new URL(finalLink.href, window.location.origin).href,
                        linkText,
                        type: section.type,
                        year
                    });
                }
            }
        });
    });
    
    console.log(`Found ${allDocuments.length} relevant documents.`);
    return allDocuments.sort((a,b) => b.year - a.year);
}

// --- FINANCIAL DATA EXTRACTION (FOR CHARTS & AI) ---
function extractFinancialData() {
    const plTable = document.querySelector('#profit-loss table.data-table');
    const quarterlyTable = document.querySelector('#quarters table.data-table');
    const companyName = document.querySelector('h1')?.innerText.trim() || 'Unknown Company';

    if (!plTable || !quarterlyTable) {
        console.error("Could not find P&L or Quarterly tables.");
        return null;
    }

    const yearlyData = parseTable(plTable);
    const quarterlyData = parseTable(quarterlyTable);
    
    return { companyName, yearlyData, quarterlyData };
}

function parseTable(table) {
    const headers = [...table.querySelectorAll('thead th')].map(th => th.innerText.trim()).slice(1);
    const rows = {};
    table.querySelectorAll('tbody tr').forEach(tr => {
        const cells = [...tr.querySelectorAll('td')];
        const label = cells[0]?.innerText.trim().toLowerCase();
        if (label) {
            rows[label] = cells.map(td => td.innerText.trim()).slice(1);
        }
    });
    return { headers, rows };
}


// --- UI INJECTION & MANAGEMENT ---
function injectToolkitUI() {
    if (state.isUIInjected) {
        console.log("UI is already injected.");
        return;
    }

    const injectionPoint = document.querySelector('#top-company-info + .card') || document.querySelector('section#profit-loss');
    if (!injectionPoint) {
        console.error("Could not find a suitable point to inject the UI.");
        return;
    }
    
    const toolkitContainer = document.createElement('div');
    toolkitContainer.id = 'stockdocs-toolkit-container';
    toolkitContainer.innerHTML = `
        <style>
            #stockdocs-toolkit-container { margin: 20px 0; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .toolkit-header { background-color: #f8f9fa; padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-size: 1.1em; font-weight: 600; color: #333; }
            .toolkit-content { padding: 15px; }
            .charts-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
            .analysis-container h3 { margin-top: 0; }
            .analysis-container button { background-color: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em; }
            .analysis-container button:hover { background-color: #0056b3; }
            #analysis-result { margin-top: 15px; background: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap; line-height: 1.6; font-family: monospace; }
        </style>
        <div class="toolkit-header">StockDocs Analysis Toolkit</div>
        <div class="toolkit-content">
            <div id="charts-module">
                <h3>Financial Charts</h3>
                <div class="charts-container">
                    <canvas id="sales-chart"></canvas>
                    <canvas id="profit-chart"></canvas>
                </div>
            </div>
            <div id="analysis-module" class="analysis-container">
                <h3>AI Financial Analysis (Gemini)</h3>
                <button id="run-analysis-btn">Analyze Financials with AI</button>
                <div id="analysis-result">Click the button to generate an analysis.</div>
            </div>
        </div>
    `;

    injectionPoint.parentNode.insertBefore(toolkitContainer, injectionPoint);
    state.isUIInjected = true;

    // Load necessary scripts for features
    loadFeatureScripts();
    
    // Attach event listeners
    document.getElementById('run-analysis-btn').addEventListener('click', () => {
        updateAnalysisUI("loading");
        chrome.runtime.sendMessage({type: 'PERFORM_ANALYSIS'});
    });
}

function loadFeatureScripts() {
    const scripts = [
        "lib/chart.min.js",
        "features/data-processor.js",
        "features/chart-renderer.js"
    ];

    scripts.forEach((script, index) => {
        const scriptEl = document.createElement('script');
        scriptEl.src = chrome.runtime.getURL(script);
        document.head.appendChild(scriptEl);

        // After the last script is loaded, render the charts
        if (index === scripts.length - 1) {
            scriptEl.onload = () => {
                if (window.renderScreenerCharts && state.financialData) {
                    window.renderScreenerCharts(state.financialData);
                } else {
                    console.error("Chart rendering function not available or financial data missing.");
                }
            };
        }
    });
}

function updateAnalysisUI(status, content = "") {
    const resultDiv = document.getElementById('analysis-result');
    const analyzeBtn = document.getElementById('run-analysis-btn');

    switch (status) {
        case "loading":
            resultDiv.innerHTML = `<div class="spinner"></div><p>Analyzing... This may take a moment.</p>`;
            analyzeBtn.disabled = true;
            break;
        case "success":
            resultDiv.innerHTML = content;
            analyzeBtn.disabled = false;
            break;
        case "error":
            resultDiv.innerHTML = `<p style="color: red;">Error: ${content}</p>`;
            analyzeBtn.disabled = false;
            break;
    }
}


// Listen for analysis results from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "ANALYSIS_COMPLETE") {
        updateAnalysisUI("success", message.analysis);
    } else if (message.type === "ANALYSIS_ERROR") {
        updateAnalysisUI("error", message.error);
    }
});


init();
