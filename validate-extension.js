const fs = require('fs');
const path = require('path');

// Validation results
const results = {
    passed: [],
    failed: [],
    warnings: []
};

function addResult(type, message) {
    results[type].push(message);
    const icon = type === 'passed' ? '✅' : type === 'failed' ? '❌' : '⚠️';
    console.log(`${icon} ${message}`);
}

function validateFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        addResult('passed', `${description}: ${filePath}`);
        return true;
    } else {
        addResult('failed', `Missing ${description}: ${filePath}`);
        return false;
    }
}

function validateJSONFile(filePath, description, requiredFields = []) {
    if (!validateFile(filePath, description)) return false;
    
    try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        for (const field of requiredFields) {
            if (!content[field]) {
                addResult('failed', `${description} missing required field: ${field}`);
                return false;
            }
        }
        
        addResult('passed', `${description} structure valid`);
        return true;
    } catch (error) {
        addResult('failed', `${description} JSON parsing error: ${error.message}`);
        return false;
    }
}

function validateJSFile(filePath, description) {
    if (!validateFile(filePath, description)) return false;
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic syntax validation (this is not comprehensive but catches obvious issues)
        if (content.includes('your-project-name')) {
            addResult('warnings', `${description} contains placeholder URL - needs configuration`);
        }
        
        addResult('passed', `${description} readable and accessible`);
        return true;
    } catch (error) {
        addResult('failed', `${description} reading error: ${error.message}`);
        return false;
    }
}

console.log('🔍 Validating Chrome Extension Structure...\n');

// Core extension files
validateJSONFile('extension/manifest.json', 'Manifest file', ['manifest_version', 'name', 'version']);
validateJSFile('extension/background.js', 'Background script');
validateJSFile('extension/content_script.js', 'Content script');

// Popup files
validateFile('extension/popup/popup.html', 'Popup HTML');
validateJSFile('extension/popup/popup.js', 'Popup JavaScript');
validateFile('extension/popup/popup.css', 'Popup CSS');

// Icons
validateFile('extension/icons/icon16.png', 'Icon 16x16');
validateFile('extension/icons/icon48.png', 'Icon 48x48');
validateFile('extension/icons/icon128.png', 'Icon 128x128');

// Feature files
validateFile('extension/lib/chart.min.js', 'Chart.js library');
validateJSFile('extension/features/data-processor.js', 'Data processor');
validateJSFile('extension/features/chart-renderer.js', 'Chart renderer');

// API files
validateJSFile('api/analyze-company.js', 'Document analyzer API');
validateJSFile('api/generate-analysis.js', 'AI analysis API');
validateJSFile('api/ping.js', 'Ping API');

// Configuration files
validateJSONFile('package.json', 'Package configuration', ['name', 'dependencies']);
validateFile('vercel.json', 'Vercel configuration');

console.log('\n📊 Validation Summary:');
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);

if (results.failed.length === 0) {
    console.log('\n🎉 Extension structure validation PASSED!');
    console.log('✅ All required files are present and accessible');
    if (results.warnings.length > 0) {
        console.log('⚠️  Please address the warnings above before deployment');
    }
} else {
    console.log('\n❌ Extension structure validation FAILED!');
    console.log('Please fix the missing files before proceeding');
}

console.log('\n📋 Next Steps:');
console.log('1. Address any failed validations above');
console.log('2. Update placeholder URLs in background.js and manifest.json');
console.log('3. Deploy backend to Vercel');
console.log('4. Load extension in Chrome (chrome://extensions/)');
console.log('5. Test on a Screener.in company page');

process.exit(results.failed.length > 0 ? 1 : 0); 