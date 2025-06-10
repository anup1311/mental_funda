# Screener.in Company Charts Extension

Injects beautiful, interactive financial charts (Sales, Net Profit, OPM %, Sales Growth %) into Screener.in company pages. Robustly extracts yearly data regardless of table structure or stock type.

## Features
- Extracts and visualizes:
  - Sales/Revenue
  - Net Profit/PAT
  - Operating Profit Margin (OPM %)
  - Sales Growth %
- Handles all table/label variations and skips quarterly tables
- Modern, mobile-friendly UI with Chart.js
- Dropdown to switch between two chart views
- Graceful error handling
- Minimal dependencies (only Chart.js)
- Extensible and robust codebase

## Installation
1. Clone or download this repo.
2. In Chrome, go to `chrome://extensions` and enable Developer Mode.
3. Click "Load unpacked" and select the project folder.
4. Visit any Screener.in company page to see the charts.

## Usage
- Charts appear below the main chart/company name on Screener.in company pages.
- Use the dropdown to switch between Sales/Net Profit and Sales Growth %/OPM %.
- For troubleshooting, enable debug logging by running `localStorage.debug = 'true'` in the DevTools console and reload the page.

## Settings
- (Coming soon) Popup to customize which metrics to chart and enable/disable debug mode.

## Screenshots
_Add screenshots of the extension in action here._

## Contributing
1. Fork the repository
2. Create a new branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Add feature name"`
4. Push to your branch: `git push origin feature-name`
5. Open a pull request

## Chrome Web Store Prep
- Manifest v3 compliant
- 16x16, 48x48, 128x128 icons in `assets/`
- Privacy policy and support email recommended

## License
MIT (or your preferred license) 