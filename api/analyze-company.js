const axios = require('axios');
const path = require('path');
const archiver = require('archiver');

/**
 * Downloads a file from a URL.
 * @param {string} url The URL of the document to fetch.
 * @returns {Promise<{buffer: Buffer, extension: string}>} The file buffer and its extension.
 */
async function downloadFile(url) {
    try {
        console.log(`Downloading document from: ${url}`);
        
        // Determine appropriate headers based on the source
        let headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
            'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'Cache-Control': 'max-age=0'
        };

        // Add specific headers for BSE India to bypass 403 errors
        if (url.includes('bseindia.com')) {
            headers['Referer'] = 'https://www.screener.in/';
            headers['Origin'] = 'https://www.screener.in';
            headers['Sec-Fetch-Site'] = 'cross-site';
            // Remove conflicting headers for cross-site requests
            delete headers['sec-ch-ua'];
            delete headers['sec-ch-ua-mobile']; 
            delete headers['sec-ch-ua-platform'];
        } else if (url.includes('nseindia.com')) {
            headers['Referer'] = 'https://www.nseindia.com/';
            headers['Origin'] = 'https://www.nseindia.com';
            headers['Sec-Fetch-Site'] = 'same-origin';
        } else if (url.includes('screener.in')) {
            headers['Referer'] = 'https://www.screener.in/';
            headers['Origin'] = 'https://www.screener.in';
            headers['Sec-Fetch-Site'] = 'same-origin';
        }

        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            timeout: 45000, // 45 second timeout for larger files
            maxContentLength: 50 * 1024 * 1024, // 50MB max file size
            headers,
            maxRedirects: 5, // Follow redirects
            validateStatus: (status) => status < 400 // Accept any status < 400
        });
        const buffer = Buffer.from(response.data);

        // Determine file extension primarily from URL, fallback to headers
        const urlPath = new URL(url).pathname;
        let extension = path.extname(urlPath).toLowerCase();
        
        if (!['.pdf', '.docx', '.pptx', '.xlsx', '.zip'].includes(extension)) {
            const contentType = response.headers['content-type'] || '';
            if (contentType.includes('application/pdf')) extension = '.pdf';
            else if (contentType.includes('application/zip')) extension = '.zip';
            else if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) extension = '.docx';
            else if (contentType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) extension = '.pptx';
            else if (contentType.includes('application/vnd.ms-excel') || contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) extension = '.xlsx';
            else extension = '.pdf'; // Default to PDF if unknown
        }
        
        console.log(`Downloaded ${url} - Extension: ${extension}, Size: ${buffer.length} bytes`);
        return { buffer, extension };
    } catch (error) {
        console.error(`Error downloading file from ${url}:`, error.message);
        // Provide a more specific error message if possible
        let errorMessage = error.response ? `HTTP ${error.response.status}` : error.code || error.message;
        
        // Add helpful context for common BSE/NSE errors
        if (error.response?.status === 403 && url.includes('bseindia.com')) {
            errorMessage += ' (BSE access restricted - document may require login or have access limitations)';
        } else if (error.response?.status === 404) {
            errorMessage += ' (Document not found or URL invalid)';
        }
        
        throw new Error(`Failed to download: ${errorMessage}`);
    }
}

/**
 * Extracts a clean company name from the first document URL.
 * @param {string} url The document URL.
 * @returns {string} A sanitized company name or a fallback.
 */
function extractCompanyName(url) {
    try {
        if (url.includes('screener.in/company/')) {
            const match = url.match(/screener\.in\/company\/([^\/]+)/);
            if (match && match[1]) {
                // Capitalize first letter of each part for cleaner look
                return match[1].split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
            }
        }
        // Fallback for non-screener URLs
        const hostname = new URL(url).hostname;
        const parts = hostname.replace('www.', '').split('.');
        return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Company';
    } catch (error) {
        return 'Company';
    }
}


/**
 * Generates a descriptive and clean filename based on document metadata.
 * This is now highly reliable as it uses structured data from the frontend.
 * @param {object} doc - The document object { url, type, year, linkText }.
 * @param {string} companyName - The sanitized company name.
 * @param {string} extension - The file extension (e.g., '.pdf').
 * @returns {string} The generated filename.
 */
function generateFilename(doc, companyName, extension) {
    const { type, year } = doc;
    
    let baseName;
    switch (type) {
        case 'annual_report':
            baseName = `${companyName}_AnnualReport_FY${year}`;
            break;
        case 'concall_transcript':
            // Try to extract quarter info from linkText for more specific naming
            const quarterMatch = doc.linkText.match(/(Q[1-4])|([A-Za-z]{3})/);
            const quarter = quarterMatch ? quarterMatch[0].toUpperCase() : '';
            baseName = `${companyName}_ConcallTranscript_${year}${quarter ? '_' + quarter : ''}`;
            break;
        case 'investor_presentation':
            // Try to extract quarter info from linkText for more specific naming
            const presentationQuarter = doc.linkText.match(/(Q[1-4])|([A-Za-z]{3})/);
            const quarter2 = presentationQuarter ? presentationQuarter[0].toUpperCase() : '';
            baseName = `${companyName}_InvestorPresentation_${year}${quarter2 ? '_' + quarter2 : ''}`;
            break;
        default:
            // Fallback for any other types, though we don't expect them
            const sanitizedLinkText = doc.linkText.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
            baseName = `${companyName}_${sanitizedLinkText}_${year}`;
    }
    
    return `${baseName}${extension}`;
}


/**
 * Creates a ZIP file containing all downloaded documents.
 * @param {Array} documents Array of document objects with buffer and filename.
 * @returns {Promise<Buffer>} ZIP file buffer.
 */
async function createZipFile(documents) {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 9 } });
        const chunks = [];
        archive.on('data', chunk => chunks.push(chunk));
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        archive.on('error', err => reject(err));
        
        documents.forEach(doc => {
            archive.append(doc.buffer, { name: doc.filename });
        });
        
        archive.finalize();
    });
}

// Main Vercel Serverless Function Handler
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or specific extension origin
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Now expecting a more structured object from the frontend
    const { documentsToDownload } = req.body;

    if (!Array.isArray(documentsToDownload) || documentsToDownload.length === 0) {
        return res.status(400).json({ error: 'documentsToDownload must be a non-empty array of document objects.' });
    }

    console.log(`Processing ${documentsToDownload.length} documents for download...`);
    const companyName = extractCompanyName(documentsToDownload[0].url);

    try {
        const downloadPromises = documentsToDownload.map(async (doc) => {
            try {
                const { buffer, extension } = await downloadFile(doc.url);
                const filename = generateFilename(doc, companyName, extension);
                
                return {
                    status: 'success',
                    filename,
                    buffer, // Keep buffer for zipping
                    size: buffer.length,
                    documentType: doc.type,
                    originalUrl: doc.url,
                    linkText: doc.linkText
                };
            } catch (error) {
                return {
                    status: 'error',
                    url: doc.url,
                    linkText: doc.linkText,
                    error: error.message
                };
            }
        });

        const results = await Promise.all(downloadPromises);
        
        const successfulDownloads = results.filter(r => r.status === 'success');
        const failedDownloads = results.filter(r => r.status === 'error');
        
        if (successfulDownloads.length === 0) {
            return res.status(400).json({
                error: 'Failed to download any of the selected documents.',
                details: failedDownloads.map(f => `URL: ${f.url}, Reason: ${f.error}`).join('; ')
            });
        }

        console.log(`Successfully downloaded ${successfulDownloads.length} files. Creating ZIP...`);
        
        // Use the already downloaded buffers for zipping instead of re-downloading
        const zipFileContents = successfulDownloads.map(doc => ({
            buffer: doc.buffer,
            filename: doc.filename,
        }));
        
        const zipBuffer = await createZipFile(zipFileContents);
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const zipFilename = `${companyName}_ScreenerDocs_${timestamp}.zip`;
        
        res.status(200).json({
            success: true,
            message: `Successfully packaged ${successfulDownloads.length} documents.`,
            zipFilename,
            zipSize: zipBuffer.length,
            downloadedFiles: successfulDownloads.map(d => ({
                filename: d.filename,
                size: d.size,
                documentType: d.documentType,
                originalUrl: d.originalUrl
            })),
            failedDownloads: failedDownloads.length > 0 ? failedDownloads.map(f => ({
                url: f.url,
                linkText: f.linkText,
                error: f.error
            })) : [],
            zipData: zipBuffer.toString('base64')
        });

    } catch (error) {
        console.error('Critical error in document processing pipeline:', error);
        res.status(500).json({
            error: 'An internal server error occurred during the process.',
            details: error.message
        });
    }
};
