# Watchlist Button Debugging Guide

## Quick Test Commands

Open the browser console on any Screener.in company page and try these commands:

### 1. Check if extension is loaded
```javascript
console.log('Extension loaded:', !!window.screenerChartsExtensionLoaded);
console.log('Debug functions available:', !!window.screenerChartsDebug);
```

### 2. Manual button injection
```javascript
// Force inject the watchlist button
window.screenerChartsDebug.injectWatchlistButton();
```

### 3. Check company ID detection
```javascript
// Verify company ID can be found
console.log('Company ID:', window.screenerChartsDebug.getNumericCompanyId());
```

### 4. Test company details extraction
```javascript
// Check if company details can be extracted
console.log('Company details:', window.screenerChartsDebug.getWatchlistCompanyDetails());
```

### 5. Force retry mechanism
```javascript
// Trigger the retry mechanism
window.screenerChartsDebug.retryWatchlistButtonInjection();
```

### 6. Check if button exists
```javascript
// Look for the button in DOM
console.log('Button exists:', !!document.getElementById('screener-add-to-watchlist-btn'));
```

## Debugging Steps

### Step 1: Check Extension Loading
1. Open Screener.in company page (e.g., https://www.screener.in/company/RELIANCE/)
2. Open Developer Tools (F12)
3. Check for these console messages:
   - `Loading Screener.in Analysis Extension - Content Script`
   - `[Screener Charts] Attempting to inject watchlist button...`
   - `[Screener Charts] Found target using selector: ...`

### Step 2: Manual Injection Test
If button doesn't appear automatically:
```javascript
// Reset the loaded flag and retry
window.screenerWatchlistFeatureLoaded = false;
window.screenerChartsDebug.retryWatchlistButtonInjection();
```

### Step 3: Check DOM Structure
If injection fails, inspect page structure:
```javascript
// List all headings on page
document.querySelectorAll('h1, h2, h3').forEach((h, i) => {
  console.log(`${i + 1}. ${h.tagName}: "${h.textContent.trim().substring(0, 50)}..."`);
});
```

### Step 4: Force Fallback Injection
If all else fails, use fallback:
```javascript
// This will create a fixed position button
const btn = document.createElement('button');
btn.id = 'screener-add-to-watchlist-btn';
btn.className = 'watchlist-btn';
btn.textContent = 'Add to Watchlist (Test)';
btn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999;';
document.body.appendChild(btn);
console.log('Test button added at top-right');
```

## Common Issues & Solutions

### Issue 1: Button not visible
**Cause**: CSS not loaded or conflicting styles
**Solution**: Check styles.css is loaded in manifest.json

### Issue 2: Company ID not found
**Cause**: Page structure changed or script running too early
**Solution**: Check URL pattern and retry with delay

### Issue 3: Extension not loading
**Cause**: Manifest issues or Chrome extension disabled
**Solution**: Check extension is enabled in Chrome Extensions page

### Issue 4: Button appears but doesn't work
**Cause**: Event listeners not attached or background script issues
**Solution**: Check background.js logs for errors

## Expected Console Output (Success)
```
Loading Screener.in Analysis Extension - Content Script
[Screener Charts] Attempting to inject watchlist button...
[Screener Charts] Found target using selector: h1
[Screener Charts] Inserted button after target element  
[Screener Charts] Watchlist button injected successfully for company ID: 12345
```

## File Locations
- Main logic: `content.js` (lines 863-1000+)
- Styles: `styles.css` (lines 550+)
- Background: `background.js` (fetchLatestPriceForCompany function)
- Popup: `popup/popup.js` and `popup/popup.html`

## Manual Test Sequence
1. Navigate to https://www.screener.in/company/RELIANCE/
2. Open Console (F12)
3. Look for "Add to Watchlist" button near company name
4. If not visible, run: `window.screenerChartsDebug.retryWatchlistButtonInjection()`
5. Click button to test functionality
6. Open extension popup to verify watchlist display

## Debug Flags
```javascript
// Enable verbose logging
localStorage.debug = 'true';

// Check navigation watcher
console.log('Navigation watcher active:', !!window.screenerChartsDebug.setupNavigationWatcher);
``` 