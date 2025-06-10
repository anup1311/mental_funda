// Data processor for cleaning and normalizing financial data

(function() {
    window.processFinancialData = function(rawData) {
      // Process and clean quarterly data
      const processedQuarterlyData = processQuarterlyData(rawData.quarterlyData);
      
      // Process and clean yearly data
      const processedYearlyData = processYearlyData(rawData.yearlyData);
      
      // Process and sort year-wise returns
      const processedReturnsData = processReturnsData(rawData.yearWiseReturns);
      
      return {
        companyName: rawData.companyName,
        quarterlyData: processedQuarterlyData,
        yearlyData: processedYearlyData,
        returnsData: processedReturnsData
      };
    };
  
    // Alternative method: Use tables on the page
    function extractDataFromTables() {
      const data = {
        quarterly: {
          dates: [],
          sales: [],
          netProfit: [],
          opm: [],
          eps: []
        },
        yearly: {
          dates: [],
          sales: [],
          netProfit: [],
          opm: [],
          eps: []
        }
      };
  
      // Find all tables on the page
      const tables = document.querySelectorAll('table');
      
      tables.forEach(table => {
        const headerRow = table.querySelector('thead tr');
        if (!headerRow) return;
        
        // Check if this is a quarterly or yearly table
        const headerText = headerRow.textContent.toLowerCase();
        const isQuarterly = headerText.includes('quarter') || headerText.includes('q1') || headerText.includes('q2');
        const isYearly = headerText.includes('year') || headerText.includes('mar') || headerText.includes('annual');
        
        if (!isQuarterly && !isYearly) return;
        
        // Get target data object (quarterly or yearly)
        const targetData = isQuarterly ? data.quarterly : data.yearly;
        
        // Extract headers (dates)
        const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent.trim());
        targetData.dates = headers.slice(1); // Skip first column which is usually the metric name
        
        // Extract data rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          const metricName = cells[0].textContent.toLowerCase().trim();
          
          // Extract values based on metric name
          const values = Array.from(cells).slice(1).map(cell => {
            // Parse value, removing commas and converting to number
            return parseFloat(cell.textContent.replace(/,/g, '').trim()) || 0;
          });
          
          // Map to appropriate array based on metric name
          if (metricName.includes('sales') || metricName.includes('revenue') || metricName.includes('income')) {
            targetData.sales = values;
          } else if (metricName.includes('net profit') || metricName.includes('pat')) {
            targetData.netProfit = values;
          } else if (metricName.includes('operating margin') || metricName.includes('opm')) {
            targetData.opm = values;
          } else if (metricName.includes('eps') || metricName.includes('earning per share')) {
            targetData.eps = values;
          }
        });
      });
  
      return data;
    }
  
    function processQuarterlyData(data) {
      // If data is empty or incomplete, try extracting from tables
      if (!data.labels.length) {
        const tableData = extractDataFromTables();
        if (tableData.quarterly.dates.length) {
          return {
            labels: tableData.quarterly.dates,
            datasets: [
              {
                label: 'Sales',
                data: tableData.quarterly.sales,
                borderColor: '#4dc9f6',
                backgroundColor: 'rgba(77,201,246,0.2)'
              },
              {
                label: 'Net Profit',
                data: tableData.quarterly.netProfit,
                borderColor: '#f67019',
                backgroundColor: 'rgba(246,112,25,0.2)'
              },
              {
                label: 'OPM %',
                data: tableData.quarterly.opm,
                borderColor: '#8549ba',
                backgroundColor: 'rgba(133,73,186,0.2)'
              },
              {
                label: 'EPS',
                data: tableData.quarterly.eps,
                borderColor: '#f53794',
                backgroundColor: 'rgba(245,55,148,0.2)'
              }
            ]
          };
        }
      }
  
      // Process the SVG-extracted data
      return {
        labels: data.labels,
        datasets: [
          {
            label: 'Sales',
            data: data.sales,
            borderColor: '#4dc9f6',
            backgroundColor: 'rgba(77,201,246,0.2)'
          },
          {
            label: 'Net Profit',
            data: data.netProfit,
            borderColor: '#f67019',
            backgroundColor: 'rgba(246,112,25,0.2)'
          },
          {
            label: 'OPM %',
            data: data.opm,
            borderColor: '#8549ba',
            backgroundColor: 'rgba(133,73,186,0.2)'
          },
          {
            label: 'EPS',
            data: data.eps,
            borderColor: '#f53794',
            backgroundColor: 'rgba(245,55,148,0.2)'
          }
        ]
      };
    }
  
    function processYearlyData(data) {
      // Similar processing for yearly data
      // If data is empty or incomplete, try extracting from tables
      if (!data.labels.length) {
        const tableData = extractDataFromTables();
        if (tableData.yearly.dates.length) {
          return {
            labels: tableData.yearly.dates,
            datasets: [
              {
                label: 'Sales',
                data: tableData.yearly.sales,
                borderColor: '#4dc9f6',
                backgroundColor: 'rgba(77,201,246,0.2)'
              },
              {
                label: 'Net Profit',
                data: tableData.yearly.netProfit,
                borderColor: '#f67019',
                backgroundColor: 'rgba(246,112,25,0.2)'
              },
              {
                label: 'OPM %',
                data: tableData.yearly.opm,
                borderColor: '#8549ba',
                backgroundColor: 'rgba(133,73,186,0.2)'
              },
              {
                label: 'EPS',
                data: tableData.yearly.eps,
                borderColor: '#f53794',
                backgroundColor: 'rgba(245,55,148,0.2)'
              }
            ]
          };
        }
      }
      
      return {
        labels: data.labels,
        datasets: [
          {
            label: 'Sales',
            data: data.sales,
            borderColor: '#4dc9f6',
            backgroundColor: 'rgba(77,201,246,0.2)'
          },
          {
            label: 'Net Profit',
            data: data.netProfit,
            borderColor: '#f67019',
            backgroundColor: 'rgba(246,112,25,0.2)'
          },
          {
            label: 'OPM %',
            data: data.opm,
            borderColor: '#8549ba',
            backgroundColor: 'rgba(133,73,186,0.2)'
          },
          {
            label: 'EPS',
            data: data.eps,
            borderColor: '#f53794',
            backgroundColor: 'rgba(245,55,148,0.2)'
          }
        ]
      };
    }
  
    function processReturnsData(returns) {
      // Convert returns object to sorted arrays
      const years = Object.keys(returns).sort((a, b) => parseInt(a) - parseInt(b));
      const values = years.map(year => returns[year]);
      
      // Create colors based on positive/negative returns
      const colors = values.map(value => 
        value >= 0 ? 'rgba(75, 192, 75, 0.8)' : 'rgba(255, 99, 132, 0.8)'
      );
      
      return {
        labels: years,
        datasets: [{
          label: 'Returns %',
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.8', '1')),
          borderWidth: 1
        }]
      };
    }
  })();