// Main content script that runs on screener.in pages

(function() {
    // Only run on company pages
    if (!window.location.pathname.match(/^\/company\/[^/]+\/?$/)) {
      return;
    }
  
    console.log('Screener Charts Extension: Initializing on company page');
  
    // Import dependencies (handled through script injection for more reliable loading)
    function loadDependencies() {
      // Load Chart.js or your preferred charting library
      const chartScript = document.createElement('script');
      chartScript.src = chrome.runtime.getURL('lib/chart.min.js');
      document.head.appendChild(chartScript);
  
      // Load our custom scripts
      const dataProcessorScript = document.createElement('script');
      dataProcessorScript.src = chrome.runtime.getURL('scripts/dataProcessor.js');
      document.head.appendChild(dataProcessorScript);
  
      const chartRendererScript = document.createElement('script');
      chartRendererScript.src = chrome.runtime.getURL('scripts/chartRenderer.js');
      document.head.appendChild(chartRendererScript);
  
      return new Promise(resolve => {
        chartRendererScript.onload = resolve;
      });
    }
  
    // Extract data from the page
    function extractFinancialData() {
      const data = {
        companyName: document.querySelector('h1')?.textContent.trim() || 'Unknown Company',
        quarterlyData: extractQuarterlyData(),
        yearlyData: extractYearlyData(),
        yearWiseReturns: extractYearWiseReturns()
      };
      return data;
    }
  
    // Extract quarterly financial data
    function extractQuarterlyData() {
      const quarterlyData = {
        labels: [],
        sales: [],
        netProfit: [],
        opm: [],
        eps: []
      };
  
      try {
        // Find the quarterly chart container
        const quarterlyChartContainer = Array.from(document.querySelectorAll('h2, h3, h4'))
          .find(el => el.textContent.includes('Quarterly Financial'))
          ?.closest('div');
        
        if (!quarterlyChartContainer) return quarterlyData;
  
        // Get all SVG elements in the quarterly chart container
        const svgElements = quarterlyChartContainer.querySelectorAll('svg');
        if (svgElements.length === 0) return quarterlyData;
  
        // Process the SVG to extract data points
        // This is a simplified approach - we'll need to adapt based on actual DOM structure
        svgElements.forEach(svg => {
          // Extract x-axis labels (dates)
          const textElements = svg.querySelectorAll('text');
          textElements.forEach(text => {
            if (text.getAttribute('transform')?.includes('rotate(-90)')) {
              // These are likely dates on the x-axis
              quarterlyData.labels.push(text.textContent.trim());
            }
          });
  
          // Extract data points - this is simplified and would need to be adapted
          const circleElements = svg.querySelectorAll('circle');
          
          // Group circles by their color/series
          const seriesGroups = {};
          circleElements.forEach(circle => {
            const fill = circle.getAttribute('fill');
            if (!seriesGroups[fill]) seriesGroups[fill] = [];
            seriesGroups[fill].push({
              x: parseFloat(circle.getAttribute('cx')),
              y: parseFloat(circle.getAttribute('cy')),
              value: parseFloat(circle.getAttribute('cy'))
            });
          });
  
          // Map series to our data structure (simplified)
          // In reality, we'd need to identify which series corresponds to which metric
          const seriesKeys = Object.keys(seriesGroups);
          if (seriesKeys.length >= 4) {
            quarterlyData.sales = seriesGroups[seriesKeys[0]].map(point => point.value);
            quarterlyData.netProfit = seriesGroups[seriesKeys[1]].map(point => point.value);
            quarterlyData.opm = seriesGroups[seriesKeys[2]].map(point => point.value);
            quarterlyData.eps = seriesGroups[seriesKeys[3]].map(point => point.value);
          }
        });
      } catch (error) {
        console.error('Error extracting quarterly data:', error);
      }
  
      return quarterlyData;
    }
  
    // Extract yearly financial data
    function extractYearlyData() {
      const yearlyData = {
        labels: [],
        sales: [],
        netProfit: [],
        opm: [],
        eps: []
      };
  
      try {
        // Find the yearly chart container
        const yearlyChartContainer = Array.from(document.querySelectorAll('h2, h3, h4'))
          .find(el => el.textContent.includes('Yearly Financial'))
          ?.closest('div');
        
        if (!yearlyChartContainer) return yearlyData;
  
        // Similar extraction logic as quarterly data
        // Adapting based on actual DOM structure would be needed
      } catch (error) {
        console.error('Error extracting yearly data:', error);
      }
  
      return yearlyData;
    }
  
    // Extract year-wise returns
    function extractYearWiseReturns() {
      const yearWiseReturns = {};
  
      try {
        // Find the year-wise returns container
        const returnsContainer = Array.from(document.querySelectorAll('h2, h3, h4'))
          .find(el => el.textContent.includes('Year-wise Return'))
          ?.closest('div');
        
        if (!returnsContainer) return yearWiseReturns;
  
        // Get all year blocks
        const yearBlocks = returnsContainer.querySelectorAll('.flex.flex-col, .container');
        
        yearBlocks.forEach(block => {
          // Find year and return percentage
          const yearElement = block.querySelector('div:first-child');
          const returnElement = block.querySelector('div[class*="text-green"], div[class*="text-red"]');
          
          if (yearElement && returnElement) {
            const year = yearElement.textContent.trim();
            const returnValue = parseFloat(returnElement.textContent.replace('%', '').trim());
            yearWiseReturns[year] = returnValue;
          }
        });
      } catch (error) {
        console.error('Error extracting year-wise returns:', error);
      }
  
      return yearWiseReturns;
    }
  
    // Create and insert chart containers
    function createChartContainers() {
      // Create container for our custom charts
      const chartsContainer = document.createElement('div');
      chartsContainer.id = 'screener-enhanced-charts';
      chartsContainer.className = 'screener-charts-container';
      
      // Create individual chart containers
      const metrics = ['profit', 'revenue', 'pe', 'eps'];
      metrics.forEach(metric => {
        const chartDiv = document.createElement('div');
        chartDiv.className = 'screener-chart-wrapper';
        
        const chartCanvas = document.createElement('canvas');
        chartCanvas.id = `screener-chart-${metric}`;
        chartDiv.appendChild(chartCanvas);
        
        chartsContainer.appendChild(chartDiv);
      });
  
      // Find a good position to insert our charts
      const ratiosTab = document.querySelector('a[href*="ratios"]');
      if (ratiosTab) {
        const tabContainer = ratiosTab.closest('div').parentElement;
        tabContainer.parentElement.insertBefore(chartsContainer, tabContainer.nextSibling);
      } else {
        // Fallback to inserting after the first major section
        const firstSection = document.querySelector('section, .container, .content');
        if (firstSection) {
          firstSection.parentElement.insertBefore(chartsContainer, firstSection.nextSibling);
        } else {
          // Last resort - append to body
          document.body.appendChild(chartsContainer);
        }
      }
  
      return chartsContainer;
    }
  
    // Main initialization function
    async function init() {
      try {
        await loadDependencies();
        
        // Extract data from the page
        const financialData = extractFinancialData();
        console.log('Extracted financial data:', financialData);
        
        // Create chart containers
        const chartsContainer = createChartContainers();
        
        // Initialize charts (will be defined in chartRenderer.js)
        if (window.renderScreenerCharts) {
          window.renderScreenerCharts(financialData, chartsContainer);
        } else {
          console.error('Chart renderer not loaded properly');
        }
      } catch (error) {
        console.error('Error initializing Screener Charts Extension:', error);
      }
    }
  
    // Wait for page to be fully loaded
    if (document.readyState === 'complete') {
      init();
    } else {
      window.addEventListener('load', init);
    }
  })();