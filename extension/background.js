// background.js - Service worker for handling API requests and downloads
console.log("StockDocs Scanner & Analyzer: Background script started.");

// --- CONFIGURATION ---
// Replace with your Vercel project's domain.
// IMPORTANT: Do NOT include "/api/..." in this variable.
const VERCEL_DOMAIN = "https://your-project-name.vercel.app";

const DOWNLOADER_API_URL = `${VERCEL_DOMAIN}/api/analyze-company`;
const ANALYSIS_API_URL = `${VERCEL_DOMAIN}/api/generate-analysis`;

// --- STATE ---
let tabDataStore = {}; // Store data per tab ID

// --- MESSAGE HANDLING ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const tabId = sender.tab ? sender.tab.id : null;

    switch (message.type) {
        case "PAGE_DATA_UPDATED":
            if (tabId) {
                tabDataStore[tabId] = { documents: message.documents };
            }
            break;

        case "GET_DETECTED_URLS": // Legacy support for popup v1
            if (tabId && tabDataStore[tabId]) {
                sendResponse({ documents: tabDataStore[tabId].documents });
            } else {
                sendResponse({ documents: [] });
            }
            break;

        case "DOWNLOAD_DOCUMENTS":
            handleDocumentDownload(message.documentsToDownload)
                .then(sendResponse)
                .catch(error => sendResponse({ error: error.message }));
            return true; // Indicates async response

        case "PERFORM_ANALYSIS_BACKEND":
            performAnalysis(message.financialData, message.apiKey)
                .then(analysis => chrome.tabs.sendMessage(tabId, { type: "ANALYSIS_COMPLETE", analysis }))
                .catch(error => chrome.tabs.sendMessage(tabId, { type: "ANALYSIS_ERROR", error: error.message }));
            break;
    }
    return true;
});


// --- FEATURE LOGIC: DOCUMENT DOWNLOADER ---

async function handleDocumentDownload(documents) {
    console.log("Attempting server-side download for", documents.length, "documents.");
    
    try {
        const serverResult = await fetchFromBackend(DOWNLOADER_API_URL, { documentsToDownload: documents });
        
        // If some files failed on the server (e.g., BSE links), try them on the client
        if (serverResult.failedDownloads && serverResult.failedDownloads.length > 0) {
            console.log(`Server download partially failed. Retrying ${serverResult.failedDownloads.length} files on client.`);
            
            const clientResult = await handleClientSideDownloads(serverResult.failedDownloads);

            // Combine results
            return {
                success: true,
                message: `Hybrid download: ${serverResult.downloadedFiles.length} in ZIP, ${clientResult.downloaded.length} as individual files.`,
                downloadedFiles: [...serverResult.downloadedFiles, ...clientResult.downloaded],
                failedDownloads: clientResult.failed,
                zipData: serverResult.zipData,
                zipFilename: serverResult.zipFilename,
            };
        }
        
        // If all successful on server
        return serverResult;

    } catch (error) {
        console.log("Server download completely failed. Falling back to client-side for all.", error);
        // If the entire server request fails, try all documents on the client side
        const fallbackResult = await handleClientSideDownloads(documents);
        return {
            success: true,
            message: `Server offline. Downloaded ${fallbackResult.downloaded.length} files individually.`,
            downloadedFiles: fallbackResult.downloaded,
            failedDownloads: fallbackResult.failed,
            zipData: null,
            zipFilename: null,
        };
    }
}

async function handleClientSideDownloads(documents) {
    const downloaded = [];
    const failed = [];

    for (const doc of documents) {
        try {
            const filename = generateClientFilename(doc);
            const downloadId = await chrome.downloads.download({
                url: doc.url,
                filename: `StockDocs/${filename}` // Save in a subfolder
            });
            downloaded.push({ filename, downloadId, originalUrl: doc.url, documentType: doc.type });
        } catch (err) {
            failed.push({ url: doc.url, linkText: doc.linkText, error: err.message });
        }
    }
    return { downloaded, failed };
}

function generateClientFilename(doc) {
    const { type, year, linkText } = doc;
    const companyName = linkText.split(' ')[0] || 'Company';
    let baseName = `${companyName}_${type.replace(/_/g, '-')}_${year}`;
    return `${baseName}.pdf`; // Assume PDF for client downloads
}


// --- FEATURE LOGIC: AI ANALYSIS ---

async function performAnalysis(financialData, apiKey) {
    if (!apiKey) {
        throw new Error("Gemini API Key is not set. Please add it in the extension settings.");
    }
    console.log("Sending financial data to analysis backend...");
    const response = await fetchFromBackend(ANALYSIS_API_URL, { financialData, apiKey });
    return response.analysis;
}


// --- GENERIC API FETCHER ---

async function fetchFromBackend(url, body) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const responseData = await response.json();

        if (!response.ok) {
            // Forward the specific error message from the backend
            throw new Error(responseData.error || `Server responded with status ${response.status}`);
        }

        return responseData;
    } catch (error) {
        console.error(`Error fetching from backend URL ${url}:`, error);
        // Re-throw the error so the calling function can handle it
        throw new Error(error.message || "Failed to connect to the backend service.");
    }
}

// Clean up tab data store when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    delete tabDataStore[tabId];
});
