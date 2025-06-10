const axios = require('axios');

// Test data for the APIs
const testDocuments = [
    {
        url: "https://example.com/test.pdf",
        linkText: "Annual Report 2024",
        type: "annual_report",
        year: 2024
    }
];

const testFinancialData = {
    companyName: "Test Company",
    yearlyData: {
        headers: ["2024", "2023", "2022"],
        rows: {
            sales: ["1000", "900", "800"],
            "net profit": ["100", "90", "80"]
        }
    },
    quarterlyData: {
        headers: ["Q4 2024", "Q3 2024", "Q2 2024"],
        rows: {
            sales: ["250", "240", "230"],
            "net profit": ["25", "24", "23"]
        }
    }
};

// Test the analyze-company API
async function testAnalyzeCompanyAPI() {
    try {
        console.log('Testing analyze-company API...');
        const analyzeCompany = require('./api/analyze-company.js');
        
        // Mock request and response objects
        const mockReq = {
            method: 'POST',
            body: {
                documentsToDownload: testDocuments
            }
        };
        
        const mockRes = {
            setHeader: () => {},
            status: (code) => ({
                json: (data) => {
                    console.log(`Response Status: ${code}`);
                    console.log('Response Data:', JSON.stringify(data, null, 2));
                    return mockRes;
                },
                end: () => {
                    console.log(`Response Status: ${code} (ended)`);
                    return mockRes;
                }
            })
        };
        
        await analyzeCompany(mockReq, mockRes);
        
    } catch (error) {
        console.error('Error testing analyze-company API:', error.message);
    }
}

// Test the generate-analysis API
async function testGenerateAnalysisAPI() {
    try {
        console.log('\nTesting generate-analysis API...');
        const generateAnalysis = require('./api/generate-analysis.js');
        
        // Mock request and response objects
        const mockReq = {
            method: 'POST',
            body: {
                financialData: testFinancialData,
                apiKey: process.env.GEMINI_API_KEY || 'test-api-key'
            }
        };
        
        const mockRes = {
            setHeader: () => {},
            status: (code) => ({
                json: (data) => {
                    console.log(`Response Status: ${code}`);
                    console.log('Response Data:', JSON.stringify(data, null, 2));
                    return mockRes;
                },
                end: () => {
                    console.log(`Response Status: ${code} (ended)`);
                    return mockRes;
                }
            })
        };
        
        await generateAnalysis(mockReq, mockRes);
        
    } catch (error) {
        console.error('Error testing generate-analysis API:', error.message);
    }
}

// Test ping API
async function testPingAPI() {
    try {
        console.log('\nTesting ping API...');
        const ping = require('./api/ping.js');
        
        const mockReq = {
            method: 'GET'
        };
        
        const mockRes = {
            setHeader: () => {},
            status: (code) => ({
                json: (data) => {
                    console.log(`Response Status: ${code}`);
                    console.log('Response Data:', JSON.stringify(data, null, 2));
                    return mockRes;
                }
            })
        };
        
        await ping(mockReq, mockRes);
        
    } catch (error) {
        console.error('Error testing ping API:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting API Tests...\n');
    
    await testPingAPI();
    await testAnalyzeCompanyAPI();
    await testGenerateAnalysisAPI();
    
    console.log('\n✅ API Tests Complete!');
}

runAllTests(); 