document.addEventListener('DOMContentLoaded', () => {
    // --- COMMON ELEMENTS ---
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- DOWNLOADER ELEMENTS ---
    const downloaderViews = {
        initial: document.getElementById('initial-view'),
        loading: document.getElementById('loading-view'),
        results: document.getElementById('results-view'),
        error: document.getElementById('error-view'),
    };
    const statusMessage = document.getElementById('status-message');
    const detectedUrlsContainer = document.getElementById('detected-urls-container');
    const urlsList = document.getElementById('urls-list');
    const downloadButton = document.getElementById('download-button');
    const rescanButton = document.getElementById('rescan-button');
    const analysisResultsContent = document.getElementById('analysis-results-content');
    const backToScanButton = document.getElementById('back-to-scan-button');
    const errorMessageText = document.getElementById('error-message-text');
    const retryButton = document.getElementById('retry-button');
    const backToScanFromErrorButton = document.getElementById('back-to-scan-from-error-button');
    let allDetectedDocuments = [];
    let lastSelectedDocuments = [];

    // --- ANALYSIS & CHARTS ELEMENTS ---
    const injectUiButton = document.getElementById('inject-ui-button');
    const injectStatus = document.getElementById('inject-status');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyButton = document.getElementById('save-api-key-button');
    const apiKeyStatus = document.getElementById('api-key-status');

    // --- INITIALIZATION ---
    function init() {
        setupTabNavigation();
        setupDownloader();
        setupAnalysisTab();
    }

    // --- TAB NAVIGATION LOGIC ---
    function setupTabNavigation() {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;

                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${targetTab}-tab`) {
                        content.classList.add('active');
                    }
                });
            });
        });
    }

    // --- DOWNLOADER LOGIC ---
    function setupDownloader() {
        // Event Listeners
        downloadButton.addEventListener('click', handleDownloadClick);
        rescanButton.addEventListener('click', handleRescanClick);
        retryButton.addEventListener('click', handleRetryClick);
        backToScanButton.addEventListener('click', resetToInitialView);
        backToScanFromErrorButton.addEventListener('click', resetToInitialView);

        // Initial data request
        requestDataFromContentScript('GET_DOCUMENT_DATA', updateDetectedUrlsList);
    }
    
    function showDownloaderView(viewName) {
        Object.values(downloaderViews).forEach(v => v.style.display = 'none');
        if (downloaderViews[viewName]) downloaderViews[viewName].style.display = 'block';
    }

    function updateDetectedUrlsList(data) {
        if (!data || !data.documents) {
            statusMessage.textContent = "Could not retrieve document data from the page.";
            return;
        }
        
        urlsList.innerHTML = '';
        allDetectedDocuments = data.documents.map(doc => ({ ...doc, checked: true }));

        if (allDetectedDocuments.length === 0) {
            statusMessage.textContent = 'No recent Annual Reports (10y), Transcripts (5y), or Presentations (5y) found.';
            detectedUrlsContainer.style.display = 'none';
            downloadButton.disabled = true;
        } else {
            statusMessage.textContent = `Found ${allDetectedDocuments.length} relevant document(s):`;
            detectedUrlsContainer.style.display = 'block';
            
            allDetectedDocuments.forEach((doc, index) => {
                const li = document.createElement('li');
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.id = `doc-check-${index}`;
                cb.checked = doc.checked;
                cb.addEventListener('change', (e) => {
                    allDetectedDocuments[index].checked = e.target.checked;
                    updateDownloadButtonState();
                });
                
                const lbl = document.createElement('label');
                lbl.setAttribute('for', `doc-check-${index}`);
                const icon = doc.type === 'annual_report' ? '📄' : doc.type === 'concall_transcript' ? '📋' : '📊';
                lbl.textContent = ` ${icon} ${doc.linkText || doc.url}`;
                lbl.title = doc.url;
                
                li.appendChild(cb);
                li.appendChild(lbl);
                urlsList.appendChild(li);
            });
            updateDownloadButtonState();
        }
    }
    
    function updateDownloadButtonState() {
        const selectedCount = allDetectedDocuments.filter(item => item.checked).length;
        downloadButton.disabled = selectedCount === 0;
        downloadButton.textContent = selectedCount > 0 ? `Download ${selectedCount} Document(s)` : 'Download Selected';
    }

    function handleDownloadClick() {
        const selectedDocuments = allDetectedDocuments.filter(item => item.checked);
        if (selectedDocuments.length === 0) return;
        
        lastSelectedDocuments = selectedDocuments;
        showDownloaderView('loading');
        chrome.runtime.sendMessage({ type: "DOWNLOAD_DOCUMENTS", documentsToDownload: selectedDocuments }, handleDownloadResponse);
    }

    function handleDownloadResponse(response) {
        if (chrome.runtime.lastError) { 
            showDownloaderError(`Download request failed: ${chrome.runtime.lastError.message}`);
            return;
        }
        if (response && response.error) { 
            showDownloaderError(response.error, response.details); 
        } else if (response && response.success) { 
            displayDownloadResults(response); 
        } else { 
            showDownloaderError("An unexpected error occurred.");
        }
    }

    function showDownloaderError(message, details = "") {
        showDownloaderView('error');
        errorMessageText.textContent = message + (details ? ` Details: ${details}` : "");
        retryButton.style.display = 'inline-block';
    }

    function displayDownloadResults(data) {
        showDownloaderView('results');
        // This part is simplified from your original; you can expand it as needed
        let summaryHtml = `<h3>Download Summary</h3><p>${data.message}</p>`;
        if (data.zipData) {
            summaryHtml += `<button id="download-zip-btn" class="button-primary">Download ZIP File</button>`;
        }
        analysisResultsContent.innerHTML = summaryHtml;

        if (data.zipData) {
            document.getElementById('download-zip-btn').addEventListener('click', () => {
                const blob = new Blob([Uint8Array.from(atob(data.zipData), c => c.charCodeAt(0))], { type: 'application/zip' });
                const url = URL.createObjectURL(blob);
                chrome.downloads.download({ url: url, filename: data.zipFilename });
            });
        }
    }

    function handleRescanClick() {
        statusMessage.textContent = 'Re-scanning page...'; 
        sendMessageToContentScript({ type: "RESCAN_PAGE" }, () => {
             setTimeout(() => requestDataFromContentScript('GET_DOCUMENT_DATA', updateDetectedUrlsList), 500);
        });
    }
    
    function handleRetryClick() {
        if (lastSelectedDocuments.length > 0) {
            showDownloaderView('loading');
            chrome.runtime.sendMessage({ type: "DOWNLOAD_DOCUMENTS", documentsToDownload: lastSelectedDocuments }, handleDownloadResponse);
        }
    }

    function resetToInitialView() {
        showDownloaderView('initial');
        requestDataFromContentScript('GET_DOCUMENT_DATA', updateDetectedUrlsList);
    }

    // --- ANALYSIS & CHARTS LOGIC ---
    function setupAnalysisTab() {
        // Load stored API key
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
            if (result.geminiApiKey) {
                apiKeyInput.value = result.geminiApiKey;
            }
        });

        // Event Listeners
        saveApiKeyButton.addEventListener('click', saveApiKey);
        injectUiButton.addEventListener('click', () => {
             sendMessageToContentScript({ type: "INJECT_UI" }, (response) => {
                if(response.status) injectStatus.textContent = response.status;
             });
        });
        
        // Check injection status on popup open
        sendMessageToContentScript({ type: 'GET_INJECT_STATUS' }, (response) => {
            if (response && response.isInjected) {
                injectUiButton.textContent = "UI Already Injected";
                injectUiButton.disabled = true;
            }
        });
    }

    function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            apiKeyStatus.textContent = "API Key cannot be empty.";
            apiKeyStatus.className = "status-text error";
            return;
        }
        chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
            apiKeyStatus.textContent = "API Key saved successfully!";
            apiKeyStatus.className = "status-text success";
            // Inform content script of the new key
            sendMessageToContentScript({ type: 'API_KEY_UPDATED', apiKey });
            setTimeout(() => apiKeyStatus.textContent = "", 3000);
        });
    }
    
    // --- GENERIC HELPER FUNCTIONS ---
    function requestDataFromContentScript(messageType, callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: messageType }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Popup error:", chrome.runtime.lastError.message);
                        callback(null); // Handle error case in the callback
                    } else {
                        callback(response);
                    }
                });
            }
        });
    }

    function sendMessageToContentScript(message, callback) {
         chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, message, callback);
            }
        });
    }
    
    init();
});
